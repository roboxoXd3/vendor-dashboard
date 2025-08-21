'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function DebugProductsPage() {
  const { vendor, user } = useAuth()
  const [debugData, setDebugData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchDebugData = async () => {
    if (!vendor?.id) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/debug-products?vendorId=${vendor.id}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch debug data')
      }
      
      setDebugData(result.debug)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (vendor?.id) {
      fetchDebugData()
    }
  }, [vendor?.id])

  if (!user) {
    return <div className="p-8">Please log in to view debug information.</div>
  }

  if (!vendor) {
    return <div className="p-8">No vendor profile found.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Products Debug Information</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current User & Vendor Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">User</h3>
              <p className="text-sm text-gray-600">ID: {user.id}</p>
              <p className="text-sm text-gray-600">Email: {user.email}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Vendor</h3>
              <p className="text-sm text-gray-600">ID: {vendor.id}</p>
              <p className="text-sm text-gray-600">Business: {vendor.business_name}</p>
              <p className="text-sm text-gray-600">Status: {vendor.status}</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="text-center mt-2">Loading debug data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {debugData && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Vendor Verification</h2>
              <div className="bg-gray-50 p-4 rounded">
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify({
                    requestedVendorId: debugData.requestedVendorId,
                    vendor: debugData.vendor,
                    vendorError: debugData.vendorError
                  }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Database Products Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-medium text-blue-800">Total Products in DB</h3>
                  <p className="text-2xl font-bold text-blue-600">{debugData.totalProductsInDb || 0}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded">
                  <h3 className="font-medium text-emerald-800">Your Products</h3>
                  <p className="text-2xl font-bold text-emerald-600">{debugData.vendorProductsCount || 0}</p>
                </div>
              </div>
              
              {debugData.sampleProducts && debugData.sampleProducts.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Sample Products in Database:</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(debugData.sampleProducts, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Your Products</h2>
              {debugData.vendorProductsError && (
                <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                  <h3 className="text-red-800 font-medium">Error fetching your products:</h3>
                  <pre className="text-sm text-red-600 mt-2">
                    {JSON.stringify(debugData.vendorProductsError, null, 2)}
                  </pre>
                </div>
              )}
              
              {debugData.vendorProducts && debugData.vendorProducts.length > 0 ? (
                <div className="bg-gray-50 p-4 rounded">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(debugData.vendorProducts, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-gray-600">No products found for your vendor ID.</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Vendor IDs in Products Table</h2>
              <p className="text-sm text-gray-600 mb-2">
                These are all the vendor IDs that have products in the database:
              </p>
              <div className="bg-gray-50 p-4 rounded">
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(debugData.uniqueVendorIdsInProducts, null, 2)}
                </pre>
              </div>
              
              {debugData.uniqueVendorIdsInProducts && 
               debugData.uniqueVendorIdsInProducts.length > 0 && 
               !debugData.uniqueVendorIdsInProducts.includes(debugData.requestedVendorId) && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-800 font-medium">⚠️ Issue Found:</p>
                  <p className="text-yellow-700 text-sm">
                    Your vendor ID ({debugData.requestedVendorId}) is not found in the products table. 
                    This means either:
                  </p>
                  <ul className="text-yellow-700 text-sm mt-2 ml-4 list-disc">
                    <li>You haven't created any products yet</li>
                    <li>Products were created with a different vendor ID</li>
                    <li>There's a data migration issue</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={fetchDebugData}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-6 py-2 rounded-lg font-medium"
          >
            {loading ? 'Refreshing...' : 'Refresh Debug Data'}
          </button>
        </div>
      </div>
    </div>
  )
}
