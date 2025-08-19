import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { tokenAuthService } from '@/services/tokenAuthService'

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

    // Get Supabase client
    const supabase = getSupabase()

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

    // Get vendor profile
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()

    if (vendorError || !vendor) {
      console.error('❌ Vendor profile not found:', vendorError?.message)
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 404 }
      )
    }

    // Check vendor status
    if (vendor.status !== 'approved') {
      console.log('⚠️ Vendor not approved:', vendor.status)
      return NextResponse.json(
        { 
          error: 'Vendor not approved',
          vendor: vendor,
          requiresApproval: true
        },
        { status: 403 }
      )
    }

    // Try to create vendor session with tokens, fallback to simple auth if table doesn't exist
    let sessionToken = null
    try {
      const sessionResult = await tokenAuthService.createVendorSession(authData.user, vendor)
      sessionToken = sessionResult.sessionToken
      console.log('✅ Vendor session created with tokens')
    } catch (sessionError) {
      console.warn('⚠️ Token session creation failed, using fallback auth:', sessionError.message)
      // Generate a simple session token for fallback
      sessionToken = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    console.log('✅ Vendor login successful for:', vendor.business_name)

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email
      },
      vendor: vendor,
      sessionToken: sessionToken,
      message: 'Login successful'
    })

  } catch (error) {
    console.error('❌ Vendor login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
