'use client'
import { useState, useRef, useEffect } from 'react'
import { FaUpload, FaTimes, FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa'
import { imageUploadService } from '@/services/imageUploadService'
import { isValidProductId } from '@/services/productMediaService'

function isPendingPreview(url) {
  return typeof url === 'string' && url.startsWith('blob:')
}

export default function ImageUpload({ 
  vendorId, 
  productId = null, 
  type = 'main',
  colorName = null,
  onUploadSuccess, 
  onUploadError,
  onRemoveImage,
  onPendingFileAdd,
  onPendingFileRemove,
  onColorUploadSuccess,
  existingImages = [],
  multiple = true,
  className = '',
  accept = 'image/*'
}) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState([])
  const [images, setImages] = useState(existingImages)
  const fileInputRef = useRef(null)
  const canUploadImmediately = isValidProductId(productId)

  useEffect(() => {
    setImages(existingImages)
  }, [existingImages])

  const uploadSingleFile = async (file) => {
    if (!canUploadImmediately) {
      const previewUrl = URL.createObjectURL(file)
      onPendingFileAdd?.(file, { type, colorName, previewUrl })
      return previewUrl
    }

    const result = await imageUploadService.uploadFile(
      file,
      vendorId,
      productId,
      type,
      { colorName }
    )

    if (result.error) {
      throw new Error(`Failed to upload ${file.name}: ${result.error.message}`)
    }

    if ((type.startsWith('color-') || colorName) && result.colors) {
      onColorUploadSuccess?.({
        colorName,
        imageUrl: result.publicUrl,
        colors: result.colors,
      })
      return result.publicUrl
    }

    if (type === 'main' && canUploadImmediately) {
      onUploadSuccess?.(
        result.publicUrl,
        result.colors ? { colors: result.colors } : undefined
      )
      return result.publicUrl
    }

    return result.publicUrl
  }

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)

    const validationResults = fileArray.map((file) => ({
      file,
      validation: imageUploadService.validateImageFile(file),
    }))

    const invalidFiles = validationResults.filter((result) => !result.validation.isValid)
    if (invalidFiles.length > 0) {
      const errorMessages = invalidFiles.map(
        (result) => `${result.file.name}: ${result.validation.errors.join(', ')}`
      )
      onUploadError?.(errorMessages.join('\n'))
      return
    }

    setUploading(true)
    setUploadProgress(fileArray.map((file) => ({ name: file.name, status: 'uploading' })))

    try {
      const uploadedUrls = await Promise.all(fileArray.map((file) => uploadSingleFile(file)))
      const newImages = multiple ? [...images, ...uploadedUrls] : uploadedUrls
      setImages(newImages)

      const isColorUpload = type.startsWith('color-') || colorName
      const isMainUpload = type === 'main'

      if (!isColorUpload && !isMainUpload) {
        if (multiple) {
          uploadedUrls.forEach((url) => onUploadSuccess?.(url))
        } else {
          onUploadSuccess?.(uploadedUrls[0])
        }
      } else if (!canUploadImmediately) {
        uploadedUrls.forEach((url) => onUploadSuccess?.(url))
      }

      setUploadProgress(fileArray.map((file) => ({ name: file.name, status: 'success' })))
      setTimeout(() => setUploadProgress([]), 2000)
    } catch (error) {
      console.error('Upload error:', error)
      onUploadError?.(error.message)
      setUploadProgress(fileArray.map((file) => ({ name: file.name, status: 'error' })))
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (imageUrl) => {
    const newImages = images.filter((img) => img !== imageUrl)
    setImages(newImages)

    if (isPendingPreview(imageUrl)) {
      URL.revokeObjectURL(imageUrl)
      onPendingFileRemove?.(imageUrl, { type, colorName })
    }

    onRemoveImage?.(imageUrl)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files)
    e.target.value = ''
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const pendingCount = images.filter((img) => isPendingPreview(img)).length
  const savedCount = images.length - pendingCount

  return (
    <div className={`space-y-4 ${className}`}>
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.filter((img) => typeof img === 'string').map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={imageUrl}
                alt={`Product image ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4='
                }}
              />
              <button
                onClick={() => handleRemoveImage(imageUrl)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <FaTimes size={12} />
              </button>
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded truncate">
                  {isPendingPreview(imageUrl) ? '🟡 Pending upload' : '🟢 Saved'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragOver
            ? 'border-emerald-400 bg-emerald-50'
            : uploading
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!uploading ? openFileDialog : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-4">
            <FaSpinner className="mx-auto text-4xl text-emerald-600 animate-spin" />
            <div className="space-y-2">
              <p className="text-gray-600">
                {canUploadImmediately ? 'Uploading images...' : 'Preparing images...'}
              </p>
              {uploadProgress.map((progress, index) => (
                <div key={index} className="flex items-center justify-center gap-2 text-sm">
                  {progress.status === 'uploading' && <FaSpinner className="animate-spin text-emerald-600" />}
                  {progress.status === 'success' && <FaCheck className="text-green-600" />}
                  {progress.status === 'error' && <FaExclamationTriangle className="text-red-600" />}
                  <span className={
                    progress.status === 'success' ? 'text-green-600' :
                    progress.status === 'error' ? 'text-red-600' : 'text-gray-600'
                  }>
                    {progress.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <FaUpload className="mx-auto text-4xl text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                {multiple ? 'Upload Images' : 'Upload Image'}
              </p>
              <p className="text-gray-600">
                Drag & drop images here, or click to select files
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports: JPEG, PNG, WebP, GIF (max 5MB each)
              </p>
              {!canUploadImmediately && (
                <p className="text-sm text-amber-600 mt-2">
                  Images will upload to R2 when you publish the product.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-700">{savedCount} Saved</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-yellow-700">{pendingCount} Pending</span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            {canUploadImmediately
              ? 'Uploaded images are stored in Cloudflare R2.'
              : 'Pending images will be uploaded when you create the product.'}
          </p>
        </div>
      )}
    </div>
  )
}

export function MainImageUpload({ 
  vendorId, 
  productId, 
  onUploadSuccess, 
  onUploadError, 
  onRemoveImage,
  onPendingFileAdd,
  onPendingFileRemove,
  existingImages = [] 
}) {
  const safeExistingImages = Array.isArray(existingImages) ? existingImages : []

  return (
    <ImageUpload
      vendorId={vendorId}
      productId={productId}
      type="main"
      onUploadSuccess={onUploadSuccess}
      onUploadError={onUploadError}
      onRemoveImage={onRemoveImage}
      onPendingFileAdd={onPendingFileAdd}
      onPendingFileRemove={onPendingFileRemove}
      existingImages={safeExistingImages}
      multiple={true}
      className="w-full"
    />
  )
}

export function ColorImageUpload({ 
  vendorId, 
  productId, 
  color, 
  onUploadSuccess, 
  onUploadError, 
  onRemoveImage,
  onPendingFileAdd,
  onPendingFileRemove,
  onColorUploadSuccess,
  existingImages = [] 
}) {
  const safeExistingImages = Array.isArray(existingImages) ? existingImages : []

  return (
    <ImageUpload
      vendorId={vendorId}
      productId={productId}
      type={`color-${color.toLowerCase().replace(/\s+/g, '-')}`}
      colorName={color}
      onUploadSuccess={onUploadSuccess}
      onUploadError={onUploadError}
      onRemoveImage={onRemoveImage}
      onPendingFileAdd={onPendingFileAdd}
      onPendingFileRemove={onPendingFileRemove}
      onColorUploadSuccess={onColorUploadSuccess}
      existingImages={safeExistingImages}
      multiple={true}
      className="w-full"
    />
  )
}
