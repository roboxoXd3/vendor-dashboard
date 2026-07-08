import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

// GET /api/analytics/views-over-time - Daily product view counts for the period
//
// Backed by Django's GET /api/vendors/analytics/views-over-time/?period=X
// (added alongside the other dashboard/vendor endpoints). Two known caveats
// from backend verification, not fixed here:
//   - `granularity` is accepted by neither this route nor Django's — the
//     data is always daily-bucketed regardless of the `view` selector below.
//   - Django sources this from `products.ProductViews`, a different table
//     than the `ProductAnalyticsEvent` model backing the funnel/performance
//     endpoints, so these view counts may not reconcile with "Total Views"
//     shown elsewhere on the Analytics page.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    const { response, error, status } = await besmartRequest(`/api/vendors/analytics/views-over-time/?period=${encodeURIComponent(period)}`)

    if (error) {
      return Response.json({ error }, { status })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: message }, { status: response.status })
    }

    const { data } = await response.json()

    const chartData = (data || []).map((entry) => ({
      date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: entry.views || 0,
      fullDate: entry.date,
    }))

    return Response.json({ data: chartData })

  } catch (error) {
    console.error('❌ Error fetching views over time:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
