import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'
import { KYC_STATUS } from '@/lib/kycUtils'

// POST /api/storage/kyc-upload
// Handles KYC document uploads (ID proof, business license, address proof)
//
// Note: Django's own /api/vendors/kyc/upload/ stores verification_documents
// as a flat array of {name, url, uploaded_at} — incompatible with the
// object-keyed-by-document-type shape this dashboard's KYC UI expects
// (see kycUtils.js). We use it purely to get the file stored (R2), then
// immediately overwrite verification_documents back into the correct shape
// via the profile endpoint. See docs/BACKEND_ACTION_ITEMS.
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

    // Snapshot the current (correctly-shaped) verification_documents before
    // Django's upload endpoint mutates it into its own array format.
    const current = await besmartRequest('/api/vendors/profile/')
    const currentVendor = !current.error && current.response.ok ? await current.response.json() : null
    const verificationDocs =
      currentVendor?.verification_documents && !Array.isArray(currentVendor.verification_documents)
        ? currentVendor.verification_documents
        : {}

    const outbound = new FormData()
    outbound.append('document', file)

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
    const uploadedUrl = Array.isArray(uploadResult.documents)
      ? uploadResult.documents[uploadResult.documents.length - 1]?.url
      : null

    if (!uploadedUrl) {
      return Response.json({ success: false, error: 'Upload succeeded but no file URL was returned' }, { status: 502 })
    }

    verificationDocs[documentType] = {
      url: uploadedUrl,
      type: file.type,
      status: KYC_STATUS.DRAFT,
      uploaded_at: new Date().toISOString()
    }

    const { response: patchResponse } = await besmartRequest('/api/vendors/profile/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verification_documents: verificationDocs }),
    })

    if (!patchResponse?.ok) {
      // File is uploaded; only the tracking record failed to normalize. Not
      // fatal for this request, but worth surfacing loudly if it happens.
      console.error('⚠️ Failed to normalize verification_documents shape after KYC upload')
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
