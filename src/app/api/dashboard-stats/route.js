import { getSupabaseServer } from '@/lib/supabase-server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const period = searchParams.get('period') || '30d'
    const view = searchParams.get('view') || 'daily'
    const supabase = getSupabaseServer()
    
    if (!vendorId) {
      return Response.json({ 
        error: 'Vendor ID is required' 
      }, { status: 400 })
    }

    console.log('📊 Fetching comprehensive dashboard stats for vendor:', vendorId, 'with filters:', { period, view })

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

    // Use direct queries for accurate data instead of the flawed view
    console.log('🔄 Using direct queries for accurate vendor stats...')
    
    // Get basic product count
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .eq('status', 'active')

    // Get follower count
    const { count: followerCount } = await supabase
      .from('vendor_follows')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)

    // Get vendor's product IDs for order calculations
    const { data: products } = await supabase
      .from('products')
      .select('id, currency')
      .eq('vendor_id', vendorId)

    let totalOrders = 0
    let totalRevenue = 0
    let pendingOrders = 0

    if (products && products.length > 0) {
      const productIds = products.map(p => p.id)
      
      // Get order items for vendor's products with date filter
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          quantity,
          price,
          order_id,
          orders!inner(id, status, created_at)
        `)
        .in('product_id', productIds)
        .gte('orders.created_at', startDate.toISOString())
        .lte('orders.created_at', endDate.toISOString())

      if (orderItems && orderItems.length > 0) {
        // Process order data to get UNIQUE orders (not sum of product orders)
        const uniqueOrders = new Map()
        let vendorTotalRevenue = 0

        orderItems.forEach(item => {
          const order = item.orders
          const itemTotal = parseFloat(item.price) * item.quantity
          
          // Find the product to get currency
          const product = products.find(p => p.id === item.product_id)
          const currency = product?.currency || 'USD'

          if (!uniqueOrders.has(order.id)) {
            uniqueOrders.set(order.id, {
              status: order.status,
              vendor_total: 0,
              currency: currency
            })
          }

          uniqueOrders.get(order.id).vendor_total += itemTotal

          if (['completed', 'delivered'].includes(order.status)) {
            vendorTotalRevenue += itemTotal
          }
        })

        // Count UNIQUE orders, not sum of product order counts
        totalOrders = uniqueOrders.size
        totalRevenue = vendorTotalRevenue
        pendingOrders = Array.from(uniqueOrders.values())
          .filter(order => order.status === 'pending').length
      }
    }

    // Get the most common currency from orders (fallback to USD)
    let mostCommonCurrency = 'USD'
    if (products && products.length > 0) {
      const orderCurrencies = Array.from(uniqueOrders.values()).map(order => order.currency)
      mostCommonCurrency = orderCurrencies.length > 0 ? orderCurrencies[0] : 'USD'
    }

    const stats = {
      totalProducts: productCount || 0,
      totalOrders: totalOrders,
      totalSales: totalRevenue,
      pendingOrders: pendingOrders,
      followerCount: followerCount || 0,
      currency: mostCommonCurrency,
      monthlyRevenue: {
        [new Date().toISOString().slice(0, 7)]: totalRevenue
      }
    }

    console.log('✅ Accurate dashboard stats calculated:', stats)
    return Response.json({ data: stats })

  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
