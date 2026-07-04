import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    const { response, error, status } = await besmartRequest(`/api/vendors/dashboard/stats/?period=${period}`)
    if (error) {
      return Response.json({ error }, { status })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: message }, { status: response.status })
    }

    const stats = await response.json()

    return Response.json({ data: stats })

  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
