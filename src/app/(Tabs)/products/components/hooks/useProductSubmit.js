'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { productKeys } from '@/hooks/useProducts'
import { productMediaService } from '@/services/productMediaService'
import { mergeColorEntries } from '@/lib/product-colors'

function stripMediaFields(data) {
  const {
    images: _images,
    video_url: _videoUrl,
    color_images: _colorImages,
    ...rest
  } = data
  return rest
}

function hasPendingMedia(pendingMedia) {
  if (!pendingMedia) return false
  const hasMain = (pendingMedia.mainImages || []).length > 0
  const hasVideo = !!pendingMedia.video
  const hasColor = Object.values(pendingMedia.colorImages || {}).some((files) => files.length > 0)
  return hasMain || hasVideo || hasColor
}

function mergeUploadedMedia(baseData, uploadedMedia) {
  const mergedColorImages = { ...(baseData.color_images || {}) }

  if (uploadedMedia.color_images && Object.keys(uploadedMedia.color_images).length > 0) {
    Object.assign(mergedColorImages, uploadedMedia.color_images)
  }

  return {
    images: uploadedMedia.images?.length
      ? Array.from(new Set([...(baseData.images || []), ...uploadedMedia.images]))
      : (baseData.images || []),
    video_url: uploadedMedia.video_url || baseData.video_url || '',
    color_images: mergedColorImages,
    colors:
      uploadedMedia.colors && Object.keys(uploadedMedia.colors).length > 0
        ? mergeColorEntries(baseData.colors, uploadedMedia.colors)
        : baseData.colors,
  }
}

export const useProductSubmit = (vendor) => {
  const [loading, setLoading] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()
  const queryClient = useQueryClient()

  const buildProductPayload = (formData) => ({
    ...formData,
    vendor_id: vendor.id,
    price: parseFloat(formData.price) || 0,
    mrp: parseFloat(formData.mrp) || 0,
    sale_price: parseFloat(formData.sale_price) || 0,
    stock_quantity: parseInt(formData.stock_quantity) || 0,
    weight: parseFloat(formData.weight) || 0,
    dimensions: {
      ...formData.dimensions,
      length: parseFloat(formData.dimensions.length) || 0,
      width: parseFloat(formData.dimensions.width) || 0,
      height: parseFloat(formData.dimensions.height) || 0,
    },
  })

  const createProduct = async (formData, pendingMedia = null, sanitizeMediaFields = null) => {
    try {
      if (!vendor?.id) {
        throw new Error('Your vendor profile is still loading. Please wait a moment and try again.')
      }

      setLoading(true)
      setError(null)

      const sanitizedFormData = sanitizeMediaFields
        ? sanitizeMediaFields(formData)
        : formData
      const productData = buildProductPayload(stripMediaFields(sanitizedFormData))

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: vendor.id,
          productData,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        const message = result.message || result.error || 'Failed to create product'
        throw new Error(message)
      }

      let finalData = result.data

      if (result.warning) {
        console.warn('⚠️ Product create warning:', result.warning)
      }

      if (hasPendingMedia(pendingMedia)) {
        setUploadingMedia(true)
        try {
          const uploadedMedia = await productMediaService.uploadPendingMedia(
            finalData.id,
            pendingMedia
          )
          const mergedMedia = mergeUploadedMedia(sanitizedFormData, uploadedMedia)

          const updateResponse = await fetch(`/api/products/${finalData.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              updates: {
                ...productData,
                ...mergedMedia,
              },
            }),
          })

          const updateResult = await updateResponse.json()
          if (!updateResponse.ok || !updateResult.success) {
            throw new Error(updateResult.error || 'Product created but media upload update failed')
          }

          finalData = updateResult.data
        } finally {
          setUploadingMedia(false)
        }
      }

      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      return finalData
    } catch (err) {
      console.error('❌ Error creating product:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateProduct = async (productId, formData, pendingMedia = null, sanitizeMediaFields = null) => {
    try {
      if (!vendor?.id) {
        throw new Error('Your vendor profile is still loading. Please wait a moment and try again.')
      }

      setLoading(true)
      setError(null)

      const sanitizedFormData = sanitizeMediaFields
        ? sanitizeMediaFields(formData)
        : formData

      if (hasPendingMedia(pendingMedia)) {
        setUploadingMedia(true)
        try {
          const uploadedMedia = await productMediaService.uploadPendingMedia(
            productId,
            pendingMedia
          )
          const mergedMedia = mergeUploadedMedia(sanitizedFormData, uploadedMedia)
          sanitizedFormData.images = mergedMedia.images
          sanitizedFormData.video_url = mergedMedia.video_url
          sanitizedFormData.color_images = mergedMedia.color_images
          sanitizedFormData.colors = mergedMedia.colors
        } finally {
          setUploadingMedia(false)
        }
      }

      const productData = buildProductPayload(sanitizedFormData)

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: productData,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update product')
      }

      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) })
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })

      return result.data
    } catch (err) {
      console.error('❌ Error updating product:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (
    formData,
    productId = null,
    onSuccess = null,
    pendingMedia = null,
    sanitizeMediaFields = null,
    clearPendingMedia = null
  ) => {
    try {
      let result
      if (productId) {
        result = await updateProduct(productId, formData, pendingMedia, sanitizeMediaFields)
        alert('Product updated successfully!')
      } else {
        result = await createProduct(formData, pendingMedia, sanitizeMediaFields)
        const hasMedia = hasPendingMedia(pendingMedia)
        alert(
          hasMedia
            ? 'Product created successfully with images and video uploaded to R2!'
            : 'Product created successfully!'
        )
      }

      clearPendingMedia?.()

      if (onSuccess) {
        onSuccess(result)
      } else {
        router.push('/products')
      }

      return result
    } catch (err) {
      alert(`Error: ${err.message}`)
      throw err
    }
  }

  return {
    loading,
    uploadingMedia,
    error,
    createProduct,
    updateProduct,
    handleSubmit,
  }
}
