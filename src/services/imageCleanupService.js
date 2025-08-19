import { supabase } from '@/lib/supabase'

/**
 * Service for managing temporary image uploads and cleanup
 */
export const imageCleanupService = {
  // Store temporary images for cleanup
  tempImages: new Set(),

  /**
   * Add image to temporary storage tracking
   */
  addTempImage(imagePath) {
    if (imagePath) {
      this.tempImages.add(imagePath)
      console.log('📝 Added to temp tracking:', imagePath)
    }
  },

  /**
   * Track temporary image (alias for addTempImage)
   */
  trackTempImage(imagePath) {
    this.addTempImage(imagePath)
  },

  /**
   * Remove image from temporary storage tracking (when product is saved)
   */
  confirmImage(imagePath) {
    if (imagePath) {
      this.tempImages.delete(imagePath)
      console.log('✅ Confirmed image (removed from temp):', imagePath)
    }
  },

  /**
   * Confirm all images in an array (when product is saved)
   */
  confirmImages(imagePaths) {
    if (Array.isArray(imagePaths)) {
      imagePaths.forEach(path => this.confirmImage(path))
    }
  },

  /**
   * Clean up temporary images that weren't used
   */
  async cleanupTempImages() {
    if (this.tempImages.size === 0) {
      console.log('🧹 No temporary images to clean up')
      return { success: true, cleaned: 0 }
    }

    console.log(`🧹 Cleaning up ${this.tempImages.size} temporary images...`)
    
    const imagesToDelete = Array.from(this.tempImages)
    let cleanedCount = 0
    const errors = []

    for (const imagePath of imagesToDelete) {
      try {
        // Extract bucket and path from full URL or path
        const { bucket, path } = this.parseImagePath(imagePath)
        
        if (bucket && path) {
          const { error } = await supabase.storage
            .from(bucket)
            .remove([path])

          if (error) {
            console.error('❌ Failed to delete temp image:', imagePath, error)
            errors.push(`${imagePath}: ${error.message}`)
          } else {
            console.log('🗑️ Deleted temp image:', imagePath)
            this.tempImages.delete(imagePath)
            cleanedCount++
          }
        }
      } catch (error) {
        console.error('❌ Error deleting temp image:', imagePath, error)
        errors.push(`${imagePath}: ${error.message}`)
      }
    }

    return {
      success: errors.length === 0,
      cleaned: cleanedCount,
      errors: errors
    }
  },

  /**
   * Parse image path to extract bucket and file path
   */
  parseImagePath(imagePath) {
    try {
      if (!imagePath) return { bucket: null, path: null }

      // If it's a full URL
      if (imagePath.startsWith('http')) {
        const url = new URL(imagePath)
        const pathParts = url.pathname.split('/')
        
        // Supabase storage URL format: /storage/v1/object/public/BUCKET/PATH
        const storageIndex = pathParts.indexOf('storage')
        if (storageIndex !== -1 && pathParts[storageIndex + 4]) {
          const bucket = pathParts[storageIndex + 4]
          const path = pathParts.slice(storageIndex + 5).join('/')
          return { bucket, path }
        }
      }

      // If it's just a path like "products/vendor-id/filename.jpg"
      if (imagePath.includes('/')) {
        const parts = imagePath.split('/')
        if (parts.length >= 2) {
          // Assume first part is bucket, rest is path
          return {
            bucket: parts[0],
            path: parts.slice(1).join('/')
          }
        }
      }

      return { bucket: null, path: null }
    } catch (error) {
      console.error('Error parsing image path:', imagePath, error)
      return { bucket: null, path: null }
    }
  },

  /**
   * Clean up on page unload (browser event)
   */
  setupAutoCleanup() {
    // Clean up when user navigates away or closes tab
    const handleBeforeUnload = () => {
      // Note: This runs synchronously, so we can't use async cleanup
      // We'll rely on manual cleanup calls instead
      console.log('🚪 Page unloading, temp images will be cleaned up on next session')
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is being hidden, schedule cleanup
        setTimeout(() => {
          this.cleanupTempImages()
        }, 1000)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Return cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  },

  /**
   * Get current temporary images count
   */
  getTempImagesCount() {
    return this.tempImages.size
  },

  /**
   * Get list of temporary images
   */
  getTempImages() {
    return Array.from(this.tempImages)
  },

  /**
   * Clear all temporary image tracking (use with caution)
   */
  clearTempTracking() {
    const count = this.tempImages.size
    this.tempImages.clear()
    console.log(`🧹 Cleared ${count} items from temp tracking`)
    return count
  }
}

// Auto-setup cleanup on import
if (typeof window !== 'undefined') {
  imageCleanupService.setupAutoCleanup()
}

export default imageCleanupService
