import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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

    // Create vendor session with tokens
    const { sessionToken } = await tokenAuthService.createVendorSession(authData.user, vendor)

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
