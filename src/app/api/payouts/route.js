import { getSupabaseServer } from '@/lib/supabase-server'

// GET /api/payouts - Fetch vendor payout data
export async function GET(request) {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    const supabase = getSupabaseServer()

    console.log('💰 Fetching vendor payout data...')
    
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
      .select('id, total_earnings, pending_payouts, total_paid_out, created_at')
      .eq('user_id', userId)
      .single()

    if (vendorError || !vendor) {
      console.log('❌ Vendor not found')
      return Response.json({ 
        error: 'Vendor not found' 
      }, { status: 404 })
    }

    // Calculate available balance (total earnings - pending payouts - total paid out)
    const totalEarnings = parseFloat(vendor.total_earnings || 0)
    const pendingPayouts = parseFloat(vendor.pending_payouts || 0)
    const totalPaidOut = parseFloat(vendor.total_paid_out || 0)
    const availableBalance = totalEarnings - pendingPayouts - totalPaidOut

    // Get current month and last month earnings
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get orders for this vendor to calculate monthly earnings
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        total,
        created_at,
        order_items!inner(
          products!inner(
            vendor_id
          )
        )
      `)
      .eq('order_items.products.vendor_id', vendor.id)
      .eq('payment_status', 'completed')

    let thisMonthEarnings = 0
    let lastMonthEarnings = 0

    if (orders && !ordersError) {
      orders.forEach(order => {
        const orderDate = new Date(order.created_at)
        const orderTotal = parseFloat(order.total || 0)
        
        if (orderDate >= currentMonthStart) {
          thisMonthEarnings += orderTotal
        } else if (orderDate >= lastMonthStart && orderDate <= lastMonthEnd) {
          lastMonthEarnings += orderTotal
        }
      })
    }

    const payoutData = {
      availableBalance: availableBalance.toFixed(2),
      pendingBalance: pendingPayouts.toFixed(2),
      lifetimeEarnings: totalEarnings.toFixed(2),
      thisMonthEarnings: thisMonthEarnings.toFixed(2),
      lastMonthEarnings: lastMonthEarnings.toFixed(2)
    }

    console.log('✅ Payout data calculated:', payoutData)

    return Response.json({
      success: true,
      data: payoutData
    })

  } catch (error) {
    console.error('❌ Payout API error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
