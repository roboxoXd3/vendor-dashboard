'use client'

import { useRef, useState } from 'react'
import { FaUpload, FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa'
import { sizeChartMediaService } from '@/services/sizeChartMediaService'

function isBlobUrl(url) {
  return typeof url === 'string' && url.startsWith('blob:')
}

export default function SizeChartImageUpload({
  templateId = null,
  imageUrl = '',
  onImageChange,
  onPendingFileChange,
  disabled = false,
  className = '',
}) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState(null)
  const [message, setMessage] = useState('')

  const canUploadNow = !!templateId

  const handleFileSelect = async (files) => {
    const file = files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('Image must be smaller than 5MB')
      return
    }

    setUploading(true)
    setStatus(null)
    setMessage('')

    try {
      if (!canUploadNow) {
        const previewUrl = URL.createObjectURL(file)
        onPendingFileChange?.(file, previewUrl)
        onImageChange?.(previewUrl)
        setStatus('success')
        setMessage('Image will upload when you save the size chart.')
        return
      }

      const result = await sizeChartMediaService.uploadImage(templateId, file)
      onPendingFileChange?.(null, null)
      onImageChange?.(result.imageUrl)
      setStatus('success')
      setMessage('Image uploaded successfully.')
      setTimeout(() => setStatus(null), 3000)
    } catch (error) {
      console.error('Size chart image upload error:', error)
      setStatus('error')
      setMessage(error.message)
      alert(`Failed to upload image: ${error.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const openFileDialog = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click()
    }
  }

  const isPending = isBlobUrl(imageUrl)

  return (
    <div className={`space-y-3 ${className}`}>
      {imageUrl ? (
        <div className="relative inline-block w-full">
          <img
            src={imageUrl}
            alt="Size chart preview"
            className="w-full max-h-64 object-contain border border-gray-300 rounded-lg bg-gray-50"
          />
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className={`px-2 py-1 rounded-full ${isPending ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
              {isPending ? 'Pending upload' : 'Saved in R2'}
            </span>
          </div>
        </div>
      ) : null}

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          uploading || disabled
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
        }`}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading || disabled}
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        {uploading ? (
          <div className="space-y-3">
            <FaSpinner className="mx-auto text-3xl text-emerald-600 animate-spin" />
            <p className="text-gray-600">Uploading image...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {status === 'success' && <FaCheck className="mx-auto text-3xl text-green-600" />}
            {status === 'error' && <FaExclamationTriangle className="mx-auto text-3xl text-red-600" />}
            {!status && <FaUpload className="mx-auto text-3xl text-gray-400" />}
            <div>
              <p className="font-medium text-gray-900">
                {imageUrl ? 'Replace size chart image' : 'Upload size chart image'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {message ||
                  (canUploadNow
                    ? 'Image uploads immediately to Cloudflare R2.'
                    : 'Save the size chart first, or pick an image now to upload after save.')}
              </p>
              <p className="text-xs text-gray-500 mt-2">JPEG, PNG, WebP, GIF up to 5MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
