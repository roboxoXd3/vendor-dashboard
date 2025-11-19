import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { fullName, businessName, businessType, phoneNumber } = body || {}
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    const supabase = getSupabaseServer()

    if (!sessionToken) {
      return Response.json({
        error: 'Authentication required - please login first'
      }, { status: 401 })
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('vendor_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single()

    if (sessionError || !sessionData) {
      return Response.json({
        error: 'Invalid or expired session'
      }, { status: 401 })
    }

    const userId = sessionData.user_id

    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (vendorError || !vendor) {
      return Response.json({
        error: 'Vendor profile not found'
      }, { status: 404 })
    }

    if (!fullName || !businessName || !businessType || !phoneNumber) {
      return Response.json({
        error: 'Full name, business name, business type, and phone number are required'
      }, { status: 400 })
    }

    const updateData = {
      business_name: businessName,
      business_type: businessType,
      business_phone: phoneNumber,
      status: 'pending',
      verification_status: 'unverified',
      is_active: false,
      admin_notes: null,
      rejection_reason: null,
      updated_at: new Date().toISOString()
    }

    const { data: updatedVendor, error: updateError } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (updateError) {
      console.error('❌ Error during vendor resubmission:', updateError)
      return Response.json({
        error: updateError.message || 'Failed to resubmit application. Please try again.'
      }, { status: 500 })
    }

    try {
      const { data: existingUser, error: userFetchError } = await supabase.auth.admin.getUserById(userId)

      if (userFetchError) {
        console.error('⚠️ Unable to fetch user metadata for resubmission:', userFetchError)
      } else {
        const existingMetadata = existingUser?.user?.user_metadata || {}
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...existingMetadata,
            full_name: fullName,
            phone: phoneNumber
          }
        })
      }
    } catch (metadataError) {
      console.error('⚠️ Failed to update user metadata during resubmission:', metadataError)
    }

    return Response.json({
      success: true,
      message: 'Application resubmitted successfully. Our team will review the updates shortly.',
      vendor: updatedVendor
    })

  } catch (error) {
    console.error('❌ Vendor resubmission error:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

