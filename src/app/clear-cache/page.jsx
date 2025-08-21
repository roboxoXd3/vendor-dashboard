'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function ClearCachePage() {
  const { user, vendor, signOut } = useAuth()
  const [debugInfo, setDebugInfo] = useState(null)
  const [cleared, setCleared] = useState(false)

  const checkCurrentAuth = async () => {
    try {
      const response = await fetch('/api/debug-current-auth')
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      setDebugInfo({ error: error.message })
    }
  }

  const clearAllAuthData = async () => {
    console.log('🧹 Starting cookie-based auth clear...')
    
    try {
      // Call logout API to clear cookies properly
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      console.log('✅ Cookies cleared via logout API!')
    } catch (error) {
      console.log('⚠️ Logout API failed, clearing manually:', error.message)
    }
    
    // Clear any remaining localStorage (just in case)
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear any client-side cookies (though they should be HTTP-only)
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
    })
    
    console.log('✅ All auth data cleared!')
    
    setCleared(true)
    
    // Reload the page after a short delay
    setTimeout(() => {
      window.location.href = '/'
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🍪 Clear Authentication Cookies</h1>
        
        {/* Current State */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Frontend State</h2>
          <div className="space-y-2 text-sm">
            <div><strong>User:</strong> {user?.email || 'None'}</div>
            <div><strong>Vendor:</strong> {vendor?.business_name || 'None'}</div>
            <div><strong>Status:</strong> {vendor?.status || 'None'}</div>
          </div>
        </div>

        {/* Server State */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Current Server State</h2>
            <button 
              onClick={checkCurrentAuth}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Check Server Auth
            </button>
          </div>
          {debugInfo && (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-4">
            {!cleared ? (
              <button 
                onClick={clearAllAuthData}
                className="px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
              >
                🍪 Clear All Cookies & Reload
              </button>
            ) : (
              <div className="text-green-600 font-semibold">
                ✅ Cache cleared! Redirecting to login...
              </div>
            )}
            
            <button 
              onClick={signOut}
              className="px-6 py-3 bg-gray-500 text-white rounded hover:bg-gray-600 ml-4"
            >
              🚪 Sign Out Properly
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Click "Check Server Auth" to see what the server thinks your auth state is</li>
              <li>2. If it shows the wrong user, click "🍪 Clear All Cookies & Reload"</li>
              <li>3. Log in again with your correct credentials (roboxo97@gmail.com)</li>
              <li>4. The dashboard should now show the correct user information (stored in secure cookies)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
