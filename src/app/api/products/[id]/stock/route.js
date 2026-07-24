import { besmartRequest, parseBesmartError, isValidProductId } from '@/lib/besmart-api'

// PATCH /api/products/[id]/stock → Django PATCH /api/vendors/own-products/{id}/stock/
export async function PATCH(request, { params }) {
  try {
    const { id } = await params

    if (!isValidProductId(id)) {
      return Response.json({ success: false, error: 'Valid product ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const stockQuantity = body.stock_quantity ?? body.stockQuantity

    if (stockQuantity === undefined || stockQuantity === null) {
      return Response.json({ success: false, error: 'stock_quantity is required' }, { status: 400 })
    }

    const { response, error, status } = await besmartRequest(
      `/api/vendors/own-products/${id}/stock/`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_quantity: Number(stockQuantity) }),
      }
    )

    if (error) {
      return Response.json({ success: false, error }, { status })
    }

    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ success: false, error: message }, { status: response.status })
    }

    const data = await response.json()
    return Response.json({ success: true, data })
  } catch (error) {
    console.error('❌ Error updating product stock:', error)
    return Response.json({ success: false, error: 'Failed to update stock' }, { status: 500 })
  }
}
