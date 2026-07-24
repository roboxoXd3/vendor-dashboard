import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

/**
 * GET /api/orders/stats
 * Returns order counts by status for filter tab badges.
 * Uses page_size=1 per status so Django's `count` is the source of truth.
 */
const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

async function countForStatus(status) {
  const params = new URLSearchParams({
    page: '1',
    page_size: '1',
  })
  if (status) params.set('status', status)

  const { response, error } = await besmartRequest(`/api/vendors/orders/?${params.toString()}`)
  if (error || !response?.ok) return 0
  const data = await response.json()
  return data.count ?? 0
}

export async function GET() {
  try {
    const [all, ...perStatus] = await Promise.all([
      countForStatus(null),
      ...STATUSES.map((status) => countForStatus(status)),
    ])

    const statusCounts = { all, total: all }
    STATUSES.forEach((status, index) => {
      statusCounts[status] = perStatus[index]
    })

    return Response.json({ success: true, data: statusCounts })
  } catch (error) {
    console.error('❌ Error fetching order stats:', error)
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
