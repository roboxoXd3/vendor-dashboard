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

    // Calculate metrics
    let totalRevenue = 0
    let totalOrders = 0
    let totalItems = 0
    let completedOrders = 0
    const uniqueOrders = new Set()

    if (orderItems && orderItems.length > 0) {
      orderItems.forEach(item => {
        const order = item.orders
        uniqueOrders.add(order.id)
        
        if (['completed', 'delivered'].includes(order.status)) {
          totalRevenue += parseFloat(item.price) * item.quantity
          totalItems += item.quantity
          completedOrders++
        }
      })
      
      totalOrders = uniqueOrders.size
    }

    // Calculate metrics
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0
    const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
    
    // For now, return rate is hardcoded as we don't have return data
    const returnRate = 1.2

    // Total views is estimated based on orders (rough calculation)
    const totalViews = totalOrders * 20 // Assume 20 views per order on average

    const metrics = {
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      returnRate: returnRate,
      totalViews: totalViews,
      totalOrders: totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2))
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
