import { getSupabaseServer } from '@/lib/supabase-server'

// GET vendor profile
export async function GET(request) {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    const supabase = getSupabaseServer()

    if (!sessionToken) {
      return Response.json({ 
        error: 'Authentication required - please login first' 
      }, { status: 401 })
    }

    // Find active session in database
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

    // Check if session is expired
    if (new Date(sessionData.expires_at) < new Date()) {
      return Response.json({ 
        error: 'Session expired - please login again' 
      }, { status: 401 })
    }

    const userId = sessionData.user_id

    // Fetch vendor profile
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (vendorError) {
      console.error('❌ Error fetching vendor profile:', vendorError)
      return Response.json({ 
        error: 'Failed to fetch vendor profile' 
      }, { status: 500 })
    }

    return Response.json({ 
      success: true,
      vendor: vendor
    })

  } catch (error) {
    console.error('❌ Vendor profile GET error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// UPDATE vendor profile
export async function PUT(request) {
  try {
    const body = await request.json()
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    const supabase = getSupabaseServer()

    console.log('🔄 Updating vendor profile...')

    if (!sessionToken) {
      return Response.json({ 
        error: 'Authentication required - please login first' 
      }, { status: 401 })
    }

    // Find active session in database
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

    // Check if session is expired
    if (new Date(sessionData.expires_at) < new Date()) {
      return Response.json({ 
        error: 'Session expired - please login again' 
      }, { status: 401 })
    }

    const userId = sessionData.user_id

    // Prepare update data (only allow certain fields to be updated)
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
    
    // Only include allowed fields that are provided
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    console.log('💾 Updating vendor with data:', Object.keys(updateData))

    // Update vendor profile
    const { data: updatedVendor, error: updateError } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (updateError) {
      console.error('❌ Error updating vendor profile:', updateError)
      return Response.json({ 
        error: 'Failed to update vendor profile' 
      }, { status: 500 })
    }

    console.log('✅ Vendor profile updated successfully:', updatedVendor.business_name)

    // Check if this update completes the vendor setup
    const isSetupComplete = 
      updatedVendor.business_name && 
      updatedVendor.business_name !== 'Pending Setup' &&
      updatedVendor.business_description && 
      updatedVendor.business_description !== 'Please complete your vendor application' &&
      updatedVendor.business_address && 
      updatedVendor.business_address !== 'Address to be updated' &&
      updatedVendor.business_phone

    // If setup is complete, update verification status
    if (isSetupComplete && updatedVendor.verification_status === 'unverified') {
      const { error: verificationError } = await supabase
        .from('vendors')
        .update({ 
          verification_status: 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (!verificationError) {
        console.log('✅ Vendor setup completed, status updated to verified')
        updatedVendor.verification_status = 'verified'
      } else {
        console.error('❌ Error updating verification status:', verificationError)
      }
    }

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
