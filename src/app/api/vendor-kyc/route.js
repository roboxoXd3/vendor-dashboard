import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'
import { countUploadedDocs, getOverallKycStatus, updateAllDocStatuses, KYC_STATUS } from '@/lib/kycUtils'

// GET KYC documents and status
export async function GET() {
  try {
    const { response, error, status } = await besmartRequest('/api/vendors/profile/')
    if (error) {
      return Response.json({ error }, { status })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: 'Failed to fetch KYC information', details: message }, { status: response.status })
    }
    const vendor = await response.json()

    return Response.json({
      success: true,
      kyc: {
        documents: vendor.verification_documents || {},
        business_registration_number: vendor.business_registration_number,
        tax_id: vendor.tax_id,
        business_type: vendor.business_type,
        status: getOverallKycStatus(vendor.verification_documents),
        uploadedCount: countUploadedDocs(vendor.verification_documents)
      }
    })

  } catch (error) {
    console.error('❌ KYC GET error:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// SUBMIT KYC documents and information
export async function POST(request) {
  try {
    const body = await request.json()

    const current = await besmartRequest('/api/vendors/profile/')
    if (current.error) {
      return Response.json({ error: current.error }, { status: current.status })
    }
    if (!current.response.ok) {
      const message = await parseBesmartError(current.response)
      return Response.json({ error: 'Failed to submit KYC documents', details: message }, { status: current.response.status })
    }
    const currentVendor = await current.response.json()

    let verificationDocs = updateAllDocStatuses(
      currentVendor?.verification_documents || {},
      KYC_STATUS.UNDER_REVIEW
    )
    verificationDocs.submitted_at = new Date().toISOString()
    verificationDocs.status = KYC_STATUS.UNDER_REVIEW

    const { response, error, status } = await besmartRequest('/api/vendors/profile/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_registration_number: body.businessRegistrationNumber || null,
        tax_id: body.taxId || null,
        business_type: body.businessType || null,
        verification_documents: verificationDocs,
      }),
    })

    if (error) {
      return Response.json({ error }, { status })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: 'Failed to submit KYC documents', details: message }, { status: response.status })
    }

    return Response.json({
      success: true,
      message: 'KYC documents submitted successfully for review',
      kyc: {
        status: 'under_review',
        submitted_at: verificationDocs.submitted_at
      }
    })

  } catch (error) {
    console.error('❌ KYC submission error:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
