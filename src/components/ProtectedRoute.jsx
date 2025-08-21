'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import VendorApplication from './VendorApplication'
import { getSupabase } from '@/lib/supabase'

export default function ProtectedRoute({ children }) {
  const { user, vendor, loading, error, sessionToken, validateCurrentSession } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  // Prevent hydration mismatches
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!loading && isClient) {
      console.log('🔄 ProtectedRoute: Checking token-based access...', {
        user: !!user,
        vendor: !!vendor,
        vendorStatus: vendor?.status,
        hasSessionToken: !!sessionToken,
        error: !!error,
        currentPath: window.location.pathname
      })

      // No user - redirect to login
      if (!user) {
        console.log('❌ No user - redirecting to login')
        router.push('/')
        return
      }

      // User exists but no session token - allow for new users applying for vendor status
      if (!sessionToken && vendor && vendor.status !== 'approved') {
        console.log('ℹ️ User without session token but has unapproved vendor profile')
        // Allow access to pending page
      } else if (!sessionToken && !vendor) {
        console.log('ℹ️ User without session token and no vendor profile - can apply')
        // Allow access to apply for vendor status
      } else if (!sessionToken) {
        console.log('❌ No session token for approved vendor - redirecting to login')
        router.push('/')
        return
      }
      
      // If vendor is approved but on pending page, redirect to dashboard
      if (vendor && vendor.status === 'approved' && window.location.pathname === '/vendor-pending') {
        console.log('🔄 Approved vendor on pending page, redirecting to dashboard')
        router.push('/dashboard')
        return
      }

      // User exists but no vendor profile - show pending page to apply
      if (!vendor) {
        console.log('ℹ️ No vendor profile - redirecting to pending to apply')
        if (window.location.pathname !== '/vendor-pending') {
          router.push('/vendor-pending')
        }
        return
      }

      // Vendor exists but not approved - show pending page
      if (vendor.status !== 'approved') {
        console.log('ℹ️ Vendor not approved - status:', vendor.status, '- redirecting to pending')
        if (window.location.pathname !== '/vendor-pending') {
          router.push('/vendor-pending')
        }
        return
      }

      console.log('✅ Token-based access granted for vendor:', vendor.business_name)
    }
  }, [user, vendor, loading, router, error, isClient, sessionToken, validateCurrentSession])

  // Show loading spinner while checking auth
  if (loading || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait while we verify your access</p>
          {isClient && error && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg text-sm text-yellow-800">
              <p>⚠️ Connection issue detected. Retrying...</p>
            </div>
          )}

        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Authentication Error</h2>
          <p className="text-gray-500 mb-4">{error.message}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  // If no user, show nothing (redirect is happening)
  if (!user) {
    return null
  }

  // If no vendor or not approved, show nothing (redirect is happening)
  // But allow access to vendor-pending page for applications and status checks
  if (!vendor || (vendor.status !== 'approved' && window.location.pathname !== '/vendor-pending')) {
    return null
  }
  
  // If vendor is approved but we're on pending page, redirect immediately
  if (vendor && vendor.status === 'approved' && window.location.pathname === '/vendor-pending') {
    console.log('🔄 Approved vendor detected on pending page, redirecting...')
    router.push('/dashboard')
    return null
  }

  // All checks passed - render protected content
  return children
}

// Vendor Pending Page Component
export function VendorPendingPage() {
  const { user, vendor, signOut, fetchVendorProfile, loading: authLoading } = useAuth()
  const [showApplication, setShowApplication] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔄 VendorPendingPage: Checking vendor status', {
      vendor: !!vendor,
      status: vendor?.status,
      authLoading,
      user: !!user
    })

    // Don't do anything if auth is still loading
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...')
      return
    }

    // If vendor is already approved, redirect immediately
    if (vendor?.status === 'approved') {
      console.log('✅ Vendor already approved, redirecting to dashboard')
      window.location.href = '/dashboard'
      return
    }

    // If we have a user but no vendor, or vendor is not approved, check application status
    if (user) {
      checkApplicationStatus()
    }
  }, [vendor, authLoading, user])

  const checkApplicationStatus = async () => {
    try {
      console.log('🔄 Checking application status with cookie-based auth...')
      
      // Use cookie-based authentication instead of session tokens
      const response = await fetch('/api/vendor-application', {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        console.error('❌ Failed to check application status:', response.status)
        return
      }
      
      const data = await response.json()
      console.log('✅ Application status checked:', data)
      setApplicationStatus(data)
    } catch (error) {
      console.error('❌ Error checking application status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationSuccess = async (result) => {
    console.log('✅ Application submitted successfully:', result)
    setShowApplication(false)
    await fetchVendorProfile(user.id)
    await checkApplicationStatus()
  }

  const getStatusMessage = () => {
    if (!vendor && !applicationStatus?.hasApplication) {
      return {
        title: "Vendor Application Required",
        message: "Join thousands of successful vendors and start selling on Be Smart Mall. Complete your application to get started.",
        action: "Apply as Vendor",
        showApplyButton: true,
        useQuickApplication: true
      }
    }

    if (vendor?.status === 'pending' || applicationStatus?.vendor?.status === 'pending') {
      return {
        title: "Application Under Review",
        message: "Your vendor application is being reviewed by our team. This typically takes 1-3 business days. We'll notify you once approved.",
        action: "Check Status",
        showApplyButton: false
      }
    }

    if (vendor?.status === 'rejected' || applicationStatus?.vendor?.status === 'rejected') {
      return {
        title: "Application Needs Attention",
        message: "Your application requires additional information or has been declined. Please contact our support team for assistance.",
        action: "Contact Support",
        showApplyButton: false
      }
    }

    return {
      title: "Account Status Unknown",
      message: "There seems to be an issue with your vendor account status. Please contact support for assistance.",
      action: "Contact Support",
      showApplyButton: false
    }
  }

  // If vendor is approved while we're loading, redirect immediately
  if (vendor?.status === 'approved') {
    console.log('🚀 Approved vendor detected in VendorPendingPage, redirecting immediately')
    window.location.href = '/dashboard'
    return null
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Loading your account...' : 'Checking application status...'}
          </p>
        </div>
      </div>
    )
  }

  if (showApplication) {
    const status = getStatusMessage()
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <VendorApplication
          mode={status.useQuickApplication ? 'quick' : 'detailed'}
          onSuccess={handleApplicationSuccess}
          onCancel={() => setShowApplication(false)}
        />
      </div>
    )
  }

  const status = getStatusMessage()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="bg-yellow-100 rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <span className="text-yellow-600 text-2xl">
              {status.title.includes('Required') ? '📋' : status.title.includes('Review') ? '⏳' : '⚠️'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{status.title}</h1>
          <p className="text-gray-600">{status.message}</p>
        </div>

        {user && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <strong>Account:</strong> {user.email}
            </p>
            {(vendor || applicationStatus?.vendor) && (
              <>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> {vendor?.status || applicationStatus?.vendor?.status}
                </p>
                {applicationStatus?.vendor?.created_at && (
                  <p className="text-sm text-gray-600">
                    <strong>Applied:</strong> {new Date(applicationStatus.vendor.created_at).toLocaleDateString()}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <div className="space-y-3">
          {status.showApplyButton ? (
            <button
              onClick={() => setShowApplication(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg transition-colors font-semibold"
            >
              {status.action}
            </button>
          ) : (
            <button
              onClick={() => window.location.href = 'mailto:support@besmartmall.com'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Contact Support
            </button>
          )}
          
          <button
            onClick={signOut}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}