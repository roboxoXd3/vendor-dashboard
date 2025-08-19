import { supabase } from '@/lib/supabase'
import { imageCleanupService } from './imageCleanupService'

export const imageUploadService = {
  /**
   * Generic file upload method for both images and videos
   * @param {File} file - The file to upload
   * @param {string} vendorId - The vendor ID for organizing files
   * @param {string} productId - Optional product ID for organizing files
   * @param {string} type - Type of file ('images', 'videos', 'main', 'color-specific', etc.)
   * @returns {Promise<{publicUrl: string, error: null} | {publicUrl: null, error: Error}>}
   */
  async uploadFile(file, vendorId, productId = null, type = 'images') {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided')
      }

      // Determine if it's a video or image and validate accordingly
      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')

      if (!isVideo && !isImage) {
        throw new Error('Invalid file type. Please upload images or videos only.')
      }

      // Validate based on file type
      if (isImage) {
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedImageTypes.includes(file.type)) {
          throw new Error('Invalid image type. Please upload JPEG, PNG, WebP, or GIF images.')
        }
        // Check image file size (max 5MB)
        const maxImageSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxImageSize) {
          throw new Error('Image file size too large. Please upload images smaller than 5MB.')
        }
      }

      if (isVideo) {
        const allowedVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime']
        if (!allowedVideoTypes.includes(file.type)) {
          throw new Error('Invalid video type. Please upload MP4, MOV, AVI, or WebM videos.')
        }
        // Check video file size (max 5MB)
        const maxVideoSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxVideoSize) {
          throw new Error('Video file size too large. Please upload videos smaller than 5MB.')
        }
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop().toLowerCase()
      const fileName = `${timestamp}-${randomString}.${fileExtension}`

      // Create storage path: vendors/vendorId/products/productId/type/filename
      const storagePath = productId 
        ? `vendors/${vendorId}/products/${productId}/${type}/${fileName}`
        : `vendors/${vendorId}/temp/${type}/${fileName}`

      console.log(`📤 Uploading ${isVideo ? 'video' : 'image'}:`, {
        fileName,
        storagePath,
        fileSize: file.size,
        fileType: file.type
      })

      // Choose the appropriate bucket based on file type
      const bucketName = isVideo ? 'product-videos' : 'products'

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false // Don't overwrite existing files
        })

      if (error) {
        console.error('❌ Upload error:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(storagePath)

      console.log(`✅ ${isVideo ? 'Video' : 'Image'} uploaded successfully:`, publicUrl)

      // Add to temporary tracking for cleanup if product creation fails
      if (productId === 'temp' || !productId) {
        imageCleanupService.addTempImage(storagePath)
      }

      return {
        publicUrl,
        path: storagePath,
        error: null
      }

    } catch (error) {
      console.error(`❌ ${file.type.startsWith('video/') ? 'Video' : 'Image'} upload error:`, error)
      return {
        publicUrl: null,
        path: null,
        error: error
      }
    }
  },

  /**
   * Upload a single image to Supabase Storage (legacy method for backward compatibility)
   * @param {File} file - The image file to upload
   * @param {string} vendorId - The vendor ID for organizing files
   * @param {string} productId - Optional product ID for organizing files
   * @param {string} type - Type of image (main, color-specific, etc.)
   * @returns {Promise<{url: string, error: null} | {url: null, error: string}>}
   */
  async uploadImage(file, vendorId, productId = null, type = 'main') {
    // Use the new uploadFile method for consistency
    const result = await this.uploadFile(file, vendorId, productId, type)
    
    // Convert to legacy format for backward compatibility
    return {
      url: result.publicUrl,
      path: result.path,
      error: result.error ? result.error.message : null
    }
  },

  /**
   * Upload multiple images
   * @param {File[]} files - Array of image files
   * @param {string} vendorId - The vendor ID
   * @param {string} productId - Optional product ID
   * @param {string} type - Type of images
   * @returns {Promise<{urls: string[], errors: string[]}>}
   */
  async uploadMultipleImages(files, vendorId, productId = null, type = 'main') {
    const results = await Promise.allSettled(
      files.map(file => this.uploadImage(file, vendorId, productId, type))
    )

    const urls = []
    const errors = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.url) {
        urls.push(result.value.url)
      } else {
        const error = result.status === 'rejected' 
          ? result.reason.message 
          : result.value.error
        errors.push(`File ${index + 1}: ${error}`)
      }
    })

    return { urls, errors }
  },

  /**
   * Delete an image from Supabase Storage
   * @param {string} imageUrl - The full URL of the image to delete
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async deleteImage(imageUrl) {
    try {
      // Extract path from URL
      const url = new URL(imageUrl)
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/products\/(.+)/)
      
      if (!pathMatch) {
        throw new Error('Invalid image URL format')
      }

      const filePath = pathMatch[1]
      
      console.log('🗑️ Deleting image:', filePath)

      const { error } = await supabase.storage
        .from('products')
        .remove([filePath])

      if (error) {
        console.error('❌ Delete error:', error)
        throw new Error(`Delete failed: ${error.message}`)
      }

      console.log('✅ Image deleted successfully')
      return { success: true, error: null }

    } catch (error) {
      console.error('❌ Image delete error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get optimized image URL with transformations
   * @param {string} imageUrl - Original image URL
   * @param {Object} options - Transformation options
   * @returns {string} - Optimized image URL
   */
  getOptimizedImageUrl(imageUrl, options = {}) {
    const {
      width = null,
      height = null,
      quality = 80,
      format = 'webp'
    } = options

    // For Supabase Storage, we can add transformation parameters
    // This depends on your Supabase configuration and any image optimization service
    let optimizedUrl = imageUrl

    // Add transformation parameters if supported
    const params = new URLSearchParams()
    if (width) params.append('width', width)
    if (height) params.append('height', height)
    if (quality) params.append('quality', quality)
    if (format) params.append('format', format)

    if (params.toString()) {
      optimizedUrl += `?${params.toString()}`
    }

    return optimizedUrl
  },

  /**
   * Validate image file before upload
   * @param {File} file - The file to validate
   * @returns {Object} - Validation result
   */
  validateImageFile(file) {
    const errors = []

    // Check if file exists
    if (!file) {
      errors.push('No file selected')
      return { isValid: false, errors }
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.')
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      errors.push('File size too large. Maximum size is 5MB.')
    }

    // Check minimum dimensions (optional)
    // This would require reading the image, which is more complex
    // For now, we'll skip this validation

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
