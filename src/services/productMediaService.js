import { isValidProductId } from '@/lib/validators'

export { isValidProductId }

/** Main product images (no color variant) use the color-image API with this name */
export const MAIN_IMAGE_COLOR_NAME = 'default'

function parseError(data, fallback = 'Upload failed') {
  return data?.error || data?.message || data?.detail || fallback
}

async function parseResponse(response, fallback) {
  const data = await response.json().catch(() => ({}))

  const isAccepted = response.status === 202
  if (!response.ok && !isAccepted) {
    throw new Error(parseError(data, fallback))
  }

  if (data.success === false || data.status === 'failure') {
    throw new Error(parseError(data, fallback))
  }

  return data
}

/** Map BeSmart colors object → form color_images (arrays of URLs) */
export function colorsObjectToColorImages(colors) {
  const result = {}
  for (const [colorName, colorData] of Object.entries(colors || {})) {
    const url =
      typeof colorData === 'string'
        ? colorData
        : colorData?.image_url || null
    if (url) {
      const existing = result[colorName] || []
      if (!existing.includes(url)) {
        result[colorName] = [...existing, url]
      }
    }
  }
  return result
}

function extractColorImageUrl(colors, colorName) {
  if (!colors || !colorName) return null
  const entry = colors[colorName]
  if (!entry) return null
  if (typeof entry === 'string') return entry
  return entry.image_url || null
}

export const productMediaService = {
  /**
   * Main product images use the same endpoint as color images with color_name "default".
   * POST /api/products/{id}/upload-color-image/ — form-data: color_name=default, image
   */
  async uploadMainImage(productId, file) {
    const upload = await this.uploadColorImage(productId, file, MAIN_IMAGE_COLOR_NAME)
    const publicUrl =
      upload.publicUrl ||
      extractColorImageUrl(upload.colors, MAIN_IMAGE_COLOR_NAME)

    return {
      publicUrl,
      images: publicUrl ? [publicUrl] : [],
      colors: upload.colors,
      colorImages: upload.colorImages,
    }
  },

  /**
   * POST /api/products/{id}/upload-color-image/
   * Body (form-data): color_name, image
   * Response: { status, image_url, colors: { Red: { image_url }, Blue: { hex, sizes } } }
   */
  async uploadColorImage(productId, file, colorName) {
    const formData = new FormData()
    formData.append('color_name', colorName)
    formData.append('image', file)

    const response = await fetch(`/api/products/${productId}/upload-color-image`, {
      method: 'POST',
      body: formData,
    })

    const data = await parseResponse(response, 'Failed to upload color image')
    const colors = data.colors || {}
    const publicUrl =
      data.image_url ||
      data.url ||
      extractColorImageUrl(colors, colorName)

    return {
      publicUrl,
      colors,
      colorImages: colorsObjectToColorImages(colors),
    }
  },

  /**
   * POST /api/products/{id}/upload-video/
   * Body: video (file)
   * Response 202: { job_id, status: "processing" }
   */
  async initiateVideoUpload(productId, file) {
    const formData = new FormData()
    formData.append('video', file)

    const response = await fetch(`/api/products/${productId}/upload-video`, {
      method: 'POST',
      body: formData,
    })

    const data = await parseResponse(response, 'Failed to start video upload')

    if (!data.job_id) {
      throw new Error('Video upload accepted but no job_id was returned')
    }

    return {
      jobId: data.job_id,
      status: data.status || 'processing',
    }
  },

  /**
   * GET /api/products/upload-jobs/{job_id}/
   * Response: { id, status, result_url, error_message }
   */
  async getUploadJobStatus(jobId) {
    const response = await fetch(`/api/products/upload-jobs/${jobId}`)
    const data = await parseResponse(response, 'Failed to fetch upload job status')
    return {
      id: data.id || jobId,
      status: data.status,
      resultUrl: data.result_url,
      errorMessage: data.error_message,
    }
  },

  async pollVideoUpload(jobId, {
    intervalMs = 4000,
    maxAttempts = 60,
    onStatus,
  } = {}) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const job = await this.getUploadJobStatus(jobId)
      onStatus?.(job)

      if (job.status === 'completed') {
        if (!job.resultUrl) {
          throw new Error('Video upload completed but no result_url was returned')
        }
        return job.resultUrl
      }

      if (job.status === 'failed') {
        throw new Error(job.errorMessage || 'Video upload failed')
      }

      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs))
      }
    }

    throw new Error('Video upload timed out. Please try again.')
  },

  async uploadVideo(productId, file, options = {}) {
    const { jobId, status } = await this.initiateVideoUpload(productId, file)
    options.onInitiated?.({ jobId, status })
    return this.pollVideoUpload(jobId, options)
  },

  extractColorName(type, fallbackColorName = null) {
    if (fallbackColorName) {
      return fallbackColorName
    }
    if (!type || !type.startsWith('color-')) {
      return null
    }
    return type.replace(/^color-/, '').replace(/-/g, ' ')
  },

  async uploadPendingMedia(productId, pendingMedia = {}) {
    const result = {
      images: [],
      video_url: '',
      color_images: {},
      colors: {},
    }

    for (const file of pendingMedia.mainImages || []) {
      const upload = await this.uploadMainImage(productId, file)
      if (upload.publicUrl) {
        result.images = Array.from(new Set([...result.images, upload.publicUrl]))
      }
      if (upload.colors && Object.keys(upload.colors).length > 0) {
        result.colors = { ...result.colors, ...upload.colors }
      }
      if (upload.colorImages && Object.keys(upload.colorImages).length > 0) {
        result.color_images = { ...result.color_images, ...upload.colorImages }
      }
    }

    for (const [color, files] of Object.entries(pendingMedia.colorImages || {})) {
      for (const file of files) {
        const upload = await this.uploadColorImage(productId, file, color)
        if (upload.colors && Object.keys(upload.colors).length > 0) {
          result.colors = { ...result.colors, ...upload.colors }
          result.color_images = {
            ...result.color_images,
            ...upload.colorImages,
          }
        } else if (upload.publicUrl) {
          result.color_images[color] = [
            ...(result.color_images[color] || []),
            upload.publicUrl,
          ]
        }
      }
    }

    if (pendingMedia.video) {
      result.video_url = await this.uploadVideo(productId, pendingMedia.video, {
        onInitiated: pendingMedia.onVideoInitiated,
        onStatus: pendingMedia.onVideoStatus,
      })
    }

    return result
  },
}
