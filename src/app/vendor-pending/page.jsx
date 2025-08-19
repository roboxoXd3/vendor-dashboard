'use client'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { VendorPendingPage } from '@/components/ProtectedRoute'

export default function VendorPending() {
  const { vendor, loading } = useAuth()

  useEffect(() => {
    // If vendor is approved, redirect immediately
    if (!loading && vendor?.status === 'approved') {
      console.log('🚀 Approved vendor accessing pending page, redirecting to dashboard')
      window.location.href = '/dashboard'
    }
  }, [vendor, loading])

  // Don't render anything if vendor is approved
  if (!loading && vendor?.status === 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return <VendorPendingPage />
}