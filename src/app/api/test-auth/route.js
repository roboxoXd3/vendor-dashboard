import { getSupabaseClient } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    const supabase = getSupabaseClient()
    
    console.log('🔄 Testing authentication for:', email)
    
    // Test authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return Response.json({ 
        success: false, 
        error: authError.message,
        step: 'authentication'
      }, { status: 401 })
    }
    
    console.log('✅ Authentication successful for:', authData.user.email)
    
    // Check if vendor profile exists
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()
    
    if (vendorError && vendorError.code !== 'PGRST116') {
      console.error('❌ Vendor query error:', vendorError)
      return Response.json({ 
        success: false, 
        error: vendorError.message,
        step: 'vendor_lookup'
      }, { status: 500 })
    }
    
    const result = {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        created_at: authData.user.created_at
      },
      vendor: vendor ? {
        id: vendor.id,
        business_name: vendor.business_name,
        status: vendor.status,
        verification_status: vendor.verification_status,
        is_active: vendor.is_active,
        created_at: vendor.created_at
      } : null,
      step: 'complete'
    }
    
    console.log('✅ Test complete:', result)
    return Response.json(result)
    
  } catch (error) {
    console.error('❌ Test auth exception:', error)
    return Response.json({ 
      success: false, 
      error: error.message,
      step: 'exception'
    }, { status: 500 })
  }
}