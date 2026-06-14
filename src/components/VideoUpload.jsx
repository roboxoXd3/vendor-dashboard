'use client'
import { useState, useRef, useEffect } from 'react'
import { FaUpload, FaVideo, FaPlay, FaTimes, FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa'
import { productMediaService, isValidProductId } from '@/services/productMediaService'

function isPendingPreview(url) {
  return typeof url === 'string' && url.startsWith('blob:')
}

export default function VideoUpload({ 
  onVideoUploaded, 
  onVideoRemoved, 
  onPendingVideoAdd,
  onPendingVideoRemove,
  existingVideoUrl = null,
  vendorId,
  productId = null,
  disabled = false,
  className = ''
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadPhase, setUploadPhase] = useState(null) // 'uploading' | 'processing' | null
  const [uploadStatus, setUploadStatus] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [videoUrl, setVideoUrl] = useState(existingVideoUrl)
  const [showPreview, setShowPreview] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const canUploadImmediately = isValidProductId(productId)

  useEffect(() => {
    setVideoUrl(existingVideoUrl)
  }, [existingVideoUrl])

  const handleFileSelect = async (files) => {
    const file = files?.[0] || files
    if (!file) return

    if (!file.type.startsWith('video/')) {
      setUploadStatus('error')
      alert('Please select a valid video file')
      return
    }

    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadStatus('error')
      alert('Video file size must be less than 50MB')
      return
    }

    await uploadVideo(file)
  }

  const uploadVideo = async (file) => {
    if (!vendorId) {
      alert('Vendor ID is required for video upload')
      return
    }

    if (videoUrl) {
      const confirmReplace = window.confirm(
        'A video is already uploaded for this product. Do you want to replace it with the new video?'
      )
      if (!confirmReplace) {
        return
      }
    }

    setUploading(true)
    setUploadPhase('uploading')
    setUploadStatus(null)
    setStatusMessage('')

    try {
      if (!canUploadImmediately) {
        const previewUrl = URL.createObjectURL(file)
        onPendingVideoAdd?.(file, previewUrl)
        setVideoUrl(previewUrl)
        setUploadStatus('success')
        setStatusMessage('Video will upload to R2 when you publish the product.')
        onVideoUploaded?.(previewUrl)
        return
      }

      setStatusMessage('Uploading video file...')
      const { jobId, status } = await productMediaService.initiateVideoUpload(productId, file)
      setUploadPhase('processing')
      setStatusMessage(
        status === 'processing'
          ? `Upload accepted. Processing video (job: ${jobId.slice(0, 8)}...)`
          : 'Processing video upload...'
      )

      const resultUrl = await productMediaService.pollVideoUpload(jobId, {
        intervalMs: 4000,
        onStatus: (job) => {
          if (job.status === 'pending' || job.status === 'processing') {
            setStatusMessage('Checking upload status...')
          }
          if (job.status === 'completed') {
            setStatusMessage('Video processing completed.')
          }
        },
      })

      setVideoUrl(resultUrl)
      setUploadStatus('success')
      setStatusMessage('Video uploaded successfully.')
      onVideoUploaded?.(resultUrl)
      setTimeout(() => setUploadStatus(null), 3000)
    } catch (error) {
      console.error('Video upload error:', error)
      setUploadStatus('error')
      setStatusMessage(error.message)
      alert(`Failed to upload video: ${error.message}`)
      setTimeout(() => setUploadStatus(null), 5000)
    } finally {
      setUploading(false)
      setUploadPhase(null)
    }
  }

  const handleRemoveVideo = () => {
    const confirmRemove = window.confirm('Are you sure you want to remove this video?')
    if (!confirmRemove) return

    if (isPendingPreview(videoUrl)) {
      URL.revokeObjectURL(videoUrl)
      onPendingVideoRemove?.(videoUrl)
    }

    setVideoUrl(null)
    setShowPreview(false)
    setUploadStatus(null)
    setStatusMessage('')
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
    handleFileSelect(e.dataTransfer.files)
  }

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files)
    e.target.value = ''
  }

  const openFileDialog = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click()
    }
  }

  const isPending = isPendingPreview(videoUrl)

  return (
    <div className={`space-y-4 ${className}`}>
      {videoUrl && (
        <div className="relative group">
          <div className="bg-gray-100 border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FaVideo className="text-red-500" />
                <span className="font-medium text-gray-900">Product Video</span>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  isPending
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isPending ? '🟡 Pending upload' : '🟢 Saved'}
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

            <div className="relative bg-black rounded-lg overflow-hidden">
              {showPreview ? (
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-48 object-contain"
                  onError={() => setShowPreview(false)}
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

            <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
              <p className="font-medium text-gray-700 mb-1">Video URL:</p>
              <p className="text-gray-600 break-all">{videoUrl}</p>
            </div>
          </div>
        </div>
      )}

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
                <p className="text-gray-600">
                  {statusMessage ||
                    (uploadPhase === 'processing'
                      ? 'Waiting for video processing to complete...'
                      : 'Uploading video...')}
                </p>
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
                  {uploadStatus === 'success' ? 'Video Ready' :
                   uploadStatus === 'error' ? 'Upload Failed' :
                   disabled ? 'Video Upload Disabled' : 'Upload Product Video'}
                </p>
                <p className="text-gray-600">
                  {statusMessage ||
                    (disabled ? 'Complete required fields first' :
                    'Drag & drop a video here, or click to select')}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports: MP4, MOV, AVI, WebM (max 50MB)
                </p>
                {!canUploadImmediately && (
                  <p className="text-sm text-amber-600 mt-2">
                    Video will upload to R2 when you publish the product.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {videoUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <FaVideo className="text-red-500" />
            <span className="font-medium">Video Status:</span>
            <div className={`flex items-center gap-1 ${
              isPending ? 'text-yellow-700' : 'text-green-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isPending ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
              <span>{isPending ? 'Pending Upload' : 'Stored in R2'}</span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            {isPending
              ? 'This video will be uploaded when you save the product.'
              : 'This video is stored in Cloudflare R2 and linked to your product.'}
          </p>
        </div>
      )}
    </div>
  )
}
