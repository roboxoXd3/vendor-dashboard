'use client'
import { useState, useRef, useEffect } from 'react'
import { FaUpload, FaVideo, FaTrash, FaPlay, FaTimes, FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa'
import { imageUploadService } from '@/services/imageUploadService'
import { imageCleanupService } from '@/services/imageCleanupService'

export default function VideoUpload({ 
  onVideoUploaded, 
  onVideoRemoved, 
  existingVideoUrl = null,
  vendorId,
  productId = null,
  disabled = false,
  className = ''
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState(existingVideoUrl)
  const [showPreview, setShowPreview] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null) // 'success', 'error', null
  const fileInputRef = useRef(null)

  // Update video URL when existingVideoUrl prop changes
  useEffect(() => {
    setVideoUrl(existingVideoUrl)
  }, [existingVideoUrl])

  const handleFileSelect = async (files) => {
    const file = files?.[0] || files
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setUploadStatus('error')
      alert('Please select a valid video file')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setUploadStatus('error')
      alert('Video file size must be less than 5MB')
      return
    }

    await uploadVideo(file)
  }

  const uploadVideo = async (file) => {
    if (!vendorId) {
      alert('Vendor ID is required for video upload')
      return
    }

    // If there's already a video, confirm replacement
    if (videoUrl) {
      const confirmReplace = window.confirm(
        'A video is already uploaded for this product. Do you want to replace it with the new video?'
      )
      if (!confirmReplace) {
        return
      }
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadStatus(null)

    try {
      // Upload to videos bucket with temp folder
      const result = await imageUploadService.uploadFile(
        file, 
        vendorId, 
        productId || 'temp', 
        'videos'
      )

      if (result.error) {
        throw new Error(result.error.message)
      }

      // Track the uploaded video for cleanup
      imageCleanupService.trackTempImage(result.publicUrl)

      // Update local state
      setVideoUrl(result.publicUrl)
      setUploadStatus('success')
      
      // Notify parent component
      onVideoUploaded?.(result.publicUrl)

      // Clear success status after 3 seconds
      setTimeout(() => setUploadStatus(null), 3000)

    } catch (error) {
      console.error('Video upload error:', error)
      setUploadStatus('error')
      alert(`Failed to upload video: ${error.message}`)
      
      // Clear error status after 5 seconds
      setTimeout(() => setUploadStatus(null), 5000)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemoveVideo = () => {
    const confirmRemove = window.confirm('Are you sure you want to remove this video?')
    if (!confirmRemove) return

    // Track for cleanup if it's a temp video
    if (videoUrl && videoUrl.includes('/temp/')) {
      imageCleanupService.trackTempImage(videoUrl)
    }

    setVideoUrl(null)
    setShowPreview(false)
    setUploadStatus(null)
    onVideoRemoved?.()
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files)
  }

  const openFileDialog = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click()
    }
  }

  const isTemporary = videoUrl && videoUrl.includes('/temp/')

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Existing Video Display */}
      {videoUrl && (
        <div className="relative group">
          <div className="bg-gray-100 border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FaVideo className="text-red-500" />
                <span className="font-medium text-gray-900">Product Video</span>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  isTemporary 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isTemporary ? '🟡 Temporary' : '🟢 Saved'}
                </div>
              </div>
              <button
                onClick={handleRemoveVideo}
                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                title="Remove video"
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Video Preview */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              {showPreview ? (
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-48 object-contain"
                  onError={() => {
                    console.error('Video failed to load:', videoUrl)
                    setShowPreview(false)
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div 
                  className="w-full h-48 flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => setShowPreview(true)}
                >
                  <div className="text-center text-white">
                    <FaPlay className="mx-auto text-4xl mb-2 opacity-80" />
                    <p className="text-sm opacity-80">Click to preview video</p>
                  </div>
                </div>
              )}
            </div>

            {/* Video URL Display */}
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
              <p className="font-medium text-gray-700 mb-1">Video URL:</p>
              <p className="text-gray-600 break-all">{videoUrl}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!videoUrl && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragOver
              ? 'border-red-400 bg-red-50'
              : uploading || disabled
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!uploading && !disabled ? openFileDialog : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={uploading || disabled}
          />

          {uploading ? (
            <div className="space-y-4">
              <FaSpinner className="mx-auto text-4xl text-red-600 animate-spin" />
              <div className="space-y-2">
                <p className="text-gray-600">Uploading video...</p>
                {uploadProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {uploadStatus === 'success' && (
                <FaCheck className="mx-auto text-4xl text-green-600" />
              )}
              {uploadStatus === 'error' && (
                <FaExclamationTriangle className="mx-auto text-4xl text-red-600" />
              )}
              {!uploadStatus && (
                <FaUpload className="mx-auto text-4xl text-gray-400" />
              )}
              
              <div>
                <p className={`text-lg font-medium ${
                  uploadStatus === 'success' ? 'text-green-600' :
                  uploadStatus === 'error' ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {uploadStatus === 'success' ? 'Video Uploaded Successfully!' :
                   uploadStatus === 'error' ? 'Upload Failed' :
                   disabled ? 'Video Upload Disabled' : 'Upload Product Video'}
                </p>
                <p className="text-gray-600">
                  {uploadStatus === 'success' ? 'Your video has been uploaded and is ready to use.' :
                   uploadStatus === 'error' ? 'Please try uploading again.' :
                   disabled ? 'Complete required fields first' :
                   'Drag & drop a video here, or click to select'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports: MP4, MOV, AVI, WebM (max 5MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video Status Info */}
      {videoUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <FaVideo className="text-red-500" />
            <span className="font-medium">Video Status:</span>
            <div className={`flex items-center gap-1 ${
              isTemporary ? 'text-yellow-700' : 'text-green-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isTemporary ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
              <span>{isTemporary ? 'Temporary Upload' : 'Permanently Saved'}</span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            💡 {isTemporary 
              ? 'This video will be automatically deleted if you leave without saving the product.'
              : 'This video is permanently stored and linked to your product.'
            }
          </p>
        </div>
      )}

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && videoUrl && (
        <div className="bg-gray-100 p-3 rounded text-xs">
          <p className="font-medium mb-2">Debug - Video Info:</p>
          <div className="space-y-1">
            <div>URL: {videoUrl}</div>
            <div>Temporary: {isTemporary ? 'Yes' : 'No'}</div>
            <div>Vendor ID: {vendorId}</div>
            <div>Product ID: {productId || 'temp'}</div>
          </div>
        </div>
      )}
    </div>
  )
}
