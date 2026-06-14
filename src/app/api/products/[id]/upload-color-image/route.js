import {
  besmartRequest,
  parseBesmartError,
  isValidProductId,
  appendFileToFormData,
} from '@/lib/besmart-api'
import { colorsObjectToColorImages } from '@/services/productMediaService'

// POST /api/products/[id]/upload-color-image
// Proxies to BeSmart: POST /api/products/{id}/upload-color-image/
// Body (form-data): color_name, image
export async function POST(request, { params }) {
  try {
    const { id } = await params

    if (!isValidProductId(id)) {
      return Response.json({ success: false, error: 'Valid product ID is required' }, { status: 400 })
    }

    const form = await request.formData()
    const image = form.get('image') || form.get('file')
    const colorName = form.get('color_name') || form.get('colorName')

    if (!image || typeof image === 'string') {
      return Response.json({ success: false, error: 'No image file provided' }, { status: 400 })
    }

    if (!colorName || typeof colorName !== 'string') {
      return Response.json({ success: false, error: 'color_name is required' }, { status: 400 })
    }

    const outbound = new FormData()
    outbound.append('color_name', colorName)
    appendFileToFormData(outbound, 'image', image)

    const { response, error, status } = await besmartRequest(
      `/api/products/${id}/upload-color-image/`,
      { method: 'POST', body: outbound }
    )

    if (error) {
      return Response.json({ success: false, error }, { status })
    }

    const rawText = await response.text()
    let data = {}
    try {
      data = rawText ? JSON.parse(rawText) : {}
    } catch {
      data = {}
    }

    if (!response.ok || data.status === 'failure') {
      const errorMessage = await parseBesmartError(response, data, rawText)
      console.error('❌ BeSmart color image upload failed:', {
        productId: id,
        colorName,
        status: response.status,
        error: errorMessage,
        data,
      })
      return Response.json(
        { success: false, error: errorMessage },
        { status: response.status }
      )
    }

    const colors = data.colors || {}
    const imageUrl =
      data.image_url ||
      colors[colorName]?.image_url ||
      (typeof colors[colorName] === 'string' ? colors[colorName] : null)

    return Response.json({
      success: true,
      status: data.status || 'success',
      image_url: imageUrl,
      url: imageUrl,
      colors,
      color_images: colorsObjectToColorImages(colors),
      message: 'Color image uploaded successfully',
    })
  } catch (error) {
    console.error('❌ Product color image upload proxy error:', error)
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
