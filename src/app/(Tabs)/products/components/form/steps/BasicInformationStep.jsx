'use client'
import React from 'react'
import { FaInfoCircle } from 'react-icons/fa'
import StepContainer from '../shared/StepContainer'
import FormField from '../shared/FormField'

export default function BasicInformationStep({ 
  formData, 
  categories, 
  handleInputChange, 
  onNext 
}) {
  // Create category options with better error handling
  const categoryOptions = React.useMemo(() => {
    const baseOptions = [{ value: "", label: "Select a category" }]
    
    if (!categories) {
      return [...baseOptions, { value: "", label: "Loading categories...", disabled: true }]
    }
    
    if (categories.length === 0) {
      return [...baseOptions, { value: "", label: "No categories available", disabled: true }]
    }
    
    return [
      ...baseOptions,
      ...categories.map(category => ({
        value: category.id,
        label: category.name
      }))
    ]
  }, [categories])

  return (
    <StepContainer
      icon={FaInfoCircle}
      iconBgColor="bg-blue-100"
      iconColor="text-blue-600"
      title="Basic Information"
      description="Enter the basic details about your product"
      onNext={onNext}
      nextLabel="Next: Pricing"
      showBack={false}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Product Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          placeholder="Enter product name"
          tooltip="Choose a clear, descriptive name for your product"
          colSpan={2}
        />

        <FormField
          label="Product Subtitle"
          name="subtitle"
          value={formData.subtitle}
          onChange={handleInputChange}
          placeholder="Enter product subtitle"
          tooltip="A short tagline or key feature highlight"
          colSpan={2}
        />

        <FormField
          label="Description"
          name="description"
          type="textarea"
          value={formData.description}
          onChange={handleInputChange}
          required
          placeholder="Describe your product in detail..."
          tooltip="Detailed description of your product features and benefits"
          rows={4}
          colSpan={2}
        />

        <FormField
          label="Brand"
          name="brand"
          value={formData.brand}
          onChange={handleInputChange}
          placeholder="Enter brand name"
          tooltip="The brand or manufacturer of this product"
        />

        <FormField
          label="SKU"
          name="sku"
          value={formData.sku}
          onChange={handleInputChange}
          placeholder="Enter SKU"
          tooltip="Stock Keeping Unit - unique identifier for inventory tracking"
        />

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
            <div className="inline-block ml-1 group relative">
              <div className="text-gray-400 text-xs cursor-help">ⓘ</div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Select the most appropriate category for your product
              </div>
            </div>
          </label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {categoryOptions.map((option, index) => (
              <option key={index} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Category status indicator */}
          <div className="mt-2 flex items-center gap-2 text-sm">
            {!categories ? (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-red-500">
                ⚠️ No categories available
              </div>
            ) : (
              <div className="text-green-600">
                ✅ {categories.length} categories available
                {formData.category_id && (
                  <span className="ml-2 text-blue-600">
                    | Selected: {categories.find(cat => cat.id === formData.category_id)?.name || 'Unknown'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Debug info - separate from FormField */}
        {process.env.NODE_ENV === 'development' && (
          <div className="col-span-2 text-xs text-gray-500 -mt-4 mb-2 p-2 bg-gray-100 rounded">
            <div><strong>Debug Info:</strong></div>
            <div>Categories loaded: {categories?.length || 0}</div>
            <div>Categories array: {categories ? 'exists' : 'null/undefined'}</div>
            <div>Current category_id: "{formData.category_id}"</div>
            {categories?.length > 0 && (
              <div className="mt-1">
                Available: {categories.map(cat => `${cat.name} (${cat.id})`).join(', ')}
              </div>
            )}
            <div className="mt-1">
              Options generated: {categoryOptions.length} items
            </div>
          </div>
        )}
      </div>
    </StepContainer>
  )
}
