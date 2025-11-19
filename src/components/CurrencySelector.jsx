'use client'
import { useState, useMemo } from 'react'
import { useCurrencyContext } from '@/contexts/CurrencyContext'
import { FaGlobe, FaCheck, FaSearch } from 'react-icons/fa'

// Allowed currencies for the dropdown
const ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'NGN', 'CAD', 'AUD', 'JPY']

export default function CurrencySelector({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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
    setSearchQuery('')
  }

  // Filter to only allowed currencies
  const allowedCurrencies = useMemo(() => {
    return supportedCurrencies.filter(currency => 
      ALLOWED_CURRENCIES.includes(currency.code)
    )
  }, [supportedCurrencies])

  // Filter currencies based on search query
  const filteredCurrencies = useMemo(() => {
    let currencies = allowedCurrencies
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      currencies = allowedCurrencies.filter(currency => 
        currency.code.toLowerCase().includes(query) ||
        currency.name.toLowerCase().includes(query) ||
        currency.symbol.toLowerCase().includes(query)
      )
    }
    
    return currencies
  }, [allowedCurrencies, searchQuery])

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
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-2">
                Currency
              </div>
              
              {/* Search Input */}
              {allowedCurrencies.length > 5 && (
                <div className="mb-2 relative">
                  <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              )}
              
              {/* Currency List - Scrollable */}
              <div className="max-h-64 overflow-y-auto">
                {filteredCurrencies.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-gray-500 text-center">
                    No currencies found
                  </div>
                ) : (
                  filteredCurrencies.map((currency) => (
                    <button
                      key={currency.code}
                      onClick={() => handleCurrencyChange(currency.code)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md hover:bg-gray-50 transition-colors ${
                        currency.code === globalCurrency ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-medium text-sm flex-shrink-0">{currency.symbol}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{currency.code}</div>
                          <div className="text-xs text-gray-500 truncate">{currency.name}</div>
                        </div>
                      </div>
                      
                      {currency.code === globalCurrency && (
                        <FaCheck className="w-3 h-3 text-emerald-600 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  ))
                )}
              </div>
              
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 px-2 py-1">
                  Prices shown in selected currency
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
