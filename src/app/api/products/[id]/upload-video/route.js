import { besmartRequest, parseBesmartError, isValidProductId, appendFileToFormData } from '@/lib/besmart-api'

// POST /api/products/[id]/upload-video
// Proxies to BeSmart: POST /api/products/{id}/upload-video/
export async function POST(request, { params }) {
  try {
    const { id } = await params

    if (!isValidProductId(id)) {
      return Response.json({ success: false, error: 'Valid product ID is required' }, { status: 400 })
    }

    const form = await request.formData()
    const video = form.get('video') || form.get('file')

    if (!video || typeof video === 'string') {
      return Response.json({ success: false, error: 'No video file provided' }, { status: 400 })
    }

    const outbound = new FormData()
    appendFileToFormData(outbound, 'video', video)

    const { response, error, status } = await besmartRequest(
      `/api/products/${id}/upload-video/`,
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

    if (!response.ok && response.status !== 202) {
      const errorMessage = await parseBesmartError(response, data, rawText)
      return Response.json(
        { success: false, error: errorMessage },
        { status: response.status }
      )
    }

    return Response.json({
      success: true,
      job_id: data.job_id,
      status: data.status || 'processing',
    }, { status: response.status === 202 ? 202 : 200 })
  } catch (error) {
    console.error('❌ Product video upload proxy error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
