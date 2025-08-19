'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useUpdateProduct } from '@/hooks/useProducts'
import { FaArrowLeft, FaSave, FaInfoCircle, FaImage, FaVideo, FaTags, FaBox, FaShoppingCart, FaEye, FaCheckCircle } from 'react-icons/fa'
import { productsService } from '@/services/productsService'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const { vendor } = useAuth()
  const updateProductMutation = useUpdateProduct()
  
  const [product, setProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(true)
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
    
    // Pricing
    price: '',
    mrp: '',
    sale_price: '',
    currency: 'USD',
    discount_percentage: '',
    is_on_sale: false,
    
    // Inventory
    stock_quantity: '',
    weight: '',
    dimensions: { length: '', width: '', height: '' },
    
    // Media
    images: [],
    video_url: '',
    color_images: {},
    
    // Variants
    sizes: [],
    colors: [],
    
    // Product Details
    tags: [],
    box_contents: [],
    usage_instructions: [],
    care_instructions: [],
    safety_notes: [],
    
    // Settings
    status: 'active',
    is_featured: false,
    is_new_arrival: false,
    shipping_required: true,
    
    // SEO
    meta_title: '',
    meta_description: ''
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
    if (params.id) {
      loadProduct()
    }
    fetchCategories()
  }, [params.id])

  const loadProduct = async () => {
    try {
      setLoadingProduct(true)
      const { data, error } = await productsService.getProduct(params.id)
      
      if (error) {
        throw new Error(error.message || 'Failed to load product')
      }

      if (data) {
        setProduct(data)
        populateForm(data)
      }
    } catch (error) {
      console.error('Error loading product:', error)
      alert('Failed to load product. Redirecting to products page.')
      router.push('/products')
    } finally {
      setLoadingProduct(false)
    }
  }

  const populateForm = (productData) => {
    const colorImages = productData.color_images || {}
    const dimensions = productData.dimensions || {}
    
    setFormData({
      name: productData.name || '',
      subtitle: productData.subtitle || '',
      description: productData.description || '',
      brand: productData.brand || '',
      sku: productData.sku || '',
      category_id: productData.category_id || '',
      
      price: productData.price || '',
      mrp: productData.mrp || '',
      sale_price: productData.sale_price || '',
      currency: productData.currency || 'USD',
      discount_percentage: productData.discount_percentage || '',
      is_on_sale: productData.is_on_sale || false,
      
      stock_quantity: productData.stock_quantity || '',
      weight: productData.weight || '',
      dimensions: {
        length: dimensions.length || '',
        width: dimensions.width || '',
        height: dimensions.height || ''
      },
      
      images: Array.isArray(productData.images) ? productData.images : 
              productData.images ? productData.images.split(',').map(img => img.trim()) : [],
      video_url: productData.video_url || '',
      color_images: colorImages,
      
      sizes: productData.sizes || [],
      colors: productData.colors || [],
      
      tags: productData.tags || [],
      box_contents: productData.box_contents || [],
      usage_instructions: productData.usage_instructions || [],
      care_instructions: productData.care_instructions || [],
      safety_notes: productData.safety_notes || [],
      
      status: productData.status || 'active',
      is_featured: productData.is_featured || false,
      is_new_arrival: productData.is_new_arrival || false,
      shipping_required: productData.shipping_required !== false,
      
      meta_title: productData.meta_title || '',
      meta_description: productData.meta_description || ''
    })
    
    // Set preview for first image
    if (productData.images) {
      const firstImage = Array.isArray(productData.images) ? productData.images[0] : 
                        productData.images.split(',')[0]?.trim()
      setImagePreview(firstImage || '')
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const result = await response.json()
      if (result.success) {
        setCategories(result.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name.includes('.')) {
      // Handle nested objects like dimensions
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        images: formData.images.join(','),
        dimensions: Object.keys(formData.dimensions).length > 0 ? formData.dimensions : null
      }

      await updateProductMutation.mutateAsync({
        productId: params.id,
        updates: submitData
      })
      
      // Redirect to products page on success
      router.push('/products')
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Failed to update product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { id: 1, title: 'Basic Info', icon: FaInfoCircle, description: 'Product name, description, and category' },
    { id: 2, title: 'Pricing', icon: FaShoppingCart, description: 'Set your product prices and offers' },
    { id: 3, title: 'Media', icon: FaImage, description: 'Upload product photos and videos' },
    { id: 4, title: 'Variants', icon: FaTags, description: 'Add sizes, colors, and tags' },
    { id: 5, title: 'Details', icon: FaBox, description: 'Package contents and instructions' },
    { id: 6, title: 'Review', icon: FaEye, description: 'Review and save your changes' }
  ]

  const InfoTooltip = ({ text }) => (
    <div className="group relative inline-block ml-2">
      <FaInfoCircle className="text-gray-400 hover:text-blue-500 cursor-help" size={14} />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
        {text}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  )

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Product not found</p>
          <button
            onClick={() => router.push('/products')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FaArrowLeft />
                <span>Back to Products</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Edit Product</h1>
                <p className="text-sm text-gray-600">{product.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/products')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.name || !formData.price}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center gap-3 cursor-pointer transition-colors ${
                    currentStep === step.id
                      ? 'text-emerald-600'
                      : currentStep > step.id
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                  onClick={() => setCurrentStep(step.id)}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      currentStep === step.id
                        ? 'border-emerald-600 bg-emerald-50'
                        : currentStep > step.id
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <FaCheckCircle size={16} />
                    ) : (
                      <step.icon size={14} />
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs opacity-75">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4 h-px bg-gray-200 hidden md:block"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Same as create page but with populated data */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Content */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <FaInfoCircle className="text-emerald-600" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                      <p className="text-gray-600 text-sm">Update your product details</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Name *
                          <InfoTooltip text="Give your product a clear, descriptive name that customers will search for" />
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="e.g., Women's Comfortable Yoga Pants"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Subtitle
                          <InfoTooltip text="A short tagline that highlights your product's key benefit" />
                        </label>
                        <input
                          type="text"
                          name="subtitle"
                          value={formData.subtitle}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="e.g., Premium Quality • Maximum Flexibility"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Description
                        <InfoTooltip text="Describe your product's features, benefits, and what makes it special" />
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Tell customers about your product's features, materials, and benefits..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="e.g., Nike, Adidas"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SKU (Product Code)
                          <InfoTooltip text="A unique code to identify this product in your inventory" />
                        </label>
                        <input
                          type="text"
                          name="sku"
                          value={formData.sku}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="e.g., YP-001-BLK"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                          <InfoTooltip text="Choose the category that best describes your product" />
                        </label>
                        <select
                          name="category_id"
                          value={formData.category_id}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                      >
                        Next: Pricing →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Pricing - Same structure as create page */}
              {currentStep === 2 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaShoppingCart className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Pricing & Inventory</h2>
                      <p className="text-gray-600 text-sm">Update your prices and manage stock</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Pricing */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Pricing</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Selling Price * ({formData.currency})
                            <InfoTooltip text="The price customers will pay for your product" />
                          </label>
                          <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            required
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            MRP ({formData.currency})
                            <InfoTooltip text="Maximum Retail Price - shown as crossed out price" />
                          </label>
                          <input
                            type="number"
                            name="mrp"
                            value={formData.mrp}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sale Price ({formData.currency})
                            <InfoTooltip text="Special discounted price for sales events" />
                          </label>
                          <input
                            type="number"
                            name="sale_price"
                            value={formData.sale_price}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Currency
                            <InfoTooltip text="The currency for your product pricing" />
                          </label>
                          <select
                            name="currency"
                            value={formData.currency}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="INR">INR (₹)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Inventory */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory & Shipping</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Stock Quantity *
                            <InfoTooltip text="How many units do you have available to sell?" />
                          </label>
                          <input
                            type="number"
                            name="stock_quantity"
                            value={formData.stock_quantity}
                            onChange={handleInputChange}
                            required
                            min="0"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
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
                </div>
              )}

              {/* Step 3: Media */}
              {currentStep === 3 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FaImage className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Media & Videos</h2>
                      <p className="text-gray-600 text-sm">Update photos and videos of your product</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Main Images */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h3>
                      
                      {/* Current Images */}
                      {formData.images.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {formData.images.map((image, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={image}
                                  alt={`Product ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg border"
                                  onError={(e) => {
                                    e.target.src = '/placeholder-image.png'
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      images: prev.images.filter((_, i) => i !== index)
                                    }))
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add Image URL */}
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newInputs.image}
                          onChange={(e) => handleNewInputChange('image', e.target.value)}
                          placeholder="Enter image URL"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => addToArray('images', 'image')}
                          disabled={!newInputs.image.trim()}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Image
                        </button>
                      </div>
                    </div>

                    {/* Video */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FaVideo className="text-red-600" />
                        Product Video
                        <InfoTooltip text="Add a video to showcase your product in action" />
                      </h3>
                      <input
                        type="url"
                        name="video_url"
                        value={formData.video_url}
                        onChange={handleInputChange}
                        placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      {formData.video_url && (
                        <div className="mt-2 text-sm text-gray-600">
                          ✅ Video URL added
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between">
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
                </div>
              )}

              {/* Steps 4-6: Same as create page but with "Save Changes" instead of "Publish" */}
              {currentStep > 3 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Step {currentStep} - {steps[currentStep - 1]?.title}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Additional steps are available. For now, you can save your changes or go back to edit media.
                    </p>
                    <div className="flex justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.name || !formData.price}
                        className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Preview Sidebar - Same as create page */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaEye className="text-emerald-600" />
                  Product Preview
                </h3>
                
                {imagePreview && (
                  <div className="mb-4">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-full h-48 object-cover rounded-lg border"
                      onError={(e) => {
                        e.target.src = '/placeholder-image.png'
                      }}
                    />
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {formData.name || 'Product Name'}
                    </h4>
                    {formData.subtitle && (
                      <p className="text-gray-600">{formData.subtitle}</p>
                    )}
                  </div>

                  {formData.brand && (
                    <div>
                      <span className="text-gray-500">Brand: </span>
                      <span className="font-medium">{formData.brand}</span>
                    </div>
                  )}

                  {formData.price && (
                    <div>
                      <span className="text-2xl font-bold text-emerald-600">
                        {formData.currency} {formData.price}
                      </span>
                      {formData.mrp && formData.mrp !== formData.price && (
                        <span className="ml-2 text-gray-500 line-through">
                          {formData.currency} {formData.mrp}
                        </span>
                      )}
                    </div>
                  )}

                  {formData.description && (
                    <div>
                      <p className="text-gray-600 text-sm">{formData.description}</p>
                    </div>
                  )}

                  {formData.stock_quantity && (
                    <div>
                      <span className="text-gray-500">Stock: </span>
                      <span className={formData.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                        {formData.stock_quantity} units
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
