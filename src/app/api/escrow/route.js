import { getSupabaseServer } from '@/lib/supabase-server'

// GET /api/escrow - Fetch vendor escrow orders
export async function GET(request) {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    console.log('🔒 Fetching vendor escrow data...')
    
    if (!sessionToken) {
      console.log('❌ No session token found')
      return Response.json({ 
        error: 'Authentication required - please login first' 
      }, { status: 401 })
    }

    // Find active session in database
    const { data: sessionData, error: sessionError } = await supabase
      .from('vendor_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (sessionError || !sessionData) {
      console.log('❌ Invalid or expired session')
      return Response.json({ 
        error: 'Invalid or expired session' 
      }, { status: 401 })
    }

    // Get user ID from session
    const userId = sessionData.user_id
    console.log('✅ Valid session found for user:', userId)

    // Get vendor data
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (vendorError || !vendor) {
      console.log('❌ Vendor not found')
      return Response.json({ 
        error: 'Vendor not found' 
      }, { status: 404 })
    }

    // Build query for orders with escrow status
    let query = supabase
      .from('orders')
      .select(`
        id,
        total,
        escrow_status,
        escrow_release_date,
        payment_status,
        created_at,
        updated_at,
        user_id,
        order_items!inner(
          id,
          quantity,
          price,
          products!inner(
            id,
            name,
            vendor_id,
            currency
          )
        )
      `)
      .eq('order_items.products.vendor_id', vendor.id)
      .eq('payment_status', 'completed')
      .not('escrow_status', 'is', null)
      .not('escrow_status', 'eq', 'none')
      .order('created_at', { ascending: false })

    // Apply status filter
    if (status !== 'all') {
      if (status === 'held') {
        query = query.eq('escrow_status', 'held')
      } else if (status === 'released') {
        query = query.eq('escrow_status', 'released')
      } else if (status === 'pending') {
        query = query.or('escrow_status.eq.pending,escrow_status.eq.held')
      }
    }

    const { data: orders, error: ordersError } = await query

    if (ordersError) {
      console.error('❌ Error fetching escrow orders:', ordersError)
      return Response.json({ 
        error: 'Failed to fetch escrow orders' 
      }, { status: 500 })
    }

    // Get user information for all orders
    const userIds = [...new Set(orders.map(order => order.user_id).filter(Boolean))]
    let usersData = []
    
    if (userIds.length > 0) {
      console.log('🔍 Looking up users:', userIds)
      
      // Try auth_users_view first
      const { data: users, error: usersError } = await supabase
        .from('auth_users_view')
        .select('id, email, raw_user_meta_data')
        .in('id', userIds)
      
      if (!usersError && users) {
        usersData = users
        console.log('✅ Found users from auth_users_view:', users.length)
      } else {
        console.log('❌ Error with auth_users_view:', usersError)
        
        // Try auth.users as fallback
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
        
        if (!authError && authUsers?.users) {
          usersData = authUsers.users.filter(user => userIds.includes(user.id))
          console.log('✅ Found users from auth.users:', usersData.length)
        } else {
          console.log('❌ Error with auth.users:', authError)
        }
      }
    }

    // Process orders to calculate vendor-specific amounts and format data
    const processedOrders = orders.map(order => {
      // Calculate vendor's portion of the order
      const vendorItems = order.order_items.filter(item => 
        item.products.vendor_id === vendor.id
      )
      
      const vendorAmount = vendorItems.reduce((sum, item) => 
        sum + (parseFloat(item.price) * item.quantity), 0
      )

      // Get user information
      const user = usersData.find(u => u.id === order.user_id)
      console.log('👤 Processing user for order:', order.id, 'user:', user)
      
      let customerName = 'Unknown Customer'
      let customerEmail = ''
      
      if (user) {
        // Handle different user data structures
        customerEmail = user.email || ''
        
        // Try different ways to get the name
        if (user.raw_user_meta_data?.full_name) {
          customerName = user.raw_user_meta_data.full_name
        } else if (user.user_metadata?.full_name) {
          customerName = user.user_metadata.full_name
        } else if (user.raw_user_meta_data?.name) {
          customerName = user.raw_user_meta_data.name
        } else if (user.user_metadata?.name) {
          customerName = user.user_metadata.name
        } else if (user.raw_user_meta_data?.firstName && user.raw_user_meta_data?.lastName) {
          customerName = `${user.raw_user_meta_data.firstName} ${user.raw_user_meta_data.lastName}`
        } else if (user.user_metadata?.firstName && user.user_metadata?.lastName) {
          customerName = `${user.user_metadata.firstName} ${user.user_metadata.lastName}`
        } else if (customerEmail) {
          // Use email as fallback, but make it more readable
          customerName = customerEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }
      }

      // Determine escrow status display
      let statusDisplay = 'Unknown'
      let statusClass = 'bg-gray-100 text-gray-700'
      
      if (order.escrow_status === 'held') {
        const releaseDate = new Date(order.escrow_release_date)
        const now = new Date()
        const daysUntilRelease = Math.ceil((releaseDate - now) / (1000 * 60 * 60 * 24))
        
        if (daysUntilRelease > 0) {
          statusDisplay = `Pending (${daysUntilRelease} days)`
          statusClass = 'bg-yellow-100 text-yellow-700'
        } else {
          statusDisplay = 'Ready for Release'
          statusClass = 'bg-blue-100 text-blue-700'
        }
      } else if (order.escrow_status === 'released') {
        statusDisplay = 'Released'
        statusClass = 'bg-green-100 text-green-700'
      } else if (order.escrow_status === 'pending') {
        statusDisplay = 'Processing'
        statusClass = 'bg-blue-100 text-blue-700'
      }

      // Format release date
      const releaseDate = order.escrow_release_date 
        ? new Date(order.escrow_release_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        : 'N/A'

      // Get currency from the first vendor item
      const firstVendorItem = vendorItems[0]
      const currency = firstVendorItem?.products?.currency || 'USD'

      return {
        id: order.id,
        customer: customerName,
        customerEmail: customerEmail,
        amount: vendorAmount.toFixed(2),
        currency: currency,
        status: statusDisplay,
        statusClass: statusClass,
        releaseDate: releaseDate,
        escrowStatus: order.escrow_status,
        createdAt: order.created_at
      }
    })

    console.log('✅ Escrow orders processed:', processedOrders.length)

    return Response.json({
      success: true,
      data: processedOrders
    })

  } catch (error) {
    console.error('❌ Escrow API error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
