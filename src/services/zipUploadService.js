import JSZip from 'jszip'
import { bulkUploadService } from './bulkUploadService'
import { imageUploadService } from './imageUploadService'

export const zipUploadService = {
  /**
   * Parse ZIP file containing CSV and images
   * @param {File} zipFile - ZIP file to parse
   * @returns {Promise<Object>} Parsed data with CSV and image files
   */
  async parseZipFile(zipFile) {
    try {
      const zip = new JSZip()
      const zipContent = await zip.loadAsync(zipFile)
      
      let csvData = null
      const imageFiles = {}
      const videoFiles = {}
      
      // Process each file in the ZIP
      for (const [filename, file] of Object.entries(zipContent.files)) {
        if (file.dir) continue // Skip directories
        
        const lowerFilename = filename.toLowerCase()
        
        // Find CSV file
        if (lowerFilename.endsWith('.csv')) {
          const csvText = await file.async('text')
          csvData = await this.parseCSVText(csvText)
        }
        
        // Find image files
        else if (this.isImageFile(lowerFilename)) {
          const blob = await file.async('blob')
          const imageFile = new File([blob], filename, { type: this.getMimeType(lowerFilename) })
          imageFiles[filename] = imageFile
        }
        
        // Find video files
        else if (this.isVideoFile(lowerFilename)) {
          const blob = await file.async('blob')
          const videoFile = new File([blob], filename, { type: this.getMimeType(lowerFilename) })
          videoFiles[filename] = videoFile
        }
      }
      
      if (!csvData) {
        throw new Error('No CSV file found in ZIP archive')
      }
      
      return {
        csvData,
        imageFiles,
        videoFiles,
        totalFiles: Object.keys(zipContent.files).length
      }
    } catch (error) {
      console.error('ZIP parsing error:', error)
      throw new Error(`Failed to parse ZIP file: ${error.message}`)
    }
  },

  /**
   * Parse CSV text content
   * @param {string} csvText - CSV content as text
   * @returns {Promise<Array>} Parsed CSV data
   */
  async parseCSVText(csvText) {
    return new Promise((resolve, reject) => {
      // Create a temporary file-like object for Papa Parse
      const csvBlob = new Blob([csvText], { type: 'text/csv' })
      const csvFile = new File([csvBlob], 'data.csv', { type: 'text/csv' })
      
      bulkUploadService.parseCSV(csvFile)
        .then(resolve)
        .catch(reject)
    })
  },

  /**
   * Process ZIP upload with images
   * @param {string} vendorId - Vendor ID
   * @param {Object} zipData - Parsed ZIP data
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload results
   */
  async processZipUpload(vendorId, zipData, onProgress = () => {}) {
    const { csvData, imageFiles, videoFiles } = zipData
    const results = {
      products: [],
      images: [],
      videos: [],
      errors: []
    }

    try {
      onProgress({ stage: 'products', progress: 0, message: 'Creating products...' })
      
      // Step 1: Create products first (fast)
      const productResponse = await fetch('/api/products/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          products: csvData
        })
      })

      const productResult = await productResponse.json()
      
      if (!productResult.success) {
        throw new Error(productResult.error || 'Failed to create products')
      }

      results.products = productResult.data
      onProgress({ stage: 'products', progress: 100, message: `Created ${results.products.length} products` })

      // Step 2: Upload images and videos
      if (Object.keys(imageFiles).length > 0 || Object.keys(videoFiles).length > 0) {
        onProgress({ stage: 'media', progress: 0, message: 'Uploading media files...' })
        
        await this.uploadMediaFiles(vendorId, results.products, imageFiles, videoFiles, results, onProgress)
      }

      onProgress({ stage: 'complete', progress: 100, message: 'Upload complete!' })
      return results

    } catch (error) {
      console.error('ZIP upload error:', error)
      results.errors.push(error.message)
      throw error
    }
  },

  /**
   * Upload media files and associate with products
   * @param {string} vendorId - Vendor ID
   * @param {Array} products - Created products
   * @param {Object} imageFiles - Image files from ZIP
   * @param {Object} videoFiles - Video files from ZIP
   * @param {Object} results - Results object to update
   * @param {Function} onProgress - Progress callback
   */
  async uploadMediaFiles(vendorId, products, imageFiles, videoFiles, results, onProgress) {
    const totalFiles = Object.keys(imageFiles).length + Object.keys(videoFiles).length
    let processedFiles = 0

    // Create a mapping of filename patterns to products
    const productMapping = this.createProductMediaMapping(products, imageFiles, videoFiles)

    // Upload images
    for (const [filename, file] of Object.entries(imageFiles)) {
      try {
        const productMatches = productMapping[filename] || []
        
        if (productMatches.length === 0) {
          results.errors.push(`No product match found for image: ${filename}`)
          continue
        }

        // Upload image
        const uploadResult = await imageUploadService.uploadFile(
          file, 
          vendorId, 
          productMatches[0].id, 
          'images'
        )

        if (uploadResult.publicUrl) {
          // Update product with image
          await this.updateProductImages(productMatches[0].id, [uploadResult.publicUrl])
          results.images.push({ filename, productId: productMatches[0].id, url: uploadResult.publicUrl })
        }

      } catch (error) {
        results.errors.push(`Failed to upload image ${filename}: ${error.message}`)
      }

      processedFiles++
      onProgress({ 
        stage: 'media', 
        progress: (processedFiles / totalFiles) * 100, 
        message: `Uploaded ${processedFiles}/${totalFiles} media files` 
      })
    }

    // Upload videos
    for (const [filename, file] of Object.entries(videoFiles)) {
      try {
        const productMatches = productMapping[filename] || []
        
        if (productMatches.length === 0) {
          results.errors.push(`No product match found for video: ${filename}`)
          continue
        }

        // Upload video
        const uploadResult = await imageUploadService.uploadFile(
          file, 
          vendorId, 
          productMatches[0].id, 
          'videos'
        )

        if (uploadResult.publicUrl) {
          // Update product with video
          await this.updateProductVideo(productMatches[0].id, uploadResult.publicUrl)
          results.videos.push({ filename, productId: productMatches[0].id, url: uploadResult.publicUrl })
        }

      } catch (error) {
        results.errors.push(`Failed to upload video ${filename}: ${error.message}`)
      }

      processedFiles++
      onProgress({ 
        stage: 'media', 
        progress: (processedFiles / totalFiles) * 100, 
        message: `Uploaded ${processedFiles}/${totalFiles} media files` 
      })
    }
  },

  /**
   * Create mapping between media files and products based on filename patterns
   * @param {Array} products - Products array
   * @param {Object} imageFiles - Image files
   * @param {Object} videoFiles - Video files
   * @returns {Object} Mapping of filenames to products
   */
  createProductMediaMapping(products, imageFiles, videoFiles) {
    const mapping = {}
    const allFiles = { ...imageFiles, ...videoFiles }

    for (const filename of Object.keys(allFiles)) {
      const matches = []
      
      // Try different matching strategies
      for (const product of products) {
        // Strategy 1: Filename contains SKU
        if (product.sku && filename.toLowerCase().includes(product.sku.toLowerCase())) {
          matches.push(product)
          continue
        }
        
        // Strategy 2: Filename contains product name (partial match)
        const productNameWords = product.name.toLowerCase().split(' ')
        const filenameWords = filename.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ')
        
        const matchingWords = productNameWords.filter(word => 
          word.length > 2 && filenameWords.some(fw => fw.includes(word))
        )
        
        if (matchingWords.length >= 2) {
          matches.push(product)
        }
      }
      
      mapping[filename] = matches
    }

    return mapping
  },

  /**
   * Update product with new images
   * @param {string} productId - Product ID
   * @param {Array} imageUrls - Array of image URLs
   */
  async updateProductImages(productId, imageUrls) {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updates: { images: JSON.stringify(imageUrls) }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to update product images')
    }
  },

  /**
   * Update product with video
   * @param {string} productId - Product ID
   * @param {string} videoUrl - Video URL
   */
  async updateProductVideo(productId, videoUrl) {
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
  },

  /**
   * Check if file is an image
   * @param {string} filename - Filename to check
   * @returns {boolean} True if image file
   */
  isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    return imageExtensions.some(ext => filename.endsWith(ext))
  },

  /**
   * Check if file is a video
   * @param {string} filename - Filename to check
   * @returns {boolean} True if video file
   */
  isVideoFile(filename) {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv']
    return videoExtensions.some(ext => filename.endsWith(ext))
  },

  /**
   * Get MIME type from filename
   * @param {string} filename - Filename
   * @returns {string} MIME type
   */
  getMimeType(filename) {
    const ext = filename.split('.').pop().toLowerCase()
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'webm': 'video/webm',
      'mkv': 'video/x-matroska'
    }
    return mimeTypes[ext] || 'application/octet-stream'
  }
}
