'use client'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function AuthRedirect({ children }) {
  const { user, vendor, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // If user is authenticated and has an approved vendor profile, redirect to dashboard
      if (user && vendor && vendor.status === 'approved') {
        console.log('✅ User already authenticated, redirecting to dashboard')
        router.push('/dashboard')
        return
      }
      
      // If user exists but no vendor or not approved, redirect to pending
      if (user && (!vendor || vendor.status !== 'approved')) {
        console.log('ℹ️ User authenticated but vendor not approved, redirecting to pending')
        router.push('/vendor-pending')
        return
      }
    }
  }, [user, vendor, loading, router])

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Checking authentication...</p>
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.clear()
                window.location.reload()
              }
            }}
            className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Clear Session & Reload
          </button>
        </div>
      </div>
    )
  }

  // If user is authenticated, don't show login page (redirect is happening)
  if (user) {
    return null
  }

  // Show login page for unauthenticated users
  return children
}