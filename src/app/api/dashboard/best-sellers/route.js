import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

/**
 * GET /api/dashboard/best-sellers?limit=5&period=30d
 * Uses Django analytics/performance (period-aware) sorted by purchases/revenue.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit')) || 5, 20)
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
      return Response.json({ data: [] })
    }

    let productsById = new Map()
    try {
      const productsRes = await besmartRequest('/api/vendors/own-products/?page_size=100&ordering=-added_date')
      if (!productsRes.error && productsRes.response.ok) {
        const productsData = await productsRes.response.json()
        productsById = new Map((productsData.results || []).map((p) => [String(p.id), p]))
      }
    } catch {
      // non-critical
    }

    const ranked = [...stats]
      .map((stat) => {
        const product = productsById.get(String(stat.product_id))
        const purchases = Number(stat.purchases || 0)
        const price = Number(stat.price ?? product?.price ?? 0)
        return {
          id: stat.product_id,
          name: stat.name,
          sku: product?.sku || 'N/A',
          price,
          images: product?.images || [],
          orders_count: purchases,
          total_revenue: Number((price * purchases).toFixed(2)),
          total_sold: purchases,
        }
      })
      .sort((a, b) => b.orders_count - a.orders_count || b.total_revenue - a.total_revenue)
      .slice(0, limit)

    return Response.json({ data: ranked })
  } catch (error) {
    console.error('❌ Error fetching best sellers:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
