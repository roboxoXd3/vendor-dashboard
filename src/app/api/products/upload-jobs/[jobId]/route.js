import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

// GET /api/products/upload-jobs/[jobId]
// Proxies to BeSmart: GET /api/products/upload-jobs/{job_id}/
export async function GET(request, { params }) {
  try {
    const { jobId } = await params

    if (!jobId) {
      return Response.json({ success: false, error: 'Job ID is required' }, { status: 400 })
    }

    const { response, error, status } = await besmartRequest(
      `/api/products/upload-jobs/${jobId}/`,
      { method: 'GET' }
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

    if (!response.ok) {
      return Response.json(
        { success: false, error: await parseBesmartError(response, data, rawText) },
        { status: response.status }
      )
    }

    return Response.json({
      success: true,
      id: data.id || jobId,
      status: data.status,
      result_url: data.result_url,
      error_message: data.error_message,
    })
  } catch (error) {
    console.error('❌ Upload job status proxy error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
