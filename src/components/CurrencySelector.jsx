'use client'
import { useState } from 'react'
import { useCurrencyContext } from '@/contexts/CurrencyContext'
import { FaGlobe, FaCheck } from 'react-icons/fa'

export default function CurrencySelector({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const { 
    globalCurrency, 
    supportedCurrencies, 
    updateGlobalCurrency, 
    getCurrencySymbol,
    isLoading 
  } = useCurrencyContext()

  const handleCurrencyChange = (currencyCode) => {
    updateGlobalCurrency(currencyCode)
    setIsOpen(false)
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      >
        <FaGlobe className="w-4 h-4 text-gray-500" />
        <span className="font-medium">
          {globalCurrency} ({getCurrencySymbol(globalCurrency)})
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-2">
                Select Display Currency
              </div>
              
              {supportedCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencyChange(currency.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-gray-50 ${
                    currency.code === globalCurrency ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-lg">{currency.symbol}</span>
                    <div>
                      <div className="font-medium">{currency.code}</div>
                      <div className="text-xs text-gray-500">{currency.name}</div>
                    </div>
                  </div>
                  
                  {currency.code === globalCurrency && (
                    <FaCheck className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              ))}
              
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 px-3 py-1">
                  All product prices will be displayed in the selected currency
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
