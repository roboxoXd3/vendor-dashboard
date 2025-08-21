import { getSupabase } from '@/lib/supabase'
import CryptoJS from 'crypto-js'

class CookieAuthService {
  constructor() {
    this.tokenCookieName = 'vendor_session_token'
    this.refreshCookieName = 'vendor_refresh_token'
  }

  // Generate secure tokens
  generateTokens() {
    const sessionToken = CryptoJS.lib.WordArray.random(32).toString()
    const refreshToken = CryptoJS.lib.WordArray.random(32).toString()
    return { sessionToken, refreshToken }
  }

  // Create vendor session with cookies
  async createVendorSession(user, vendor) {
    try {
      console.log('🔐 Creating vendor session with cookies for:', vendor.business_name)
      
      const { sessionToken, refreshToken } = this.generateTokens()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      
      // Get device info
      const deviceInfo = {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
        platform: typeof window !== 'undefined' ? window.navigator.platform : null,
        language: typeof window !== 'undefined' ? window.navigator.language : null
      }

      // Try to clean up old sessions for this user
      try {
        await this.cleanupUserSessions(user.id)
      } catch (cleanupError) {
        console.warn('⚠️ Could not cleanup old sessions:', cleanupError.message)
      }

      // Create new session in database
      const supabase = getSupabase()
      const { data: sessionData, error } = await supabase
        .from('vendor_sessions')
        .insert({
          vendor_id: vendor.id,
          user_id: user.id,
          session_token: sessionToken,
          refresh_token: refreshToken,
          expires_at: expiresAt.toISOString(),
          device_info: deviceInfo,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      console.log('✅ Database session created successfully with cookies')
      return { sessionData, sessionToken, refreshToken, vendor, user }
      
    } catch (error) {
      console.error('❌ Error in createVendorSession:', error)
      throw error
    }
  }

  // Validate session token from cookies
  async validateSessionFromCookies() {
    try {
      console.log('🔍 Validating session from cookies...')

      // Get session token from cookie via API call
      const response = await fetch('/api/auth/validate-session', {
        method: 'GET',
        credentials: 'include' // Include cookies
      })

      if (!response.ok) {
        console.log('❌ Session validation failed')
        return { valid: false, vendor: null, user: null }
      }

      const data = await response.json()
      
      if (data.valid) {
        console.log('✅ Cookie session validated for:', data.vendor?.business_name)
        return {
          valid: true,
          vendor: data.vendor,
          user: data.user,
          session: data.session
        }
      } else {
        console.log('❌ Invalid cookie session')
        return { valid: false, vendor: null, user: null }
      }
    } catch (error) {
      console.error('❌ Error validating session from cookies:', error)
      return { valid: false, vendor: null, user: null }
    }
  }

  // Refresh session token
  async refreshSession() {
    try {
      console.log('🔄 Refreshing session token via cookies...')

      const response = await fetch('/api/auth/refresh-session', {
        method: 'POST',
        credentials: 'include' // Include cookies
      })

      if (!response.ok) {
        console.log('❌ Session refresh failed')
        return { success: false }
      }

      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Session refreshed successfully via cookies')
        return { success: true, sessionToken: data.sessionToken }
      } else {
        console.log('❌ Session refresh failed')
        return { success: false }
      }
    } catch (error) {
      console.error('❌ Error refreshing session:', error)
      return { success: false }
    }
  }

  // Clean up user sessions
  async cleanupUserSessions(userId) {
    try {
      const supabase = getSupabase()
      await supabase
        .from('vendor_sessions')
        .delete()
        .eq('user_id', userId)
      
      console.log('🧹 Cleaned up old sessions for user')
    } catch (error) {
      console.error('❌ Error cleaning up sessions:', error)
    }
  }

  // Invalidate current session
  async invalidateSession() {
    try {
      console.log('🚪 Invalidating session via cookies...')
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // Include cookies
      })

      if (response.ok) {
        console.log('✅ Session invalidated successfully via cookies')
      } else {
        console.log('⚠️ Session invalidation response not OK, but continuing...')
      }
    } catch (error) {
      console.error('❌ Error invalidating session:', error)
    }
  }
}

export const cookieAuthService = new CookieAuthService()
