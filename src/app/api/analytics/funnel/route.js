import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

// GET /api/analytics/funnel - Vendor conversion funnel (view -> cart -> checkout -> purchase)
//
// Backed by Django's GET /api/vendors/analytics/funnel/, which aggregates real
// ProductAnalyticsEvent rows for the authenticated vendor. Django resolves the
// vendor from the auth token and has no period/date-range filtering yet, so
// those query params are currently ignored (all-time totals only).
export async function GET() {
  try {
    const { response, error, status } = await besmartRequest('/api/vendors/analytics/funnel/')

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
      }
    })

  } catch (error) {
    console.error('❌ Error fetching conversion funnel:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
