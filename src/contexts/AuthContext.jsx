'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { cookieAuthService } from '@/services/cookieAuthService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isClient, setIsClient] = useState(false)
  const [sessionToken, setSessionToken] = useState(null)
  const router = useRouter()

  // Set client flag to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Only run auth logic on client side
    if (!isClient) return
    
    console.log('🔄 AuthProvider: Initializing cookie-based authentication...')
    
    const initializeAuth = async () => {
      try {
        // Validate session from cookies
        const validation = await cookieAuthService.validateSessionFromCookies()
        
        if (validation.valid) {
          console.log('✅ Cookie session is valid for:', validation.vendor?.business_name)
          console.log('🔍 DEBUG - Setting user:', validation.user?.email)
          console.log('🔍 DEBUG - Setting vendor:', validation.vendor?.business_name)
          setUser(validation.user)
          setVendor(validation.vendor)
          setSessionToken('cookie_based') // Placeholder since token is in HTTP-only cookie
          setError(null)
          
          // Start session refresh timer for approved vendors
          if (validation.vendor?.status === 'approved') {
            startSessionRefreshTimer()
          }
        } else {
          console.log('❌ No valid cookie session found')
          
          // Check if there's a Supabase session (fallback for first-time login)
          const supabase = getSupabase()
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.user) {
            console.log('🔄 Found Supabase session, but no cookie session - user needs to login again')
            // Don't auto-migrate, let user login again to set cookies properly
            setUser(null)
            setVendor(null)
            setSessionToken(null)
          } else {
            console.log('ℹ️ No active session found')
            setUser(null)
            setVendor(null)
            setSessionToken(null)
          }
        }
      } catch (err) {
        console.error('❌ Error initializing auth:', err)
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
      console.log('🔄 Supabase auth state changed:', event)
      
      if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out, clearing tokens...')
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
  }, [isClient])

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