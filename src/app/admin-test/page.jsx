'use client'
import { useState, useEffect } from 'react'

export default function AdminTestPage() {
  const [pendingVendors, setPendingVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    fetchPendingVendors()
  }, [])

  const fetchPendingVendors = async () => {
    try {
      const response = await fetch('/api/admin/approve-vendor')
      const data = await response.json()
      setPendingVendors(data.pendingVendors || [])
    } catch (error) {
      console.error('Error fetching pending vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVendorAction = async (vendorId, action) => {
    setActionLoading(prev => ({ ...prev, [vendorId]: true }))
    
    try {
      const response = await fetch('/api/admin/approve-vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId,
          action,
          notes: `${action} by admin test interface`
        })
      })

      const result = await response.json()

      if (result.success) {
        console.log(`✅ Vendor ${action}d successfully`)
        // Remove from pending list
        setPendingVendors(prev => prev.filter(v => v.id !== vendorId))
      } else {
        console.error(`❌ Failed to ${action} vendor:`, result.error)
        alert(`Failed to ${action} vendor: ${result.error}`)
      }
    } catch (error) {
      console.error(`❌ Error ${action}ing vendor:`, error)
      alert(`Error ${action}ing vendor`)
    } finally {
      setActionLoading(prev => ({ ...prev, [vendorId]: false }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Test - Vendor Applications</h1>
            <p className="text-gray-600 mt-2">
              This is a test interface to approve/reject vendor applications. 
              In production, this would be in the admin panel.
            </p>
          </div>

          {pendingVendors.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Applications</h3>
              <p className="text-gray-600">All vendor applications have been processed.</p>
              <button
                onClick={fetchPendingVendors}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingVendors.map((vendor) => (
                <div key={vendor.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {vendor.business_name}
                      </h3>
                      <p className="text-gray-600">{vendor.business_email}</p>
                      <p className="text-sm text-gray-500">
                        Applied: {new Date(vendor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVendorAction(vendor.id, 'approve')}
                        disabled={actionLoading[vendor.id]}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                      >
                        {actionLoading[vendor.id] ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          '✅'
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleVendorAction(vendor.id, 'reject')}
                        disabled={actionLoading[vendor.id]}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                      >
                        {actionLoading[vendor.id] ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          '❌'
                        )}
                        Reject
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Business Type:</strong> {vendor.business_type}
                    </div>
                    <div>
                      <strong>Status:</strong> 
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        {vendor.status}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <strong>Description:</strong>
                      <p className="mt-1 text-gray-700">{vendor.business_description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <button
                onClick={fetchPendingVendors}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🔄 Refresh Applications
              </button>
              <a
                href="/"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🏠 Back to Vendor Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}