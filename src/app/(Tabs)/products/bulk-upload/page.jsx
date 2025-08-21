'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { categoriesService } from '@/services/categoriesService'
import { useBulkUpload } from '@/hooks/useBulkUpload'
import { zipUploadService } from '@/services/zipUploadService'
import { bulkUploadService } from '@/services/bulkUploadService'
import { FaUpload, FaDownload, FaFileExcel, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaTimes, FaArrowLeft, FaInfoCircle, FaFileArchive } from 'react-icons/fa'

export default function BulkUploadPage() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const { loading, error, vendor, uploadProducts, parseAndValidateCSV, downloadTemplate, clearError } = useBulkUpload()
  
  const [file, setFile] = useState(null)
  const [csvData, setCsvData] = useState(null)
  const [validation, setValidation] = useState(null)
  const [uploadResults, setUploadResults] = useState(null)
  const [step, setStep] = useState(1) // 1: Upload, 2: Validate, 3: Results
  const [uploadType, setUploadType] = useState('csv') // 'csv' or 'zip'
  const [zipData, setZipData] = useState(null)
  const [zipProgress, setZipProgress] = useState(null)
  const [categories, setCategories] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedCategories, setSelectedCategories] = useState(new Set())

  useEffect(() => {
    // Load categories for reference/download
    ;(async () => {
      try {
        const list = await categoriesService.fetchAll()
        setCategories(list)
      } catch (e) {
        console.warn('Failed to load categories:', e.message)
      }
    })()
  }, [])

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0]
    if (!selectedFile) return

    const isCSV = selectedFile.name.endsWith('.csv')
    const isZIP = selectedFile.name.endsWith('.zip')

    if (!isCSV && !isZIP) {
      alert('Please select a CSV or ZIP file')
      return
    }

    setFile(selectedFile)
    clearError()
    
    try {
      if (isCSV) {
        setUploadType('csv')
        const { csvData: parsedData, validation: validationResult } = await parseAndValidateCSV(selectedFile)
        setCsvData(parsedData)
        setValidation(validationResult)
        setStep(2)
      } else if (isZIP) {
        setUploadType('zip')
        console.log('📦 Parsing ZIP file...')
        const parsedZipData = await zipUploadService.parseZipFile(selectedFile)
        setZipData(parsedZipData)
        
        // Validate the CSV data from ZIP
        const validationResult = bulkUploadService.validateCSVStructure(parsedZipData.csvData)
        setValidation(validationResult)
        setCsvData(parsedZipData.csvData)
        setStep(2)
      }
    } catch (error) {
      console.error('File parsing error:', error)
      // Error is handled by the hook or shown as alert
      alert(`Error parsing file: ${error.message}`)
    }
  }

  const handleUpload = async () => {
    if (!csvData) return

    try {
      if (uploadType === 'csv') {
        const results = await uploadProducts(csvData)
        setUploadResults(results)
        setStep(3)
      } else if (uploadType === 'zip' && zipData) {
        // Handle ZIP upload with progress tracking
        setStep(3)
        setZipProgress({ stage: 'starting', progress: 0, message: 'Starting upload...' })
        
        const results = await zipUploadService.processZipUpload(
          vendor.id, 
          zipData, 
          (progress) => setZipProgress(progress)
        )
        
        setUploadResults({
          success: true,
          processedCount: results.products.length,
          totalCount: results.products.length,
          data: results.products,
          mediaResults: {
            images: results.images,
            videos: results.videos,
            errors: results.errors
          }
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadResults({
        success: false,
        error: error.message,
        processedCount: 0,
        totalCount: csvData.length
      })
      setStep(3)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setCsvData(null)
    setValidation(null)
    setUploadResults(null)
    setZipData(null)
    setZipProgress(null)
    setUploadType('csv')
    setStep(1)
    clearError()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.zip'))) {
      const event = { target: { files: [droppedFile] } }
      handleFileSelect(event)
    } else {
      alert('Please drop a CSV or ZIP file')
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header - matches existing design patterns */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/products')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bulk Product Upload</h1>
                <p className="text-gray-600 mt-1">Upload multiple products at once using CSV file</p>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <FaDownload size={16} />
              Download Template
            </button>
          </div>
        </div>

        {/* Progress Steps - matches existing step design */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between max-w-md">
            {[
              { number: 1, title: 'Upload CSV', icon: FaUpload },
              { number: 2, title: 'Validate Data', icon: FaCheckCircle },
              { number: 3, title: 'Review Results', icon: FaFileExcel }
            ].map((stepItem, index) => (
              <div key={stepItem.number} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= stepItem.number ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  <stepItem.icon size={16} />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step >= stepItem.number ? 'text-emerald-600' : 'text-gray-400'
                }`}>
                  {stepItem.title}
                </span>
                {index < 2 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    step > stepItem.number ? 'bg-emerald-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <FaExclamationTriangle />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={clearError}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="p-6">
          {/* Step 1: File Upload */}
          {step === 1 && (
            <div className="text-center py-12">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-emerald-400 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <FaFileExcel size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload your files</h3>
                <p className="text-gray-600 mb-6">
                  Drag and drop your CSV or ZIP file here, or click to browse
                </p>
                
                <div className="flex items-center justify-center gap-8 mb-6">
                  <div className="text-center">
                    <FaFileExcel className="text-3xl text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">CSV Only</p>
                    <p className="text-xs text-gray-500">Products data only</p>
                  </div>
                  <div className="text-center">
                    <FaFileArchive className="text-3xl text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">ZIP Package</p>
                    <p className="text-xs text-gray-500">CSV + Images + Videos</p>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <button
                  type="button"
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 mx-auto transition-colors"
                >
                  <FaUpload size={16} />
                  Choose File (CSV or ZIP)
                </button>
              </div>
              
              {/* Categories helper panel */}
              <div className="mt-8 text-left bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FaInfoCircle className="text-gray-700" />
                    <h4 className="font-medium text-gray-900">Available Categories</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      placeholder="Search categories..."
                      className="border border-gray-300 rounded px-3 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => categoriesService.downloadCSV(categories)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-2"
                    >
                      <FaDownload size={14} /> Download Categories CSV
                    </button>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded">
                  <ul className="divide-y divide-gray-100">
                    {categories
                      .filter(c => !categoryFilter || c.name.toLowerCase().includes(categoryFilter.toLowerCase()))
                      .map(c => {
                        const checked = selectedCategories.has(c.id)
                        return (
                          <li key={c.id} className="flex items-center justify-between px-3 py-2">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{c.name}</p>
                              {c.description && (
                                <p className="text-xs text-gray-500">{c.description}</p>
                              )}
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setSelectedCategories(prev => {
                                    const copy = new Set(prev)
                                    if (e.target.checked) copy.add(c.id); else copy.delete(c.id)
                                    return copy
                                  })
                                }}
                              />
                              Select
                            </label>
                          </li>
                        )
                      })}
                  </ul>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Tip: Use the exact category name in your CSV under <code>category_name</code>.
                </p>
              </div>

              {/* Instructions - matches existing info boxes */}
              <div className="mt-8 text-left bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaInfoCircle className="text-blue-600" />
                  <h4 className="font-medium text-blue-900">CSV Format Requirements:</h4>
                </div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Required columns:</strong> name, price</li>
                  <li>• <strong>Array fields:</strong> Use pipe (|) to separate values: "Small|Medium|Large"</li>
                  <li>• <strong>Image URLs:</strong> Use comma (,) to separate multiple URLs</li>
                  <li>• <strong>Category:</strong> Use category name, not ID (e.g., "Electronics")</li>
                  <li>• <strong>Boolean fields:</strong> Use "true" or "false"</li>
                  <li>• <strong>ZIP format:</strong> Include CSV file + image/video files</li>
                  <li>• <strong>File naming:</strong> Name images with SKU or product name for auto-matching</li>
                  <li>• <strong>File size:</strong> Maximum 1000 products per upload</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Validation Results */}
          {step === 2 && validation && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Validation Results for "{file?.name}"
                  </h3>
                  {uploadType === 'zip' && zipData && (
                    <p className="text-sm text-gray-600 mt-1">
                      📦 ZIP contains: {Object.keys(zipData.imageFiles).length} images, {Object.keys(zipData.videoFiles).length} videos
                    </p>
                  )}
                </div>
                <button
                  onClick={resetUpload}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Upload different file"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              {validation.isValid ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-green-800">
                    <FaCheckCircle />
                    <span className="font-medium">Validation Passed!</span>
                  </div>
                  <p className="text-green-700 mt-1">
                    Found {validation.validRows || csvData.length} valid products ready for upload
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <FaExclamationTriangle />
                    <span className="font-medium">Validation Errors Found</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="text-red-700 text-sm space-y-1">
                      {validation.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Data Preview */}
              {csvData && csvData.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Data Preview (First 5 rows of {csvData.length} total)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          {validation.columns.slice(0, 6).map(col => (
                            <th key={col} className="text-left py-2 px-3 font-medium text-gray-700 capitalize">
                              {col.replace(/_/g, ' ')}
                            </th>
                          ))}
                          {validation.columns.length > 6 && (
                            <th className="text-left py-2 px-3 font-medium text-gray-700">
                              ... +{validation.columns.length - 6} more
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 5).map((row, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            {validation.columns.slice(0, 6).map(col => (
                              <td key={col} className="py-2 px-3 text-gray-600">
                                {row[col] || '-'}
                              </td>
                            ))}
                            {validation.columns.length > 6 && (
                              <td className="py-2 px-3 text-gray-400">...</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={resetUpload}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Upload Different File
                </button>
                {validation.isValid && (
                  <button
                    onClick={handleUpload}
                    disabled={loading}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {loading && <FaSpinner className="animate-spin" />}
                    {loading ? 'Uploading...' : 'Proceed with Upload'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && uploadResults && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Upload Results</h3>
              
              {uploadResults.success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-green-800">
                    <FaCheckCircle />
                    <span className="font-medium">
                      ✅ Successfully created {uploadResults.processedCount} products!
                    </span>
                  </div>
                  <p className="text-green-700 mt-1">
                    Products are now available in your catalog and pending admin approval.
                  </p>
                  {uploadResults.data && uploadResults.data.length > 0 && (
                    <div className="mt-3">
                      <p className="text-green-700 text-sm font-medium mb-2">Created products:</p>
                      <div className="max-h-32 overflow-y-auto">
                        <ul className="text-green-600 text-sm space-y-1">
                          {uploadResults.data.slice(0, 10).map((product, index) => (
                            <li key={index}>• {product.name} (SKU: {product.sku})</li>
                          ))}
                          {uploadResults.data.length > 10 && (
                            <li className="text-green-500">... and {uploadResults.data.length - 10} more</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-red-800">
                    <FaExclamationTriangle />
                    <span className="font-medium">Upload Failed</span>
                  </div>
                  <p className="text-red-700 mt-1">{uploadResults.error || 'Unknown error occurred'}</p>
                </div>
              )}

              <div className="flex gap-4">
                {uploadResults.success && uploadResults.data && uploadResults.data.length > 0 && (
                  <button
                    onClick={() => {
                      const productIds = uploadResults.data.map(p => p.id).join(',')
                      router.push(`/products/bulk-upload/media?products=${productIds}`)
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FaUpload size={16} />
                    Add Images & Videos
                  </button>
                )}
                <button
                  onClick={resetUpload}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Upload More Products
                </button>
                <button
                  onClick={() => router.push('/products')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Products
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
