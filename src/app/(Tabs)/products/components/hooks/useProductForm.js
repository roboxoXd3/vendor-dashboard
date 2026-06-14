'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import currencyService from '@/services/currencyService'
import { mergeColorEntries } from '@/lib/product-colors'

function isBlobUrl(url) {
  return typeof url === 'string' && url.startsWith('blob:')
}

export const useProductForm = (initialData = {}) => {
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    subtitle: '',
    description: '',
    brand: '',
    sku: '',
    category_id: '',
    subcategory_id: '',
    
    // Pricing & Inventory
    price: '',
    mrp: '',
    sale_price: '',
    currency: 'NGN',
    base_currency: 'NGN',
    converted_prices: {},
    stock_quantity: '',
    weight: '',
    
    // Media
    images: [],
    video_url: '',
    
    // Variants & Options
    sizes: [],
    colors: {},
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
    cod_allowed: false,
    
    // Size Chart Settings
    size_chart_override: 'auto',
    size_chart_template_id: '',
    size_guide_type: 'template',
    custom_size_chart_data: null,
    
    // Override with initial data
    ...initialData
  })

  // Currency-related state
  const [supportedCurrencies, setSupportedCurrencies] = useState([])
  const [exchangeRates, setExchangeRates] = useState({})
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false)
  const [currencyError, setCurrencyError] = useState(null)

  const pendingMediaRef = useRef({
    mainImages: [],
    colorImages: {},
    video: null,
    previewMap: new Map(),
  })

  const addPendingFile = useCallback((file, { type, colorName, previewUrl }) => {
    if (type === 'main' || type === 'images') {
      pendingMediaRef.current.mainImages.push(file)
    } else if (colorName) {
      if (!pendingMediaRef.current.colorImages[colorName]) {
        pendingMediaRef.current.colorImages[colorName] = []
      }
      pendingMediaRef.current.colorImages[colorName].push(file)
    }
    pendingMediaRef.current.previewMap.set(previewUrl, { file, type, colorName })
  }, [])

  const removePendingFile = useCallback((previewUrl, { colorName } = {}) => {
    const entry = pendingMediaRef.current.previewMap.get(previewUrl)
    if (!entry) return

    if (entry.type === 'main' || entry.type === 'images') {
      pendingMediaRef.current.mainImages = pendingMediaRef.current.mainImages.filter(
        (file) => file !== entry.file
      )
    } else if (entry.colorName || colorName) {
      const color = entry.colorName || colorName
      pendingMediaRef.current.colorImages[color] = (
        pendingMediaRef.current.colorImages[color] || []
      ).filter((file) => file !== entry.file)
    }

    pendingMediaRef.current.previewMap.delete(previewUrl)
  }, [])

  const addPendingVideo = useCallback((file, previewUrl) => {
    pendingMediaRef.current.video = file
    pendingMediaRef.current.previewMap.set(previewUrl, { file, type: 'video' })
  }, [])

  const removePendingVideo = useCallback((previewUrl) => {
    const entry = pendingMediaRef.current.previewMap.get(previewUrl)
    if (entry?.file === pendingMediaRef.current.video) {
      pendingMediaRef.current.video = null
    }
    pendingMediaRef.current.previewMap.delete(previewUrl)
  }, [])

  const getPendingMedia = useCallback(() => ({
    mainImages: [...pendingMediaRef.current.mainImages],
    colorImages: Object.fromEntries(
      Object.entries(pendingMediaRef.current.colorImages).map(([color, files]) => [color, [...files]])
    ),
    video: pendingMediaRef.current.video,
  }), [])

  const clearPendingMedia = useCallback(() => {
    pendingMediaRef.current = {
      mainImages: [],
      colorImages: {},
      video: null,
      previewMap: new Map(),
    }
  }, [])

  const sanitizeMediaFields = useCallback((data) => ({
    ...data,
    images: (data.images || []).filter((url) => !isBlobUrl(url)),
    video_url: isBlobUrl(data.video_url) ? '' : (data.video_url || ''),
    color_images: Object.fromEntries(
      Object.entries(data.color_images || {}).map(([color, urls]) => [
        color,
        (urls || []).filter((url) => !isBlobUrl(url)),
      ])
    ),
  }), [])

  // Load currency data on mount
  useEffect(() => {
    loadCurrencyData()
  }, [])

  const loadCurrencyData = async () => {
    setIsLoadingCurrencies(true)
    setCurrencyError(null)
    
    try {
      const data = await currencyService.getCurrencyData()
      setSupportedCurrencies(data.currencies)
      setExchangeRates(data.rates)
    } catch (error) {
      console.error('Error loading currency data:', error)
      setCurrencyError('Failed to load currency data')
    } finally {
      setIsLoadingCurrencies(false)
    }
  }

  // Convert prices when currency changes
  const convertPrices = useCallback(async (newCurrency, fromCurrency) => {
    // Don't convert if no price is set
    if (!formData.price) return
    
    // Don't convert if it's the same currency
    if (newCurrency === fromCurrency) return

    try {
      const prices = {
        price: parseFloat(formData.price) || 0,
        mrp: parseFloat(formData.mrp) || 0,
        sale_price: parseFloat(formData.sale_price) || 0
      }

      const convertedPrices = await currencyService.convertProductPrices(
        null, // No productId for preview
        prices,
        fromCurrency,
        [newCurrency]
      )

      if (convertedPrices[newCurrency]) {
        setFormData(prev => ({
          ...prev,
          price: convertedPrices[newCurrency].price?.toString() || prev.price,
          mrp: convertedPrices[newCurrency].mrp?.toString() || prev.mrp,
          sale_price: convertedPrices[newCurrency].sale_price?.toString() || prev.sale_price,
          converted_prices: convertedPrices
        }))
      }
    } catch (error) {
      console.error('Error converting prices:', error)
      // Currency is already updated in the UI, so we don't need to do anything here
      // The user will see the currency change but prices won't convert
    }
  }, [formData.price, formData.mrp, formData.sale_price])

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    
    // Handle currency change with immediate UI update
    if (name === 'currency' && value !== formData.currency) {
      const oldCurrency = formData.currency
      
      // Immediately update the currency in the UI
      setFormData(prev => ({
        ...prev,
        currency: value
      }))
      
      // Then trigger price conversion in the background
      convertPrices(value, oldCurrency)
      return
    }
    
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
  }, [formData.currency, convertPrices])

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

  const handleImageUploaded = useCallback((imageUrl, meta = null) => {
    if (!imageUrl) return

    setFormData((prev) => ({
      ...prev,
      colors: meta?.colors ? mergeColorEntries(prev.colors, meta.colors) : prev.colors,
      images: [...prev.images, imageUrl],
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

  const addColorImage = useCallback((color, imageUrl, apiColors = null) => {
    if (!color || !imageUrl) return

    setFormData((prev) => ({
      ...prev,
      colors: apiColors ? mergeColorEntries(prev.colors, apiColors) : prev.colors,
      color_images: {
        ...prev.color_images,
        [color]: [...(prev.color_images[color] || []), imageUrl],
      },
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
      subcategory_id: '',
      price: '',
      mrp: '',
      sale_price: '',
      currency: 'NGN',
      stock_quantity: '',
      weight: '',
      images: [],
      video_url: '',
      sizes: [],
      colors: {},
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
      shipping_required: true,
      cod_allowed: false
    })
  }, [])

  const updateFormData = useCallback((newData) => {
    setFormData(prev => ({
      ...prev,
      ...newData
    }))
  }, [])

  // Calculate stock quantity from colors
  const calculateStockQuantity = useCallback((colors) => {
    if (!colors || typeof colors !== 'object') return 0
    
    return Object.values(colors).reduce((total, colorData) => {
      if (typeof colorData === 'object') {
        // New format with sizes
        if (colorData.sizes && typeof colorData.sizes === 'object') {
          return total + Object.values(colorData.sizes).reduce((sizeTotal, qty) => sizeTotal + (qty || 0), 0)
        }
        // Old format with quantity (for backward compatibility)
        if (typeof colorData.quantity === 'number') {
          return total + colorData.quantity
        }
      }
      return total
    }, 0)
  }, [])

  // Update stock quantity when colors change
  useEffect(() => {
    const totalStock = calculateStockQuantity(formData.colors)
    setFormData(prev => ({
      ...prev,
      stock_quantity: totalStock
    }))
  }, [formData.colors, calculateStockQuantity])

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
    updateFormData,
    // Currency-related
    supportedCurrencies,
    exchangeRates,
    isLoadingCurrencies,
    currencyError,
    convertPrices,
    loadCurrencyData,
    addPendingFile,
    removePendingFile,
    addPendingVideo,
    removePendingVideo,
    getPendingMedia,
    clearPendingMedia,
    sanitizeMediaFields,
  }
}
