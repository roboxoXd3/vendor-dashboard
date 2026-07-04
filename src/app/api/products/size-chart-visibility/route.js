import { besmartRequest, parseBesmartError, isValidProductId } from '@/lib/besmart-api'

// Note: Django's ownership-scoped queryset means this also closes a latent
// IDOR the old Supabase-direct version had (no vendor_id check on update).
export async function PATCH(request) {
  try {
    const { productId, sizeChartOverride } = await request.json()

    if (!isValidProductId(productId)) {
      return Response.json({ error: 'Valid product ID is required' }, { status: 400 })
    }

    const { response, error, status } = await besmartRequest(`/api/vendors/own-products/${productId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size_chart_override: sizeChartOverride }),
    })

    if (error) {
      return Response.json({ error }, { status })
    }

    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: response.status === 404 ? 'Product not found' : message }, { status: response.status })
    }

    const product = await response.json()

    return Response.json({
      success: true,
      product,
      message: `Size chart ${sizeChartOverride === 'hide' ? 'hidden' : 'shown'} for product`
    })
  } catch (error) {
    return Response.json({
      error: error.message
    }, { status: 500 })
  }
}
