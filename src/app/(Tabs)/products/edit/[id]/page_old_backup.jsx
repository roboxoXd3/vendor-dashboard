'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateProduct } from '@/hooks/useProducts'
import { FaArrowLeft, FaSave, FaInfoCircle, FaImage, FaVideo, FaTags, FaBox, FaShoppingCart, FaEye, FaCheckCircle, FaUpload, FaTrash, FaPlus, FaTimes, FaMobile } from 'react-icons/fa'
import { MainImageUpload, ColorImageUpload } from '@/components/ImageUpload'
import VideoUpload from '@/components/VideoUpload'
import ProductPreview from '@/components/ProductPreview'
import { imageCleanupService } from '@/services/imageCleanupService'

export default function EditProductPage({ params }) {
  const router = useRouter()
  const { vendor } = useAuth()
  const createProductMutation = useCreateProduct()
  const [productId, setProductId] = useState(null)
  
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [imagePreview, setImagePreview] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  // Mobile-only preview - no need for multiple modes
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  
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
    status: 'active',
    is_featured: false,
    is_new_arrival: false,
    shipping_required: true
  })

  // Input states for arrays
  const [newInputs, setNewInputs] = useState({
    size: '',
    color: '',
    tag: '',
    boxContent: '',
    usageInstruction: '',
    careInstruction: '',
    safetyNote: '',
    image: '',
    selectedColor: '',
    colorImage: '',
    showAddToColor: null
  })

  // Load product and categories on mount
  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params
      const id = resolvedParams.id
      setProductId(id)
      await Promise.all([fetchCategories(), loadProduct(id)])
    }
    loadData()
  }, [params])

  // Cleanup temporary images on component unmount
  useEffect(() => {
    return () => {
      // Clean up temporary images when leaving the page
      setTimeout(() => {
        imageCleanupService.cleanupTempImages()
      }, 1000)
    }
  }, [])

  const loadProduct = async (id) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${id}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load product')
      }
      
      const productData = result.data
      
      // Populate form with existing data
      setFormData({
        name: productData.name || '',
        subtitle: productData.subtitle || '',
        description: productData.description || '',
        brand: productData.brand || '',
        sku: productData.sku || '',
        category_id: productData.category_id || '',
        
        price: productData.price?.toString() || '',
        mrp: productData.mrp?.toString() || '',
        sale_price: productData.sale_price?.toString() || '',
        currency: productData.currency || 'USD',
        stock_quantity: productData.stock_quantity?.toString() || '',
        weight: productData.weight?.toString() || '',
        
        images: Array.isArray(productData.images) ? productData.images : 
                (typeof productData.images === 'string' ? productData.images.split(',').filter(Boolean) : []),
        video_url: productData.video_url || '',
        
        sizes: productData.sizes || [],
        colors: productData.colors || [],
        tags: productData.tags || [],
        color_images: productData.color_images || {},
        dimensions: productData.dimensions || {
          length: '',
          width: '',
          height: '',
          unit: 'cm'
        },
        
        box_contents: productData.box_contents || [],
        usage_instructions: productData.usage_instructions || [],
        care_instructions: productData.care_instructions || [],
        safety_notes: productData.safety_notes || [],
        
        status: productData.status || 'active',
        is_featured: productData.is_featured || false,
        is_new_arrival: productData.is_new_arrival || false,
        shipping_required: productData.shipping_required !== false
      })
      
    } catch (error) {
      console.error('Error loading product:', error)
      alert('Failed to load product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      console.log('📂 Categories API response:', data)
      if (data.categories) {
        console.log('📂 Setting categories:', data.categories)
        setCategories(data.categories)
      } else {
        console.log('📂 No categories found in response')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleNewInputChange = (key, value) => {
    setNewInputs(prev => ({ ...prev, [key]: value }))
  }

  const addToArray = (arrayKey, inputKey) => {
    const value = newInputs[inputKey]?.trim()
    if (value && !formData[arrayKey].includes(value)) {
      setFormData(prev => ({
        ...prev,
        [arrayKey]: [...prev[arrayKey], value]
      }))
      setNewInputs(prev => ({ ...prev, [inputKey]: '' }))
    }
  }

  const removeFromArray = (arrayKey, item) => {
    setFormData(prev => ({
      ...prev,
      [arrayKey]: prev[arrayKey].filter(i => i !== item)
    }))
  }

  // Video handling functions
  const handleVideoUploaded = (videoUrl) => {
    setFormData(prev => ({
      ...prev,
      video_url: videoUrl
    }))
  }

  const handleVideoRemoved = () => {
    setFormData(prev => ({
      ...prev,
      video_url: ''
    }))
  }

  const addColorImage = (color, imageUrl) => {
    if (!color || !imageUrl) return
    
    setFormData(prev => ({
      ...prev,
      color_images: {
        ...prev.color_images,
        [color]: [...(prev.color_images[color] || []), imageUrl]
      }
    }))
    setNewInputs(prev => ({ ...prev, colorImage: '', showAddToColor: null }))
  }

  const removeColorImage = (color, imageUrl) => {
    if (window.confirm('Are you sure you want to remove this image?')) {
      setFormData(prev => ({
        ...prev,
        color_images: {
          ...prev.color_images,
          [color]: prev.color_images[color]?.filter(img => img !== imageUrl) || []
        }
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!vendor?.id || !productId) {
      alert('Product or vendor information not found. Please try again.')
      return
    }

    setLoading(true)
    
    try {
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

      // Update product via API
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates: productData })
      })

      const result = await response.json()

      if (!response.ok) {
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
      
      console.log('✅ Product updated successfully, images confirmed as permanent')
      alert('Product updated successfully!')
      router.push('/products')
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Failed to update product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const InfoTooltip = ({ text }) => (
    <div className="group relative">
      <FaInfoCircle className="text-gray-400 hover:text-gray-600 cursor-help" size={14} />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {text}
      </div>
    </div>
  )

  const steps = [
    { number: 1, title: 'Basic Info', icon: FaInfoCircle, description: 'Product name, description, and category' },
    { number: 2, title: 'Pricing', icon: FaShoppingCart, description: 'Set product prices and inventory' },
    { number: 3, title: 'Media', icon: FaImage, description: 'Upload photos and videos' },
    { number: 4, title: 'Variants', icon: FaTags, description: 'Add sizes, colors, and tags' },
    { number: 5, title: 'Details', icon: FaBox, description: 'Package contents and instructions' },
    { number: 6, title: 'Review', icon: FaEye, description: 'Review and publish your product' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/products')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <FaArrowLeft size={16} />
            Back to Products
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600 mt-2">Update your product information</p>
            </div>
            
            {/* Preview Toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  // On large screens, toggle side preview
                  if (window.innerWidth >= 1024) {
                    setShowPreview(!showPreview)
                  } else {
                    // On mobile, show modal preview
                    setShowMobilePreview(true)
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium ${showPreview ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border'}`}
              >
                <span className="hidden lg:inline">{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                <span className="lg:hidden">Preview</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className={`flex gap-8 ${showPreview ? '' : 'justify-center'}`}>
          {/* Form Section */}
          <div className={`${showPreview ? 'flex-1' : 'max-w-4xl'}`}>

        {/* Clean Progress Steps */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* Steps Container */}
            <div className="relative">
              {/* Background Progress Line */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200"></div>
              
              {/* Active Progress Line */}
              <div 
                className="absolute top-6 left-0 h-0.5 bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              ></div>
              
              {/* Steps */}
              <div className="relative flex justify-between">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex flex-col items-center">
                    {/* Step Circle */}
                    <div className={`
                      relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 bg-white
                      ${currentStep >= step.number
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-gray-300 text-gray-400'
                      }
                    `}>
                      {currentStep > step.number ? (
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                          <FaCheckCircle size={18} className="text-white" />
                        </div>
                      ) : (
                        <step.icon size={16} />
                      )}
                    </div>
                    
                    {/* Step Info */}
                    <div className="mt-3 text-center max-w-[100px]">
                      <div className={`
                        text-sm font-medium transition-colors duration-300
                        ${currentStep >= step.number 
                          ? 'text-emerald-600' 
                          : 'text-gray-500'
                        }
                      `}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {step.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Current Step Indicator */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Step {currentStep} of {steps.length}: {steps.find(s => s.number === currentStep)?.title}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {Math.round((currentStep / steps.length) * 100)}% Complete
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaInfoCircle className="text-blue-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                  <p className="text-gray-600 text-sm">Enter the basic details about your product</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                    <InfoTooltip text="Choose a clear, descriptive name for your product" />
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter product name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Subtitle
                    <InfoTooltip text="A short tagline or key feature highlight" />
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter product subtitle"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                    <InfoTooltip text="Detailed description of your product features and benefits" />
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Describe your product in detail..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                    <InfoTooltip text="The brand or manufacturer of this product" />
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter brand name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU
                    <InfoTooltip text="Stock Keeping Unit - unique identifier for inventory tracking" />
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter SKU"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                    <InfoTooltip text="Select the most appropriate category for your product" />
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select a category</option>
                    {categories.length > 0 ? (
                      categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>Loading categories...</option>
                    )}
                  </select>
                  {/* Debug info */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-500 mt-1">
                      Debug: {categories.length} categories loaded
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                >
                  Next: Pricing →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Pricing & Inventory */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FaShoppingCart className="text-green-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Pricing & Inventory</h2>
                  <p className="text-gray-600 text-sm">Set your product pricing and stock information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selling Price *
                    <InfoTooltip text="The price customers will pay for this product" />
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MRP (Maximum Retail Price)
                    <InfoTooltip text="The original price before any discounts" />
                  </label>
                  <input
                    type="number"
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sale Price
                    <InfoTooltip text="Special promotional price (optional)" />
                  </label>
                  <input
                    type="number"
                    name="sale_price"
                    value={formData.sale_price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                    <InfoTooltip text="The currency for pricing" />
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                    <InfoTooltip text="Number of units available for sale" />
                  </label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg)
                    <InfoTooltip text="Product weight for shipping calculations" />
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                >
                  Next: Media →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Media & Videos */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FaImage className="text-purple-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Media & Videos</h2>
                  <p className="text-gray-600 text-sm">Upload photos and videos of your product</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Main Images Upload */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaImage className="text-blue-600" />
                    Product Images
                    <div className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      <FaInfoCircle className="inline mr-1" />
                      Upload high-quality images to showcase your product
                    </div>
                  </h3>
                  
                  {/* Current Images */}
                  {formData.images.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images ({formData.images.length})</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Product ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                              onError={(e) => {
                                e.target.src = '/placeholder-image.png'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to remove this image?')) {
                                  setFormData(prev => ({
                                    ...prev,
                                    images: prev.images.filter((_, i) => i !== index)
                                  }))
                                }
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FaTrash size={10} />
                            </button>
                            {index === 0 && (
                              <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                Main
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Options */}
                  <div className="space-y-4">
                    {/* File Upload */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FaUpload className="text-emerald-600" />
                        Upload from Device
                      </h4>
                      <MainImageUpload
                        onUploadSuccess={(urls) => {
                          console.log('Images uploaded successfully:', urls)
                          setFormData(prev => ({
                            ...prev,
                            images: [...prev.images, ...(Array.isArray(urls) ? urls : [urls])]
                          }))
                        }}
                        onUploadError={(error) => {
                          console.error('Image upload error:', error)
                          alert('Failed to upload image: ' + error)
                        }}
                        vendorId={vendor?.id}
                        productId="temp"
                        multiple={true}
                      />
                    </div>

                    {/* URL Input */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Add Image URL</h4>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newInputs.image}
                          onChange={(e) => handleNewInputChange('image', e.target.value)}
                          placeholder="Enter image URL (https://...)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => addToArray('images', 'image')}
                          disabled={!newInputs.image.trim()}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add URL
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Video */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaVideo className="text-red-600" />
                    Product Video
                    <div className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      <FaInfoCircle className="inline mr-1" />
                      Optional: Add a video to showcase your product in action
                    </div>
                  </h3>
                  
                  {/* Video Upload Component */}
                  <VideoUpload
                    onVideoUploaded={handleVideoUploaded}
                    onVideoRemoved={handleVideoRemoved}
                    existingVideoUrl={formData.video_url}
                    vendorId={vendor?.id}
                    productId={productId} // Use the current product ID for editing
                  />

                  {/* Alternative: Manual Video URL Input */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or enter video URL manually
                    </label>
                    <input
                      type="url"
                      name="video_url"
                      value={formData.video_url}
                      onChange={handleInputChange}
                      placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported: Upload video files (max 5MB) or enter YouTube, Vimeo URLs
                  </p>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                >
                  Next: Variants →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Variants & Options */}
          {currentStep === 4 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FaTags className="text-orange-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Variants & Options</h2>
                  <p className="text-gray-600 text-sm">Add sizes, colors, and tags for your product</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Sizes */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaTags className="text-blue-600" />
                    Available Sizes
                    <InfoTooltip text="Add different size options for your product" />
                  </h3>
                  
                  {formData.sizes.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {formData.sizes.map((size, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {size}
                            <button
                              type="button"
                              onClick={() => removeFromArray('sizes', size)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FaTimes size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInputs.size}
                      onChange={(e) => handleNewInputChange('size', e.target.value)}
                      placeholder="Enter size (e.g., S, M, L, XL)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => addToArray('sizes', 'size')}
                      disabled={!newInputs.size.trim()}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaPlus size={14} />
                    </button>
                  </div>
                </div>

                {/* Colors */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaTags className="text-purple-600" />
                    Available Colors
                    <InfoTooltip text="Add different color options for your product" />
                  </h3>
                  
                  {formData.colors.length > 0 && (
                    <div className="mb-4 space-y-3">
                      {formData.colors.map((color, index) => (
                        <div key={index} className="p-3 bg-white rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                              {color}
                              <button
                                type="button"
                                onClick={() => removeFromArray('colors', color)}
                                className="text-purple-600 hover:text-purple-800"
                              >
                                <FaTimes size={12} />
                              </button>
                            </span>
                            <button
                              type="button"
                              onClick={() => setNewInputs(prev => ({ 
                                ...prev, 
                                showAddToColor: prev.showAddToColor === color ? null : color 
                              }))}
                              className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                            >
                              <FaImage size={12} />
                              Add Images
                            </button>
                          </div>
                          
                          {/* Color Images */}
                          {formData.color_images[color] && formData.color_images[color].length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mb-2">
                              {formData.color_images[color].map((image, imgIndex) => (
                                <div key={imgIndex} className="relative group">
                                  <img
                                    src={image}
                                    alt={`${color} ${imgIndex + 1}`}
                                    className="w-full h-16 object-cover rounded border"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeColorImage(color, image)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <FaTimes size={8} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Image to Color */}
                          {newInputs.showAddToColor === color && (
                            <div className="space-y-2">
                              <ColorImageUpload
                                onUploadSuccess={(urls) => {
                                  console.log('Color images uploaded successfully:', urls)
                                  const urlArray = Array.isArray(urls) ? urls : [urls]
                                  urlArray.forEach(url => addColorImage(color, url))
                                }}
                                onUploadError={(error) => {
                                  console.error('Color image upload error:', error)
                                  alert('Failed to upload color image: ' + error)
                                }}
                                vendorId={vendor?.id}
                                productId="temp"
                                color={color}
                              />
                              <div className="flex gap-2">
                                <input
                                  type="url"
                                  value={newInputs.colorImage}
                                  onChange={(e) => handleNewInputChange('colorImage', e.target.value)}
                                  placeholder="Or enter image URL"
                                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (newInputs.colorImage.trim()) {
                                      addColorImage(color, newInputs.colorImage.trim())
                                    }
                                  }}
                                  disabled={!newInputs.colorImage.trim()}
                                  className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInputs.color}
                      onChange={(e) => handleNewInputChange('color', e.target.value)}
                      placeholder="Enter color (e.g., Red, Blue, Black)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => addToArray('colors', 'color')}
                      disabled={!newInputs.color.trim()}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaPlus size={14} />
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaTags className="text-green-600" />
                    Product Tags
                    <InfoTooltip text="Add tags to help customers find your product" />
                  </h3>
                  
                  {formData.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeFromArray('tags', tag)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <FaTimes size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInputs.tag}
                      onChange={(e) => handleNewInputChange('tag', e.target.value)}
                      placeholder="Enter tag (e.g., trending, bestseller)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => addToArray('tags', 'tag')}
                      disabled={!newInputs.tag.trim()}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaPlus size={14} />
                    </button>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaBox className="text-indigo-600" />
                    Product Dimensions
                    <InfoTooltip text="Physical dimensions for shipping calculations" />
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
                      <input
                        type="number"
                        value={formData.dimensions.length}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          dimensions: { ...prev.dimensions, length: e.target.value }
                        }))}
                        min="0"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                      <input
                        type="number"
                        value={formData.dimensions.width}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          dimensions: { ...prev.dimensions, width: e.target.value }
                        }))}
                        min="0"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                      <input
                        type="number"
                        value={formData.dimensions.height}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          dimensions: { ...prev.dimensions, height: e.target.value }
                        }))}
                        min="0"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <select
                      value={formData.dimensions.unit}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        dimensions: { ...prev.dimensions, unit: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="cm">Centimeters (cm)</option>
                      <option value="in">Inches (in)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                >
                  Next: Details →
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Product Details */}
          {currentStep === 5 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FaBox className="text-indigo-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Product Details</h2>
                  <p className="text-gray-600 text-sm">Package contents and instructions</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Box Contents */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaBox className="text-brown-600" />
                    What's in the Box
                    <InfoTooltip text="List all items included with the product" />
                  </h3>
                  
                  {formData.box_contents.length > 0 && (
                    <div className="mb-4">
                      <ul className="space-y-2">
                        {formData.box_contents.map((item, index) => (
                          <li key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm">• {item}</span>
                            <button
                              type="button"
                              onClick={() => removeFromArray('box_contents', item)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTimes size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInputs.boxContent}
                      onChange={(e) => handleNewInputChange('boxContent', e.target.value)}
                      placeholder="Enter box content item"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => addToArray('box_contents', 'boxContent')}
                      disabled={!newInputs.boxContent.trim()}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaPlus size={14} />
                    </button>
                  </div>
                </div>

                {/* Usage Instructions */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaInfoCircle className="text-blue-600" />
                    Usage Instructions
                    <InfoTooltip text="Step-by-step instructions on how to use the product" />
                  </h3>
                  
                  {formData.usage_instructions.length > 0 && (
                    <div className="mb-4">
                      <ol className="space-y-2">
                        {formData.usage_instructions.map((instruction, index) => (
                          <li key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm">{index + 1}. {instruction}</span>
                            <button
                              type="button"
                              onClick={() => removeFromArray('usage_instructions', instruction)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTimes size={12} />
                            </button>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInputs.usageInstruction}
                      onChange={(e) => handleNewInputChange('usageInstruction', e.target.value)}
                      placeholder="Enter usage instruction"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => addToArray('usage_instructions', 'usageInstruction')}
                      disabled={!newInputs.usageInstruction.trim()}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaPlus size={14} />
                    </button>
                  </div>
                </div>

                {/* Care Instructions */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaInfoCircle className="text-green-600" />
                    Care Instructions
                    <InfoTooltip text="How to maintain and care for the product" />
                  </h3>
                  
                  {formData.care_instructions.length > 0 && (
                    <div className="mb-4">
                      <ul className="space-y-2">
                        {formData.care_instructions.map((instruction, index) => (
                          <li key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm">• {instruction}</span>
                            <button
                              type="button"
                              onClick={() => removeFromArray('care_instructions', instruction)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTimes size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInputs.careInstruction}
                      onChange={(e) => handleNewInputChange('careInstruction', e.target.value)}
                      placeholder="Enter care instruction"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => addToArray('care_instructions', 'careInstruction')}
                      disabled={!newInputs.careInstruction.trim()}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaPlus size={14} />
                    </button>
                  </div>
                </div>

                {/* Safety Notes */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaInfoCircle className="text-red-600" />
                    Safety Notes
                    <InfoTooltip text="Important safety information and warnings" />
                  </h3>
                  
                  {formData.safety_notes.length > 0 && (
                    <div className="mb-4">
                      <ul className="space-y-2">
                        {formData.safety_notes.map((note, index) => (
                          <li key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm">⚠️ {note}</span>
                            <button
                              type="button"
                              onClick={() => removeFromArray('safety_notes', note)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTimes size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInputs.safetyNote}
                      onChange={(e) => handleNewInputChange('safetyNote', e.target.value)}
                      placeholder="Enter safety note"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => addToArray('safety_notes', 'safetyNote')}
                      disabled={!newInputs.safetyNote.trim()}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaPlus size={14} />
                    </button>
                  </div>
                </div>

                {/* Product Settings */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Featured Product</label>
                        <p className="text-xs text-gray-500">Show this product in featured sections</p>
                      </div>
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">New Arrival</label>
                        <p className="text-xs text-gray-500">Mark as a new product</p>
                      </div>
                      <input
                        type="checkbox"
                        name="is_new_arrival"
                        checked={formData.is_new_arrival}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Shipping Required</label>
                        <p className="text-xs text-gray-500">This product requires physical shipping</p>
                      </div>
                      <input
                        type="checkbox"
                        name="shipping_required"
                        checked={formData.shipping_required}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(6)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                >
                  Next: Review →
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Review & Publish */}
          {currentStep === 6 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FaEye className="text-green-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Review & Publish</h2>
                  <p className="text-gray-600 text-sm">Review your product details before publishing</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Product Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Summary</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Basic Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Name:</span> {formData.name || 'Not specified'}</div>
                        <div><span className="font-medium">Subtitle:</span> {formData.subtitle || 'Not specified'}</div>
                        <div><span className="font-medium">Brand:</span> {formData.brand || 'Not specified'}</div>
                        <div><span className="font-medium">SKU:</span> {formData.sku || 'Not specified'}</div>
                        <div><span className="font-medium">Category:</span> {
                          categories.find(cat => cat.id === formData.category_id)?.name || 'Not selected'
                        }</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Pricing & Inventory</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Selling Price:</span> {formData.currency} {formData.price || 'Not set'}</div>
                        <div><span className="font-medium">MRP:</span> {formData.mrp ? `${formData.currency} ${formData.mrp}` : 'Not set'}</div>
                        <div><span className="font-medium">Sale Price:</span> {formData.sale_price ? `${formData.currency} ${formData.sale_price}` : 'Not set'}</div>
                        <div><span className="font-medium">Stock:</span> {formData.stock_quantity || '0'} units</div>
                        <div><span className="font-medium">Weight:</span> {formData.weight ? `${formData.weight} kg` : 'Not specified'}</div>
                        <div><span className="font-medium">Dimensions:</span> {
                          formData.dimensions.length || formData.dimensions.width || formData.dimensions.height ? 
                          `${formData.dimensions.length || 0} × ${formData.dimensions.width || 0} × ${formData.dimensions.height || 0} ${formData.dimensions.unit || 'cm'}` : 
                          'Not specified'
                        }</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                  <div className="text-sm text-gray-700">
                    {formData.description ? (
                      <p className="leading-relaxed">{formData.description}</p>
                    ) : (
                      <p className="text-gray-500 italic">No description provided</p>
                    )}
                  </div>
                </div>

                {/* Media Preview */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Media</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Images ({formData.images.length})</h4>
                      {formData.images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {formData.images.slice(0, 6).map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Product ${index + 1}`}
                              className="w-full h-16 object-cover rounded border"
                            />
                          ))}
                          {formData.images.length > 6 && (
                            <div className="w-full h-16 bg-gray-200 rounded border flex items-center justify-center text-xs text-gray-600">
                              +{formData.images.length - 6} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No images added</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Video</h4>
                      {formData.video_url ? (
                        <div className="space-y-2">
                          <div className="p-2 bg-white rounded border text-sm">
                            <FaVideo className="inline mr-2 text-red-500" />
                            Video added
                          </div>
                          <div className="text-xs text-gray-600 break-all">
                            <span className="font-medium">URL:</span> {formData.video_url}
                          </div>
                          {formData.video_url.includes('supabase') && (
                            <div className="text-xs text-green-600">
                              ✓ Uploaded to storage
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No video added</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Variants & Options */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Variants & Options</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Sizes ({formData.sizes.length})</h4>
                      {formData.sizes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {formData.sizes.map((size, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {size}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No sizes added</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Colors ({formData.colors.length})</h4>
                      {formData.colors.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {formData.colors.map((color, index) => (
                            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                              {color}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No colors added</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Tags ({formData.tags.length})</h4>
                      {formData.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {formData.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No tags added</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Box Contents ({formData.box_contents.length})</h4>
                      {formData.box_contents.length > 0 ? (
                        <ul className="text-sm space-y-1">
                          {formData.box_contents.slice(0, 3).map((item, index) => (
                            <li key={index}>• {item}</li>
                          ))}
                          {formData.box_contents.length > 3 && (
                            <li className="text-gray-500">... and {formData.box_contents.length - 3} more items</li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No box contents specified</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Instructions</h4>
                      <div className="text-sm space-y-1">
                        <div>Usage: {formData.usage_instructions.length} items</div>
                        <div>Care: {formData.care_instructions.length} items</div>
                        <div>Safety: {formData.safety_notes.length} items</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className={`px-3 py-1 rounded-full ${formData.is_featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                      {formData.is_featured ? '⭐ Featured' : 'Not Featured'}
                    </div>
                    <div className={`px-3 py-1 rounded-full ${formData.is_new_arrival ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                      {formData.is_new_arrival ? '🆕 New Arrival' : 'Regular Product'}
                    </div>
                    <div className={`px-3 py-1 rounded-full ${formData.shipping_required ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {formData.shipping_required ? '📦 Shipping Required' : 'No Shipping'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating Product...
                    </>
                  ) : (
                    <>
                      <FaSave size={16} />
                      Update Product
                    </>
                  )}
                </button>
              </div>
            </div>
                      )}
          </form>
          </div>
          
          {/* Preview Panel */}
          {showPreview && (
            <div className="w-96 flex-shrink-0 hidden lg:block">
              <div className="sticky top-8 space-y-4">
                {/* Preview Header */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                      <FaMobile size={14} />
                      <span className="text-sm font-medium">Mobile Preview</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    How your product will appear in the mobile app
                  </p>
                </div>
                
                {/* Preview Content */}
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4">
                  <ProductPreview formData={formData} categories={categories} vendor={vendor} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Preview Modal */}
      {showMobilePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 lg:hidden">
          <div className="bg-white rounded-lg max-w-sm w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <FaMobile size={16} className="text-emerald-600" />
                <h3 className="text-lg font-semibold">Mobile Preview</h3>
              </div>
              <button
                onClick={() => setShowMobilePreview(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={16} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-4">
              <ProductPreview formData={formData} categories={categories} vendor={vendor} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
