import { besmartRequest, parseBesmartError, isValidProductId } from '@/lib/besmart-api'

function normalizeImagesList(images) {
  if (!images) return []
  if (Array.isArray(images)) return images.filter(Boolean)
  if (typeof images === 'string') return images ? [images] : []
  return []
}

/**
 * POST /api/products/[id]/upload-image
 * Proxies Django upload-image (now correctly appends to images[]).
 * Prefer upload-color-image for new product media in the create/edit wizard.
 */
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
        { success: false, error: await parseBesmartError(response, data) },
        { status: response.status }
      )
    }

    const images = normalizeImagesList(data.images)
    const latestUrl = images[images.length - 1] || data.file_url || data.url || null

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
