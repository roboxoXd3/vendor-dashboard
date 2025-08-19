import { supabase } from '@/lib/supabase'
import CryptoJS from 'crypto-js'

class TokenAuthService {
  constructor() {
    this.tokenKey = 'vendor_session_token'
    this.refreshKey = 'vendor_refresh_token'
    this.vendorKey = 'vendor_data'
  }

  // Generate secure tokens
  generateTokens() {
    const sessionToken = CryptoJS.lib.WordArray.random(32).toString()
    const refreshToken = CryptoJS.lib.WordArray.random(32).toString()
    return { sessionToken, refreshToken }
  }

  // Create vendor session with tokens
  async createVendorSession(user, vendor) {
    try {
      console.log('🔐 Creating vendor session for:', vendor.business_name)
      
      const { sessionToken, refreshToken } = this.generateTokens()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      
      // Get device info
      const deviceInfo = {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
        platform: typeof window !== 'undefined' ? window.navigator.platform : null,
        language: typeof window !== 'undefined' ? window.navigator.language : null
      }

      // Clean up old sessions for this user
      await this.cleanupUserSessions(user.id)

      // Create new session in database
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
        console.error('❌ Error creating vendor session:', error)
        throw error
      }

      // Store tokens in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.tokenKey, sessionToken)
        localStorage.setItem(this.refreshKey, refreshToken)
        localStorage.setItem(this.vendorKey, JSON.stringify(vendor))
      }

      console.log('✅ Vendor session created successfully')
      return { sessionData, sessionToken, refreshToken }
    } catch (error) {
      console.error('❌ Error in createVendorSession:', error)
      throw error
    }
  }

  // Validate session token
  async validateSession(token = null) {
    try {
      const sessionToken = token || this.getStoredToken()
      
      if (!sessionToken) {
        console.log('❌ No session token found')
        return { valid: false, vendor: null, user: null }
      }

      console.log('🔍 Validating session token...')

      // Query session from database
      const { data: sessionData, error } = await supabase
        .from('vendor_sessions')
        .select(`
          *,
          vendors!inner(
            id,
            business_name,
            business_email,
            status,
            user_id,
            created_at
          )
        `)
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !sessionData) {
        console.log('❌ Invalid or expired session token')
        this.clearStoredTokens()
        return { valid: false, vendor: null, user: null }
      }

      // Get user data
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user || user.id !== sessionData.user_id) {
        console.log('❌ User mismatch or not authenticated')
        this.clearStoredTokens()
        return { valid: false, vendor: null, user: null }
      }

      // Update session last activity
      await supabase
        .from('vendor_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('session_token', sessionToken)

      console.log('✅ Session validated successfully for:', sessionData.vendors.business_name)
      
      return {
        valid: true,
        vendor: sessionData.vendors,
        user: user,
        session: sessionData
      }
    } catch (error) {
      console.error('❌ Error validating session:', error)
      this.clearStoredTokens()
      return { valid: false, vendor: null, user: null }
    }
  }

  // Refresh session token
  async refreshSession() {
    try {
      const refreshToken = this.getStoredRefreshToken()
      
      if (!refreshToken) {
        console.log('❌ No refresh token found')
        return { success: false }
      }

      console.log('🔄 Refreshing session token...')

      // Find session by refresh token
      const { data: sessionData, error } = await supabase
        .from('vendor_sessions')
        .select('*')
        .eq('refresh_token', refreshToken)
        .eq('is_active', true)
        .single()

      if (error || !sessionData) {
        console.log('❌ Invalid refresh token')
        this.clearStoredTokens()
        return { success: false }
      }

      // Generate new tokens
      const { sessionToken: newSessionToken, refreshToken: newRefreshToken } = this.generateTokens()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      // Update session with new tokens
      const { error: updateError } = await supabase
        .from('vendor_sessions')
        .update({
          session_token: newSessionToken,
          refresh_token: newRefreshToken,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionData.id)

      if (updateError) {
        console.error('❌ Error updating session tokens:', updateError)
        return { success: false }
      }

      // Update stored tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.tokenKey, newSessionToken)
        localStorage.setItem(this.refreshKey, newRefreshToken)
      }

      console.log('✅ Session refreshed successfully')
      return { success: true, sessionToken: newSessionToken }
    } catch (error) {
      console.error('❌ Error refreshing session:', error)
      this.clearStoredTokens()
      return { success: false }
    }
  }

  // Clean up user sessions
  async cleanupUserSessions(userId) {
    try {
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
      const sessionToken = this.getStoredToken()
      
      if (sessionToken) {
        await supabase
          .from('vendor_sessions')
          .update({ is_active: false })
          .eq('session_token', sessionToken)
      }

      this.clearStoredTokens()
      console.log('✅ Session invalidated successfully')
    } catch (error) {
      console.error('❌ Error invalidating session:', error)
    }
  }

  // Storage helpers
  getStoredToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.tokenKey)
    }
    return null
  }

  getStoredRefreshToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.refreshKey)
    }
    return null
  }

  getStoredVendor() {
    if (typeof window !== 'undefined') {
      const vendorData = localStorage.getItem(this.vendorKey)
      return vendorData ? JSON.parse(vendorData) : null
    }
    return null
  }

  clearStoredTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey)
      localStorage.removeItem(this.refreshKey)
      localStorage.removeItem(this.vendorKey)
    }
  }

  // Check if user has valid session
  hasValidStoredSession() {
    return !!(this.getStoredToken() && this.getStoredRefreshToken())
  }
}

export const tokenAuthService = new TokenAuthService()
