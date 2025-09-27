'use client'
import { useState, useEffect } from 'react'
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'

export default function SizeChartsPage() {
  const { vendor } = useAuth()
  const [sizeCharts, setSizeCharts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingChart, setEditingChart] = useState(null)

  useEffect(() => {
    loadSizeCharts()
  }, [vendor?.id])

  const loadSizeCharts = async () => {
    if (!vendor?.id) return
    
    try {
      const response = await fetch(`/api/size-charts?vendorId=${vendor.id}`)
      const data = await response.json()
      setSizeCharts(data.sizeCharts || [])
    } catch (error) {
      console.error('Error loading size charts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (chartId) => {
    if (!confirm('Are you sure you want to delete this size chart?')) return
    
    try {
      const response = await fetch(`/api/size-charts/${chartId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        loadSizeCharts()
      }
    } catch (error) {
      console.error('Error deleting size chart:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-48 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Size Charts</h1>
          <p className="text-gray-600">Create and manage size charts for your products</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
        >
          <FaPlus size={14} /> Create Size Chart
        </button>
      </div>

      {/* Size Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sizeCharts.map((chart) => (
          <div key={chart.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{chart.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingChart(chart)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Edit"
                >
                  <FaEdit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(chart.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Category:</strong> {chart.category_name || 'All Categories'}</p>
              <p><strong>Sizes:</strong> {chart.entries?.length || 0} sizes</p>
              <p><strong>Status:</strong> 
                <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                  chart.approval_status === 'approved' 
                    ? 'bg-green-100 text-green-800' 
                    : chart.approval_status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {chart.approval_status}
                </span>
              </p>
            </div>

            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setEditingChart(chart)}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
              >
                <FaEye size={14} /> View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sizeCharts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaPlus size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No size charts yet</h3>
          <p className="text-gray-600 mb-6">Create your first size chart to help customers choose the right size</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Create Your First Size Chart
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingChart) && (
        <SizeChartModal
          chart={editingChart}
          onClose={() => {
            setShowCreateModal(false)
            setEditingChart(null)
          }}
          onSave={() => {
            loadSizeCharts()
            setShowCreateModal(false)
            setEditingChart(null)
          }}
        />
      )}
    </div>
  )
}

// Size Chart Modal Component
function SizeChartModal({ chart, onClose, onSave }) {
  const { vendor } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    measurement_types: ['Chest', 'Waist', 'Length'],
    measurement_instructions: '',
    entries: [
      { size: 'S', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
      { size: 'M', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
      { size: 'L', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
    ]
  })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false) // Add admin check

  useEffect(() => {
    loadCategories()
    checkAdminStatus()
    if (chart) {
      setFormData({
        name: chart.name || '',
        category_id: chart.category_id || '',
        measurement_types: chart.measurement_types || ['Chest', 'Waist', 'Length'],
        measurement_instructions: chart.measurement_instructions || '',
        entries: chart.entries || [
          { size: 'S', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
          { size: 'M', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
          { size: 'L', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
        ]
      })
    }
  }, [chart])

  const checkAdminStatus = async () => {
    try {
      // Check if current user is admin (you can implement this based on your auth system)
      const response = await fetch('/api/auth/check-admin')
      const data = await response.json()
      setIsAdmin(data.isAdmin || false)
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
    }
  }

  // Get default measurement types based on category
  const getDefaultMeasurementTypes = (categoryName) => {
    if (!categoryName) return ['Chest', 'Waist', 'Length']
    
    const category = categoryName.toLowerCase()
    
    if (category.includes('trouser') || category.includes('pant') || category.includes('jeans') || category.includes('bottom')) {
      return ['Waist', 'Hip', 'Length', 'Thigh', 'Knee']
    }
    
    if (category.includes('shirt') || category.includes('top') || category.includes('t-shirt') || category.includes('blouse')) {
      return ['Chest', 'Waist', 'Length', 'Shoulder', 'Sleeve']
    }
    
    if (category.includes('dress')) {
      return ['Chest', 'Waist', 'Hip', 'Length', 'Shoulder']
    }
    
    if (category.includes('jacket') || category.includes('coat')) {
      return ['Chest', 'Waist', 'Length', 'Shoulder', 'Sleeve']
    }
    
    if (category.includes('shoe') || category.includes('footwear')) {
      return ['Length', 'Width']
    }
    
    if (category.includes('accessory') || category.includes('jewelry')) {
      return ['Circumference', 'Length']
    }
    
    // Default for other categories
    return ['Chest', 'Waist', 'Length']
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleCategoryChange = (categoryId) => {
    const selectedCategory = categories.find(cat => cat.id === categoryId)
    const defaultTypes = getDefaultMeasurementTypes(selectedCategory?.name)
    
    setFormData(prev => ({
      ...prev,
      category_id: categoryId,
      measurement_types: defaultTypes,
      entries: prev.entries.map(entry => {
        const newMeasurements = {}
        defaultTypes.forEach(type => {
          newMeasurements[type] = entry.measurements[type] || ''
        })
        return { ...entry, measurements: newMeasurements }
      })
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = chart ? `/api/size-charts/${chart.id}` : '/api/size-charts'
      const method = chart ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          vendor_id: vendor.id
        })
      })

      if (response.ok) {
        onSave()
      } else {
        throw new Error('Failed to save size chart')
      }
    } catch (error) {
      console.error('Error saving size chart:', error)
      alert('Failed to save size chart. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addSize = () => {
    const newSize = `Size ${formData.entries.length + 1}`
    const newEntry = {
      size: newSize,
      measurements: {}
    }
    
    formData.measurement_types.forEach(type => {
      newEntry.measurements[type] = ''
    })
    
    setFormData({
      ...formData,
      entries: [...formData.entries, newEntry]
    })
  }

  const removeSize = (index) => {
    setFormData({
      ...formData,
      entries: formData.entries.filter((_, i) => i !== index)
    })
  }

  const addMeasurementType = () => {
    const newType = prompt('Enter measurement type (e.g., Shoulder, Hip):')
    if (newType && !formData.measurement_types.includes(newType)) {
      setFormData({
        ...formData,
        measurement_types: [...formData.measurement_types, newType],
        entries: formData.entries.map(entry => ({
          ...entry,
          measurements: { ...entry.measurements, [newType]: '' }
        }))
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            {chart ? 'Edit Size Chart' : 'Create New Size Chart'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size Chart Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Men's T-Shirt Sizing"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                💡 Selecting a category will automatically set appropriate measurement types
              </p>
            </div>
          </div>

          {/* Measurement Types */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Measurement Types
              </label>
              <button
                type="button"
                onClick={addMeasurementType}
                className="text-sm text-emerald-600 hover:text-emerald-700"
              >
                + Add Type
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.measurement_types.map((type, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {type}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              💡 Common measurements: Chest (for tops), Waist (for bottoms), Length (for all), Hip (for dresses/bottoms)
            </p>
          </div>

          {/* Measurement Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Measurement Instructions
            </label>
            <textarea
              value={formData.measurement_instructions}
              onChange={(e) => setFormData({...formData, measurement_instructions: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Instructions for customers on how to measure..."
            />
          </div>

          {/* Size Chart Data */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Size Chart Data
              </label>
              <button
                type="button"
                onClick={addSize}
                className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
              >
                + Add Size
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left">Size</th>
                    {formData.measurement_types.map(type => (
                      <th key={type} className="border border-gray-300 p-3 text-center">
                        {type} (cm)
                      </th>
                    ))}
                    <th className="border border-gray-300 p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.entries.map((entry, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-3">
                        <input
                          type="text"
                          value={entry.size}
                          onChange={(e) => {
                            const newEntries = [...formData.entries]
                            newEntries[index].size = e.target.value
                            setFormData({...formData, entries: newEntries})
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      {formData.measurement_types.map(type => (
                        <td key={type} className="border border-gray-300 p-3">
                          <input
                            type="number"
                            step="0.1"
                            value={entry.measurements[type] || ''}
                            onChange={(e) => {
                              const newEntries = [...formData.entries]
                              newEntries[index].measurements[type] = e.target.value
                              setFormData({...formData, entries: newEntries})
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="0.0"
                          />
                        </td>
                      ))}
                      <td className="border border-gray-300 p-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeSize(index)}
                          className="text-red-600 hover:text-red-800"
                          disabled={formData.entries.length <= 1}
                        >
                          <FaTrash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (chart ? 'Update Size Chart' : 'Create Size Chart')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
