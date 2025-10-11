'use client'
import { FaImage, FaVideo } from 'react-icons/fa'
import StepContainer from '../shared/StepContainer'
import { MainImageUpload } from '@/components/ImageUpload'
import VideoUpload from '@/components/VideoUpload'
import EnhancedColorImageUpload from '@/components/EnhancedColorImageUpload'

export default function MediaVideosStep({ 
  formData, 
  handleInputChange,
  handleImageUploaded,
  handleImageRemoved,
  handleVideoUploaded,
  handleVideoRemoved,
  addColorImage,
  removeColorImage,
  vendor,
  productId,
  onNext, 
  onBack 
}) {
  return (
    <StepContainer
      icon={FaImage}
      iconBgColor="bg-purple-100"
      iconColor="text-purple-600"
      title="Media & Videos"
      description="Upload photos and videos of your product"
      onNext={onNext}
      onBack={onBack}
      nextLabel="Next: Details"
    >
      <div className="space-y-6">
        {/* Main Images Upload */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaImage className="text-blue-600" />
            Product Images
            <div className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Required: Upload at least one main product image
            </div>
          </h3>
          
          <MainImageUpload
            onUploadSuccess={handleImageUploaded}
            onRemoveImage={handleImageRemoved}
            existingImages={formData.images}
            vendorId={vendor?.id}
            productId={productId}
          />
        </div>

        {/* Color-specific Images */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaImage className="text-green-600" />
            Color Variant Images
            <div className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Optional: Add images for specific colors
            </div>
          </h3>
          
          {Object.entries(formData.colors || {}).map(([colorName, colorData], index) => {
            // Handle both old format (string) and new format (object with hex and sizes)
            const hexValue = typeof colorData === 'string' ? colorData : (colorData?.hex || '#000000')
            return (
              <div key={index} className="mb-4 p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: hexValue }}
                  ></div>
                  <span className="font-medium text-gray-700">
                    Images for {colorName}
                  </span>
                </div>
              
              <EnhancedColorImageUpload
                color={colorName}
                onUploadSuccess={(imageUrl) => addColorImage(colorName, imageUrl)}
                onRemoveImage={(imageUrl) => removeColorImage(colorName, imageUrl)}
                existingImages={formData.color_images[colorName] || []}
                mainImages={formData.images || []} // Pass main images for selection
                vendorId={vendor?.id}
                productId={productId}
              />
              </div>
            )
          })}
          
          {(!formData.colors || Object.keys(formData.colors).length === 0) ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <FaImage className="mx-auto text-4xl text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium mb-2">No Color Variants Added Yet</p>
              <p className="text-gray-500 text-sm">
                You added colors in the previous step (Variants & Options). <br/>
                Color-specific images will appear here once you add colors.
              </p>
              <button
                type="button"
                onClick={onBack} // Go back to variants step
                className="mt-3 px-4 py-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
              >
                ← Go back to add colors
              </button>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm font-medium mb-1">
                🎨 Great! You have {Object.keys(formData.colors || {}).length} color variant{Object.keys(formData.colors || {}).length > 1 ? 's' : ''}
              </p>
              <p className="text-blue-600 text-xs mb-2">
                For each color, you can either <strong>select from main images</strong> or <strong>upload new images</strong> specific to that variant.
              </p>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Select from {formData.images?.length || 0} main images</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Upload new variant-specific images</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Product Video */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaVideo className="text-red-600" />
            Product Video
            <div className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              Optional: Add a video to showcase your product in action
            </div>
          </h3>
          
          <VideoUpload
            onVideoUploaded={handleVideoUploaded}
            onVideoRemoved={handleVideoRemoved}
            existingVideoUrl={formData.video_url}
            vendorId={vendor?.id}
            productId={productId}
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
    </StepContainer>
  )
}
