import { besmartRequest, parseBesmartError, isValidProductId } from '@/lib/besmart-api'
import { buildBesmartProductUpdatePayload, transformBesmartProduct } from '@/lib/besmart-product-api'

// GET /api/products/[id] - Get single product
export async function GET(request, { params }) {
  try {
    const { id } = await params

    if (!isValidProductId(id)) {
      return Response.json({ success: false, error: 'Valid product ID is required' }, { status: 400 })
    }

    const { response, error, status } = await besmartRequest(`/api/vendors/own-products/${id}/`)

    if (error) {
      return Response.json({ success: false, error }, { status })
    }

    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json(
        { success: false, error: response.status === 404 ? 'Product not found' : message },
        { status: response.status }
      )
    }

    const data = await response.json()

    return Response.json({
      success: true,
      data: transformBesmartProduct(data),
    })
  } catch (error) {
    console.error('❌ Error fetching product:', error)
    return Response.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}

// PUT /api/products/[id] - Update product (partial update)
export async function PUT(request, { params }) {
  try {
    const { id } = await params

    if (!isValidProductId(id)) {
      return Response.json({ success: false, error: 'Valid product ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { updates } = body

    if (!updates || Object.keys(updates).length === 0) {
      return Response.json({
        error: 'No updates provided'
      }, { status: 400 })
    }

    const payload = buildBesmartProductUpdatePayload(updates)

    const { response, error, status } = await besmartRequest(`/api/vendors/own-products/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (error) {
      return Response.json({ success: false, error }, { status })
    }

    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json(
        { success: false, error: response.status === 404 ? 'Product not found' : message },
        { status: response.status }
      )
    }

    const data = await response.json()

    return Response.json({
      success: true,
      data: transformBesmartProduct(data),
      message: 'Product updated successfully'
    })
  } catch (error) {
    console.error('❌ Error updating product:', error)
    return Response.json({
      success: false,
      error: 'Failed to update product',
      message: error.message
    }, { status: 500 })
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    if (!isValidProductId(id)) {
      return Response.json({ success: false, error: 'Valid product ID is required' }, { status: 400 })
    }

    const { response, error, status } = await besmartRequest(`/api/vendors/own-products/${id}/`, {
      method: 'DELETE',
    })

    if (error) {
      return Response.json({ success: false, error }, { status })
    }

    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json(
        { success: false, error: response.status === 404 ? 'Product not found' : message },
        { status: response.status }
      )
    }

    return Response.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('❌ Error deleting product:', error)
    return Response.json({
      success: false,
      error: 'Failed to delete product',
      message: error.message
    }, { status: 500 })
  }
}
