import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

// GET vendor profile
export async function GET() {
  try {
    const { response, error, status } = await besmartRequest('/api/vendors/profile/')
    if (error) {
      return Response.json({ error }, { status })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: message }, { status: response.status })
    }

    const vendor = await response.json()

    return Response.json({
      success: true,
      vendor
    })

  } catch (error) {
    console.error('❌ Vendor profile GET error:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// UPDATE vendor profile
//
// Note: the old Supabase-direct version auto-set verification_status to
// 'verified' once these fields were filled in. Django marks
// verification_status read-only for vendors (self-verification isn't
// allowed there — matches the security hardening already flagged in the
// robustness plan for approval_status). That auto-verify behavior is
// intentionally dropped here, not carried over.
export async function PUT(request) {
  try {
    const body = await request.json()

    const allowedFields = [
      'business_name',
      'business_description',
      'business_phone',
      'business_address',
      'business_logo',
      'business_type',
      'business_registration_number',
      'tax_id',
      'payment_method_preference',
      'bank_account_info'
    ]

    const updateData = {}
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    const { response, error, status } = await besmartRequest('/api/vendors/profile/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    })

    if (error) {
      return Response.json({ error }, { status })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: message }, { status: response.status })
    }

    const updatedVendor = await response.json()

    const isSetupComplete =
      updatedVendor.business_name &&
      updatedVendor.business_name !== 'Pending Setup' &&
      updatedVendor.business_description &&
      updatedVendor.business_description !== 'Please complete your vendor application' &&
      updatedVendor.business_address &&
      updatedVendor.business_address !== 'Address to be updated' &&
      updatedVendor.business_phone

    return Response.json({
      success: true,
      message: 'Vendor profile updated successfully',
      vendor: updatedVendor,
      setupComplete: isSetupComplete
    })

  } catch (error) {
    console.error('❌ Vendor profile update error:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
