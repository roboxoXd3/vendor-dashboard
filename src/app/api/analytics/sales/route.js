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

    console.log('📊 Fetching sales analytics for vendor:', vendorId, 'with filters:', { period, view })

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
          dailySales: {},
          statusCounts: { pending: 0, processing: 0, completed: 0, cancelled: 0 },
          totalRevenue: 0,
          totalOrders: 0,
          period
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

    // Process the data for charts
    const dailySales = {}
    const statusCounts = { pending: 0, processing: 0, completed: 0, cancelled: 0 }
    let totalRevenue = 0
    const uniqueOrders = new Set()

    if (orderItems && orderItems.length > 0) {
      orderItems.forEach(item => {
        const order = item.orders
        const date = order.created_at.split('T')[0] // YYYY-MM-DD
        const amount = parseFloat(item.price) * item.quantity

        uniqueOrders.add(order.id)
        dailySales[date] = (dailySales[date] || 0) + amount
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
        
        if (['completed', 'delivered'].includes(order.status)) {
          totalRevenue += amount
        }
      })
    }

    const analytics = {
      dailySales,
      statusCounts,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders: uniqueOrders.size,
      period
    }

    console.log('✅ Sales analytics calculated:', analytics)
    return Response.json({ data: analytics })

  } catch (error) {
    console.error('❌ Error fetching sales analytics:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
