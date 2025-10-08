'use client'
import { FaShoppingCart } from 'react-icons/fa'
import StepContainer from '../shared/StepContainer'
import FormField from '../shared/FormField'

export default function PricingInventoryStep({ 
  formData, 
  handleInputChange, 
  onNext, 
  onBack,
  supportedCurrencies = [],
  isLoadingCurrencies = false,
  currencyError = null
}) {
  // Use global currencies if available, fallback to hardcoded list
  const currencyOptions = supportedCurrencies.length > 0 
    ? supportedCurrencies.map(currency => ({
        value: currency.code,
        label: `${currency.code} (${currency.symbol})`
      }))
    : [
        { value: "USD", label: "USD ($)" },
        { value: "EUR", label: "EUR (€)" },
        { value: "GBP", label: "GBP (£)" },
        { value: "INR", label: "INR (₹)" },
        { value: "NGN", label: "NGN (₦)" }
      ]

  return (
    <StepContainer
      icon={FaShoppingCart}
      iconBgColor="bg-green-100"
      iconColor="text-green-600"
      title="Pricing & Inventory"
      description="Set your product pricing and stock information"
      onNext={onNext}
      onBack={onBack}
      nextLabel="Next: Variants"
    >
      <div className="space-y-4 sm:space-y-6">
        <FormField
          label="Selling Price"
          name="price"
          type="number"
          value={formData.price}
          onChange={handleInputChange}
          required
          min="0"
          step="0.01"
          placeholder="0.00"
          tooltip="The price customers will pay for this product"
        />

        <FormField
          label="MRP (Maximum Retail Price)"
          name="mrp"
          type="number"
          value={formData.mrp}
          onChange={handleInputChange}
          min="0"
          step="0.01"
          placeholder="0.00"
          tooltip="The original price before any discounts"
        />

        <FormField
          label="Sale Price"
          name="sale_price"
          type="number"
          value={formData.sale_price}
          onChange={handleInputChange}
          min="0"
          step="0.01"
          placeholder="0.00"
          tooltip="Special promotional price (optional)"
        />

        <div>
          <FormField
            label="Currency"
            name="currency"
            type="select"
            value={formData.currency}
            onChange={handleInputChange}
            options={currencyOptions}
            tooltip="The currency for pricing"
            disabled={isLoadingCurrencies}
          />
          {isLoadingCurrencies && (
            <p className="text-sm text-gray-500 mt-1">Loading currencies...</p>
          )}
          {currencyError && (
            <p className="text-sm text-red-500 mt-1">{currencyError}</p>
          )}
        </div>

        <FormField
          label="Weight (kg)"
          name="weight"
          type="number"
          value={formData.weight}
          onChange={handleInputChange}
          min="0"
          step="0.01"
          placeholder="0.00"
          tooltip="Product weight for shipping calculations"
        />

        {/* Stock Quantity Info */}
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">ℹ</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800">Stock Quantity Management</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Stock quantity is automatically calculated from the quantities you set for each color variant in the next step.
                  You don't need to enter a total stock quantity here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StepContainer>
  )
}
