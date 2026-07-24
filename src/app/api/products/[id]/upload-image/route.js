import { besmartRequest, parseBesmartError, isValidProductId } from '@/lib/besmart-api'

function normalizeImagesList(images) {
  if (!images) return []
  if (Array.isArray(images)) return images.filter(Boolean)
  if (typeof images === 'string') return images ? [images] : []
  return []
}

/**
 * POST /api/products/[id]/upload-image
 * Proxies Django upload-image, then repairs `images` if Django saved a string
 * instead of a JSON array (known backend bug).
 *
 * Prefer upload-color-image for new product media — that path is correct.
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params

    if (!isValidProductId(id)) {
      return Response.json({ success: false, error: 'Valid product ID is required' }, { status: 400 })
    }

    // Capture existing images before Django may overwrite them as a string
    let existingImages = []
    try {
      const beforeRes = await besmartRequest(`/api/vendors/own-products/${id}/`)
      if (!beforeRes.error && beforeRes.response?.ok) {
        const before = await beforeRes.response.json()
        existingImages = normalizeImagesList(before.images)
      }
    } catch {
      // non-critical
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

    const uploadedUrl =
      (typeof data.images === 'string' && data.images) ||
      (Array.isArray(data.images) && data.images[data.images.length - 1]) ||
      data.file_url ||
      data.url ||
      null

    let images = normalizeImagesList(data.images)
    if (images.length <= 1 && existingImages.length > 0) {
      images = [...existingImages]
    }
    if (uploadedUrl && !images.includes(uploadedUrl)) {
      images.push(uploadedUrl)
    }

    // Repair Django string overwrite so product.images stays a JSON array
    try {
      await besmartRequest(`/api/vendors/own-products/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      })
    } catch (repairError) {
      console.warn('⚠️ Could not repair product.images array after upload:', repairError)
    }

    return Response.json({
      success: true,
      url: uploadedUrl || images[images.length - 1] || null,
      images,
      message: data.message || 'Image uploaded successfully',
    })
  } catch (error) {
    console.error('❌ Product image upload proxy error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
