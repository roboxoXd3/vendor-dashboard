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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          label="Stock Quantity"
          name="stock_quantity"
          type="number"
          value={formData.stock_quantity}
          onChange={handleInputChange}
          required
          min="0"
          placeholder="0"
          tooltip="Number of units available for sale"
        />

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
      </div>
    </StepContainer>
  )
}
