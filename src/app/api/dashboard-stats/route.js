import { getSupabaseServer } from '@/lib/supabase-server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const supabase = getSupabaseServer()
    
    if (!vendorId) {
      return Response.json({ 
        error: 'Vendor ID is required' 
      }, { status: 400 })
    }

    console.log('📊 Fetching comprehensive dashboard stats for vendor:', vendorId)

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
      .select('id')
      .eq('vendor_id', vendorId)

    let totalOrders = 0
    let totalRevenue = 0
    let pendingOrders = 0

    if (products && products.length > 0) {
      const productIds = products.map(p => p.id)
      
      // Get order items for vendor's products
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          quantity,
          price,
          order_id,
          orders!inner(id, status, created_at)
        `)
        .in('product_id', productIds)

      if (orderItems && orderItems.length > 0) {
        // Process order data to get UNIQUE orders (not sum of product orders)
        const uniqueOrders = new Map()
        let vendorTotalRevenue = 0

        orderItems.forEach(item => {
          const order = item.orders
          const itemTotal = parseFloat(item.price) * item.quantity

          if (!uniqueOrders.has(order.id)) {
            uniqueOrders.set(order.id, {
              status: order.status,
              vendor_total: 0
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

    const stats = {
      totalProducts: productCount || 0,
      totalOrders: totalOrders,
      totalSales: totalRevenue,
      pendingOrders: pendingOrders,
      followerCount: followerCount || 0,
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
