'use client'
import { FaTags, FaPlus, FaTimes } from 'react-icons/fa'
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

  const handleAddColor = () => {
    const colorInput = document.getElementById('new-color')
    if (colorInput.value.trim()) {
      const input = colorInput.value.trim()
      
      // Check if input contains commas (bulk input)
      if (input.includes(',')) {
        // Split by comma and clean up each color
        const colors = input
          .split(',')
          .map(color => color.trim())
          .filter(color => color.length > 0) // Remove empty strings
        
        // Add each color to the array
        colors.forEach(color => {
          addToArray('colors', color)
        })
      } else {
        // Single color input
        addToArray('colors', input)
      }
      
      colorInput.value = ''
    }
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
      <div className="space-y-6">
        {/* Sizes Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Sizes</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Sizes</label>
            <div className="flex gap-2">
              <input
                id="new-size"
                type="text"
                placeholder="Single size (e.g., S) or multiple sizes (e.g., XS, S, M, L, XL)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSizes()}
              />
              <button
                type="button"
                onClick={handleAddSizes}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <FaPlus size={12} /> Add
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Single size: "S" | Multiple sizes: "XS, S, M, L, XL" | Shoe sizes: "7, 8, 9, 10, 11"
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.sizes.map((size, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {size}
                <button
                  type="button"
                  onClick={() => removeFromArray('sizes', size)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FaTimes size={10} />
                </button>
              </span>
            ))}
            {formData.sizes.length === 0 && (
              <p className="text-gray-500 text-sm italic">No sizes added yet</p>
            )}
          </div>
        </div>

        {/* Colors Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Colors</h3>
          
          <div className="flex gap-2 mb-4">
            <input
              id="new-color"
              type="text"
              placeholder="Single color (e.g., Red) or multiple colors (e.g., Red, Blue, Green)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              onKeyPress={(e) => e.key === 'Enter' && handleAddColor()}
            />
            <button
              type="button"
              onClick={handleAddColor}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <FaPlus size={12} /> Add Color
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Single color: "Red" | Multiple colors: "Red, Blue, Green" | Hex codes: "#FF0000, #00FF00"
          </p>
          
          <div className="flex flex-wrap gap-2">
            {formData.colors.map((color, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
              >
                <div 
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.startsWith('#') ? color : color.toLowerCase() }}
                ></div>
                {color}
                <button
                  type="button"
                  onClick={() => removeFromArray('colors', color)}
                  className="text-green-600 hover:text-green-800"
                >
                  <FaTimes size={10} />
                </button>
              </span>
            ))}
            {formData.colors.length === 0 && (
              <p className="text-gray-500 text-sm italic">No colors added yet</p>
            )}
          </div>
        </div>

        {/* Tags Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Tags</h3>
          
          <div className="flex gap-2 mb-4">
            <input
              id="new-tag"
              type="text"
              placeholder="Enter tag (e.g., wireless, premium, bestseller)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <FaPlus size={12} /> Add Tag
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeFromArray('tags', tag)}
                  className="text-purple-600 hover:text-purple-800"
                >
                  <FaTimes size={10} />
                </button>
              </span>
            ))}
            {formData.tags.length === 0 && (
              <p className="text-gray-500 text-sm italic">No tags added yet</p>
            )}
          </div>
        </div>

        {/* Dimensions Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Dimensions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        </div>
      </div>
    </StepContainer>
  )
}
