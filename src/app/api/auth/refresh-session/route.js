import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseServer, getSupabaseClient } from '@/lib/supabase-server'

/**
 * Extends the vendor session and refreshes the embedded Supabase JWT.
 * Intentionally does NOT rotate vendor_session_token / vendor_refresh_token
 * on every refresh — rotating them caused intermittent "Invalid session"
 * when concurrent requests (product create + media uploads + auto-timer)
 * raced with the cookie update.
 */
export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    const refreshToken = cookieStore.get('vendor_refresh_token')?.value

    if (!sessionToken && !refreshToken) {
      return NextResponse.json({
        success: false,
        message: 'No session token found'
      }, { status: 401 })
    }

    console.log('🔄 Refreshing session token via cookies...')

    const supabase = getSupabaseServer()

    let sessionData = null

    if (sessionToken) {
      const { data, error } = await supabase
        .from('vendor_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!error && data) {
        sessionData = data
      }
    }

    // Fallback: look up by refresh token (older clients / edge cases)
    if (!sessionData && refreshToken) {
      const { data, error } = await supabase
        .from('vendor_sessions')
        .select('*')
        .eq('refresh_token', refreshToken)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!error && data) {
        sessionData = data
      }
    }

    if (!sessionData) {
      console.log('❌ Invalid session for refresh')
      return NextResponse.json({
        success: false,
        message: 'Invalid refresh token'
      }, { status: 401 })
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // extend 24 hours

    let deviceInfo = sessionData.device_info || {}
    if (typeof deviceInfo === 'string') {
      try {
        deviceInfo = JSON.parse(deviceInfo)
      } catch {
        deviceInfo = {}
      }
    }

    const supabaseRefreshToken = deviceInfo.supabase_refresh_token

    if (supabaseRefreshToken) {
      try {
        const supabaseClient = getSupabaseClient()
        const { data: authData, error: authError } = await supabaseClient.auth.refreshSession({
          refresh_token: supabaseRefreshToken,
        })

        if (!authError && authData?.session) {
          deviceInfo = {
            ...deviceInfo,
            supabase_access_token: authData.session.access_token,
            supabase_refresh_token: authData.session.refresh_token,
          }
        } else {
          console.warn('⚠️ Could not refresh BeSmart auth token:', authError?.message)
        }
      } catch (tokenError) {
        console.error('⚠️ Could not refresh BeSmart auth token:', tokenError)
      }
    }

    // Keep the same session_token / refresh_token — only extend expiry + update JWT
    const { error: updateError } = await supabase
      .from('vendor_sessions')
      .update({
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
        device_info: deviceInfo,
      })
      .eq('id', sessionData.id)

    if (updateError) {
      console.error('❌ Error updating session tokens:', updateError)
      return NextResponse.json({
        success: false,
        message: 'Failed to refresh session'
      }, { status: 500 })
    }

    // Re-assert cookies with extended maxAge (same token values)
    cookieStore.set('vendor_session_token', sessionData.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/'
    })

    if (sessionData.refresh_token) {
      cookieStore.set('vendor_refresh_token', sessionData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/'
      })
    }

    console.log('✅ Session refreshed successfully via cookies')

    return NextResponse.json({
      success: true,
      sessionToken: 'stored_in_cookie',
      message: 'Session refreshed successfully'
    })

  } catch (error) {
    console.error('❌ Error refreshing session:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
