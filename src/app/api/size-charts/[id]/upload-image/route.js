import { besmartRequest, parseBesmartError, isValidProductId } from '@/lib/besmart-api'

// POST /api/size-charts/[id]/upload-image
// Proxies to BeSmart: POST /api/vendors/size-charts/{template_id}/upload-image/
export async function POST(request, { params }) {
  try {
    const { id } = await params

    if (!isValidProductId(id)) {
      return Response.json({ success: false, error: 'Valid template ID is required' }, { status: 400 })
    }

    const form = await request.formData()
    const image = form.get('image') || form.get('file')

    if (!image || typeof image === 'string') {
      return Response.json({ success: false, error: 'No image file provided' }, { status: 400 })
    }

    const outbound = new FormData()
    outbound.append('image', image)

    const { response, error, status } = await besmartRequest(
      `/api/vendors/size-charts/${id}/upload-image/`,
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

    return Response.json({
      success: true,
      image_url: data.image_url,
    })
  } catch (error) {
    console.error('❌ Size chart image upload proxy error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
