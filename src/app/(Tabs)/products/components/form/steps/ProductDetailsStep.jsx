'use client'
import { FaBox, FaPlus, FaTimes } from 'react-icons/fa'
import StepContainer from '../shared/StepContainer'

export default function ProductDetailsStep({ 
  formData,
  handleInputChange,
  addToArray,
  removeFromArray,
  onNext, 
  onBack 
}) {
  const handleAddBoxContent = () => {
    const input = document.getElementById('new-box-content')
    if (input.value.trim()) {
      addToArray('box_contents', input.value.trim())
      input.value = ''
    }
  }

  const handleAddUsageInstruction = () => {
    const input = document.getElementById('new-usage-instruction')
    if (input.value.trim()) {
      addToArray('usage_instructions', input.value.trim())
      input.value = ''
    }
  }

  const handleAddCareInstruction = () => {
    const input = document.getElementById('new-care-instruction')
    if (input.value.trim()) {
      addToArray('care_instructions', input.value.trim())
      input.value = ''
    }
  }

  const handleAddSafetyNote = () => {
    const input = document.getElementById('new-safety-note')
    if (input.value.trim()) {
      addToArray('safety_notes', input.value.trim())
      input.value = ''
    }
  }

  const InstructionSection = ({ title, items, inputId, onAdd, onRemove, placeholder, arrayKey }) => (
    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{title}</h3>
      
      <div className="flex flex-col sm:flex-row gap-2 mb-3 sm:mb-4">
        <input
          id={inputId}
          type="text"
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
          onKeyPress={(e) => e.key === 'Enter' && onAdd()}
        />
        <button
          type="button"
          onClick={onAdd}
          className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 text-sm"
        >
          <FaPlus size={10} className="sm:w-3 sm:h-3" /> Add
        </button>
      </div>
      
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 sm:p-3 bg-white border border-gray-200 rounded-lg"
          >
            <span className="text-xs sm:text-sm text-gray-700 flex-1 pr-2">{index + 1}. {item}</span>
            <button
              type="button"
              onClick={() => onRemove(arrayKey, item)}
              className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
            >
              <FaTimes size={10} className="sm:w-3 sm:h-3" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-gray-500 text-xs sm:text-sm italic">No items added yet</p>
        )}
      </div>
    </div>
  )

  return (
    <StepContainer
      icon={FaBox}
      iconBgColor="bg-indigo-100"
      iconColor="text-indigo-600"
      title="Product Details"
      description="Add package contents and instructions"
      onNext={onNext}
      onBack={onBack}
      nextLabel="Next: Review"
    >
      <div className="space-y-4 sm:space-y-6">
        <InstructionSection
          title="What's in the Box"
          items={formData.box_contents}
          inputId="new-box-content"
          onAdd={handleAddBoxContent}
          onRemove={removeFromArray}
          placeholder="Enter box content item (e.g., 1x Headphones, 1x USB Cable)"
          arrayKey="box_contents"
        />

        <InstructionSection
          title="Usage Instructions"
          items={formData.usage_instructions}
          inputId="new-usage-instruction"
          onAdd={handleAddUsageInstruction}
          onRemove={removeFromArray}
          placeholder="Enter usage instruction (e.g., Press power button to turn on)"
          arrayKey="usage_instructions"
        />

        <InstructionSection
          title="Care Instructions"
          items={formData.care_instructions}
          inputId="new-care-instruction"
          onAdd={handleAddCareInstruction}
          onRemove={removeFromArray}
          placeholder="Enter care instruction (e.g., Clean with dry cloth only)"
          arrayKey="care_instructions"
        />

        <InstructionSection
          title="Safety Notes"
          items={formData.safety_notes}
          inputId="new-safety-note"
          onAdd={handleAddSafetyNote}
          onRemove={removeFromArray}
          placeholder="Enter safety note (e.g., Keep away from water)"
          arrayKey="safety_notes"
        />

        {/* Product Settings */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Product Settings</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <label className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border border-gray-200 rounded-lg bg-white cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleInputChange}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="font-medium text-gray-900 text-sm sm:text-base">Featured Product</span>
                <p className="text-xs sm:text-sm text-gray-500">Display this product prominently</p>
              </div>
            </label>

            <label className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border border-gray-200 rounded-lg bg-white cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                name="is_new_arrival"
                checked={formData.is_new_arrival}
                onChange={handleInputChange}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="font-medium text-gray-900 text-sm sm:text-base">New Arrival</span>
                <p className="text-xs sm:text-sm text-gray-500">Mark as recently added</p>
              </div>
            </label>

            <label className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border border-gray-200 rounded-lg bg-white cursor-pointer hover:bg-gray-50 sm:col-span-2">
              <input
                type="checkbox"
                name="shipping_required"
                checked={formData.shipping_required}
                onChange={handleInputChange}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="font-medium text-gray-900 text-sm sm:text-base">Shipping Required</span>
                <p className="text-xs sm:text-sm text-gray-500">This product needs to be shipped</p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </StepContainer>
  )
}
