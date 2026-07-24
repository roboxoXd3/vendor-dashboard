'use client'
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { cookieAuthService } from '@/services/cookieAuthService'
import toast from 'react-hot-toast'

const AuthContext = createContext()

const PUBLIC_PREFIXES = [
  '/reset-password',
  '/auth/reset-password',
  '/auth/forgot-password',
  '/privacy',
  '/terms',
]

function isPublicPath(pathname) {
  return Boolean(pathname && PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isClient, setIsClient] = useState(false)
  const [sessionToken, setSessionToken] = useState(null)
  const router = useRouter()
  const pathname = usePathname()
  const refreshIntervalRef = useRef(null)
  const authInitializedRef = useRef(false)
  const refreshInFlightRef = useRef(null)

  const stopSessionRefreshTimer = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
  }, [])

  const clearAuthState = useCallback(() => {
    stopSessionRefreshTimer()
    authInitializedRef.current = false
    setUser(null)
    setVendor(null)
    setSessionToken(null)
    setError(null)
  }, [stopSessionRefreshTimer])

  const signOut = useCallback(async () => {
    try {
      console.log('🚪 Signing out...')
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      clearAuthState()
      console.log('✅ Sign out successful')
      router.push('/')
    } catch (err) {
      console.error('❌ Sign out error:', err)
      clearAuthState()
      router.push('/')
    }
  }, [clearAuthState, router])

  // Force logout + login redirect when an API returns invalid/expired session
  const handleSessionExpired = useCallback(async (message) => {
    console.warn('⚠️ Session expired:', message)
    toast.error(message || 'Your session has expired. Please log in again.')
    await signOut()
  }, [signOut])

  const refreshSession = useCallback(async () => {
    // Deduplicate concurrent refresh calls (auto-timer + manual + API handlers)
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current
    }

    refreshInFlightRef.current = (async () => {
      try {
        const result = await cookieAuthService.refreshSession()

        if (result.success) {
          console.log('✅ Session refreshed successfully')
          return true
        }

        // Only force logout on definitive auth failure (401), not network blips
        console.log('❌ Session refresh failed:', result.status || result.error)
        if (result.status === 401) {
          await signOut()
        }
        return false
      } catch (err) {
        console.error('❌ Session refresh error:', err)
        // Network/transient errors should not kick the vendor out mid-flow
        return false
      } finally {
        refreshInFlightRef.current = null
      }
    })()

    return refreshInFlightRef.current
  }, [signOut])

  const startSessionRefreshTimer = useCallback(() => {
    // Only one interval at a time — stacking these caused intermittent invalid sessions
    if (refreshIntervalRef.current) return

    // Refresh every 45 minutes (vendor session cookie is 24h; Supabase JWT ~1h)
    refreshIntervalRef.current = setInterval(async () => {
      console.log('🔄 Auto-refreshing session...')
      const success = await refreshSession()
      if (!success) {
        stopSessionRefreshTimer()
      }
    }, 45 * 60 * 1000)
  }, [refreshSession, stopSessionRefreshTimer])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    if (isPublicPath(pathname)) {
      setLoading(false)
      return
    }

    // Do not re-validate / restack refresh timers on every client navigation
    if (authInitializedRef.current) {
      setLoading(false)
      return
    }

    let cancelled = false

    const initializeAuth = async () => {
      try {
        const validation = await cookieAuthService.validateSessionFromCookies()
        if (cancelled) return

        if (validation.valid) {
          setUser(validation.user)
          setVendor(validation.vendor)
          setSessionToken('cookie_based')
          setError(null)
          authInitializedRef.current = true

          if (validation.vendor?.status === 'approved') {
            startSessionRefreshTimer()
          }
        } else {
          setUser(null)
          setVendor(null)
          setSessionToken(null)
        }
      } catch (err) {
        if (cancelled) return
        setError(err.message)
        setUser(null)
        setVendor(null)
        setSessionToken(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    initializeAuth()

    return () => {
      cancelled = true
    }
  }, [isClient, pathname, startSessionRefreshTimer])

  // Auth listener + timer cleanup live for the lifetime of AuthProvider
  useEffect(() => {
    if (!isClient) return

    const supabaseForListener = getSupabase()
    const { data: { subscription } } = supabaseForListener.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        clearAuthState()
      }
    })

    return () => {
      subscription.unsubscribe()
      stopSessionRefreshTimer()
    }
  }, [isClient, clearAuthState, stopSessionRefreshTimer])

  const signInWithToken = async (email, password) => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔐 Attempting cookie-based login for:', email)

      const response = await fetch('/api/auth/vendor-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      if (data.requiresApproval) {
        setUser(data.user || null)
        setVendor(data.vendor || null)
        setSessionToken('cookie_based')
        authInitializedRef.current = true
        return { success: true, requiresApproval: true, vendor: data.vendor }
      }

      if (data.requiresApplication) {
        setUser(data.user || null)
        setVendor(null)
        setSessionToken(data.sessionToken ? 'cookie_based' : null)
        authInitializedRef.current = true
        return { success: true, requiresApplication: true }
      }

      setUser(data.user)
      setVendor(data.vendor)
      setSessionToken('cookie_based')
      authInitializedRef.current = true

      console.log('✅ Cookie-based login successful for:', data.vendor.business_name)

      if (data.vendor?.status === 'approved') {
        startSessionRefreshTimer()
      }

      return { success: true, user: data.user, vendor: data.vendor }
    } catch (err) {
      console.error('❌ Cookie-based login error:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const validateCurrentSession = async () => {
    if (!sessionToken) return false

    try {
      const validation = await cookieAuthService.validateSessionFromCookies()

      if (!validation.valid) {
        console.log('⚠️ Session validation failed, attempting refresh...')
        const refreshResult = await refreshSession()
        if (refreshResult) {
          console.log('✅ Session refreshed successfully')
          return true
        }
        return false
      }

      return true
    } catch (validationError) {
      console.error('❌ Session validation error:', validationError)
      // Network blips shouldn't force logout
      return true
    }
  }

  const forgotPassword = async (email) => {
    const loadingToast = toast.loading('Sending password reset email...')

    try {
      setLoading(true)
      setError(null)

      console.log('📧 Sending password reset email to:', email)

      const supabase = getSupabase()
      const vendorDashboardUrl = 'https://vendor-dashboard-production.up.railway.app'
      const resetUrl = `${vendorDashboardUrl}/auth/reset-password`

      console.log('🔗 Vendor Dashboard Reset URL:', resetUrl)

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetUrl,
      })

      if (resetError) {
        throw new Error(resetError.message)
      }

      console.log('✅ Password reset email sent successfully')
      toast.dismiss(loadingToast)
      return { success: true, message: 'Password reset link sent to your email' }
    } catch (err) {
      console.error('❌ Forgot password error:', err)
      toast.dismiss(loadingToast)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const fetchVendorProfile = async () => {
    try {
      console.log('🔄 Fetching updated vendor profile...')

      const validation = await cookieAuthService.validateSessionFromCookies()

      if (validation.valid && validation.vendor) {
        console.log('✅ Updated vendor profile fetched:', validation.vendor.business_name)
        setVendor(validation.vendor)
        return validation.vendor
      }

      console.log('❌ No vendor profile found during refresh')
      setVendor(null)
      return null
    } catch (profileError) {
      console.error('❌ Error fetching vendor profile:', profileError)
      return null
    }
  }

  const value = {
    user,
    vendor,
    loading,
    error,
    sessionToken,
    signInWithToken,
    signOut,
    handleSessionExpired,
    refreshSession,
    validateCurrentSession,
    fetchVendorProfile,
    forgotPassword,
    isAuthenticated: !!user,
    isVendor: !!vendor,
    isApprovedVendor: vendor?.status === 'approved',
    vendorId: vendor?.id,
    businessName: vendor?.business_name,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
