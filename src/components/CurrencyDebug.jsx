'use client'
import { useCurrencyContext } from '@/contexts/CurrencyContext'

export default function CurrencyDebug() {
  const { convertPrice, exchangeRates, globalCurrency } = useCurrencyContext()
  
  // Test conversion: 350 INR to NGN
  const testPrice = 350
  const fromCurrency = 'INR'
  const toCurrency = 'NGN'
  
  const convertedPrice = convertPrice(testPrice, fromCurrency, toCurrency)
  
  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="font-bold text-sm mb-2">Currency Debug</h3>
      <div className="text-xs space-y-1">
        <p><strong>Test:</strong> {testPrice} {fromCurrency} → {toCurrency}</p>
        <p><strong>Result:</strong> ₦{convertedPrice.toFixed(2)}</p>
        <p><strong>Expected:</strong> ₦6,323-6,342</p>
        <p><strong>Global Currency:</strong> {globalCurrency}</p>
        
        <details className="mt-2">
          <summary className="cursor-pointer text-blue-600">Exchange Rates</summary>
          <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(exchangeRates, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}
