import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

// GET /api/analytics/funnel?period=30d
// Forwards period to Django. Until Django honours period, response is all-time.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const qs = new URLSearchParams({ period })

    const { response, error, status } = await besmartRequest(
      `/api/vendors/analytics/funnel/?${qs.toString()}`
    )

    if (error) {
      return Response.json({ error }, { status })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: message }, { status: response.status })
    }

    const funnel = await response.json()

    return Response.json({
      data: {
        productViews: funnel.views || 0,
        addToCart: funnel.cart || 0,
        checkoutStarted: funnel.checkout || 0,
        purchased: funnel.purchases || 0,
        period,
      },
    })
  } catch (error) {
    console.error('❌ Error fetching conversion funnel:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
