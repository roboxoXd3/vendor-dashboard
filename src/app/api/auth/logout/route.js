import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    console.log('🚪 Vendor logout initiated...')

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value

    // Invalidate the session in database if we have a token
    if (sessionToken) {
      const supabase = getSupabaseServer()
      await supabase
        .from('vendor_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken)
      
      console.log('✅ Session invalidated in database')
    }

    // Clear the HTTP-only cookies
    cookieStore.set('vendor_session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    })
    
    cookieStore.set('vendor_refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    })

    // Sign out from Supabase
    const supabase = getSupabaseServer()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('❌ Supabase signout error:', error)
    }

    console.log('✅ Vendor logout successful')

    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    })

  } catch (error) {
    console.error('❌ Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
