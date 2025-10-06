'use client'
import { useState, useRef, useEffect } from 'react'
import { FaTags, FaPlus, FaTimes, FaPalette } from 'react-icons/fa'
import { HexColorPicker } from 'react-colorful'
import StepContainer from '../shared/StepContainer'
import FormField from '../shared/FormField'

export default function VariantsOptionsStep({ 
  formData,
  handleInputChange,
  addToArray,
  removeFromArray,
  onNext, 
  onBack 
}) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [colorName, setColorName] = useState('')
  const [manualHexInput, setManualHexInput] = useState('')
  const colorPickerRef = useRef(null)

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  const handleAddSizes = () => {
    const sizeInput = document.getElementById('new-size')
    if (sizeInput.value.trim()) {
      const input = sizeInput.value.trim()
      
      // Check if input contains commas (bulk input)
      if (input.includes(',')) {
        // Split by comma and clean up each size
        const sizes = input
          .split(',')
          .map(size => size.trim())
          .filter(size => size.length > 0) // Remove empty strings
        
        // Add each size to the array
        sizes.forEach(size => {
          addToArray('sizes', size)
        })
      } else {
        // Single size input
        addToArray('sizes', input)
      }
      
      sizeInput.value = ''
    }
  }

  const handleAddColorFromPicker = () => {
    if (colorName.trim()) {
      const newColors = { 
        ...formData.colors, 
        [colorName.trim()]: {
          hex: selectedColor,
          quantity: 0
        }
      }
      handleInputChange({
        target: {
          name: 'colors',
          value: newColors
        }
      })
      setColorName('')
      setManualHexInput('')
      setShowColorPicker(false)
    }
  }

  const handleManualHexInput = (hexValue) => {
    setManualHexInput(hexValue)
    // Validate and update selected color if it's a valid hex
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hexValue)) {
      setSelectedColor(hexValue)
    }
  }

  const handleQuickColorSelect = (colorName, hexValue) => {
    setSelectedColor(hexValue)
    setColorName(colorName)
    setManualHexInput(hexValue)
  }

  // Update manual hex input when color is selected from wheel
  useEffect(() => {
    setManualHexInput(selectedColor)
  }, [selectedColor])


  const handleRemoveColor = (colorName) => {
    const newColors = { ...formData.colors }
    delete newColors[colorName]
    handleInputChange({
      target: {
        name: 'colors',
        value: newColors
      }
    })
  }

  const handleColorQuantityChange = (colorName, quantity) => {
    // Allow empty string or parse the number
    const parsedQuantity = quantity === '' ? 0 : parseInt(quantity, 10)
    const finalQuantity = isNaN(parsedQuantity) ? 0 : parsedQuantity
    
    const newColors = { 
      ...formData.colors,
      [colorName]: {
        ...formData.colors[colorName],
        quantity: finalQuantity
      }
    }
    handleInputChange({
      target: {
        name: 'colors',
        value: newColors
      }
    })
  }

  const handleAddTag = () => {
    const tagInput = document.getElementById('new-tag')
    if (tagInput.value.trim()) {
      addToArray('tags', tagInput.value.trim())
      tagInput.value = ''
    }
  }

  return (
    <StepContainer
      icon={FaTags}
      iconBgColor="bg-yellow-100"
      iconColor="text-yellow-600"
      title="Variants & Options"
      description="Add sizes, colors, and tags for your product"
      onNext={onNext}
      onBack={onBack}
      nextLabel="Next: Media"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Sizes Section */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Available Sizes</h3>
          
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Add Sizes</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="new-size"
                type="text"
                placeholder="Single size (e.g., S) or multiple sizes (e.g., XS, S, M, L, XL)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSizes()}
              />
              <button
                type="button"
                onClick={handleAddSizes}
                className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 text-sm"
              >
                <FaPlus size={10} className="sm:w-3 sm:h-3" /> Add
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1 hidden sm:block">
              Single size: "S" | Multiple sizes: "XS, S, M, L, XL" | Shoe sizes: "7, 8, 9, 10, 11"
            </p>
          </div>
          
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {formData.sizes.map((size, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm"
              >
                {size}
                <button
                  type="button"
                  onClick={() => removeFromArray('sizes', size)}
                  className="text-blue-600 hover:text-blue-800 p-0.5"
                >
                  <FaTimes size={8} className="sm:w-2.5 sm:h-2.5" />
                </button>
              </span>
            ))}
            {formData.sizes.length === 0 && (
              <p className="text-gray-500 text-xs sm:text-sm italic">No sizes added yet</p>
            )}
          </div>
        </div>

        {/* Colors Section */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Available Colors</h3>
          
          {/* Enhanced Color Picker Section */}
          <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <FaPalette className="text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">Color Selection</span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column: Color Wheel and Manual Input */}
              <div className="space-y-4">
                {/* Color Wheel */}
                <div className="relative" ref={colorPickerRef}>
                  <div 
                    className="w-40 h-40 mx-auto border border-gray-300 rounded-lg cursor-pointer flex items-center justify-center text-white font-medium shadow-sm"
                    style={{ backgroundColor: selectedColor }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold">{selectedColor}</div>
                      <div className="text-xs opacity-80">Click to pick</div>
                    </div>
                  </div>
                  
                  {showColorPicker && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 p-4 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-w-sm">
                      <HexColorPicker color={selectedColor} onChange={setSelectedColor} />
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-gray-600 font-mono">{selectedColor}</span>
                        <button
                          type="button"
                          onClick={() => setShowColorPicker(false)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Manual Hex Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Or enter hex code manually
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualHexInput}
                      onChange={(e) => handleManualHexInput(e.target.value)}
                      placeholder="#000000"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedColor(manualHexInput)}
                      disabled={!manualHexInput || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(manualHexInput)}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    >
                      Apply
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Valid format: #000000 or #000
                  </p>
                </div>
              </div>
              
              {/* Right Column: Quick Colors and Add Section */}
              <div className="space-y-4">
                {/* Quick Color Presets */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Quick select common colors
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { name: 'Red', hex: '#FF0000' },
                      { name: 'Blue', hex: '#0000FF' },
                      { name: 'Green', hex: '#008000' },
                      { name: 'Yellow', hex: '#FFFF00' },
                      { name: 'Orange', hex: '#FFA500' },
                      { name: 'Purple', hex: '#800080' },
                      { name: 'Pink', hex: '#FFC0CB' },
                      { name: 'Black', hex: '#000000' },
                      { name: 'White', hex: '#FFFFFF' },
                      { name: 'Gray', hex: '#808080' },
                      { name: 'Navy', hex: '#000080' },
                      { name: 'Maroon', hex: '#800000' }
                    ].map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => handleQuickColorSelect(color.name, color.hex)}
                        className={`w-8 h-8 rounded border-2 ${
                          selectedColor === color.hex 
                            ? 'border-emerald-600 ring-2 ring-emerald-200' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {selectedColor === color.hex && (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Color Name and Add Button */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Name your color
                  </label>
            <input
              type="text"
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    placeholder="e.g., Midnight Blue, Ocean Teal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm mb-2"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddColorFromPicker()}
            />
            <button
              type="button"
                    onClick={handleAddColorFromPicker}
                    disabled={!colorName.trim()}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
            >
              <FaPlus size={12} /> Add Color
            </button>
          </div>
              </div>
            </div>
          </div>
          
          {/* Display Added Colors */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Added Colors ({Object.keys(formData.colors || {}).length})</h4>
            <div className="space-y-3">
              {Object.entries(formData.colors || {}).map(([colorName, colorData]) => {
                // Handle both old format (string) and new format (object)
                const hexValue = typeof colorData === 'string' ? colorData : colorData?.hex || '#000000'
                const quantity = typeof colorData === 'object' ? (colorData?.quantity || 0) : 0
                
                return (
                  <div
                    key={colorName}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div 
                      className="w-6 h-6 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: hexValue }}
                    ></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-green-800">{colorName}</span>
                        <span className="text-xs opacity-75 font-mono text-green-600">{hexValue}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Qty:</label>
                      <input
                        type="number"
                        min="0"
                        value={quantity === 0 ? '' : quantity}
                        onChange={(e) => handleColorQuantityChange(colorName, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(colorName)}
                      className="text-green-600 hover:text-green-800 p-1 flex-shrink-0"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                )
              })}
              {(!formData.colors || Object.keys(formData.colors).length === 0) && (
                <p className="text-gray-500 text-sm italic py-2">No colors added yet. Use the color picker above to add colors.</p>
              )}
            </div>
            
            {/* Total Stock Summary */}
            {formData.colors && Object.keys(formData.colors).length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">Total Stock Quantity:</span>
                  <span className="text-lg font-bold text-blue-900">
                    {Object.values(formData.colors).reduce((total, colorData) => {
                      const quantity = typeof colorData === 'object' ? (colorData?.quantity || 0) : 0
                      return total + quantity
                    }, 0)}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Automatically calculated from all color quantities
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tags Section */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Product Tags</h3>
          
          <div className="flex flex-col sm:flex-row gap-2 mb-3 sm:mb-4">
            <input
              id="new-tag"
              type="text"
              placeholder="Enter tag (e.g., wireless, premium, bestseller)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 text-sm"
            >
              <FaPlus size={10} className="sm:w-3 sm:h-3" /> Add Tag
            </button>
          </div>
          
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs sm:text-sm"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeFromArray('tags', tag)}
                  className="text-purple-600 hover:text-purple-800 p-0.5"
                >
                  <FaTimes size={8} className="sm:w-2.5 sm:h-2.5" />
                </button>
              </span>
            ))}
            {formData.tags.length === 0 && (
              <p className="text-gray-500 text-xs sm:text-sm italic">No tags added yet</p>
            )}
          </div>
        </div>

        {/* Dimensions Section */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Product Dimensions</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <FormField
              label="Length"
              name="dimensions.length"
              type="number"
              value={formData.dimensions.length}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              placeholder="0.0"
            />
            
            <FormField
              label="Width"
              name="dimensions.width"
              type="number"
              value={formData.dimensions.width}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              placeholder="0.0"
            />
            
            <FormField
              label="Height"
              name="dimensions.height"
              type="number"
              value={formData.dimensions.height}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              placeholder="0.0"
            />
            
            <FormField
              label="Unit"
              name="dimensions.unit"
              type="select"
              value={formData.dimensions.unit}
              onChange={handleInputChange}
              options={[
                { value: "cm", label: "cm" },
                { value: "in", label: "inches" },
                { value: "mm", label: "mm" }
              ]}
            />
          </div>
          {/* Size Chart Visibility Toggle */}
          <div className=" pt-3 sm:pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <h4 className="text-xs sm:text-sm font-medium text-gray-900">Size Chart Visibility</h4>
                <p className="text-xs sm:text-sm text-gray-500">Show size chart button on product page</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.size_chart_override !== 'hide'}
                  onChange={(e) => {
                    const newValue = e.target.checked ? 'auto' : 'hide';
                    handleInputChange({
                      target: {
                        name: 'size_chart_override',
                        value: newValue
                      }
                    });
                  }}
                />
                <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {formData.size_chart_override !== 'hide' 
                ? '✅ Size chart will be shown to customers' 
                : '❌ Size chart will be hidden from customers'}
            </p>
          </div>
        </div>
      </div>
    </StepContainer>
  )
}
