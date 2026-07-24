import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

// GET /api/analytics/performance?period=30d
// Forwards period to Django. Until Django honours period, response is all-time.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const qs = new URLSearchParams({ period })

    const { response, error, status } = await besmartRequest(
      `/api/vendors/analytics/performance/?${qs.toString()}`
    )

    if (error) {
      return Response.json({ error }, { status })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: message }, { status: response.status })
    }

    const { data: stats } = await response.json()

    if (!stats || stats.length === 0) {
      return Response.json({ data: [], period })
    }

    let productsById = new Map()
    try {
      const productsRes = await besmartRequest('/api/vendors/own-products/?page_size=100')
      if (!productsRes.error && productsRes.response.ok) {
        const productsData = await productsRes.response.json()
        productsById = new Map((productsData.results || []).map((p) => [p.id, p]))
      }
    } catch {
      // non-critical
    }

    const performanceData = stats.map((stat) => {
      const product = productsById.get(stat.product_id)
      const purchases = stat.purchases || 0
      const price = Number(stat.price ?? product?.price ?? 0)

      return {
        id: stat.product_id,
        name: stat.name,
        sku: product?.sku || 'N/A',
        price,
        images: product?.images || [],
        views: stat.views || 0,
        conversionRate: Number(stat.conversion_rate || 0),
        revenue: Number((price * purchases).toFixed(2)),
        rating: Number(product?.rating || 0),
        ordersCount: purchases,
        totalSold: purchases,
        stockQuantity: product?.stock_quantity || 0,
      }
    })

    performanceData.sort((a, b) => b.revenue - a.revenue)

    return Response.json({ data: performanceData, period })
  } catch (error) {
    console.error('❌ Error fetching product performance:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
