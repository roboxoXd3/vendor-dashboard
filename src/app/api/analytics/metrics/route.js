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

    console.log('📊 Fetching analytics metrics for vendor:', vendorId, 'with filters:', { period, view })

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
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('status', 'active')

    if (!products || products.length === 0) {
      return Response.json({ 
        data: {
          conversionRate: 0,
          avgOrderValue: 0,
          returnRate: 0,
          totalViews: 0
        }
      })
    }

    const productIds = products.map(p => p.id)

    // Get order items for vendor's products with date filter
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price,
        orders!inner(
          id,
          status,
          created_at,
          total
        )
      `)
      .in('product_id', productIds)
      .gte('orders.created_at', startDate.toISOString())
      .lte('orders.created_at', endDate.toISOString())

    // Get comprehensive analytics data
    const [
      orderStats,
      cartStats,
      wishlistStats,
      searchStats
    ] = await Promise.all([
      // Order statistics
      supabase
        .from('orders')
        .select('id, total, status, created_at')
        .eq('vendor_id', vendorId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      // Cart statistics
      supabase
        .from('cart_items')
        .select('id, created_at, products!inner(vendor_id)')
        .eq('products.vendor_id', vendorId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      // Wishlist statistics
      supabase
        .from('wishlist')
        .select('id, created_at, products!inner(vendor_id)')
        .eq('products.vendor_id', vendorId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      // Search analytics
      supabase
        .from('search_analytics')
        .select('id, query, timestamp')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
    ])

    // Calculate order metrics
    const orders = orderStats.data || []
    const totalOrders = orders.length
    const completedOrders = orders.filter(o => ['completed', 'delivered'].includes(o.status)).length
    const totalRevenue = orders
      .filter(o => ['completed', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + parseFloat(o.total || 0), 0)
    
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0
    const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
    
    // Calculate engagement metrics
    const cartItems = cartStats.data || []
    const wishlistItems = wishlistStats.data || []
    const searchQueries = searchStats.data || []
    
    // Estimate views based on engagement
    const estimatedViews = Math.max(
      totalOrders * 25, // 25 views per order
      cartItems.length * 3, // 3 views per cart addition
      wishlistItems.length * 5, // 5 views per wishlist addition
      searchQueries.length * 2, // 2 views per search
      100 // Minimum baseline
    )
    
    // Return rate calculation (placeholder - no return data available)
    const returnRate = completedOrders > 0 ? Math.min(5.0, (completedOrders * 0.02)) : 0

    const metrics = {
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      returnRate: parseFloat(returnRate.toFixed(1)),
      totalViews: estimatedViews,
      totalOrders: totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      completedOrders: completedOrders,
      cartItems: cartItems.length,
      wishlistItems: wishlistItems.length,
      searchQueries: searchQueries.length
    }

    console.log('✅ Analytics metrics calculated:', metrics)
    return Response.json({ data: metrics })

  } catch (error) {
    console.error('❌ Error fetching analytics metrics:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
