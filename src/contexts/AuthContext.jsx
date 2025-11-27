'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { cookieAuthService } from '@/services/cookieAuthService'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isClient, setIsClient] = useState(false)
  const [sessionToken, setSessionToken] = useState(null)
  const router = useRouter()
  const pathname = usePathname()

  // Set client flag to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Only run auth logic on client side
    if (!isClient) return
    
    // Skip auth checks on reset password page - it handles its own authentication
    if (pathname === '/reset-password') {
      setLoading(false)
      return
    }
    
    const initializeAuth = async () => {
      try {
        // Validate session from cookies
        const validation = await cookieAuthService.validateSessionFromCookies()
        
        if (validation.valid) {
          setUser(validation.user)
          setVendor(validation.vendor)
          setSessionToken('cookie_based') // Placeholder since token is in HTTP-only cookie
          setError(null)
          
          // Start session refresh timer for approved vendors
          if (validation.vendor?.status === 'approved') {
            startSessionRefreshTimer()
          }
        } else {
          
          // Check if there's a Supabase session (fallback for first-time login)
          const supabase = getSupabase()
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.user) {
            // Don't auto-migrate, let user login again to set cookies properly
            setUser(null)
            setVendor(null)
            setSessionToken(null)
          } else {
            setUser(null)
            setVendor(null)
            setSessionToken(null)
          }
        }
      } catch (err) {
        setError(err.message)
        setUser(null)
        setVendor(null)
        setSessionToken(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes (fallback)
    const supabaseForListener = getSupabase()
    const { data: { subscription } } = supabaseForListener.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        // Clear local state - cookies will be cleared by logout API
        setUser(null)
        setVendor(null)
        setSessionToken(null)
        setError(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [isClient, pathname])

  // Cookie-based login function
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
        credentials: 'include', // Include cookies in request
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }
      
      if (data.requiresApproval) {
        // Vendor exists but not approved - still set session for limited access
        setUser(data.user || null)
        setVendor(data.vendor || null)
        setSessionToken('cookie_based')
        return { success: true, requiresApproval: true, vendor: data.vendor }
      }

      if (data.requiresApplication) {
        // User exists but no vendor profile - allow login to apply
        setUser(data.user || null)
        setVendor(null)
        setSessionToken(data.sessionToken ? 'cookie_based' : null)
        return { success: true, requiresApplication: true }
      }
      
      // Successful login - cookies are set by the server
      setUser(data.user)
      setVendor(data.vendor)
      setSessionToken('cookie_based') // Placeholder since token is in HTTP-only cookie
      
      console.log('✅ Cookie-based login successful for:', data.vendor.business_name)
      
      // Start session refresh timer for approved vendors
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

  // Refresh session token
  const refreshSession = async () => {
    try {
      const result = await cookieAuthService.refreshSession()
      
      if (result.success) {
        console.log('✅ Session refreshed successfully')
        return true
      } else {
        console.log('❌ Session refresh failed')
        await signOut()
        return false
      }
    } catch (err) {
      console.error('❌ Session refresh error:', err)
      await signOut()
      return false
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      console.log('🚪 Signing out...')
      
      // Call logout API (cookies will be cleared by server)
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // Include cookies
      })
      
      // Clear local state
      setUser(null)
      setVendor(null)
      setSessionToken(null)
      setError(null)
      
      console.log('✅ Sign out successful')
      
      // Redirect to login
      router.push('/')
      
    } catch (err) {
      console.error('❌ Sign out error:', err)
      // Clear state anyway
      setUser(null)
      setVendor(null)
      setSessionToken(null)
      router.push('/')
    }
  }

  // Validate current session (less aggressive)
  const validateCurrentSession = async () => {
    if (!sessionToken) return false
    
    try {
      const validation = await cookieAuthService.validateSessionFromCookies()
      
      if (!validation.valid) {
        console.log('⚠️ Session validation failed, attempting refresh...')
        
        // Try to refresh the session
        const refreshResult = await refreshSession()
        if (refreshResult) {
          console.log('✅ Session refreshed successfully')
          return true
        }
        
        return false
      }
      
      return true
    } catch (error) {
      console.error('❌ Session validation error:', error)
      // Don't force logout on validation errors - could be network issues
      return true // Assume valid if we can't validate
    }
  }

  // Auto-refresh session periodically (simplified for cookies)
  const startSessionRefreshTimer = () => {
    // Refresh session every 45 minutes (tokens typically expire in 1 hour)
    const refreshInterval = setInterval(async () => {
      console.log('🔄 Auto-refreshing session...')
      const success = await refreshSession()
      if (!success) {
        clearInterval(refreshInterval)
      }
    }, 45 * 60 * 1000) // 45 minutes

    return refreshInterval
  }

  // Forgot password function
  const forgotPassword = async (email) => {
    const loadingToast = toast.loading('Sending password reset email...')
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('📧 Sending password reset email to:', email)
      
      const supabase = getSupabase()
      
      // Use the vendor dashboard's deployed URL
      const vendorDashboardUrl = 'https://vendor-dashboard-production.up.railway.app'
      const resetUrl = `${vendorDashboardUrl}/reset-password`
      
      console.log('🔗 Vendor Dashboard Reset URL:', resetUrl)
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: resetUrl
        }
      )
      
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

  // Fetch vendor profile (for refreshing after application submission)
  const fetchVendorProfile = async (userId) => {
    try {
      console.log('🔄 Fetching updated vendor profile...')
      
      const validation = await cookieAuthService.validateSessionFromCookies()
      
      if (validation.valid && validation.vendor) {
        console.log('✅ Updated vendor profile fetched:', validation.vendor.business_name)
        setVendor(validation.vendor)
        return validation.vendor
      } else {
        console.log('❌ No vendor profile found during refresh')
        setVendor(null)
        return null
      }
    } catch (error) {
      console.error('❌ Error fetching vendor profile:', error)
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
    refreshSession,
    validateCurrentSession,
    fetchVendorProfile,
    forgotPassword,
    isAuthenticated: !!user,
    isVendor: !!vendor,
    isApprovedVendor: vendor?.status === 'approved',
    vendorId: vendor?.id,
    businessName: vendor?.business_name
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