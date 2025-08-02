'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import VendorApplicationForm from './VendorApplicationForm'
import { supabase } from '@/lib/supabase'

export default function ProtectedRoute({ children }) {
  const { user, vendor, loading, error } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      console.log('🔄 ProtectedRoute: Checking access...', {
        user: !!user,
        vendor: !!vendor,
        vendorStatus: vendor?.status
      })

      // No user - redirect to login
      if (!user) {
        console.log('❌ No user - redirecting to login')
        router.push('/')
        return
      }
      
      // User exists but no vendor profile - show pending page
      if (!vendor) {
        console.log('❌ No vendor profile - redirecting to pending')
        router.push('/vendor-pending')
        return
      }

      // Vendor exists but not approved - show pending page
      if (vendor.status !== 'approved') {
        console.log('❌ Vendor not approved - redirecting to pending')
        router.push('/vendor-pending')
        return
      }

      console.log('✅ Access granted for vendor:', vendor.business_name)
    }
  }, [user, vendor, loading, router])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading...</h2>
          <p className="text-gray-500">Checking your vendor access</p>
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
  if (!vendor || vendor.status !== 'approved') {
    return null
  }

  // All checks passed - render protected content
  return children
}

// Vendor Pending Page Component
export function VendorPendingPage() {
  const { user, vendor, signOut, fetchVendorProfile } = useAuth()
  const [showApplication, setShowApplication] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkApplicationStatus()
  }, [])

  const checkApplicationStatus = async () => {
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No active session found for status check')
        return
      }

      const response = await fetch('/api/vendor-application', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      })
      const data = await response.json()
      setApplicationStatus(data)
    } catch (error) {
      console.error('Error checking application status:', error)
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
        showApplyButton: true
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking application status...</p>
        </div>
      </div>
    )
  }

  if (showApplication) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <VendorApplicationForm
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