import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

// POST /api/storage/kyc-upload
// Handles KYC document uploads (ID proof, business license, address proof).
//
// Django's /api/vendors/kyc/upload/ now requires document_type and stores
// verification_documents natively as a dict keyed by type, so this just
// proxies the upload — no client-side reshaping needed.
export async function POST(request) {
  try {
    const form = await request.formData()
    const file = form.get('file')
    const documentType = form.get('documentType')

    if (!file || typeof file === 'string') {
      return Response.json({ success: false, error: 'No file provided' }, { status: 400 })
    }
    if (!documentType) {
      return Response.json({ success: false, error: 'Document type is required' }, { status: 400 })
    }

    const allowedDocTypes = ['id_proof', 'business_license', 'address_proof']
    if (!allowedDocTypes.includes(documentType)) {
      return Response.json({ success: false, error: 'Invalid document type' }, { status: 400 })
    }

    const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedFileTypes.includes(file.type)) {
      return Response.json({
        success: false,
        error: 'Invalid file type. Please upload PDF, JPEG, PNG, or WebP files only.'
      }, { status: 400 })
    }

    const maxFileSize = 10 * 1024 * 1024
    if (file.size > maxFileSize) {
      return Response.json({
        success: false,
        error: 'File size too large. Please upload files smaller than 10MB.'
      }, { status: 400 })
    }

    const outbound = new FormData()
    outbound.append('document', file)
    outbound.append('document_type', documentType)

    const { response, error, status } = await besmartRequest('/api/vendors/kyc/upload/', {
      method: 'POST',
      body: outbound,
    })

    if (error) {
      return Response.json({ success: false, error }, { status })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ success: false, error: message }, { status: response.status })
    }

    const uploadResult = await response.json()
    const uploadedUrl = uploadResult.file_url

    if (!uploadedUrl) {
      return Response.json({ success: false, error: 'Upload succeeded but no file URL was returned' }, { status: 502 })
    }

    return Response.json({
      success: true,
      url: uploadedUrl,
      documentType
    })

  } catch (error) {
    console.error('❌ KYC upload API error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
