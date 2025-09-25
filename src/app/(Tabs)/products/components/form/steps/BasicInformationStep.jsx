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

  // Create subcategory options based on selected category
  const subcategoryOptions = React.useMemo(() => {
    const baseOptions = [{ value: "", label: "Select a subcategory (optional)" }]
    
    if (!formData.category_id || !categories) {
      return baseOptions
    }
    
    const selectedCategory = categories.find(cat => cat.id === formData.category_id)
    
    if (!selectedCategory || !selectedCategory.subcategories || selectedCategory.subcategories.length === 0) {
      return [...baseOptions, { value: "", label: "No subcategories available", disabled: true }]
    }
    
    return [
      ...baseOptions,
      ...selectedCategory.subcategories.map(subcategory => ({
        value: subcategory.id,
        label: subcategory.name
      }))
    ]
  }, [formData.category_id, categories])

  // Handle category change - reset subcategory when category changes
  const handleCategoryChange = (e) => {
    const newCategoryId = e.target.value
    
    // Create a synthetic event for category change
    const categoryEvent = {
      target: {
        name: 'category_id',
        value: newCategoryId
      }
    }
    
    // Create a synthetic event to reset subcategory
    const subcategoryEvent = {
      target: {
        name: 'subcategory_id',
        value: ''
      }
    }
    
    handleInputChange(categoryEvent)
    handleInputChange(subcategoryEvent)
  }

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
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
            onChange={handleCategoryChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
          >
            {categoryOptions.map((option, index) => (
              <option key={index} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Category status indicator */}
          <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm">
            {!categories ? (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-gray-400"></div>
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
                  <span className="ml-2 text-blue-600 hidden sm:inline">
                    | Selected: {categories.find(cat => cat.id === formData.category_id)?.name || 'Unknown'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Subcategory Field */}
        <div className="col-span-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Subcategory
            <div className="inline-block ml-1 group relative">
              <div className="text-gray-400 text-xs cursor-help">ⓘ</div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Select a more specific subcategory (optional)
              </div>
            </div>
          </label>
          <select
            name="subcategory_id"
            value={formData.subcategory_id || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
          >
            {subcategoryOptions.map((option, index) => (
              <option key={index} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Subcategory status indicator */}
          <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm">
            {formData.category_id ? (
              (() => {
                const selectedCategory = categories?.find(cat => cat.id === formData.category_id)
                const subcategoryCount = selectedCategory?.subcategories?.length || 0
                
                if (subcategoryCount === 0) {
                  return (
                    <div className="text-gray-500">
                      ℹ️ No subcategories available for this category
                    </div>
                  )
                }
                
                return (
                  <div className="text-green-600">
                    ✅ {subcategoryCount} subcategories available
                    {formData.subcategory_id && (
                      <span className="ml-2 text-blue-600 hidden sm:inline">
                        | Selected: {selectedCategory?.subcategories?.find(sub => sub.id === formData.subcategory_id)?.name || 'Unknown'}
                      </span>
                    )}
                  </div>
                )
              })()
            ) : (
              <div className="text-gray-500">
                ℹ️ Select a category first to see subcategories
              </div>
            )}
          </div>
        </div>
      </div>
    </StepContainer>
  )
}
