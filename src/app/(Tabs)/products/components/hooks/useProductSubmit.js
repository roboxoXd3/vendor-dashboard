'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { imageCleanupService } from '@/services/imageCleanupService'

export const useProductSubmit = (vendor) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  const createProduct = async (formData) => {
    try {
      setLoading(true)
      setError(null)

      const productData = {
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
          height: parseFloat(formData.dimensions.height) || 0
        }
      }

      // Creating product with data

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: vendor.id,
          productData
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create product')
      }

      // Confirm all images as permanent (remove from temp tracking)
      imageCleanupService.confirmImages(formData.images)
      if (formData.video_url) {
        imageCleanupService.confirmImage(formData.video_url)
      }
      // Confirm color images
      Object.values(formData.color_images).forEach(images => {
        imageCleanupService.confirmImages(images)
      })
      
      // Product created successfully, all media confirmed as permanent
      
      return result.data
    } catch (err) {
      console.error('❌ Error creating product:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateProduct = async (productId, formData) => {
    try {
      setLoading(true)
      setError(null)

      const productData = {
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
          height: parseFloat(formData.dimensions.height) || 0
        }
      }

      // Updating product with data

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: productData
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update product')
      }

      // Confirm all images as permanent (remove from temp tracking)
      imageCleanupService.confirmImages(formData.images)
      if (formData.video_url) {
        imageCleanupService.confirmImage(formData.video_url)
      }
      // Confirm color images
      Object.values(formData.color_images).forEach(images => {
        imageCleanupService.confirmImages(images)
      })
      
      // Product updated successfully, all media confirmed as permanent
      
      return result.data
    } catch (err) {
      console.error('❌ Error updating product:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData, productId = null, onSuccess = null) => {
    try {
      let result
      if (productId) {
        result = await updateProduct(productId, formData)
        alert('Product updated successfully!')
      } else {
        result = await createProduct(formData)
        alert('Product created successfully!')
      }
      
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
    error,
    createProduct,
    updateProduct,
    handleSubmit
  }
}
