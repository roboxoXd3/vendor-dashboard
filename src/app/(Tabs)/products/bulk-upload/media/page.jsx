'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { FaArrowLeft, FaImage, FaVideo, FaUpload, FaCheck, FaSpinner, FaTimes } from 'react-icons/fa'
import { imageUploadService } from '@/services/imageUploadService'

export default function BulkMediaUploadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { vendor } = useAuth()
  
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadingProducts, setUploadingProducts] = useState(new Set())
  const [completedProducts, setCompletedProducts] = useState(new Set())

  // Get product IDs from URL params (passed from bulk upload success)
  const productIdsParam = searchParams.get('products')
  const productIds = productIdsParam ? productIdsParam.split(',') : []

  useEffect(() => {
    if (productIdsParam && productIdsParam.length > 0) {
      fetchProducts()
    } else {
      setLoading(false)
    }
  }, [productIdsParam]) // Use the string param instead of the array

    const fetchProducts = async () => {
    try {
      setLoading(true)
      const currentProductIds = productIdsParam ? productIdsParam.split(',') : []
      
      if (currentProductIds.length === 0) {
        setProducts([])
        return
      }
      
      const productPromises = currentProductIds.map(async (id) => {
        const response = await fetch(`/api/products/${id}`)
        const result = await response.json()
        return result.success ? result.data : null
      })
      
      const fetchedProducts = await Promise.all(productPromises)
      setProducts(fetchedProducts.filter(p => p !== null))
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (productId, files) => {
    if (!files || files.length === 0) return

    setUploadingProducts(prev => new Set([...prev, productId]))

    try {
      const uploadPromises = Array.from(files).map(file => 
        imageUploadService.uploadFile(file, vendor.id, productId, 'images')
      )
      
      const results = await Promise.all(uploadPromises)
      const successfulUploads = results
        .filter(result => result.publicUrl)
        .map(result => result.publicUrl)

      if (successfulUploads.length > 0) {
        // Update product with new images
        await updateProductImages(productId, successfulUploads)
        setCompletedProducts(prev => new Set([...prev, productId]))
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Failed to upload images: ${error.message}`)
    } finally {
      setUploadingProducts(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const handleVideoUpload = async (productId, file) => {
    setUploadingProducts(prev => new Set([...prev, productId]))

    try {
      const result = await imageUploadService.uploadFile(file, vendor.id, productId, 'videos')
      
      if (result.publicUrl) {
        await updateProductVideo(productId, result.publicUrl)
        setCompletedProducts(prev => new Set([...prev, productId]))
      }
    } catch (error) {
      console.error('Video upload error:', error)
      alert(`Failed to upload video: ${error.message}`)
    } finally {
      setUploadingProducts(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const updateProductImages = async (productId, imageUrls) => {
    try {
      const product = products.find(p => p.id === productId)
      const existingImages = product.images || []
      const allImages = [...existingImages, ...imageUrls]

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: { images: JSON.stringify(allImages) }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update product images')
      }

      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, images: allImages } : p
      ))
    } catch (error) {
      console.error('Error updating product images:', error)
      throw error
    }
  }

  const updateProductVideo = async (productId, videoUrl) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: { video_url: videoUrl }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update product video')
      }

      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, video_url: videoUrl } : p
      ))
    } catch (error) {
      console.error('Error updating product video:', error)
      throw error
    }
  }

  const skipProduct = (productId) => {
    setCompletedProducts(prev => new Set([...prev, productId]))
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <FaSpinner className="animate-spin text-4xl text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-600 mb-4">No products found to add media to.</p>
          <button
            onClick={() => router.push('/products')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }

  const completedCount = completedProducts.size
  const totalCount = products.length
  const allCompleted = completedCount === totalCount

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
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
                <h1 className="text-2xl font-bold text-gray-900">Add Media to Products</h1>
                <p className="text-gray-600 mt-1">
                  Upload images and videos for your bulk uploaded products
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Progress</div>
              <div className="text-lg font-semibold text-emerald-600">
                {completedCount} / {totalCount}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Completion Message */}
        {allCompleted && (
          <div className="mx-6 mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <FaCheck />
              <span className="font-medium">All products completed!</span>
            </div>
            <p className="text-green-700 mt-1">
              You've added media to all {totalCount} products. You can now view them in your products list.
            </p>
            <button
              onClick={() => router.push('/products')}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              View Products
            </button>
          </div>
        )}

        {/* Products List */}
        <div className="p-6">
          <div className="grid gap-6">
            {products.map((product) => (
              <ProductMediaCard
                key={product.id}
                product={product}
                isUploading={uploadingProducts.has(product.id)}
                isCompleted={completedProducts.has(product.id)}
                onImageUpload={(files) => handleImageUpload(product.id, files)}
                onVideoUpload={(file) => handleVideoUpload(product.id, file)}
                onSkip={() => skipProduct(product.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Individual Product Media Card Component
function ProductMediaCard({ 
  product, 
  isUploading, 
  isCompleted, 
  onImageUpload, 
  onVideoUpload, 
  onSkip 
}) {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    const videoFiles = files.filter(file => file.type.startsWith('video/'))
    
    if (imageFiles.length > 0) {
      onImageUpload(imageFiles)
    }
    if (videoFiles.length === 1) {
      onVideoUpload(videoFiles[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  return (
    <div className={`border rounded-lg p-4 transition-all ${
      isCompleted ? 'bg-green-50 border-green-200' : 
      isUploading ? 'bg-blue-50 border-blue-200' : 
      'bg-white border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
          <p className="text-sm text-gray-600">SKU: {product.sku}</p>
          <p className="text-sm text-gray-500 mt-1">{product.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && (
            <div className="flex items-center gap-1 text-green-600">
              <FaCheck size={16} />
              <span className="text-sm font-medium">Complete</span>
            </div>
          )}
          {isUploading && (
            <div className="flex items-center gap-1 text-blue-600">
              <FaSpinner className="animate-spin" size={16} />
              <span className="text-sm font-medium">Uploading...</span>
            </div>
          )}
        </div>
      </div>

      {!isCompleted && !isUploading && (
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <FaImage className="text-2xl text-gray-400" />
            <FaVideo className="text-2xl text-gray-400" />
          </div>
          <p className="text-gray-600 mb-4">
            Drag & drop images and videos here, or click to browse
          </p>
          
          <div className="flex gap-3 justify-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => onImageUpload(e.target.files)}
              className="hidden"
              id={`images-${product.id}`}
            />
            <label
              htmlFor={`images-${product.id}`}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer flex items-center gap-2"
            >
              <FaImage size={14} />
              Add Images
            </label>

            <input
              type="file"
              accept="video/*"
              onChange={(e) => e.target.files[0] && onVideoUpload(e.target.files[0])}
              className="hidden"
              id={`video-${product.id}`}
            />
            <label
              htmlFor={`video-${product.id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-2"
            >
              <FaVideo size={14} />
              Add Video
            </label>

            <button
              onClick={onSkip}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Skip for Now
            </button>
          </div>
        </div>
      )}

      {/* Show existing media */}
      {(product.images?.length > 0 || product.video_url) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Media:</h4>
          <div className="flex gap-2 flex-wrap">
            {product.images?.map((imageUrl, index) => (
              <img
                key={index}
                src={imageUrl}
                alt={`Product ${index + 1}`}
                className="w-16 h-16 object-cover rounded border"
              />
            ))}
            {product.video_url && (
              <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                <FaVideo className="text-gray-500" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
