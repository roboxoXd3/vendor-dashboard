'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateProduct } from '@/hooks/useProducts'
import { FaArrowLeft, FaSave, FaInfoCircle, FaImage, FaVideo, FaTags, FaBox, FaShoppingCart, FaEye, FaCheckCircle } from 'react-icons/fa'
import { MainImageUpload, ColorImageUpload } from '@/components/ImageUpload'

export default function CreateProductPage() {
  const router = useRouter()
  const { vendor } = useAuth()
  const createProductMutation = useCreateProduct()
  
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

  // Load categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

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

      await createProductMutation.mutateAsync({
        vendorId: vendor?.id,
        productData: submitData
      })
      
      // Redirect to products page on success
      router.push('/products')
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Failed to create product. Please try again.')
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
    { id: 6, title: 'Review', icon: FaEye, description: 'Review and publish your product' }
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
              <h1 className="text-xl font-semibold text-gray-900">Create New Product</h1>
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
                    Creating...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Create Product
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

      {/* Main Content */}
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
                      <p className="text-gray-600 text-sm">Tell customers about your product</p>
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

              {/* Step 2: Pricing */}
              {currentStep === 2 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaShoppingCart className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Pricing & Inventory</h2>
                      <p className="text-gray-600 text-sm">Set your prices and manage stock</p>
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
                      <p className="text-gray-600 text-sm">Upload photos and videos of your product</p>
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

              {/* Step 4: Variants */}
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Sizes</h3>
                      
                      {formData.sizes.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {formData.sizes.map((size, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                              >
                                {size}
                                <button
                                  type="button"
                                  onClick={() => removeFromArray('sizes', size)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  ×
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
                          placeholder="e.g., S, M, L, XL"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => addToArray('sizes', 'size')}
                          disabled={!newInputs.size.trim()}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Add Size
                        </button>
                      </div>
                    </div>

                    {/* Colors */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Colors</h3>
                      
                      {formData.colors.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {formData.colors.map((color, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                              >
                                {color}
                                <button
                                  type="button"
                                  onClick={() => removeFromArray('colors', color)}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newInputs.color}
                          onChange={(e) => handleNewInputChange('color', e.target.value)}
                          placeholder="e.g., Red, Blue, Black"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => addToArray('colors', 'color')}
                          disabled={!newInputs.color.trim()}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Add Color
                        </button>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Tags</h3>
                      
                      {formData.tags.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeFromArray('tags', tag)}
                                  className="text-purple-600 hover:text-purple-800"
                                >
                                  ×
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
                          placeholder="e.g., trending, bestseller, eco-friendly"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => addToArray('tags', 'tag')}
                          disabled={!newInputs.tag.trim()}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Add Tag
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between">
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
                </div>
              )}

              {/* Step 5: Details */}
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">What's in the Box</h3>
                      
                      {formData.box_contents.length > 0 && (
                        <div className="mb-4">
                          <ul className="space-y-2">
                            {formData.box_contents.map((item, index) => (
                              <li key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                                <span className="text-sm">{item}</span>
                                <button
                                  type="button"
                                  onClick={() => removeFromArray('box_contents', item)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ×
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
                          placeholder="e.g., 1x Product, 1x User Manual, 1x Warranty Card"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => addToArray('box_contents', 'boxContent')}
                          disabled={!newInputs.boxContent.trim()}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Add Item
                        </button>
                      </div>
                    </div>

                    {/* Usage Instructions */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Instructions</h3>
                      
                      {formData.usage_instructions.length > 0 && (
                        <div className="mb-4">
                          <ol className="space-y-2">
                            {formData.usage_instructions.map((instruction, index) => (
                              <li key={index} className="flex items-start justify-between bg-white p-2 rounded border">
                                <span className="text-sm flex-1">
                                  <span className="font-medium text-emerald-600">{index + 1}.</span> {instruction}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeFromArray('usage_instructions', instruction)}
                                  className="text-red-500 hover:text-red-700 ml-2"
                                >
                                  ×
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
                          placeholder="e.g., Remove from packaging and clean before first use"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => addToArray('usage_instructions', 'usageInstruction')}
                          disabled={!newInputs.usageInstruction.trim()}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Add Step
                        </button>
                      </div>
                    </div>

                    {/* Care Instructions */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Care Instructions</h3>
                      
                      {formData.care_instructions.length > 0 && (
                        <div className="mb-4">
                          <ul className="space-y-2">
                            {formData.care_instructions.map((instruction, index) => (
                              <li key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                                <span className="text-sm">{instruction}</span>
                                <button
                                  type="button"
                                  onClick={() => removeFromArray('care_instructions', instruction)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ×
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
                          placeholder="e.g., Hand wash only, Do not bleach"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => addToArray('care_instructions', 'careInstruction')}
                          disabled={!newInputs.careInstruction.trim()}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Add Care Tip
                        </button>
                      </div>
                    </div>

                    {/* Product Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Settings</h3>
                      <div className="space-y-4">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            name="is_featured"
                            checked={formData.is_featured}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Featured Product</span>
                          <InfoTooltip text="Featured products appear prominently on your store" />
                        </label>

                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            name="is_new_arrival"
                            checked={formData.is_new_arrival}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <span className="text-sm font-medium text-gray-700">New Arrival</span>
                          <InfoTooltip text="Mark this product as a new arrival" />
                        </label>

                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            name="shipping_required"
                            checked={formData.shipping_required}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Requires Shipping</span>
                          <InfoTooltip text="Uncheck for digital products that don't need shipping" />
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-between">
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
                </div>
              )}

              {/* Step 6: Review */}
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
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Summary</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="text-gray-600">Name:</span> <span className="font-medium">{formData.name || 'Not set'}</span></div>
                            <div><span className="text-gray-600">Brand:</span> <span className="font-medium">{formData.brand || 'Not set'}</span></div>
                            <div><span className="text-gray-600">SKU:</span> <span className="font-medium">{formData.sku || 'Not set'}</span></div>
                            <div><span className="text-gray-600">Category:</span> <span className="font-medium">
                              {categories.find(c => c.id === formData.category_id)?.name || 'Not selected'}
                            </span></div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Pricing</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="text-gray-600">Price:</span> <span className="font-medium text-emerald-600">{formData.currency} {formData.price || '0.00'}</span></div>
                            {formData.mrp && <div><span className="text-gray-600">MRP:</span> <span className="font-medium">{formData.currency} {formData.mrp}</span></div>}
                            {formData.sale_price && <div><span className="text-gray-600">Sale Price:</span> <span className="font-medium">{formData.currency} {formData.sale_price}</span></div>}
                            <div><span className="text-gray-600">Stock:</span> <span className="font-medium">{formData.stock_quantity || '0'} units</span></div>
                          </div>
                        </div>
                      </div>

                      {formData.description && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                          <p className="text-sm text-gray-600">{formData.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Media Summary */}
                    {(formData.images.length > 0 || formData.video_url) && (
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Media</h3>
                        {formData.images.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Images ({formData.images.length})</h4>
                            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                              {formData.images.slice(0, 8).map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Product ${index + 1}`}
                                  className="w-full h-16 object-cover rounded border"
                                  onError={(e) => {
                                    e.target.src = '/placeholder-image.png'
                                  }}
                                />
                              ))}
                              {formData.images.length > 8 && (
                                <div className="w-full h-16 bg-gray-200 rounded border flex items-center justify-center text-xs text-gray-600">
                                  +{formData.images.length - 8} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {formData.video_url && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Video</h4>
                            <div className="text-sm text-gray-600">✅ Video URL provided</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Variants Summary */}
                    {(formData.sizes.length > 0 || formData.colors.length > 0 || formData.tags.length > 0) && (
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Variants & Tags</h3>
                        <div className="space-y-3">
                          {formData.sizes.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Sizes: </span>
                              <span className="text-sm text-gray-600">{formData.sizes.join(', ')}</span>
                            </div>
                          )}
                          {formData.colors.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Colors: </span>
                              <span className="text-sm text-gray-600">{formData.colors.join(', ')}</span>
                            </div>
                          )}
                          {formData.tags.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Tags: </span>
                              <span className="text-sm text-gray-600">{formData.tags.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Settings Summary */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Settings</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${formData.is_featured ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          <span className="text-gray-600">Featured Product: {formData.is_featured ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${formData.is_new_arrival ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          <span className="text-gray-600">New Arrival: {formData.is_new_arrival ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${formData.shipping_required ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          <span className="text-gray-600">Requires Shipping: {formData.shipping_required ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-yellow-600 mt-1">⚠️</div>
                        <div>
                          <h4 className="font-medium text-yellow-800">Ready to Publish?</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Once you publish this product, it will be visible to customers. You can always edit it later.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(5)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.name || !formData.price}
                        className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 text-lg"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Publishing...
                          </>
                        ) : (
                          <>
                            <FaCheckCircle />
                            Publish Product
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Preview Sidebar */}
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
