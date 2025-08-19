import { getSupabaseClient } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    const supabase = getSupabaseClient()
    
    console.log('🔍 DEBUG LOGIN - Starting login process for:', email)
    
    // Step 1: Clear any existing session
    console.log('🧹 DEBUG LOGIN - Clearing existing session')
    await supabase.auth.signOut()
    
    // Step 2: Attempt login
    console.log('🔄 DEBUG LOGIN - Attempting signInWithPassword')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (authError) {
      console.error('❌ DEBUG LOGIN - Auth failed:', authError)
      return Response.json({ 
        success: false, 
        step: 'auth_failed',
        error: authError.message,
        details: authError
      }, { status: 401 })
    }
    
    console.log('✅ DEBUG LOGIN - Auth successful, user ID:', authData.user.id)
    
    // Step 3: Fetch vendor profile
    console.log('🔄 DEBUG LOGIN - Fetching vendor profile for user:', authData.user.id)
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()
    
    if (vendorError && vendorError.code !== 'PGRST116') {
      console.error('❌ DEBUG LOGIN - Vendor query failed:', vendorError)
      return Response.json({ 
        success: false, 
        step: 'vendor_query_failed',
        error: vendorError.message,
        details: vendorError
      }, { status: 500 })
    }
    
    if (!vendor) {
      console.log('ℹ️ DEBUG LOGIN - No vendor profile found')
      return Response.json({ 
        success: true, 
        step: 'no_vendor_profile',
        user: authData.user,
        vendor: null,
        redirect_to: '/vendor-pending'
      })
    }
    
    console.log('✅ DEBUG LOGIN - Vendor found:', vendor.business_name, 'Status:', vendor.status)
    
    // Step 4: Check vendor status
    if (vendor.status !== 'approved') {
      console.log('⚠️ DEBUG LOGIN - Vendor not approved, status:', vendor.status)
      return Response.json({ 
        success: true, 
        step: 'vendor_not_approved',
        user: authData.user,
        vendor: vendor,
        redirect_to: '/vendor-pending'
      })
    }
    
    console.log('🎉 DEBUG LOGIN - Login complete! Vendor is approved')
    return Response.json({ 
      success: true, 
      step: 'login_complete',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        created_at: authData.user.created_at
      },
      vendor: {
        id: vendor.id,
        business_name: vendor.business_name,
        status: vendor.status,
        verification_status: vendor.verification_status,
        is_active: vendor.is_active
      },
      session: {
        access_token: authData.session.access_token.substring(0, 20) + '...',
        expires_at: authData.session.expires_at
      },
      redirect_to: '/dashboard'
    })
    
  } catch (error) {
    console.error('💥 DEBUG LOGIN - Exception:', error)
    return Response.json({ 
      success: false, 
      step: 'exception',
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}