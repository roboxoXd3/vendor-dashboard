'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { bulkUploadService } from '@/services/bulkUploadService'

export const useBulkUpload = () => {
  const { vendor } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Upload products via bulk upload API
   * @param {Array} csvData - Parsed CSV data
   * @returns {Promise<Object>} Upload results
   */
  const uploadProducts = async (csvData) => {
    try {
      setLoading(true)
      setError(null)

      if (!vendor?.id) {
        throw new Error('Vendor authentication required')
      }

      if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
        throw new Error('No valid product data provided')
      }

      console.log('🚀 Starting bulk upload for vendor:', vendor.id)
      console.log('📊 Products to upload:', csvData.length)

      const response = await fetch('/api/products/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: vendor.id,
          products: csvData
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      console.log('✅ Bulk upload successful:', result)
      return result
    } catch (err) {
      console.error('❌ Bulk upload error:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Parse and validate CSV file
   * @param {File} file - CSV file to parse
   * @returns {Promise<Object>} Parsed and validated data
   */
  const parseAndValidateCSV = async (file) => {
    try {
      setError(null)
      
      console.log('📄 Parsing CSV file:', file.name)
      
      // Parse CSV
      const csvData = await bulkUploadService.parseCSV(file)
      console.log('📊 Parsed CSV data:', csvData.length, 'rows')
      
      // Validate structure
      const validation = bulkUploadService.validateCSVStructure(csvData)
      console.log('✅ Validation result:', validation)
      
      return {
        csvData,
        validation
      }
    } catch (err) {
      console.error('❌ CSV parsing error:', err)
      setError(err.message)
      throw err
    }
  }

  /**
   * Generate and download CSV template
   */
  const downloadTemplate = () => {
    try {
      const template = bulkUploadService.generateTemplate()
      const blob = new Blob([template], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'product-upload-template.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      console.log('📥 CSV template downloaded')
    } catch (err) {
      console.error('❌ Template download error:', err)
      setError('Failed to download template')
    }
  }

  /**
   * Reset error state
   */
  const clearError = () => {
    setError(null)
  }

  return {
    loading,
    error,
    vendor,
    uploadProducts,
    parseAndValidateCSV,
    downloadTemplate,
    clearError
  }
}
