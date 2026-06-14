import { productMediaService, isValidProductId } from './productMediaService'

export const imageUploadService = {
  /**
   * Upload product media via BeSmart R2 APIs.
   * For non-product uploads (e.g. size charts), falls back is not handled here.
   */
  async uploadFile(file, vendorId, productId = null, type = 'images', options = {}) {
    try {
      if (!file) {
        throw new Error('No file provided')
      }

      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')

      if (!isVideo && !isImage) {
        throw new Error('Invalid file type. Please upload images or videos only.')
      }

      if (isImage) {
        const validation = this.validateImageFile(file)
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '))
        }
      }

      if (isVideo) {
        const allowedVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime']
        if (!allowedVideoTypes.includes(file.type)) {
          throw new Error('Invalid video type. Please upload MP4, MOV, AVI, or WebM videos.')
        }
        const maxVideoSize = 50 * 1024 * 1024
        if (file.size > maxVideoSize) {
          throw new Error('Video file size too large. Please upload videos smaller than 50MB.')
        }
      }

      if (!isValidProductId(productId)) {
        throw new Error('Product must be saved before uploading media. Complete product creation first.')
      }

      let publicUrl = null
      let extra = {}

      if (isVideo || type === 'videos') {
        publicUrl = await productMediaService.uploadVideo(productId, file)
      } else if (type.startsWith('color-') || options.colorName) {
        const colorName = options.colorName || productMediaService.extractColorName(type)
        if (!colorName) {
          throw new Error('Color name is required for color image upload')
        }
        const upload = await productMediaService.uploadColorImage(productId, file, colorName)
        publicUrl = upload.publicUrl
        extra = { colors: upload.colors, colorImages: upload.colorImages }
      } else {
        const upload = await productMediaService.uploadMainImage(productId, file)
        publicUrl = upload.publicUrl
        extra = {
          images: upload.images,
          colors: upload.colors,
          colorImages: upload.colorImages,
        }
      }

      if (!publicUrl && !extra.colors) {
        throw new Error('Upload succeeded but no URL was returned')
      }

      return {
        publicUrl,
        path: publicUrl,
        error: null,
        ...extra,
      }
    } catch (error) {
      console.error(`❌ ${file?.type?.startsWith('video/') ? 'Video' : 'Image'} upload error:`, error)
      return {
        publicUrl: null,
        path: null,
        error,
      }
    }
  },

  async uploadImage(file, vendorId, productId = null, type = 'main') {
    const result = await this.uploadFile(file, vendorId, productId, type)
    return {
      url: result.publicUrl,
      path: result.path,
      error: result.error ? result.error.message : null,
    }
  },

  async uploadMultipleImages(files, vendorId, productId = null, type = 'main') {
    const results = await Promise.allSettled(
      files.map((file) => this.uploadImage(file, vendorId, productId, type))
    )

    const urls = []
    const errors = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.url) {
        urls.push(result.value.url)
      } else {
        const error =
          result.status === 'rejected'
            ? result.reason.message
            : result.value.error
        errors.push(`File ${index + 1}: ${error}`)
      }
    })

    return { urls, errors }
  },

  async deleteImage() {
    return { success: true, error: null }
  },

  getOptimizedImageUrl(imageUrl) {
    return imageUrl
  },

  validateImageFile(file) {
    const errors = []

    if (!file) {
      errors.push('No file selected')
      return { isValid: false, errors }
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.')
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      errors.push('File size too large. Maximum size is 5MB.')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  },
}
