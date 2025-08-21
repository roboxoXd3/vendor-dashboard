import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    const supabase = getSupabaseServer()

    console.log('🔍 Creating vendor profile with cookie auth...')
    
    // Check for regular session token first
    if (!sessionToken) {
      // Check for application auth cookie (for new users applying)
      const applicationAuth = cookieStore.get('vendor_application_auth')?.value
      
      if (!applicationAuth) {
        console.log('❌ No session token or application auth found in cookies for profile creation')
        return NextResponse.json({ 
          error: 'Authentication required - please login first' 
        }, { status: 401 })
      }

      try {
        const authData = JSON.parse(applicationAuth)
        
        // Check if application auth is expired
        if (new Date(authData.expiresAt) < new Date()) {
          console.log('❌ Application auth expired')
          return NextResponse.json({ 
            error: 'Session expired - please login again' 
          }, { status: 401 })
        }

        const userId = authData.userId
        const userEmail = authData.email
        console.log('✅ Valid application auth found for profile creation, user:', userId)

        // Process profile creation using application auth
        return await processProfileCreation(supabase, userId, userEmail, body)

      } catch (error) {
        console.log('❌ Invalid application auth cookie for profile creation')
        return NextResponse.json({ 
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
      console.log('❌ Invalid or expired session for profile creation')
      return NextResponse.json({ 
        error: 'Invalid or expired session' 
      }, { status: 401 })
    }

    // Get user ID from session
    const userId = sessionData.user_id
    const userEmail = sessionData.user_email || body.businessEmail || 'unknown@example.com'
    console.log('✅ Valid session found for user:', userId)

    // Process profile creation using regular session auth
    return await processProfileCreation(supabase, userId, userEmail, body)

  } catch (error) {
    console.error('❌ Create vendor profile API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Helper function to process profile creation
async function processProfileCreation(supabase, userId, userEmail, body) {
  try {
    console.log('📝 Creating vendor profile for user:', userId)

    // Check if user already has a vendor profile
    const { data: existingVendor, error: checkError } = await supabase
      .from('vendors')
      .select('id, status')
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing vendor:', checkError)
      return NextResponse.json({ 
        error: 'Database error while checking existing profile' 
      }, { status: 500 })
    }

    if (existingVendor) {
      return NextResponse.json({ 
        error: `You already have a vendor profile with status: ${existingVendor.status}` 
      }, { status: 400 })
    }

    // Prepare vendor data with minimal required fields
    const vendorData = {
      user_id: userId,
      business_name: body.businessName,
      business_description: body.businessDescription || 'No description provided',
      business_email: body.businessEmail || userEmail,
      business_phone: body.businessPhone || null,
      business_address: body.businessAddress || 'Address to be updated',
      business_type: body.businessType || 'retail',
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
      payment_method_preference: body.paymentMethodPreference || 'bank_transfer',
      bank_account_info: body.bankAccountInfo || null,
      is_active: false, // Will be activated upon approval
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('💾 Creating vendor profile:', {
      business_name: vendorData.business_name,
      business_email: vendorData.business_email,
      business_type: vendorData.business_type
    })

    // Insert vendor profile
    const { data: newVendor, error: insertError } = await supabase
      .from('vendors')
      .insert([vendorData])
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating vendor profile:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create vendor profile. Please try again.' 
      }, { status: 500 })
    }

    console.log('✅ Vendor profile created successfully:', newVendor.id)

    return NextResponse.json({
      success: true,
      message: 'Vendor profile created successfully',
      vendor: {
        id: newVendor.id,
        business_name: newVendor.business_name,
        status: newVendor.status,
        verification_status: newVendor.verification_status,
        created_at: newVendor.created_at
      }
    })

  } catch (error) {
    console.error('❌ Vendor profile creation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
