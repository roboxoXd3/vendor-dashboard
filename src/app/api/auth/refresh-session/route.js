import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseServer, getSupabaseClient } from '@/lib/supabase-server'
import CryptoJS from 'crypto-js'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('vendor_refresh_token')?.value

    if (!refreshToken) {
      return NextResponse.json({
        success: false,
        message: 'No refresh token found'
      }, { status: 401 })
    }

    console.log('🔄 Refreshing session token via cookies...')

    const supabase = getSupabaseServer()
    
    // Find session by refresh token
    const { data: sessionData, error } = await supabase
      .from('vendor_sessions')
      .select('*')
      .eq('refresh_token', refreshToken)
      .eq('is_active', true)
      .single()

    if (error || !sessionData) {
      console.log('❌ Invalid refresh token')
      return NextResponse.json({
        success: false,
        message: 'Invalid refresh token'
      }, { status: 401 })
    }

    // Generate new tokens
    const newSessionToken = CryptoJS.lib.WordArray.random(32).toString()
    const newRefreshToken = CryptoJS.lib.WordArray.random(32).toString()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    let deviceInfo = sessionData.device_info || {}
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
        }
      } catch (tokenError) {
        console.error('⚠️ Could not refresh BeSmart auth token:', tokenError)
      }
    }

    // Update session with new tokens
    const { error: updateError } = await supabase
      .from('vendor_sessions')
      .update({
        session_token: newSessionToken,
        refresh_token: newRefreshToken,
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

    // Set new cookies
    cookieStore.set('vendor_session_token', newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })
    
    cookieStore.set('vendor_refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

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