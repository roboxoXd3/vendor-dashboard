import { getSupabaseServer } from '@/lib/supabase-server'

// GET /api/transactions - Fetch vendor transaction history
export async function GET(request) {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const type = searchParams.get('type') || 'all'

    console.log('💳 Fetching vendor transaction history...')
    
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

    // Collect all transactions from different sources
    let allTransactions = []

    // 1. Get earnings from completed orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        created_at,
        payment_status,
        escrow_status,
        order_items!inner(
          quantity,
          price,
          products!inner(
            vendor_id,
            name
          )
        )
      `)
      .eq('order_items.products.vendor_id', vendor.id)
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false })

    if (!ordersError && orders) {
      orders.forEach(order => {
        // Calculate vendor's portion
        const vendorItems = order.order_items.filter(item => 
          item.products.vendor_id === vendor.id
        )
        const vendorAmount = vendorItems.reduce((sum, item) => 
          sum + (parseFloat(item.price) * item.quantity), 0
        )

        allTransactions.push({
          id: `ORD-${order.id.slice(0, 8)}`,
          type: 'Earning',
          description: `Order #${order.id.slice(0, 8)}`,
          amount: vendorAmount,
          date: new Date(order.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          created_at: order.created_at,
          status: order.escrow_status || 'completed',
          orderId: order.id // Include full order ID for navigation
        })
      })
    }

    // 2. Get payout transactions
    const { data: payouts, error: payoutsError } = await supabase
      .from('vendor_payouts')
      .select('*')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })

    if (!payoutsError && payouts) {
      payouts.forEach(payout => {
        let transactionType = 'Withdrawal'
        let description = 'Payout request'
        
        if (payout.status === 'completed') {
          description = `Payout to ${payout.bank_account_number ? `****${payout.bank_account_number.slice(-4)}` : 'bank account'}`
        } else if (payout.status === 'failed') {
          description = 'Failed payout attempt'
          transactionType = 'Failed Withdrawal'
        } else if (payout.status === 'pending') {
          description = 'Pending payout request'
        }

        allTransactions.push({
          id: `PAY-${payout.id.slice(0, 8)}`,
          type: transactionType,
          description: description,
          amount: -parseFloat(payout.amount), // Negative for withdrawals
          date: new Date(payout.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          created_at: payout.created_at,
          status: payout.status
        })
      })
    }

    // 3. Get refund transactions (if any)
    const { data: refunds, error: refundsError } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        created_at,
        updated_at,
        payment_status,
        order_items!inner(
          quantity,
          price,
          products!inner(
            vendor_id
          )
        )
      `)
      .eq('order_items.products.vendor_id', vendor.id)
      .eq('payment_status', 'refunded')
      .order('updated_at', { ascending: false })

    if (!refundsError && refunds) {
      refunds.forEach(refund => {
        const vendorItems = refund.order_items.filter(item => 
          item.products.vendor_id === vendor.id
        )
        const vendorAmount = vendorItems.reduce((sum, item) => 
          sum + (parseFloat(item.price) * item.quantity), 0
        )

        allTransactions.push({
          id: `REF-${refund.id.slice(0, 8)}`,
          type: 'Refund',
          description: `Refund for Order #${refund.id.slice(0, 8)}`,
          amount: -vendorAmount, // Negative for refunds
          date: new Date(refund.updated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          created_at: refund.updated_at,
          status: 'refunded',
          orderId: refund.id // Include full order ID for navigation
        })
      })
    }

    // Sort all transactions by date (newest first)
    allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    // Apply type filter
    let filteredTransactions = allTransactions
    if (type !== 'all') {
      filteredTransactions = allTransactions.filter(transaction => 
        transaction.type.toLowerCase() === type.toLowerCase()
      )
    }

    // Apply pagination
    const offset = (page - 1) * limit
    const paginatedTransactions = filteredTransactions.slice(offset, offset + limit)

    console.log('✅ Transaction history processed:', {
      total: allTransactions.length,
      filtered: filteredTransactions.length,
      page: page,
      limit: limit
    })

    return Response.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          page: page,
          limit: limit,
          total: filteredTransactions.length,
          pages: Math.ceil(filteredTransactions.length / limit)
        },
        summary: {
          totalTransactions: allTransactions.length,
          earnings: allTransactions.filter(t => t.type === 'Earning').length,
          withdrawals: allTransactions.filter(t => t.type === 'Withdrawal').length,
          refunds: allTransactions.filter(t => t.type === 'Refund').length
        }
      }
    })

  } catch (error) {
    console.error('❌ Transaction history API error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
