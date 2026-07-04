import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    const { response, error, status } = await besmartRequest(`/api/vendors/analytics/sales/?period=${period}`)
    if (error) {
      return Response.json({ error }, { status })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: message }, { status: response.status })
    }

    const result = await response.json()

    // Django returns dailySales as an array of {date, revenue, orders} —
    // reshape to the {date: amount} object this endpoint previously returned.
    const dailySales = {}
    ;(result.dailySales || []).forEach((entry) => {
      dailySales[entry.date] = entry.revenue
    })

    const statusCounts = { pending: 0, processing: 0, completed: 0, cancelled: 0, ...result.statusCounts }

    return Response.json({
      data: {
        dailySales,
        statusCounts,
        totalRevenue: result.totalRevenue || 0,
        totalOrders: result.totalOrders || 0,
        period
      }
    })

  } catch (error) {
    console.error('❌ Error fetching sales analytics:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
