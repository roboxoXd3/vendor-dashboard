'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { tokenAuthService } from '@/services/tokenAuthService'

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
    
    console.log('🔄 AuthProvider: Initializing token-based authentication...')
    
    const initializeAuth = async () => {
      try {
        // Check if we have a stored session token
        const storedToken = tokenAuthService.getStoredToken()
        
        if (storedToken) {
          console.log('🔍 Found stored session token, validating...')
          
          const validation = await tokenAuthService.validateSession(storedToken)
          
          if (validation.valid) {
            console.log('✅ Stored session is valid for:', validation.vendor.business_name)
            setUser(validation.user)
            setVendor(validation.vendor)
            setSessionToken(storedToken)
            setError(null)
          } else {
            console.log('❌ Stored session is invalid, clearing...')
            tokenAuthService.clearStoredTokens()
            setUser(null)
            setVendor(null)
            setSessionToken(null)
          }
        } else {
          console.log('ℹ️ No stored session token found')
          
          // Check if there's a Supabase session (fallback)
          const supabase = getSupabase()
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.user) {
            console.log('🔄 Found Supabase session, migrating to token-based auth...')
            
            // Get vendor profile
            const { data: vendor } = await supabase
              .from('vendors')
              .select('*')
              .eq('user_id', session.user.id)
              .single()
            
            if (vendor && vendor.status === 'approved') {
              // Create new token session
              const { sessionToken: newToken } = await tokenAuthService.createVendorSession(session.user, vendor)
              setUser(session.user)
              setVendor(vendor)
              setSessionToken(newToken)
              console.log('✅ Migrated to token-based auth successfully')
            } else {
              console.log('⚠️ Vendor not approved or not found')
              setUser(session.user)
              setVendor(vendor)
            }
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
        tokenAuthService.clearStoredTokens()
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
        await tokenAuthService.invalidateSession()
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

  // Token-based login function
  const signInWithToken = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔐 Attempting token-based login for:', email)
      
      const response = await fetch('/api/auth/vendor-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }
      
      if (data.requiresApproval) {
        // Vendor exists but not approved
        setUser(data.user || null)
        setVendor(data.vendor || null)
        setSessionToken(null)
        return { success: false, requiresApproval: true, vendor: data.vendor }
      }
      
      // Successful login
      setUser(data.user)
      setVendor(data.vendor)
      setSessionToken(data.sessionToken)
      
      console.log('✅ Token-based login successful for:', data.vendor.business_name)
      
      return { success: true, user: data.user, vendor: data.vendor }
      
    } catch (err) {
      console.error('❌ Token-based login error:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Refresh session token
  const refreshSession = async () => {
    try {
      const result = await tokenAuthService.refreshSession()
      
      if (result.success) {
        setSessionToken(result.sessionToken)
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
      
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
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
      tokenAuthService.clearStoredTokens()
      router.push('/')
    }
  }

  // Validate current session (less aggressive)
  const validateCurrentSession = async () => {
    if (!sessionToken) return false
    
    try {
      const validation = await tokenAuthService.validateSession(sessionToken)
      
      if (!validation.valid) {
        console.log('⚠️ Session validation failed, but not forcing logout')
        return false
      }
      
      return true
    } catch (error) {
      console.error('❌ Session validation error:', error)
      // Don't force logout on validation errors - could be network issues
      return true // Assume valid if we can't validate
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