import { besmartRequest, parseBesmartError, isValidProductId } from '@/lib/besmart-api'

// POST /api/products/[id]/upload-image
// Proxies to BeSmart: POST /api/vendors/own-products/{id}/upload-image/
export async function POST(request, { params }) {
  try {
    const { id } = await params

    if (!isValidProductId(id)) {
      return Response.json({ success: false, error: 'Valid product ID is required' }, { status: 400 })
    }

    const form = await request.formData()
    const image = form.get('image') || form.get('file')

    if (!image || typeof image === 'string') {
      return Response.json({ success: false, error: 'No image file provided' }, { status: 400 })
    }

    const outbound = new FormData()
    outbound.append('image', image)

    const { response, error, status } = await besmartRequest(
      `/api/vendors/own-products/${id}/upload-image/`,
      { method: 'POST', body: outbound }
    )

    if (error) {
      return Response.json({ success: false, error }, { status })
    }

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return Response.json(
        { success: false, error: await parseBesmartError(response) },
        { status: response.status }
      )
    }

    const images = Array.isArray(data.images)
      ? data.images
      : data.images
        ? [data.images]
        : data.file_url
          ? [data.file_url]
          : []

    const latestUrl = images[images.length - 1] || data.file_url || null

    return Response.json({
      success: true,
      url: latestUrl,
      images,
      message: data.message || 'Image uploaded successfully',
    })
  } catch (error) {
    console.error('❌ Product image upload proxy error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
