import { getSupabaseServer } from '@/lib/supabase-server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const limit = parseInt(searchParams.get('limit')) || 5
    const period = searchParams.get('period') || '30d'
    const view = searchParams.get('view') || 'daily'
    const supabase = getSupabaseServer()
    
    if (!vendorId) {
      return Response.json({ 
        error: 'Vendor ID is required' 
      }, { status: 400 })
    }

    console.log('📋 Fetching recent orders for vendor:', vendorId, 'limit:', limit, 'filters:', { period, view })

    // Calculate date range based on period filter
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Get vendor's product IDs first
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('vendor_id', vendorId)

    if (productsError) {
      console.error('❌ Error fetching products:', productsError)
      throw productsError
    }

    if (!products || products.length === 0) {
      return Response.json({ data: [] })
    }

    const productIds = products.map(p => p.id)

    // Get recent order items for vendor's products with date filter
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        order_id,
        quantity,
        price,
        product_id,
        orders!inner(
          id,
          order_number,
          status,
          created_at,
          user_id
        )
      `)
      .in('product_id', productIds)
      .gte('orders.created_at', startDate.toISOString())
      .lte('orders.created_at', endDate.toISOString())
      .order('created_at', { ascending: false, referencedTable: 'orders' })
      .limit(limit * 2) // Get more to account for multiple items per order


    if (orderItemsError) {
      console.error('❌ Error fetching recent order items:', orderItemsError)
      throw orderItemsError
    }

    // Get unique user IDs from orders
    const userIds = [...new Set(orderItems?.map(item => item.orders.user_id))]
    
    // Fetch user profiles with email using the new view
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles_with_email')
      .select('id, full_name, email')
      .in('id', userIds)

    if (profilesError) {
      console.error('❌ Error fetching user profiles:', profilesError)
      // Continue without profile data rather than failing completely
    }

    // Create map for quick lookup
    const profilesMap = new Map()
    userProfiles?.forEach(profile => {
      profilesMap.set(profile.id, profile)
    })

    // Group by order and calculate vendor totals
    const orderMap = new Map()
    orderItems?.forEach(item => {
      const order = item.orders
      if (!orderMap.has(order.id)) {
        const userProfile = profilesMap.get(order.user_id)
        orderMap.set(order.id, {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          created_at: order.created_at,
          user_id: order.user_id,
          profiles: {
            full_name: userProfile?.full_name || 'Unknown User',
            email: userProfile?.email || 'N/A'
          },
          vendor_total: 0,
          product_names: []
        })
      }
      
      const orderData = orderMap.get(order.id)
      orderData.vendor_total += parseFloat(item.price) * item.quantity
      
      const product = products.find(p => p.id === item.product_id)
      if (product) {
        orderData.product_names.push(product.name)
      }
    })

    // Transform to final format and limit results
    const transformedData = Array.from(orderMap.values())
      .slice(0, limit)
      .map(order => ({
        id: order.id,
        order_number: order.order_number,
        total: order.vendor_total.toFixed(2),
        status: order.status,
        created_at: order.created_at,
        user_id: order.user_id,
        profiles: order.profiles,
        product_name: order.product_names.length > 1 
          ? 'Multiple Items' 
          : (order.product_names[0] || 'Unknown Product')
      }))

    console.log('✅ Recent orders retrieved:', transformedData.length)
    return Response.json({ data: transformedData })

  } catch (error) {
    console.error('❌ Error fetching recent orders:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
