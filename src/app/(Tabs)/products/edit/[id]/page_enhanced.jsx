'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateProduct } from '@/hooks/useProducts'
import { FaArrowLeft, FaSave, FaInfoCircle, FaImage, FaVideo, FaTags, FaBox, FaShoppingCart, FaEye, FaCheckCircle, FaUpload, FaTrash, FaPlus, FaTimes } from 'react-icons/fa'
import { MainImageUpload, ColorImageUpload } from '@/components/ImageUpload'

export default function EditProductPage({ params }) {
  const router = useRouter()
  const { vendor } = useAuth()
  const createProductMutation = useCreateProduct()
  const [productId, setProductId] = useState(null)
  
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [imagePreview, setImagePreview] = useState('')
  
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
      if (data.categories) {
        setCategories(data.categories)
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
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/products')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <FaArrowLeft size={16} />
            Back to Products
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-2">Update your product information</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center gap-3 ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.number
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {currentStep > step.number ? (
                      <FaCheckCircle size={20} />
                    ) : (
                      <step.icon size={16} />
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div className={`text-sm font-medium ${
                      currentStep >= step.number ? 'text-emerald-600' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden md:block flex-1 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-emerald-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
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

                <div>
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

                <div>
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
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
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
                        onUploadComplete={(urls) => {
                          setFormData(prev => ({
                            ...prev,
                            images: [...prev.images, ...urls]
                          }))
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
                  
                  {/* Current Video */}
                  {formData.video_url && (
                    <div className="mb-4 p-3 bg-white rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaVideo className="text-red-500" />
                          <span className="text-sm font-medium">Video URL Added</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to remove the video?')) {
                              setFormData(prev => ({ ...prev, video_url: '' }))
                            }
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">{formData.video_url}</p>
                    </div>
                  )}

                  <input
                    type="url"
                    name="video_url"
                    value={formData.video_url}
                    onChange={handleInputChange}
                    placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Supported: YouTube, Vimeo, or direct video file URLs
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
                                onUploadComplete={(urls) => {
                                  urls.forEach(url => addColorImage(color, url))
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
                        <div><span className="font-medium">Price:</span> {formData.currency} {formData.price || '0.00'}</div>
                        <div><span className="font-medium">MRP:</span> {formData.currency} {formData.mrp || '0.00'}</div>
                        <div><span className="font-medium">Stock:</span> {formData.stock_quantity || '0'} units</div>
                        <div><span className="font-medium">Weight:</span> {formData.weight || '0'} kg</div>
                      </div>
                    </div>
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
                        <div className="p-2 bg-white rounded border text-sm">
                          <FaVideo className="inline mr-2 text-red-500" />
                          Video URL added
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
    </div>
  )
}
