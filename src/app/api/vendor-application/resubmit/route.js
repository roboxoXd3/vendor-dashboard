import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

// POST /api/vendor-application/resubmit
// Updates the vendor's business details then resets a rejected application
// back to pending via Django's /api/vendors/resubmit/ (status/verification_status
// reset + rejection_reason/admin_notes cleared happen server-side in Django).
export async function POST(request) {
  try {
    const body = await request.json()
    const { fullName, businessName, businessType, phoneNumber } = body || {}

    if (!fullName || !businessName || !businessType || !phoneNumber) {
      return Response.json({
        error: 'Full name, business name, business type, and phone number are required'
      }, { status: 400 })
    }

    const profileUpdate = await besmartRequest('/api/vendors/profile/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_name: businessName,
        business_type: businessType,
        business_phone: phoneNumber,
      }),
    })

    if (profileUpdate.error) {
      return Response.json({ error: profileUpdate.error }, { status: profileUpdate.status })
    }
    if (!profileUpdate.response.ok) {
      const message = await parseBesmartError(profileUpdate.response)
      return Response.json({ error: message }, { status: profileUpdate.response.status })
    }

    const { response, error, status } = await besmartRequest('/api/vendors/resubmit/', {
      method: 'POST',
    })

    if (error) {
      return Response.json({ error }, { status })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: message }, { status: response.status })
    }

    const updatedVendor = await profileUpdate.response.json().catch(() => null)

    return Response.json({
      success: true,
      message: 'Application resubmitted successfully. Our team will review the updates shortly.',
      vendor: updatedVendor,
    })

  } catch (error) {
    console.error('❌ Vendor resubmission error:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
