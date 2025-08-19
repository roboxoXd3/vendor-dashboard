'use client'
import { useState, useCallback } from 'react'

export const useProductForm = (initialData = {}) => {
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    subtitle: '',
    description: '',
    brand: '',
    sku: '',
    category_id: '',
    
    // Pricing & Inventory
    price: '',
    mrp: '',
    sale_price: '',
    currency: 'USD',
    stock_quantity: '',
    weight: '',
    
    // Media
    images: [],
    video_url: '',
    
    // Variants & Options
    sizes: [],
    colors: [],
    tags: [],
    color_images: {},
    dimensions: {
      length: '',
      width: '',
      height: '',
      unit: 'cm'
    },
    
    // Product Details
    box_contents: [],
    usage_instructions: [],
    care_instructions: [],
    safety_notes: [],
    
    // Settings
    is_featured: false,
    is_new_arrival: true,
    shipping_required: true,
    
    // Override with initial data
    ...initialData
  })

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    
    setFormData(prev => {
      // Handle nested object properties (e.g., dimensions.length)
      if (name.includes('.')) {
        const [parent, child] = name.split('.')
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : value
          }
        }
      }
      
      // Handle regular properties
      return {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }
    })
  }, [])

  const addToArray = useCallback((arrayKey, item) => {
    setFormData(prev => ({
      ...prev,
      [arrayKey]: [...prev[arrayKey], item]
    }))
  }, [])

  const removeFromArray = useCallback((arrayKey, item) => {
    setFormData(prev => ({
      ...prev,
      [arrayKey]: prev[arrayKey].filter(i => i !== item)
    }))
  }, [])

  const handleImageUploaded = useCallback((imageUrl) => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrl]
    }))
  }, [])

  const handleImageRemoved = useCallback((imageUrl) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageUrl)
    }))
  }, [])

  const handleVideoUploaded = useCallback((videoUrl) => {
    setFormData(prev => ({
      ...prev,
      video_url: videoUrl
    }))
  }, [])

  const handleVideoRemoved = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      video_url: ''
    }))
  }, [])

  const addColorImage = useCallback((color, imageUrl) => {
    if (!color || !imageUrl) return
    
    setFormData(prev => ({
      ...prev,
      color_images: {
        ...prev.color_images,
        [color]: [...(prev.color_images[color] || []), imageUrl]
      }
    }))
  }, [])

  const removeColorImage = useCallback((color, imageUrl) => {
    setFormData(prev => ({
      ...prev,
      color_images: {
        ...prev.color_images,
        [color]: (prev.color_images[color] || []).filter(img => img !== imageUrl)
      }
    }))
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      subtitle: '',
      description: '',
      brand: '',
      sku: '',
      category_id: '',
      price: '',
      mrp: '',
      sale_price: '',
      currency: 'USD',
      stock_quantity: '',
      weight: '',
      images: [],
      video_url: '',
      sizes: [],
      colors: [],
      tags: [],
      color_images: {},
      dimensions: {
        length: '',
        width: '',
        height: '',
        unit: 'cm'
      },
      box_contents: [],
      usage_instructions: [],
      care_instructions: [],
      safety_notes: [],
      is_featured: false,
      is_new_arrival: true,
      shipping_required: true
    })
  }, [])

  const updateFormData = useCallback((newData) => {
    setFormData(prev => ({
      ...prev,
      ...newData
    }))
  }, [])

  return {
    formData,
    setFormData,
    handleInputChange,
    addToArray,
    removeFromArray,
    handleImageUploaded,
    handleImageRemoved,
    handleVideoUploaded,
    handleVideoRemoved,
    addColorImage,
    removeColorImage,
    resetForm,
    updateFormData
  }
}
