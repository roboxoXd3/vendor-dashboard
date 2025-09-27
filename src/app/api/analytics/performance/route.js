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

    console.log('📈 Fetching product performance for vendor:', vendorId, 'with filters:', { period, view })

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

    // Get vendor's products with basic info
    const { data: products } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        rating,
        images,
        sku,
        stock_quantity
      `)
      .eq('vendor_id', vendorId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (!products || products.length === 0) {
      return Response.json({ data: [] })
    }

    const productIds = products.map(p => p.id)

    // Get order items for vendor's products with date filter
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price,
        orders!inner(
          id,
          status,
          created_at
        )
      `)
      .in('product_id', productIds)
      .gte('orders.created_at', startDate.toISOString())
      .lte('orders.created_at', endDate.toISOString())

    // Get reviews for rating calculation
    const { data: reviews } = await supabase
      .from('reviews')
      .select('product_id, rating')
      .in('product_id', productIds)

    // Get additional data for each product
    const performanceData = await Promise.all(products.map(async (product) => {
      const [
        productOrders,
        productCartItems,
        productWishlistItems,
        productReviews
      ] = await Promise.all([
        // Orders for this product
        supabase
          .from('order_items')
          .select(`
            quantity,
            price,
            orders!inner(
              id,
              status,
              created_at
            )
          `)
          .eq('product_id', product.id)
          .gte('orders.created_at', startDate.toISOString())
          .lte('orders.created_at', endDate.toISOString()),
        
        // Cart items for this product
        supabase
          .from('cart_items')
          .select('id, created_at')
          .eq('product_id', product.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        
        // Wishlist items for this product
        supabase
          .from('wishlist')
          .select('id, created_at')
          .eq('product_id', product.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        
        // Reviews for this product
        supabase
          .from('product_reviews')
          .select('rating')
          .eq('product_id', product.id)
      ])
      
      const orderItems = productOrders.data || []
      const cartItems = productCartItems.data || []
      const wishlistItems = productWishlistItems.data || []
      const reviews = productReviews.data || []
      
      // Calculate metrics
      let totalRevenue = 0
      let totalSold = 0
      let ordersCount = 0
      const uniqueOrders = new Set()

      orderItems.forEach(item => {
        if (['completed', 'delivered'].includes(item.orders.status)) {
          totalRevenue += parseFloat(item.price) * item.quantity
          totalSold += item.quantity
          uniqueOrders.add(item.orders.id)
        }
      })

      ordersCount = uniqueOrders.size

      // Calculate average rating
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : parseFloat(product.rating || 0)

      // Estimate views based on engagement
      const views = Math.max(
        ordersCount * 25, // 25 views per order
        cartItems.length * 3, // 3 views per cart addition
        wishlistItems.length * 5, // 5 views per wishlist addition
        10 // Minimum baseline
      )
      
      // Calculate conversion rate
      const conversionRate = views > 0 ? (ordersCount / views) * 100 : 0

      return {
        id: product.id,
        name: product.name,
        sku: product.sku || 'N/A',
        price: parseFloat(product.price || 0),
        images: product.images || [],
        views: views,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        delta: Math.random() * 2 - 1, // Random delta for now
        revenue: parseFloat(totalRevenue.toFixed(2)),
        rating: parseFloat(avgRating.toFixed(1)),
        ordersCount: ordersCount,
        totalSold: totalSold,
        stockQuantity: product.stock_quantity || 0
      }
    }))

    // Sort by revenue descending
    performanceData.sort((a, b) => b.revenue - a.revenue)

    console.log('✅ Product performance calculated:', performanceData.length, 'products')
    return Response.json({ data: performanceData })

  } catch (error) {
    console.error('❌ Error fetching product performance:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
