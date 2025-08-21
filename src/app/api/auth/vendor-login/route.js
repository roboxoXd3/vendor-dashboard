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
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()

    // If no vendor profile exists, allow login but redirect to application
    if (vendorError && vendorError.code === 'PGRST116') {
      console.log('ℹ️ No vendor profile found - new user can apply for vendor status')
      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email
        },
        vendor: null,
        sessionToken: null,
        requiresApplication: true,
        message: 'Login successful - please complete your vendor application'
      })
    }

    if (vendorError) {
      console.error('❌ Error fetching vendor profile:', vendorError?.message)
      return NextResponse.json(
        { error: 'Database error while fetching vendor profile' },
        { status: 500 }
      )
    }

    // Check vendor status - allow all statuses to login, but handle differently
    if (vendor.status !== 'approved') {
      console.log('⚠️ Vendor not approved - status:', vendor.status)
      
      // Still allow login but with limited access
      let sessionToken = null
      try {
        // Clean up old sessions for this user first
        await supabase
          .from('vendor_sessions')
          .delete()
          .eq('user_id', authData.user.id)
          .lt('expires_at', new Date().toISOString())
        
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
        console.log('✅ Limited vendor session created in database')
      } catch (sessionError) {
        console.warn('⚠️ Token session creation failed, using fallback auth:', sessionError.message)
        sessionToken = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      return NextResponse.json(
        { 
          success: true,
          user: {
            id: authData.user.id,
            email: authData.user.email
          },
          vendor: vendor,
          sessionToken: sessionToken,
          requiresApproval: true,
          message: `Login successful - vendor status: ${vendor.status}`
        }
      )
    }

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

    // Set HTTP-only cookies for approved vendors
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
    
    console.log('✅ Vendor login successful for:', vendor.business_name)

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email
      },
      vendor: vendor,
      sessionToken: 'stored_in_cookie', // Don't send actual token to client
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
