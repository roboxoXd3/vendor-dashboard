'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    console.log('🔄 AuthProvider: Initializing...')
    
    // Clear any potentially corrupted session data first
    const clearCorruptedSession = () => {
      if (typeof window !== 'undefined') {
        // Clear all Supabase-related localStorage keys
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('supabase') || key.includes('vendor-dashboard') || key.includes('auth'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
        console.log('🧹 Cleared potentially corrupted keys:', keysToRemove)
      }
    }
    
    // Get initial session with aggressive timeout and cleanup
    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting session...')
        
        // Clear any corrupted data first
        clearCorruptedSession()
        
        // Much shorter timeout for initial session check
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout after 3 seconds')), 3000)
        )
        
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise])
        
        if (error) {
          console.error('❌ Error getting session:', error)
          // Don't set error for session issues, just clear session
          console.log('🧹 Clearing invalid session')
          await supabase.auth.signOut()
        } else if (session?.user) {
          console.log('✅ Found existing session for:', session.user.email)
          
          // Verify the session is actually valid by testing it
          try {
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError || !user) {
              console.log('⚠️ Session invalid, clearing...')
              await supabase.auth.signOut()
              setUser(null)
              setVendor(null)
            } else {
              console.log('✅ Session verified, fetching vendor profile')
              setUser(user)
              await fetchVendorProfile(user.id)
            }
          } catch (verifyErr) {
            console.error('❌ Session verification failed:', verifyErr)
            await supabase.auth.signOut()
            setUser(null)
            setVendor(null)
          }
        } else {
          console.log('ℹ️  No existing session found')
        }
      } catch (err) {
        console.error('❌ Session initialization error:', err)
        // Clear any invalid session
        console.log('🧹 Clearing session due to error')
        try {
          await supabase.auth.signOut()
        } catch (signOutErr) {
          console.error('❌ Error during signOut:', signOutErr)
        }
        setUser(null)
        setVendor(null)
        setError(null)
      } finally {
        console.log('🔄 Setting loading to false')
        setLoading(false)
      }
    }

    getInitialSession()

    // Fail-safe: Force loading to false after 5 seconds no matter what
    const failsafeTimeout = setTimeout(() => {
      console.log('⚠️ Fail-safe: Forcing loading to false after 5 seconds')
      setLoading(false)
    }, 5000)

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email)
        
        // Skip processing during sign out to prevent conflicts
        if (event === 'SIGNED_OUT') {
          console.log('🔄 Skipping vendor fetch for SIGNED_OUT event')
          setUser(null)
          setVendor(null)
          setError(null)
          return
        }
        
        setError(null) // Clear any previous errors
        
        if (session?.user) {
          console.log('🔄 Auth state: Setting user and fetching vendor profile')
          setUser(session.user)
          try {
            await fetchVendorProfile(session.user.id)
          } catch (err) {
            console.error('❌ Error in auth state change vendor fetch:', err)
          }
        } else {
          console.log('🔄 Auth state: No session, clearing user/vendor')
          setUser(null)
          setVendor(null)
        }
        
        console.log('🔄 Auth state change complete, setting loading to false')
        setLoading(false)
      }
    )

    return () => {
      console.log('🧹 AuthProvider: Cleaning up subscription')
      subscription.unsubscribe()
      clearTimeout(failsafeTimeout)
    }
  }, [])

  const fetchVendorProfile = async (userId) => {
    try {
      console.log('🔄 Fetching vendor profile for user:', userId)
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.log('ℹ️ No session found for vendor profile fetch')
        setVendor(null)
        return
      }

      // Add timeout to vendor profile fetch (shorter timeout)
      const fetchPromise = fetch('/api/my-vendor-profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Vendor profile fetch timeout after 5 seconds')), 5000)
      )
      
      const response = await Promise.race([fetchPromise, timeoutPromise])
      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Error fetching vendor profile:', result.error)
        setError(result.error)
        return
      }

      if (!result.vendor) {
        console.log('ℹ️  No vendor profile found for user:', userId)
        setVendor(null)
      } else {
        console.log('✅ Vendor profile loaded:', result.vendor.business_name, result.vendor.status)
        setVendor(result.vendor)
      }
    } catch (err) {
      console.error('❌ Vendor profile fetch exception:', err)
      setError(err)
    }
  }

  const signIn = async (email, password, rememberMe = true) => {
    try {
      console.log('🔄 Signing in user:', email, 'Remember me:', rememberMe)
      setError(null)
      setLoading(true)
      
      // Clear any existing session first to prevent conflicts
      console.log('🧹 Clearing any existing session before login')
      await supabase.auth.signOut()

      console.log('🔄 Attempting signInWithPassword...')
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password
        // Removed options that might be causing issues
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SignIn timeout after 10 seconds')), 10000)
      )
      
      const { data, error } = await Promise.race([signInPromise, timeoutPromise])
      console.log('✅ SignIn completed, data:', !!data, 'error:', !!error)

      if (error) {
        console.error('❌ Sign in error:', error)
        setError(error)
        return { data: null, error }
      }

      console.log('✅ Sign in successful:', data.user.email)
      
      // Store remember me preference
      if (typeof window !== 'undefined') {
        localStorage.setItem('vendor-remember-me', rememberMe.toString())
      }
      
      return { data, error: null }
      
    } catch (err) {
      console.error('❌ Sign in exception:', err)
      setError(err)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      console.log('🔄 Signing out user')
      setError(null)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Sign out error:', error)
        setError(error)
        return { error }
      }

      console.log('✅ Sign out successful')
      
      // Clear remember me preference and any cached data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('vendor-remember-me')
        localStorage.removeItem('vendor-dashboard-auth-token')
      }
      
      setUser(null)
      setVendor(null)
      router.push('/')
      
      return { error: null }
      
    } catch (err) {
      console.error('❌ Sign out exception:', err)
      setError(err)
      return { error: err }
    }
  }

  const clearError = () => {
    setError(null)
  }

  const clearSession = async () => {
    try {
      console.log('🧹 Manually clearing session...')
      await supabase.auth.signOut()
      setUser(null)
      setVendor(null)
      setError(null)
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('vendor-remember-me')
        localStorage.removeItem('vendor-dashboard-auth-token')
        localStorage.clear() // Clear all localStorage
      }
      
      console.log('✅ Session cleared successfully')
      router.push('/')
    } catch (err) {
      console.error('❌ Error clearing session:', err)
    }
  }

  const value = {
    user,
    vendor,
    loading,
    error,
    signIn,
    signOut,
    clearError,
    clearSession,
    fetchVendorProfile,
    // Helper computed values
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

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Helper hook for vendor-specific operations
export const useVendor = () => {
  const { vendor, isApprovedVendor, vendorId, businessName } = useAuth()
  
  return {
    vendor,
    isApprovedVendor,
    vendorId,
    businessName,
    canAccess: isApprovedVendor
  }
}