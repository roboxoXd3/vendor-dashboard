import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

/**
 * GET /api/analytics/metrics
 * Proxies Django GET /api/vendors/analytics/metrics/ and enriches with
 * avg order value + total views from related vendor endpoints.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    const [metricsRes, salesRes, viewsRes] = await Promise.all([
      besmartRequest('/api/vendors/analytics/metrics/'),
      besmartRequest(`/api/vendors/analytics/sales/?period=${period}`),
      besmartRequest(`/api/vendors/analytics/views-over-time/?period=${period}`),
    ])

    if (metricsRes.error) {
      return Response.json({ error: metricsRes.error }, { status: metricsRes.status })
    }
    if (!metricsRes.response.ok) {
      const message = await parseBesmartError(metricsRes.response)
      return Response.json({ error: message }, { status: metricsRes.response.status })
    }

    const metrics = await metricsRes.response.json()

    let avgOrderValue = 0
    let totalOrders = 0
    let totalRevenue = 0
    if (!salesRes.error && salesRes.response?.ok) {
      const sales = await salesRes.response.json()
      totalOrders = sales.totalOrders || 0
      totalRevenue = Number(sales.totalRevenue || 0)
      avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    }

    let totalViews = 0
    if (!viewsRes.error && viewsRes.response?.ok) {
      const viewsPayload = await viewsRes.response.json()
      const rows = viewsPayload.data || viewsPayload || []
      if (Array.isArray(rows)) {
        totalViews = rows.reduce((sum, row) => sum + Number(row.views || row.count || 0), 0)
      }
    }

    // Django returns conversion/return as fractions (0–1); UI shows percentages
    const conversionRate = Number(((metrics.conversion_rate || 0) * 100).toFixed(1))
    const returnRate = Number(((metrics.return_rate || 0) * 100).toFixed(1))

    return Response.json({
      data: {
        conversionRate,
        avgOrderValue: Number(avgOrderValue.toFixed(2)),
        returnRate,
        totalViews,
        totalOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        averageRating: metrics.average_rating ?? 0,
        totalReviews: metrics.total_reviews ?? 0,
      },
    })
  } catch (error) {
    console.error('❌ Error fetching analytics metrics:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
