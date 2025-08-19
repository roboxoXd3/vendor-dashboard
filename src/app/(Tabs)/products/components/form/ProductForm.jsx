'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { FaArrowLeft, FaMobile } from 'react-icons/fa'
import { imageCleanupService } from '@/services/imageCleanupService'

// Import step components
import BasicInformationStep from './steps/BasicInformationStep'
import PricingInventoryStep from './steps/PricingInventoryStep'
import MediaVideosStep from './steps/MediaVideosStep'
import VariantsOptionsStep from './steps/VariantsOptionsStep'
import ProductDetailsStep from './steps/ProductDetailsStep'
import ReviewPublishStep from './steps/ReviewPublishStep'

// Import hooks
import { useProductForm } from '@/app/(Tabs)/products/components/hooks/useProductForm'
import { useCategories } from '@/app/(Tabs)/products/components/hooks/useCategories'
import { useProductSubmit } from '@/app/(Tabs)/products/components/hooks/useProductSubmit'

// Import components
import ProductPreview from '@/components/ProductPreview'
import MobilePhonePreview from '@/components/MobilePhonePreview'

export default function ProductForm({ 
  initialData = null, 
  productId = null, 
  isEdit = false,
  onBack = null 
}) {
  const { vendor } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [showMobilePreview, setShowMobilePreview] = useState(false)

  // Custom hooks
  const {
    formData,
    handleInputChange,
    addToArray,
    removeFromArray,
    handleImageUploaded,
    handleImageRemoved,
    handleVideoUploaded,
    handleVideoRemoved,
    addColorImage,
    removeColorImage,
    updateFormData
  } = useProductForm(initialData)

  const { categories } = useCategories()
  const { loading, handleSubmit } = useProductSubmit(vendor)

  // Load initial data for edit mode
  useEffect(() => {
    if (initialData) {
      updateFormData(initialData)
    }
  }, [initialData, updateFormData])

  // Cleanup temporary images on component unmount or page navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Trigger cleanup when user navigates away
      imageCleanupService.cleanupTempImages()
    }

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      // Cleanup on component unmount
      window.removeEventListener('beforeunload', handleBeforeUnload)
      setTimeout(() => {
        imageCleanupService.cleanupTempImages()
      }, 1000)
    }
  }, [])

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Product name, description, and category' },
    { number: 2, title: 'Pricing', description: 'Set product prices and inventory' },
    { number: 3, title: 'Variants', description: 'Add sizes, colors, and tags' },
    { number: 4, title: 'Media', description: 'Upload photos and videos' },
    { number: 5, title: 'Details', description: 'Package contents and instructions' },
    { number: 6, title: 'Review', description: 'Review and publish your product' }
  ]

  const onSubmit = async (e) => {
    e.preventDefault()
    await handleSubmit(formData, productId)
  }

  const renderStep = () => {
    const stepProps = {
      formData,
      handleInputChange,
      addToArray,
      removeFromArray,
      onNext: () => setCurrentStep(prev => Math.min(prev + 1, 6)),
      onBack: () => setCurrentStep(prev => Math.max(prev - 1, 1))
    }

    switch (currentStep) {
      case 1:
        return (
          <BasicInformationStep
            {...stepProps}
            categories={categories}
          />
        )
      case 2:
        return <PricingInventoryStep {...stepProps} />
      case 3:
        return <VariantsOptionsStep {...stepProps} />
      case 4:
        return (
          <MediaVideosStep
            {...stepProps}
            handleImageUploaded={handleImageUploaded}
            handleImageRemoved={handleImageRemoved}
            handleVideoUploaded={handleVideoUploaded}
            handleVideoRemoved={handleVideoRemoved}
            addColorImage={addColorImage}
            removeColorImage={removeColorImage}
            vendor={vendor}
            productId={productId || 'temp'}
          />
        )
      case 5:
        return <ProductDetailsStep {...stepProps} />
      case 6:
        return (
          <ReviewPublishStep
            formData={formData}
            categories={categories}
            vendor={vendor}
            loading={loading}
            onBack={stepProps.onBack}
            isEdit={isEdit}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-white overflow-hidden">
      {/* Full Screen Layout */}
      <div className="h-full flex flex-col">
        {/* Top Header Bar */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaArrowLeft size={20} />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEdit ? 'Edit Product' : 'Add New Product'}
                </h1>
                <p className="text-gray-600 text-sm">
                  {isEdit ? 'Update your product information' : 'Create a new product for your store'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Mobile Preview Button */}
              <button
                onClick={() => setShowMobilePreview(true)}
                className="xl:hidden px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <FaMobile size={16} />
                Preview
              </button>

              {/* Step Indicator */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  Step {currentStep} of {steps.length}: {steps.find(s => s.number === currentStep)?.title}
                </span>
              </div>
            </div>
          </div>

          {/* Compact Progress Bar */}
          <div className="mt-4">
            <div className="relative">
              <div className="h-2 bg-gray-200 rounded-full"></div>
              <div 
                className="absolute top-0 left-0 h-2 bg-emerald-500 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              ></div>
            </div>
            
            {/* Compact Step Navigation */}
            <div className="flex justify-between mt-3">
              {steps.map((step) => (
                <button
                  key={step.number}
                  onClick={() => setCurrentStep(step.number)}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 hover:bg-gray-50 ${
                    currentStep === step.number ? 'bg-emerald-50' : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    currentStep >= step.number
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step.number}
                  </div>
                  <div className={`text-xs font-medium mt-1 ${
                    currentStep >= step.number ? 'text-emerald-600' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Form Section - Scrollable */}
          <div className="flex-1 xl:w-1/2 overflow-y-auto">
            <div className="p-6">
              <form onSubmit={onSubmit} className="max-w-4xl">
                {renderStep()}
              </form>
            </div>
          </div>
          
          {/* Preview Panel - Fixed */}
          <div className="hidden xl:block xl:w-1/2 bg-gray-50">
            <div className="h-full flex items-center justify-center px-6 py-8 overflow-hidden">
              <div className="flex items-center justify-center" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                <div className="transform scale-65 origin-center">
                  <MobilePhonePreview 
                    formData={formData} 
                    categories={categories}
                    vendor={vendor}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Preview Modal */}
        {showMobilePreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[95vh] overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Live Mobile Preview</h3>
                  <p className="text-sm text-gray-600">Full mobile experience</p>
                </div>
                <button
                  onClick={() => setShowMobilePreview(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex justify-center overflow-hidden">
                <div className="transform scale-90 origin-top">
                  <MobilePhonePreview 
                    formData={formData} 
                    categories={categories}
                    vendor={vendor}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
