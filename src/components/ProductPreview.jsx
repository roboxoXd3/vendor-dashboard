'use client'
import { useState, useEffect } from 'react'
import { FaStar, FaHeart, FaShoppingBag, FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaTruck, FaUndo, FaMoneyBillWave, FaShieldAlt, FaPlay } from 'react-icons/fa'

export default function ProductPreview({ formData, categories, vendor }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  
  // Initialize selected color with first available color
  useEffect(() => {
    if (formData.colors && Object.keys(formData.colors).length > 0 && !selectedColor) {
      setSelectedColor(Object.keys(formData.colors)[0])
    }
  }, [formData.colors, selectedColor])

  // Get current media (images + video) based on selected color
  const getCurrentMedia = () => {
    let mediaItems = []
    
    // If a color is selected and has specific images, use those
    if (selectedColor && formData.color_images && formData.color_images[selectedColor]) {
      const colorImages = formData.color_images[selectedColor]
      if (colorImages && colorImages.length > 0) {
        mediaItems = [...colorImages]
      }
    }
    
    // If no color-specific images, use main images
    if (mediaItems.length === 0 && formData.images && formData.images.length > 0) {
      mediaItems = [...formData.images]
    }
    
    // Add video if available
    if (formData.video_url) {
      mediaItems.push({
        type: 'video',
        url: formData.video_url
      })
    }
    
    // Fallback to placeholder if no media
    if (mediaItems.length === 0) {
      mediaItems = ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTIwQzE1MCAxMTQuNDc3IDE1NC40NzcgMTEwIDE2MCAxMTBIMjQwQzI0NS41MjMgMTEwIDI1MCAxMTQuNDc3IDI1MCAxMjBWMjgwQzI1MCAyODUuNTIzIDI0NS41MjMgMjkwIDI0MCAyOTBIMTYwQzE1NC40NzcgMjkwIDE1MCAyODUuNTIzIDE1MCAyODBWMTIwWiIgZmlsbD0iI0Q1RDlERCIvPgo8cGF0aCBkPSJNMTgwIDE2MEMxODYuNjI3IDE2MCAyMDAgMTY2LjM3MyAyMDAgMTcyQzIwMCAxNzguNjI3IDE4Ni42MjcgMTg0IDE4MCAxODRDMTczLjM3MyAxODQgMTcwIDE3OC42MjcgMTcwIDE3MkMxNzAgMTY2LjM3MyAxNzMuMzczIDE2MCAxODAgMTYwWiIgZmlsbD0iI0E3QUZCQSIvPgo8cGF0aCBkPSJNMjIwIDI1MEwyMTAgMjMwTDE5MCAyNTBMMTcwIDIyMEwxNTAgMjUwVjI4MEMxNTAgMjg1LjUyMyAxNTQuNDc3IDI5MCAyNDAgMjkwSDE2MEMxNTQuNDc3IDI5MCAxNTAgMjg1LjUyMyAxNTAgMjgwVjI1MFoiIGZpbGw9IiNBN0FGQkEiLz4KPC9zdmc+']
    }
    
    return mediaItems
  }
  
  const mediaItems = getCurrentMedia()
  
  // Reset image index when color changes
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [selectedColor])

  // Handle color selection
  const handleColorSelect = (color) => {
    setSelectedColor(color)
  }

  // Navigate media gallery
  const nextMedia = () => {
    setCurrentImageIndex((prev) => (prev + 1) % mediaItems.length)
  }

  const prevMedia = () => {
    setCurrentImageIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)
  }

  // Get current media item
  const getCurrentMediaItem = () => {
    const item = mediaItems[currentImageIndex]
    if (typeof item === 'object' && item.type === 'video') {
      return item
    }
    return { type: 'image', url: item }
  }

  const currentMedia = getCurrentMediaItem()
  
  // Calculate discount percentage
  const getDiscountPercentage = () => {
    const currentPrice = parseFloat(formData.sale_price || formData.price) || 0
    const mrp = parseFloat(formData.mrp) || 0
    if (mrp > currentPrice && currentPrice > 0) {
      return Math.round(((mrp - currentPrice) / mrp) * 100)
    }
    return 0
  }
  
  const discountPercentage = getDiscountPercentage()
  
  // Get currency symbol from currency code
  const getCurrencySymbol = (currencyCode) => {
    const currencySymbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
      'NGN': '₦'
    }
    return currencySymbols[currencyCode] || '₹' // Default to INR if not found
  }

  // Get color from string (same as Flutter)
  const getColorFromString = (colorName) => {
    const colors = {
      'red': '#F44336',
      'blue': '#2196F3', 
      'green': '#4CAF50',
      'yellow': '#FFEB3B',
      'orange': '#FF9800',
      'purple': '#9C27B0',
      'pink': '#E91E63',
      'brown': '#795548',
      'black': '#000000',
      'white': '#FFFFFF',
      'grey': '#9E9E9E',
      'gray': '#9E9E9E',
      'navy': '#000080',
      'maroon': '#800000',
      'teal': '#009688',
      'cyan': '#00BCD4',
      'lime': '#CDDC39',
      'indigo': '#3F51B5',
      'amber': '#FFC107'
    }
    return colors[colorName.toLowerCase()] || '#9E9E9E'
  }

  return (
    <div className="w-full mx-auto bg-white overflow-hidden">
      {/* Exact Flutter PDP Layout */}
      <div className="bg-white w-full max-w-full overflow-hidden">
        {/* 1. Interactive Hero Gallery */}
        <div className="relative bg-white w-full overflow-hidden">
          <div className="relative h-96 bg-white group w-full overflow-hidden">
            {/* Current Media Display */}
            {currentMedia.type === 'video' ? (
              <div className="relative w-full h-full bg-black overflow-hidden">
                <video
                  src={currentMedia.url}
                  className="w-full h-full object-contain max-w-full max-h-full"
                  controls
                  controlsList="nodownload"
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%',
                    width: '100%',
                    height: '100%'
                  }}
                  poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMDAwMDAwIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjIwMCIgcj0iNDAiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuOCIvPjxwYXRoIGQ9Ik0xODUgMTc1TDIyNSAyMDBMMTg1IDIyNVYxNzVaIiBmaWxsPSIjMDAwMDAwIi8+PC9zdmc+"
                />
                <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium z-10">
                  VIDEO
                </div>
              </div>
            ) : (
              <img
                src={currentMedia.url}
                alt={formData.name || 'Product Preview'}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTIwQzE1MCAxMTQuNDc3IDE1NC40NzcgMTEwIDE2MCAxMTBIMjQwQzI0NS41MjMgMTEwIDI1MCAxMTQuNDc3IDI1MCAxMjBWMjgwQzI1MCAyODUuNTIzIDI0NS41MjMgMjkwIDI0MCAyOTBIMTYwQzE1NC40NzcgMjkwIDE1MCAyODUuNTIzIDE1MCAyODBWMTIwWiIgZmlsbD0iI0Q1RDlERCIvPgo8cGF0aCBkPSJNMTgwIDE2MEMxODYuNjI3IDE2MCAyMDAgMTY2LjM3MyAyMDAgMTcyQzIwMCAxNzguNjI3IDE4Ni42MjcgMTg0IDE4MCAxODRDMTczLjM3MyAxODQgMTcwIDE3OC2MjcgMTcwIDE3MkMxNzAgMTY2LjM3MyAxNzMuMzczIDE2MCAxODAgMTYwWiIgZmlsbD0iI0E3QUZCQSIvPgo8cGF0aCBkPSJNMjIwIDI1MEwyMTAgMjMwTDE5MCAyNTBMMTcwIDIyMEwxNTAgMjUwVjI4MEMxNTAgMjg1LjUyMyAxNTQuNDc3IDI5MCAyNDAgMjkwSDE2MEMxNTQuNDc3IDI5MCAxNTAgMjg1LjUyMyAxNTAgMjgwVjI1MFoiIGZpbGw9IiNBN0FGQkEiLz4KPC9zdmc+'
                }}
              />
            )}
            
            {/* Navigation Arrows */}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={prevMedia}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FaChevronLeft className="text-gray-700" />
                </button>
                <button
                  onClick={nextMedia}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FaChevronRight className="text-gray-700" />
                </button>
              </>
            )}
            
            {/* Color Indicator */}
            {selectedColor && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-xs font-medium">
                {selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1)}
              </div>
            )}
            
            {/* Wishlist Heart */}
            <div className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
              <FaHeart className="text-gray-400 text-lg" />
            </div>
          </div>
          
          {/* Media Indicators */}
          {mediaItems.length > 1 && (
            <div className="flex justify-center mt-4 space-x-2">
              {mediaItems.map((item, index) => {
                const isVideo = typeof item === 'object' && item.type === 'video'
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative ${
                      currentImageIndex === index 
                        ? 'w-3 h-3 bg-emerald-600' 
                        : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                    } rounded-full transition-all`}
                  >
                    {isVideo && (
                      <FaPlay className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
          
          {/* Media Counter */}
          {mediaItems.length > 1 && (
            <div className="text-center mt-2">
              <span className="text-xs text-gray-500">
                {currentImageIndex + 1} of {mediaItems.length}
                {currentMedia.type === 'video' && ' (Video)'}
              </span>
            </div>
          )}
          
          <div className="h-4" />
        </div>

        {/* 2. Enhanced Price Block - Exact Flutter Implementation */}
        <div className="px-4 pb-4">
          {/* Product Title and Subtitle */}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {formData.name || 'Product Name'}
          </h1>
          {formData.subtitle && (
            <p className="text-gray-600 text-base mb-3">
              {formData.subtitle}
            </p>
          )}
          
          {/* Rating and Orders Row - Only show if we have real data */}
          {(formData.rating || formData.reviews_count || formData.orders_count) && (
            <div className="flex items-center mb-4">
              {formData.rating && (
                <>
                  <FaStar className="text-orange-500 text-lg mr-1" />
                  <span className="font-bold text-base mr-1">{formData.rating}</span>
                </>
              )}
              {formData.reviews_count && (
                <span className="text-gray-600 text-sm">({formData.reviews_count} Reviews)</span>
              )}
              {formData.orders_count && (
                <div className="flex items-center ml-4">
                  <FaShoppingBag className="text-gray-600 text-sm mr-1" />
                  <span className="text-gray-600 text-sm">{formData.orders_count} orders</span>
                </div>
              )}
            </div>
          )}
          
          {/* Price Section */}
          <div className="flex items-end mb-2">
            <span className="text-3xl font-bold text-emerald-600 mr-3">
              {getCurrencySymbol(formData.currency)}{formData.sale_price || formData.price || '0'}
            </span>
            {formData.mrp && parseFloat(formData.mrp) > parseFloat(formData.sale_price || formData.price || 0) && (
              <>
                <span className="text-lg text-gray-600 line-through mr-2">
                  {getCurrencySymbol(formData.currency)}{formData.mrp}
                </span>
                {discountPercentage > 0 && (
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                    {discountPercentage}% OFF
                  </span>
                )}
              </>
            )}
          </div>
          
          <p className="text-gray-600 text-xs mb-4">Inclusive of all taxes</p>
          
          {/* Coupon Section - Only show if coupons are available */}
          {formData.has_coupons && (
            <div className="border border-emerald-500 rounded-lg p-3 bg-emerald-50 mb-4">
              <div className="flex items-center">
                <div className="text-emerald-600 mr-2">🏷️</div>
                <span className="text-emerald-600 font-semibold flex-1">
                  Apply coupon for extra savings
                </span>
                <FaChevronRight className="text-emerald-600 text-sm" />
              </div>
            </div>
          )}
        </div>

        {/* 3. Color & Size Selection - Exact Flutter Implementation */}
        {(formData.sizes?.length > 0 || Object.keys(formData.colors || {}).length > 0) && (
          <div className="px-4 pb-4">
            {/* Size Selection */}
            {formData.sizes && formData.sizes.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold">Select Size</h3>
                  {formData.has_size_chart && (
                    <button className="text-emerald-600 text-sm font-medium">Size Chart</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.sizes.map((size, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border rounded-lg ${
                        selectedSize === size
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Interactive Color Selection */}
            {formData.colors && Object.keys(formData.colors).length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold">Select Color</h3>
                  <span className="text-xs text-gray-500">
                    {formData.color_images && formData.color_images[selectedColor] 
                      ? `${formData.color_images[selectedColor].length} images` 
                      : 'Main images'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 mb-2">
                  {Object.entries(formData.colors).map(([colorName, hexValue], index) => {
                    const hasColorImages = formData.color_images && formData.color_images[colorName] && formData.color_images[colorName].length > 0
                    return (
                      <button
                        key={index}
                        onClick={() => handleColorSelect(colorName)}
                        className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                          selectedColor === colorName
                            ? 'border-emerald-600 shadow-lg ring-2 ring-emerald-200'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: hexValue }}
                        title={`${colorName} ${hasColorImages ? '(Has specific images)' : '(Uses main images)'}`}
                      >
                        {selectedColor === colorName && (
                          <div className="w-full h-full rounded-full flex items-center justify-center">
                            <div className={`text-lg font-bold ${
                              hexValue === '#FFFFFF' || hexValue === '#FFFF00' || hexValue === '#FFD700'
                                ? 'text-gray-800' 
                                : 'text-white'
                            }`}>
                              ✓
                            </div>
                          </div>
                        )}
                        
                        {/* Color-specific image indicator */}
                        {hasColorImages && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{formData.color_images[colorName].length}</span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
                
                {/* Color Selection Feedback */}
                <div className="flex items-center justify-between">
                  <p className="text-gray-600 text-sm font-medium">
                    Selected: <span className="text-emerald-600 font-semibold">{selectedColor}</span>
                  </p>
                  {formData.color_images && formData.color_images[selectedColor] && (
                    <p className="text-xs text-emerald-600 font-medium">
                      ✨ Viewing {selectedColor} specific images
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Delivery & Services - Show only if shipping is required */}
        {formData.shipping_required && (
          <div className="px-4 pb-4">
            <h3 className="text-lg font-bold mb-3">Delivery & Services</h3>
            <div className="flex mb-4">
              <input
                type="text"
                placeholder="Enter pincode"
                className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-sm"
                maxLength={6}
              />
              <button className="bg-emerald-600 text-white px-4 py-2 rounded-r-lg text-sm font-medium">
                Check
              </button>
            </div>
            
            {/* Delivery Info - Show actual product delivery details */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="space-y-2">
                {formData.delivery_days && (
                  <div className="flex items-center">
                    <FaTruck className="text-green-600 mr-2" />
                    <span className="text-sm font-medium">Delivery: </span>
                    <span className="text-sm text-green-600 font-semibold">{formData.delivery_days} days</span>
                  </div>
                )}
                {formData.shipping_cost !== undefined && (
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">{getCurrencySymbol(formData.currency)}</span>
                    <span className="text-sm font-medium">Shipping: </span>
                    <span className="text-sm text-green-600 font-semibold">
                      {formData.shipping_cost === 0 ? 'FREE' : `${getCurrencySymbol(formData.currency)}${formData.shipping_cost}`}
                    </span>
                  </div>
                )}
                {formData.cod_available && (
                  <div className="flex items-center">
                    <FaMoneyBillWave className="text-green-600 mr-2" />
                    <span className="text-sm font-medium">Cash on Delivery: </span>
                    <span className="text-sm text-green-600 font-semibold">Available</span>
                  </div>
                )}
                {formData.return_policy && (
                  <div className="flex items-center">
                    <FaUndo className="text-blue-600 mr-2" />
                    <span className="text-sm font-medium">Returns: </span>
                    <span className="text-sm text-blue-600 font-semibold">{formData.return_policy}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. Product Description */}
        {formData.description && (
          <div className="px-4 pb-4">
            <h3 className="text-lg font-bold mb-3">Product Description</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {formData.description}
            </p>
          </div>
        )}

        {/* 7. Specifications - Show only real product data */}
        {(formData.brand || formData.weight || formData.dimensions || formData.sku) && (
          <div className="px-4 pb-4">
            <h3 className="text-lg font-bold mb-3">Specifications</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="space-y-2">
                {formData.brand && (
                  <div className="flex justify-between py-1">
                    <span className="text-sm font-medium text-gray-600">Brand</span>
                    <span className="text-sm text-gray-800">{formData.brand}</span>
                  </div>
                )}
                {formData.sku && (
                  <div className="flex justify-between py-1">
                    <span className="text-sm font-medium text-gray-600">SKU</span>
                    <span className="text-sm text-gray-800">{formData.sku}</span>
                  </div>
                )}
                {formData.weight && (
                  <div className="flex justify-between py-1">
                    <span className="text-sm font-medium text-gray-600">Weight</span>
                    <span className="text-sm text-gray-800">{formData.weight}g</span>
                  </div>
                )}
                {formData.dimensions && (
                  <div className="flex justify-between py-1">
                    <span className="text-sm font-medium text-gray-600">Dimensions</span>
                    <span className="text-sm text-gray-800">
                      {formData.dimensions.length} × {formData.dimensions.width} × {formData.dimensions.height} {formData.dimensions.unit}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 8. Box Contents */}
        {formData.box_contents && formData.box_contents.length > 0 && (
          <div className="px-4 pb-4">
            <h3 className="text-lg font-bold mb-3">What's in the Box</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="space-y-2">
                {formData.box_contents.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 9. Usage Instructions */}
        {formData.usage_instructions && formData.usage_instructions.length > 0 && (
          <div className="px-4 pb-4">
            <h3 className="text-lg font-bold mb-3">How to Use</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="space-y-2">
                {formData.usage_instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-sm font-bold text-green-600 mr-3 mt-0.5">{index + 1}.</span>
                    <span className="text-sm text-gray-700">{instruction}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 10. Care Instructions */}
        {formData.care_instructions && formData.care_instructions.length > 0 && (
          <div className="px-4 pb-4">
            <h3 className="text-lg font-bold mb-3">Care Instructions</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="space-y-2">
                {formData.care_instructions.map((instruction, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">{instruction}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 11. Safety Notes */}
        {formData.safety_notes && formData.safety_notes.length > 0 && (
          <div className="px-4 pb-4">
            <h3 className="text-lg font-bold mb-3">Safety Information</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="space-y-2">
                {formData.safety_notes.map((note, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-red-600 mr-2 mt-0.5">⚠️</span>
                    <span className="text-sm text-gray-700">{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 12. Vendor Information */}
        <div className="px-4 pb-4">
          <h3 className="text-lg font-bold mb-3">Sold By</h3>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold">
                {(vendor?.business_name || vendor?.name || 'V')[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {vendor?.business_name || vendor?.name || 'Vendor Store'}
              </p>
              {vendor?.rating && vendor?.review_count && (
                <div className="flex items-center mt-1">
                  <FaStar className="text-orange-500 text-xs mr-1" />
                  <span className="text-xs text-gray-600">{vendor.rating} ({vendor.review_count} reviews)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 13. Sticky CTA Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-3">
            <button className="flex-1 bg-white border-2 border-emerald-600 text-emerald-600 py-3 rounded-lg font-semibold">
              Add to Cart
            </button>
            <button className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Keep the DetailedProductPreview for backward compatibility but it won't be used
export function DetailedProductPreview({ formData, categories, vendor }) {
  // This is now just a wrapper around the main ProductPreview
  return <ProductPreview formData={formData} categories={categories} vendor={vendor} />
}