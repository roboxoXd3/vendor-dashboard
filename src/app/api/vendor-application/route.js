import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    const supabase = getSupabaseServer()

    console.log('🔍 Processing vendor application with cookie auth...')
    
    // Check for regular session token first
    if (!sessionToken) {
      // Check for application auth cookie (for new users applying)
      const applicationAuth = cookieStore.get('vendor_application_auth')?.value
      
      if (!applicationAuth) {
        console.log('❌ No session token or application auth found in cookies for submission')
        return Response.json({ 
          error: 'Authentication required - please login first' 
        }, { status: 401 })
      }

      try {
        const authData = JSON.parse(applicationAuth)
        
        // Check if application auth is expired
        if (new Date(authData.expiresAt) < new Date()) {
          console.log('❌ Application auth expired')
          return Response.json({ 
            error: 'Session expired - please login again' 
          }, { status: 401 })
        }

        const userId = authData.userId
        console.log('✅ Valid application auth found for submission, user:', userId)

        // Process application submission using application auth
        return await processApplicationSubmission(supabase, userId, body)

      } catch (error) {
        console.log('❌ Invalid application auth cookie for submission')
        return Response.json({ 
          error: 'Invalid authentication - please login again' 
        }, { status: 401 })
      }
    }

    
    // Find active session in database
    const { data: sessionData, error: sessionError } = await supabase
      .from('vendor_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (sessionError || !sessionData) {
      console.log('❌ Invalid or expired session for application submission')
      return Response.json({ 
        error: 'Invalid or expired session' 
      }, { status: 401 })
    }

    // Get user ID from session
    const userId = sessionData.user_id
    console.log('✅ Valid session found for user:', userId)

    // Process application submission using regular session auth
    return await processApplicationSubmission(supabase, userId, body)

  } catch (error) {
    console.error('❌ Vendor application API error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Get vendor application status
export async function GET(request) {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    const supabase = getSupabaseServer()

    console.log('🔍 Checking vendor application status with cookie auth...')
    
    // Check for regular session token first
    if (!sessionToken) {
      // Check for application auth cookie (for new users applying)
      const applicationAuth = cookieStore.get('vendor_application_auth')?.value
      
      if (!applicationAuth) {
        console.log('❌ No session token or application auth found in cookies')
        return Response.json({ 
          error: 'Authentication required - please login first' 
        }, { status: 401 })
      }

      try {
        const authData = JSON.parse(applicationAuth)
        
        // Check if application auth is expired
        if (new Date(authData.expiresAt) < new Date()) {
          console.log('❌ Application auth expired')
          return Response.json({ 
            error: 'Session expired - please login again' 
          }, { status: 401 })
        }

        const userId = authData.userId
        console.log('✅ Valid application auth found for user:', userId)

        // Check for vendor application using application auth
        const { data: vendor, error: vendorError } = await supabase
          .from('vendors')
          .select('id, business_name, status, verification_status, created_at, updated_at')
          .eq('user_id', userId)
          .single()

        if (vendorError && vendorError.code !== 'PGRST116') {
          return Response.json({ 
            error: 'Database error' 
          }, { status: 500 })
        }

        if (!vendor) {
          return Response.json({ 
            hasApplication: false 
          })
        }

        return Response.json({
          hasApplication: true,
          vendor: {
            id: vendor.id,
            business_name: vendor.business_name,
            status: vendor.status,
            verification_status: vendor.verification_status,
            created_at: vendor.created_at,
            updated_at: vendor.updated_at
          }
        })

      } catch (error) {
        console.log('❌ Invalid application auth cookie')
        return Response.json({ 
          error: 'Invalid authentication - please login again' 
        }, { status: 401 })
      }
    }

    
    // Find active session in database
    const { data: sessionData, error: sessionError } = await supabase
      .from('vendor_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (sessionError || !sessionData) {
      console.log('❌ Invalid or expired session for application status check')
      return Response.json({ 
        error: 'Invalid or expired session' 
      }, { status: 401 })
    }

    // Get user ID from session
    const userId = sessionData.user_id
    console.log('✅ Valid session found for user:', userId)

    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, business_name, status, verification_status, created_at, updated_at')
      .eq('user_id', userId)
      .single()

    if (vendorError && vendorError.code !== 'PGRST116') {
      return Response.json({ 
        error: 'Database error' 
      }, { status: 500 })
    }

    if (!vendor) {
      return Response.json({ 
        hasApplication: false 
      })
    }

    return Response.json({
      hasApplication: true,
      vendor: {
        id: vendor.id,
        business_name: vendor.business_name,
        status: vendor.status,
        verification_status: vendor.verification_status,
        created_at: vendor.created_at,
        updated_at: vendor.updated_at
      }
    })

  } catch (error) {
    console.error('❌ Get vendor application error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Helper function to process application submission
async function processApplicationSubmission(supabase, userId, body) {
  try {
    console.log('📝 Processing vendor application for user:', userId)

    // Check if user already has a vendor application
    const { data: existingVendor, error: checkError } = await supabase
      .from('vendors')
      .select('id, status')
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing vendor:', checkError)
      return Response.json({ 
        error: 'Database error while checking existing application' 
      }, { status: 500 })
    }

    if (existingVendor) {
      return Response.json({ 
        error: `You already have a vendor application with status: ${existingVendor.status}` 
      }, { status: 400 })
    }

    // Prepare vendor data
    const vendorData = {
      user_id: userId,
      business_name: body.businessName,
      business_description: body.businessDescription,
      business_email: body.businessEmail,
      business_phone: body.businessPhone || null,
      business_address: body.businessAddress,
      business_type: body.businessType,
      business_registration_number: body.businessRegistrationNumber || null,
      tax_id: body.taxId || null,
      status: 'pending',
      verification_status: 'unverified',
      is_featured: false,
      average_rating: 0,
      total_reviews: 0,
      total_sales: 0,
      total_orders: 0,
      commission_rate: 10.00, // Default 10% commission
      payout_schedule: 'monthly',
      payment_method_preference: body.paymentMethodPreference,
      bank_account_info: body.paymentMethodPreference === 'bank_transfer' ? body.bankAccountInfo : null,
      is_active: false, // Will be activated upon approval
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('💾 Creating vendor application:', {
      business_name: vendorData.business_name,
      business_email: vendorData.business_email,
      business_type: vendorData.business_type
    })

    // Insert vendor application
    const { data: newVendor, error: insertError } = await supabase
      .from('vendors')
      .insert([vendorData])
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating vendor application:', insertError)
      return Response.json({ 
        error: 'Failed to submit application. Please try again.' 
      }, { status: 500 })
    }

    console.log('✅ Vendor application created successfully:', newVendor.id)

    return Response.json({
      success: true,
      message: 'Vendor application submitted successfully',
      vendor: {
        id: newVendor.id,
        business_name: newVendor.business_name,
        status: newVendor.status,
        created_at: newVendor.created_at
      }
    })

  } catch (error) {
    console.error('❌ Vendor application processing error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}