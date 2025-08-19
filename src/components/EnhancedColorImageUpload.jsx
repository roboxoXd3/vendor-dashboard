'use client'
import { useState } from 'react'
import { FaImage, FaUpload, FaCheck, FaTimes, FaClone } from 'react-icons/fa'
import ImageUpload from './ImageUpload'

export default function EnhancedColorImageUpload({
  color,
  onUploadSuccess,
  onRemoveImage,
  existingImages = [],
  mainImages = [], // New prop for main product images
  vendorId,
  productId,
  className = ''
}) {
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [selectedFromMain, setSelectedFromMain] = useState([])

  // Handle selecting an image from main images
  const handleSelectFromMain = (imageUrl) => {
    if (selectedFromMain.includes(imageUrl)) {
      // Deselect
      setSelectedFromMain(prev => prev.filter(url => url !== imageUrl))
    } else {
      // Select
      setSelectedFromMain(prev => [...prev, imageUrl])
    }
  }

  // Confirm selection of main images for this color
  const handleConfirmSelection = () => {
    selectedFromMain.forEach(imageUrl => {
      onUploadSuccess?.(imageUrl)
    })
    setSelectedFromMain([])
    setShowImageSelector(false)
  }

  // Cancel selection
  const handleCancelSelection = () => {
    setSelectedFromMain([])
    setShowImageSelector(false)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Action Buttons */}
      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={() => setShowImageSelector(true)}
          disabled={!mainImages || mainImages.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          <FaClone size={14} />
          Select from Main Images
          {mainImages?.length > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {mainImages.length}
            </span>
          )}
        </button>
        
        <div className="text-gray-400 text-sm flex items-center">
          OR
        </div>
        
        <div className="text-gray-600 text-sm flex items-center">
          Upload new images below ↓
        </div>
      </div>

      {/* Image Selector Modal */}
      {showImageSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Images for {color} Variant
              </h3>
              <button
                onClick={handleCancelSelection}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {mainImages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaImage className="mx-auto text-4xl mb-3 text-gray-300" />
                <p>No main images uploaded yet.</p>
                <p className="text-sm">Upload main product images first to select from them.</p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Select which main product images should also represent the <strong>{color}</strong> color variant:
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {mainImages.map((imageUrl, index) => {
                    const isSelected = selectedFromMain.includes(imageUrl)
                    const isAlreadyUsed = existingImages.includes(imageUrl)
                    
                    return (
                      <div
                        key={index}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : isAlreadyUsed
                            ? 'border-green-500 ring-2 ring-green-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => !isAlreadyUsed && handleSelectFromMain(imageUrl)}
                      >
                        <img
                          src={imageUrl}
                          alt={`Main image ${index + 1}`}
                          className={`w-full h-32 object-cover ${
                            isAlreadyUsed ? 'opacity-50' : ''
                          }`}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4='
                          }}
                        />
                        
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                            <FaCheck size={12} />
                          </div>
                        )}
                        
                        {/* Already used indicator */}
                        {isAlreadyUsed && (
                          <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                            <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                              Already Added
                            </div>
                          </div>
                        )}
                        
                        {/* Image number */}
                        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          #{index + 1}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Selection Summary */}
                {selectedFromMain.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-blue-800 text-sm font-medium">
                      Selected {selectedFromMain.length} image{selectedFromMain.length > 1 ? 's' : ''} for {color} variant
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCancelSelection}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSelection}
                    disabled={selectedFromMain.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Selected Images ({selectedFromMain.length})
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Regular Image Upload Component */}
      <ImageUpload
        vendorId={vendorId}
        productId={productId}
        type={`color-${color.toLowerCase().replace(/\s+/g, '-')}`}
        onUploadSuccess={onUploadSuccess}
        onRemoveImage={onRemoveImage}
        existingImages={existingImages}
        multiple={true}
        className="w-full"
      />

      {/* Info Message */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-gray-600 text-sm">
          💡 <strong>Tip:</strong> You can either select from already uploaded main images or upload new images specific to this color variant.
        </p>
      </div>
    </div>
  )
}
