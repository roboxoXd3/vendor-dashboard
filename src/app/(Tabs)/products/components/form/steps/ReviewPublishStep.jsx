'use client'
import { FaEye, FaSave, FaVideo } from 'react-icons/fa'
import StepContainer from '../shared/StepContainer'

export default function ReviewPublishStep({ 
  formData,
  categories,
  vendor,
  loading,
  onBack,
  isEdit = false
}) {
  return (
    <StepContainer
      icon={FaEye}
      iconBgColor="bg-emerald-100"
      iconColor="text-emerald-600"
      title="Review & Publish"
      description="Review your product details before publishing"
      onBack={onBack}
      showNext={true}
      isLastStep={true}
      nextLabel={isEdit ? "Update Product" : "Create Product"}
      nextDisabled={loading}
    >
      <div className="space-y-6">
        {/* Product Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Basic Information</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Name:</span> {formData.name || 'Not specified'}</div>
                <div><span className="font-medium">Subtitle:</span> {formData.subtitle || 'Not specified'}</div>
                <div><span className="font-medium">Brand:</span> {formData.brand || 'Not specified'}</div>
                <div><span className="font-medium">SKU:</span> {formData.sku || 'Not specified'}</div>
                <div><span className="font-medium">Category:</span> {
                  categories?.find(cat => cat.id === formData.category_id)?.name || 'Not selected'
                }</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Pricing & Inventory</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Selling Price:</span> {formData.currency} {formData.price || 'Not set'}</div>
                <div><span className="font-medium">MRP:</span> {formData.mrp ? `${formData.currency} ${formData.mrp}` : 'Not set'}</div>
                <div><span className="font-medium">Sale Price:</span> {formData.sale_price ? `${formData.currency} ${formData.sale_price}` : 'Not set'}</div>
                <div><span className="font-medium">Stock:</span> {formData.stock_quantity || '0'} units</div>
                <div><span className="font-medium">Weight:</span> {formData.weight ? `${formData.weight} kg` : 'Not specified'}</div>
                <div><span className="font-medium">Dimensions:</span> {
                  formData.dimensions?.length || formData.dimensions?.width || formData.dimensions?.height ? 
                  `${formData.dimensions.length || 0} × ${formData.dimensions.width || 0} × ${formData.dimensions.height || 0} ${formData.dimensions.unit || 'cm'}` : 
                  'Not specified'
                }</div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
          <div className="text-sm text-gray-700">
            {formData.description ? (
              <p className="leading-relaxed">{formData.description}</p>
            ) : (
              <p className="text-gray-500 italic">No description provided</p>
            )}
          </div>
        </div>

        {/* Media Preview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Media</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Images ({formData.images?.length || 0})</h4>
              {formData.images && formData.images.length > 0 ? (
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
                    <div className="w-full h-16 bg-gray-200 rounded border flex items-center justify-center text-xs text-gray-500">
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
                <div className="space-y-2">
                  <div className="p-2 bg-white rounded border text-sm">
                    <FaVideo className="inline mr-2 text-red-500" />
                    Video added
                  </div>
                  <div className="text-xs text-gray-600 break-all">
                    <span className="font-medium">URL:</span> {formData.video_url}
                  </div>
                  {formData.video_url.includes('supabase') && (
                    <div className="text-xs text-green-600">
                      ✓ Uploaded to storage
                    </div>
                  )}
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
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Sizes ({formData.sizes?.length || 0})</h4>
              {formData.sizes && formData.sizes.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {formData.sizes.slice(0, 5).map((size, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {size}
                    </span>
                  ))}
                  {formData.sizes.length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{formData.sizes.length - 5} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No sizes added</p>
              )}
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Colors ({Object.keys(formData.colors || {}).length})</h4>
              {formData.colors && Object.keys(formData.colors).length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(formData.colors).slice(0, 5).map(([colorName, hexValue], index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-full border border-gray-300"
                        style={{ backgroundColor: hexValue }}
                      ></div>
                      {colorName}
                    </span>
                  ))}
                  {Object.keys(formData.colors).length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{Object.keys(formData.colors).length - 5} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No colors added</p>
              )}
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Tags ({formData.tags?.length || 0})</h4>
              {formData.tags && formData.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                  {formData.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{formData.tags.length - 3} more
                    </span>
                  )}
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
              <h4 className="font-medium text-gray-700 mb-2">Box Contents ({formData.box_contents?.length || 0})</h4>
              {formData.box_contents && formData.box_contents.length > 0 ? (
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
                <div>Usage: {formData.usage_instructions?.length || 0} items</div>
                <div>Care: {formData.care_instructions?.length || 0} items</div>
                <div>Safety: {formData.safety_notes?.length || 0} items</div>
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

        {loading && (
          <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mr-3"></div>
            <span className="text-emerald-600 font-medium">
              {isEdit ? 'Updating product...' : 'Creating product...'}
            </span>
          </div>
        )}
      </div>
    </StepContainer>
  )
}
