import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value

    console.log('🔍 Debug - Cookie store keys:', Object.keys(cookieStore.getAll()))
    console.log('🔍 Debug - Session token from cookie:', sessionToken ? 'EXISTS' : 'NULL')

    if (!sessionToken) {
      return NextResponse.json({
        valid: false,
        message: 'No session token found in cookies'
      })
      
    }

    console.log('🔍 Validating session token from cookies...')

    const supabase = getSupabaseServer()
    
    // Find session in database - first check if session exists at all
    const { data: allSessions, error: allSessionsError } = await supabase
      .from('vendor_sessions')
      .select('*')
      .eq('session_token', sessionToken)
    
    console.log('🔍 Debug - All sessions with this token:', allSessions?.length || 0)
    console.log('🔍 Debug - All sessions query error:', allSessionsError?.message)
    
    // Also check if there are ANY sessions in the table
    const { data: anySessions, error: anySessionsError } = await supabase
      .from('vendor_sessions')
      .select('*')
      .limit(5)
    
    console.log('🔍 Debug - Total sessions in table:', anySessions?.length || 0)
    console.log('🔍 Debug - Any sessions query error:', anySessionsError?.message)
    
    // Find active session in database (simplified query)
    const { data: sessionData, error } = await supabase
      .from('vendor_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error || !sessionData) {
      console.log('❌ Invalid or expired session token')
      console.log('🔍 Debug - Session lookup error:', error?.message)
      console.log('🔍 Debug - Session token being searched:', sessionToken)
      return NextResponse.json({
        valid: false,
        message: 'Invalid or expired session'
      })
    }
    
    // Get vendor data separately
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', sessionData.vendor_id)
      .single()
    
    if (vendorError || !vendor) {
      console.log('❌ Vendor not found for session')
      console.log('🔍 Debug - Vendor lookup error:', vendorError?.message)
      return NextResponse.json({
        valid: false,
        message: 'Vendor not found'
      })
    }

    // Update session last activity
    await supabase
      .from('vendor_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('session_token', sessionToken)

    // Get user email from Supabase auth users table
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(sessionData.user_id)
    
    const userEmail = userData?.user?.email || vendor.business_email || 'unknown@example.com'

    console.log('✅ Session validated for:', vendor.business_name)

    return NextResponse.json({
      valid: true,
      vendor: vendor,
      user: {
        id: sessionData.user_id,
        email: userEmail,
        created_at: sessionData.created_at
      },
      session: {
        id: sessionData.id,
        expires_at: sessionData.expires_at
      }
    })

  } catch (error) {
    console.error('❌ Error validating session:', error)
    return NextResponse.json({
      valid: false,
      error: error.message
    }, { status: 500 })
  }
}