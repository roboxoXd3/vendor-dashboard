'use client'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

export default function DebugAuth() {
  const { user, vendor, loading, error, signIn, signOut } = useAuth()
  const [testResult, setTestResult] = useState(null)
  const [sessionInfo, setSessionInfo] = useState(null)

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      setSessionInfo({
        hasSession: !!session,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email
        } : null,
        accessToken: session?.access_token ? session.access_token.substring(0, 20) + '...' : null,
        expiresAt: session?.expires_at,
        error: error?.message
      })
    } catch (err) {
      setSessionInfo({ error: err.message })
    }
  }

  const testVendorProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setTestResult({ error: 'No session found' })
        return
      }

      const response = await fetch('/api/my-vendor-profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const result = await response.json()
      setTestResult({ 
        status: response.status,
        data: result 
      })
    } catch (err) {
      setTestResult({ error: err.message })
    }
  }

  const testLogin = async () => {
    try {
      setTestResult({ loading: true })
      const result = await signIn('testvendor@gmail.com', 'testpass123')
      setTestResult({ loginResult: result })
    } catch (err) {
      setTestResult({ error: err.message })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug Panel</h1>
        
        {/* Current Auth State */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Auth State</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Loading:</strong> {loading ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>User:</strong> {user ? `✅ ${user.email}` : '❌ None'}
            </div>
            <div>
              <strong>Vendor:</strong> {vendor ? `✅ ${vendor.business_name} (${vendor.status})` : '❌ None'}
            </div>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <strong>Error:</strong> {error.message || error}
            </div>
          )}
        </div>

        {/* Session Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Session Information</h2>
            <button 
              onClick={checkSession}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Check Session
            </button>
          </div>
          {sessionInfo && (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          )}
        </div>

        {/* Vendor Profile Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Vendor Profile Test</h2>
            <button 
              onClick={testVendorProfile}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Vendor Profile API
            </button>
          </div>
          {testResult && (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex gap-4">
            <button 
              onClick={testLogin}
              className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
            >
              Test Login
            </button>
            <button 
              onClick={signOut}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
            <button 
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear & Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}