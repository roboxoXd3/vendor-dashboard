import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'
import { transformVendorOrder } from '@/lib/besmart-orders-api'

// GET /api/recent-orders - Recent vendor orders (dashboard widget)
//
// Note: Django's OrderSerializer has no customer-name lookup (no endpoint
// exists for a vendor to resolve a customer's display name from their user
// id) — the customer name shown in the UI will fall back to "Unknown
// Customer" until that's added. See docs/BACKEND_ACTION_ITEMS.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 5

    const { response, error, status } = await besmartRequest(`/api/vendors/orders/recent/?limit=${limit}`)

    if (error) {
      return Response.json({ error }, { status })
    }

    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: message }, { status: response.status })
    }

    const { data } = await response.json()
    const transformed = (data || []).map((order) => ({
      ...transformVendorOrder(order),
      profiles: { full_name: null, email: null },
    }))

    return Response.json({ data: transformed })

  } catch (error) {
    console.error('❌ Error fetching recent orders:', error)
    // Return empty data instead of error to prevent UI crashes
    return Response.json({ data: [], error: error.message })
  }
}
