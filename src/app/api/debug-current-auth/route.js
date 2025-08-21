import { getSupabase } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = getSupabase()
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return Response.json({
        success: false,
        error: sessionError.message,
        step: 'session_check'
      })
    }
    
    if (!session?.user) {
      return Response.json({
        success: true,
        authenticated: false,
        message: 'No active session found'
      })
    }
    
    // Get vendor profile for current user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
    
    const result = {
      success: true,
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        created_at: session.user.created_at
      },
      vendor: vendor ? {
        id: vendor.id,
        business_name: vendor.business_name,
        business_email: vendor.business_email,
        status: vendor.status,
        user_id: vendor.user_id
      } : null,
      session_expires_at: session.expires_at,
      access_token_preview: session.access_token ? session.access_token.substring(0, 20) + '...' : null
    }
    
    console.log('🔍 Current auth state:', result)
    return Response.json(result)
    
  } catch (error) {
    console.error('❌ Debug auth error:', error)
    return Response.json({
      success: false,
      error: error.message,
      step: 'exception'
    })
  }
}
