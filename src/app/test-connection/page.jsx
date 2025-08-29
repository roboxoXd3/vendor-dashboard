'use client'
import { useEffect, useState } from 'react'
import { testSupabaseConnection, testAuthStatus } from '@/lib/test-connection'

export default function TestConnectionPage() {
  const [connectionResult, setConnectionResult] = useState(null)
  const [authResult, setAuthResult] = useState(null)
  const [followerTest, setFollowerTest] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runTests()
  }, [])

  const runTests = async () => {
    setLoading(true)
    
    // Test Supabase connection
    const connResult = await testSupabaseConnection()
    setConnectionResult(connResult)
    
    // Test auth status
    const authResult = await testAuthStatus()
    setAuthResult(authResult)
    
    // Test follower functionality with the connection result
    await testFollowerFunctionality(connResult)
    
    setLoading(false)
  }

  const testFollowerFunctionality = async (connResult = null) => {
    try {
      // Use the passed connection result or the state
      const connectionData = connResult || connectionResult
      const sampleVendorId = connectionData?.sampleVendor?.id
      
      if (!sampleVendorId) {
        setFollowerTest({ success: false, error: 'No sample vendor found' })
        return
      }

      const response = await fetch(`/api/test-followers?vendorId=${sampleVendorId}`)
      const data = await response.json()
      
      if (response.ok) {
        setFollowerTest({ 
          success: true, 
          data: data.data,
          vendorId: sampleVendorId
        })
      } else {
        setFollowerTest({ success: false, error: data.error })
      }
    } catch (error) {
      setFollowerTest({ success: false, error: error.message })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Testing Supabase connection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🧪 Supabase Connection Test
          </h1>
          
          {/* Connection Test Results */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Database Connection</h2>
            <div className={`p-4 rounded-lg ${
              connectionResult?.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {connectionResult?.success ? (
                <div>
                  <div className="flex items-center mb-2">
                    <span className="text-green-600 text-xl mr-2">✅</span>
                    <span className="font-medium text-green-800">Connection Successful!</span>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>• Found {connectionResult.vendorCount} vendors in database</p>
                    {connectionResult.sampleVendor && (
                      <>
                        <p>• Sample vendor: {connectionResult.sampleVendor.business_name}</p>
                        <p>• Business email: {connectionResult.sampleVendor.business_email}</p>
                        <p>• Status: {connectionResult.sampleVendor.status}</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center mb-2">
                    <span className="text-red-600 text-xl mr-2">❌</span>
                    <span className="font-medium text-red-800">Connection Failed</span>
                  </div>
                  <div className="text-sm text-red-700 space-y-1">
                    <p><strong>Error:</strong> {connectionResult?.error?.message || 'Unknown error'}</p>
                    {connectionResult?.error?.details && (
                      <p><strong>Details:</strong> {connectionResult.error.details}</p>
                    )}
                    {connectionResult?.error?.type && (
                      <p><strong>Type:</strong> {connectionResult.error.type}</p>
                    )}
                    <p className="text-xs mt-2 opacity-75">Check browser console for more details</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Auth Test Results */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Authentication Status</h2>
            <div className={`p-4 rounded-lg ${
              authResult?.authenticated ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
            }`}>
              {authResult?.authenticated ? (
                <div>
                  <div className="flex items-center mb-2">
                    <span className="text-blue-600 text-xl mr-2">✅</span>
                    <span className="font-medium text-blue-800">User Authenticated</span>
                  </div>
                  <div className="text-sm text-blue-700">
                    <p>Email: {authResult.user.email}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center mb-2">
                    <span className="text-gray-600 text-xl mr-2">ℹ️</span>
                    <span className="font-medium text-gray-800">No User Session</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p>This is expected for initial setup. User needs to login.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Follower Test Results */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Follower Functionality Test</h2>
            <div className={`p-4 rounded-lg ${
              followerTest?.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {followerTest?.success ? (
                <div>
                  <div className="flex items-center mb-2">
                    <span className="text-green-600 text-xl mr-2">✅</span>
                    <span className="font-medium text-green-800">Follower System Working!</span>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>• Vendor ID: {followerTest.vendorId}</p>
                    <p>• Current followers: {followerTest.data?.count || 0}</p>
                    {followerTest.data?.followers?.length > 0 && (
                      <p>• Recent followers: {followerTest.data.followers.slice(0, 3).map(f => f.profiles?.full_name || 'Unknown').join(', ')}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center mb-2">
                    <span className="text-red-600 text-xl mr-2">❌</span>
                    <span className="font-medium text-red-800">Follower Test Failed</span>
                  </div>
                  <div className="text-sm text-red-700">
                    <p><strong>Error:</strong> {followerTest?.error || 'Unknown error'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Environment Info */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Environment Configuration</h2>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="text-sm text-gray-700 space-y-1">
                <p>• Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Missing'}</p>
                <p>• Supabase Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing'}</p>
                <p>• Site URL: {process.env.NEXT_PUBLIC_SITE_URL || 'Not set'}</p>
                <p>• App Name: {process.env.NEXT_PUBLIC_APP_NAME || 'Not set'}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={runTests}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              🔄 Run Tests Again
            </button>
            <a
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors inline-block"
            >
              🏪 Go to Dashboard
            </a>
            <a
              href="/"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors inline-block"
            >
              🏠 Go to Login
            </a>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">🚀 Next Steps</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>1. ✅ <strong>Phase 1 Complete:</strong> Supabase connection established</p>
            <p>2. 🔄 <strong>Phase 2 Next:</strong> Implement authentication system</p>
            <p>3. 📊 <strong>Phase 3 Next:</strong> Create data service layer</p>
            <p>4. 🎨 <strong>Phase 4 Next:</strong> Update components with real data</p>
          </div>
        </div>
      </div>
    </div>
  )
}