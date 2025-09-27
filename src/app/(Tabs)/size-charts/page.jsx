'use client'
import { useState, useEffect } from 'react'
import { FaPlus } from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'
import SizeChartCard from './components/SizeChartCard'
import SizeChartForm from './components/SizeChartForm'
import SizeChartViewer from './components/SizeChartViewer'
import EmptyState from './components/EmptyState'

export default function SizeChartsPage() {
  const { vendor } = useAuth()
  const [sizeCharts, setSizeCharts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // View states
  const [view, setView] = useState('list') // 'list', 'create', 'edit', 'view'
  const [selectedChart, setSelectedChart] = useState(null)

  useEffect(() => {
    if (vendor?.id) {
      loadSizeCharts()
      loadCategories()
    }
  }, [vendor?.id])

  const loadSizeCharts = async () => {
    if (!vendor?.id) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/size-charts?vendorId=${vendor.id}`)
      const data = await response.json()
      
      if (data.success) {
        setSizeCharts(data.sizeCharts || [])
      } else {
        console.error('Error loading size charts:', data.error)
      }
    } catch (error) {
      console.error('Error loading size charts:', error)
    } finally {
      setLoading(false)
    }
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

  const handleCreate = () => {
    setSelectedChart(null)
    setView('create')
  }

  const handleEdit = (chart) => {
    setSelectedChart(chart)
    setView('edit')
  }

  const handleView = (chart) => {
    setSelectedChart(chart)
    setView('view')
  }

  const handleDuplicate = async (chart) => {
    const duplicatedChart = {
      ...chart,
      name: `${chart.name} (Copy)`,
      id: null
    }
    setSelectedChart(duplicatedChart)
    setView('create')
  }

  const handleDelete = async (chartId) => {
    if (!confirm('Are you sure you want to delete this size chart?')) return
    
    try {
      const response = await fetch(`/api/size-charts/${chartId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadSizeCharts()
      } else {
        const error = await response.json()
        alert(`Failed to delete size chart: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting size chart:', error)
      alert('Failed to delete size chart. Please try again.')
    }
  }

  const handleSave = async (formData) => {
    try {
      setSaving(true)
      const url = selectedChart?.id ? `/api/size-charts/${selectedChart.id}` : '/api/size-charts'
      const method = selectedChart?.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          vendor_id: vendor.id
        })
      })

      const data = await response.json()
      
      if (data.success) {
        await loadSizeCharts()
        setView('list')
        setSelectedChart(null)
      } else {
        alert(`Failed to save size chart: ${data.error}`)
      }
    } catch (error) {
      console.error('Error saving size chart:', error)
      alert('Failed to save size chart. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setView('list')
    setSelectedChart(null)
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
    <div className="">
      {/* Header */}
      {view === 'list' && (
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Size Charts</h1>
            <p className="text-gray-600">Create and manage size charts for your products</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <FaPlus size={14} /> Create Size Chart
          </button>
        </div>
      )}

      {/* Content */}
      {view === 'list' && (
        <>
          {sizeCharts.length === 0 ? (
            <EmptyState onCreateSizeChart={handleCreate} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sizeCharts.map((chart) => (
                <SizeChartCard
                  key={chart.id}
                  chart={chart}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                />
              ))}
            </div>
          )}
        </>
      )}

      {view === 'create' && (
        <SizeChartForm
          chart={selectedChart}
          onSave={handleSave}
          onCancel={handleCancel}
          categories={categories}
          loading={saving}
        />
      )}

      {view === 'edit' && (
        <SizeChartForm
          chart={selectedChart}
          onSave={handleSave}
          onCancel={handleCancel}
          categories={categories}
          loading={saving}
        />
      )}

      {view === 'view' && (
        <SizeChartViewer
          chart={selectedChart}
          onEdit={handleEdit}
          onClose={handleCancel}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}