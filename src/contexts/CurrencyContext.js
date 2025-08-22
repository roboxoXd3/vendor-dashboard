'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import currencyService from '@/services/currencyService'

const CurrencyContext = createContext()

export const useCurrencyContext = () => {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrencyContext must be used within a CurrencyProvider')
  }
  return context
}

export const CurrencyProvider = ({ children }) => {
  // Global currency preference - default to NGN for your use case
  const [globalCurrency, setGlobalCurrency] = useState('NGN')
  const [supportedCurrencies, setSupportedCurrencies] = useState([])
  const [exchangeRates, setExchangeRates] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load currency data and preferences
  const loadCurrencyData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await currencyService.getCurrencyData()
      setSupportedCurrencies(data.currencies || [])
      setExchangeRates(data.rates || {})
      
      // Load saved global currency preference from localStorage
      const savedCurrency = localStorage.getItem('vendor_global_currency')
      if (savedCurrency && data.currencies?.some(c => c.code === savedCurrency)) {
        setGlobalCurrency(savedCurrency)
      }
    } catch (err) {
      console.error('Error loading currency data:', err)
      setError('Failed to load currency data')
      
      // Fallback currencies
      setSupportedCurrencies([
        { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
        { code: 'INR', symbol: '₹', name: 'Indian Rupee' }
      ])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCurrencyData()
  }, [loadCurrencyData])

  // Update global currency preference
  const updateGlobalCurrency = useCallback((currencyCode) => {
    setGlobalCurrency(currencyCode)
    localStorage.setItem('vendor_global_currency', currencyCode)
  }, [])

  // Get currency symbol by code
  const getCurrencySymbol = useCallback((currencyCode) => {
    const currency = supportedCurrencies.find(c => c.code === currencyCode)
    return currency ? currency.symbol : currencyCode
  }, [supportedCurrencies])

  // Convert price from one currency to another
  const convertPrice = useCallback((price, fromCurrency, toCurrency = null) => {
    const targetCurrency = toCurrency || globalCurrency
    
    if (fromCurrency === targetCurrency) {
      return price
    }

    // Direct rate (from -> to)
    if (exchangeRates[fromCurrency] && exchangeRates[fromCurrency][targetCurrency]) {
      return price * exchangeRates[fromCurrency][targetCurrency].rate
    }
    
    // Inverse rate (to -> from)
    if (exchangeRates[targetCurrency] && exchangeRates[targetCurrency][fromCurrency]) {
      return price / exchangeRates[targetCurrency][fromCurrency].rate
    }
    
    // Cross-conversion via USD (most common case)
    if (fromCurrency !== 'USD' && targetCurrency !== 'USD') {
      // Convert from source currency to USD first
      let usdAmount = price
      
      if (exchangeRates[fromCurrency] && exchangeRates[fromCurrency]['USD']) {
        // Direct rate to USD
        usdAmount = price * exchangeRates[fromCurrency]['USD'].rate
      } else if (exchangeRates['USD'] && exchangeRates['USD'][fromCurrency]) {
        // Inverse rate from USD
        usdAmount = price / exchangeRates['USD'][fromCurrency].rate
      } else {
        console.warn(`No USD conversion rate found for ${fromCurrency}`)
        return price
      }
      
      // Convert from USD to target currency
      if (exchangeRates['USD'] && exchangeRates['USD'][targetCurrency]) {
        // Direct rate from USD
        return usdAmount * exchangeRates['USD'][targetCurrency].rate
      } else if (exchangeRates[targetCurrency] && exchangeRates[targetCurrency]['USD']) {
        // Inverse rate to USD
        return usdAmount / exchangeRates[targetCurrency]['USD'].rate
      } else {
        console.warn(`No USD conversion rate found for ${targetCurrency}`)
        return usdAmount
      }
    }
    
    // Convert to/from USD
    if (fromCurrency === 'USD') {
      if (exchangeRates['USD'] && exchangeRates['USD'][targetCurrency]) {
        return price * exchangeRates['USD'][targetCurrency].rate
      }
    }
    
    if (targetCurrency === 'USD') {
      if (exchangeRates[fromCurrency] && exchangeRates[fromCurrency]['USD']) {
        return price * exchangeRates[fromCurrency]['USD'].rate
      }
    }
    
    // No conversion rate available, return original price
    console.warn(`No exchange rate found for ${fromCurrency} to ${targetCurrency}`)
    return price
  }, [exchangeRates, globalCurrency])

  // Format price with global currency
  const formatPrice = useCallback((price, fromCurrency = null, options = {}) => {
    const {
      showSymbol = true,
      decimals = 2,
      locale = 'en-NG' // Nigerian locale for NGN formatting
    } = options

    // If fromCurrency is provided, convert to global currency
    const finalPrice = fromCurrency && fromCurrency !== globalCurrency 
      ? convertPrice(price, fromCurrency, globalCurrency)
      : price

    const symbol = getCurrencySymbol(globalCurrency)
    
    if (showSymbol) {
      // Try to use Intl.NumberFormat for proper currency formatting
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: globalCurrency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(finalPrice)
      } catch (error) {
        // Fallback to simple formatting
        return `${symbol}${Number(finalPrice).toFixed(decimals)}`
      }
    }
    
    return Number(finalPrice).toFixed(decimals)
  }, [globalCurrency, convertPrice, getCurrencySymbol])

  // Format price for product listing (always in global currency)
  const formatProductPrice = useCallback((product) => {
    const productCurrency = product.currency || 'USD'
    return {
      price: formatPrice(product.price || 0, productCurrency),
      mrp: product.mrp ? formatPrice(product.mrp, productCurrency) : null,
      salePrice: product.sale_price ? formatPrice(product.sale_price, productCurrency) : null
    }
  }, [formatPrice])

  const value = {
    // State
    globalCurrency,
    supportedCurrencies,
    exchangeRates,
    isLoading,
    error,
    
    // Functions
    updateGlobalCurrency,
    getCurrencySymbol,
    convertPrice,
    formatPrice,
    formatProductPrice,
    loadCurrencyData
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export default CurrencyProvider
