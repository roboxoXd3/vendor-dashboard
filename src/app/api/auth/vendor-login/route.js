import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('🔐 Vendor login attempt for:', email)

    // Get Supabase server client (bypasses RLS)
    const supabase = getSupabaseServer()

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      console.error('❌ Authentication failed:', authError?.message)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Get vendor profile (optional - user can exist without vendor profile)
    let { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()

    // If no vendor profile exists, create one automatically with 'pending' status
    if (vendorError && vendorError.code === 'PGRST116') {
      console.log('ℹ️ No vendor profile found - creating default pending profile')
      
      try {
        // Create a default vendor profile with pending status
        const defaultVendorData = {
          user_id: authData.user.id,
          business_name: 'Pending Setup',
          business_description: 'Please complete your vendor application',
          business_email: authData.user.email,
          business_phone: null,
          business_address: 'Address to be updated',
          business_type: 'individual',
          business_registration_number: null,
          tax_id: null,
          status: 'pending',
          verification_status: 'unverified',
          is_featured: false,
          average_rating: 0,
          total_reviews: 0,
          total_sales: 0,
          total_orders: 0,
          commission_rate: 10.00,
          payout_schedule: 'monthly',
          payment_method_preference: 'bank_transfer',
          bank_account_info: null,
          is_active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data: newVendor, error: createError } = await supabase
          .from('vendors')
          .insert([defaultVendorData])
          .select()
          .single()

        if (createError) {
          console.error('❌ Error creating default vendor profile:', createError)
          throw createError
        }

        console.log('✅ Default vendor profile created:', newVendor.id)
        
        // Set vendor to the newly created profile
        vendor = newVendor
        
      } catch (error) {
        console.error('❌ Failed to create default vendor profile:', error)
        return NextResponse.json(
          { error: 'Failed to create vendor profile' },
          { status: 500 }
        )
      }
    }

    if (vendorError) {
      console.error('❌ Error fetching vendor profile:', vendorError?.message)
      return NextResponse.json(
        { error: 'Database error while fetching vendor profile' },
        { status: 500 }
      )
    }

    // Create proper vendor session regardless of status
    console.log('🔐 Creating vendor session for:', vendor.business_name, '- Status:', vendor.status)

    // Try to create vendor session with tokens, fallback to simple auth if table doesn't exist
    let sessionToken = null
    try {
      // Clean up ALL old sessions for this user first (to prevent duplicates)
      const { error: cleanupError } = await supabase
        .from('vendor_sessions')
        .delete()
        .eq('user_id', authData.user.id)
      
      if (cleanupError) {
        console.warn('⚠️ Could not cleanup old sessions:', cleanupError.message)
      } else {
        console.log('🧹 Cleaned up old sessions for user')
      }
      
      // Create session using server-side Supabase client (bypasses RLS)
      const sessionTokenValue = `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
      const refreshTokenValue = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('vendor_sessions')
        .insert({
          vendor_id: vendor.id,
          user_id: authData.user.id,
          session_token: sessionTokenValue,
          refresh_token: refreshTokenValue,
          expires_at: expiresAt.toISOString(),
          is_active: true,
          device_info: {
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
          }
        })
        .select()
        .single()

      if (sessionError) {
        console.warn('⚠️ Database session creation failed:', sessionError.message)
        throw sessionError
      }
      
      sessionToken = sessionTokenValue
      console.log('✅ Vendor session created with tokens in database')
      console.log('🔍 Debug - Created session ID:', sessionData.id)
      console.log('🔍 Debug - Session token saved:', sessionTokenValue)
    } catch (sessionError) {
      console.warn('⚠️ Token session creation failed, using fallback auth:', sessionError.message)
      // Generate a simple session token for fallback
      sessionToken = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Set HTTP-only cookies
    const cookieStore = await cookies()
    
    console.log('🔍 Debug - Setting cookie with token:', sessionToken)
    
    // Session token cookie (24 hours)
    cookieStore.set('vendor_session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    // Clear any old application auth cookies
    cookieStore.delete('vendor_application_auth')
    
    console.log('✅ Vendor login successful for:', vendor.business_name, '- Status:', vendor.status)

    // Determine response based on vendor status
    const responseData = {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email
      },
      vendor: vendor,
      sessionToken: 'stored_in_cookie', // Don't send actual token to client
      message: `Login successful - vendor status: ${vendor.status}`
    }

    // Add flags based on vendor status
    if (vendor.status === 'pending') {
      responseData.requiresApproval = true
    } else if (vendor.status === 'approved') {
      responseData.approved = true
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('❌ Vendor login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
