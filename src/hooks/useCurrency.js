'use client'
import { useState, useEffect, useCallback } from 'react'
import currencyService from '@/services/currencyService'

export const useCurrency = () => {
  const [supportedCurrencies, setSupportedCurrencies] = useState([])
  const [exchangeRates, setExchangeRates] = useState({})
  const [defaultCurrency, setDefaultCurrency] = useState({ code: 'USD', symbol: '$', name: 'US Dollar' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load currency data
  const loadCurrencyData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await currencyService.getCurrencyData()
      setSupportedCurrencies(data.currencies || [])
      setExchangeRates(data.rates || {})
      setDefaultCurrency(data.defaultCurrency || { code: 'USD', symbol: '$', name: 'US Dollar' })
    } catch (err) {
      console.error('Error loading currency data:', err)
      setError('Failed to load currency data')
      
      // Fallback to default currencies
      setSupportedCurrencies([
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
        { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
        { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
        { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
        { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
        { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
      ])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCurrencyData()
  }, [loadCurrencyData])

  // Get currency symbol by code
  const getCurrencySymbol = useCallback((currencyCode) => {
    const currency = supportedCurrencies.find(c => c.code === currencyCode)
    return currency ? currency.symbol : currencyCode
  }, [supportedCurrencies])

  // Get currency name by code
  const getCurrencyName = useCallback((currencyCode) => {
    const currency = supportedCurrencies.find(c => c.code === currencyCode)
    return currency ? currency.name : currencyCode
  }, [supportedCurrencies])

  // Convert price from one currency to another
  const convertPrice = useCallback((price, fromCurrency, toCurrency = null) => {
    const targetCurrency = toCurrency || defaultCurrency.code
    
    if (fromCurrency === targetCurrency) {
      return price
    }

    // Direct rate
    if (exchangeRates[fromCurrency] && exchangeRates[fromCurrency][targetCurrency]) {
      return price * exchangeRates[fromCurrency][targetCurrency].rate
    }
    
    // Inverse rate
    if (exchangeRates[targetCurrency] && exchangeRates[targetCurrency][fromCurrency]) {
      return price / exchangeRates[targetCurrency][fromCurrency].rate
    }
    
    // No conversion rate available, return original price
    return price
  }, [exchangeRates, defaultCurrency.code])

  // Format price with currency symbol
  const formatPrice = useCallback((price, currencyCode, options = {}) => {
    const {
      showSymbol = true,
      decimals = 2,
      locale = 'en-US'
    } = options

    const symbol = getCurrencySymbol(currencyCode)
    const formattedPrice = Number(price).toFixed(decimals)
    
    if (showSymbol) {
      // Try to use Intl.NumberFormat for proper currency formatting
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(price)
      } catch (error) {
        // Fallback to simple formatting
        return `${symbol}${formattedPrice}`
      }
    }
    
    return formattedPrice
  }, [getCurrencySymbol])

  // Format price with conversion
  const formatConvertedPrice = useCallback((price, fromCurrency, toCurrency = null, options = {}) => {
    const targetCurrency = toCurrency || defaultCurrency.code
    const convertedPrice = convertPrice(price, fromCurrency, targetCurrency)
    return formatPrice(convertedPrice, targetCurrency, options)
  }, [convertPrice, formatPrice, defaultCurrency.code])

  // Get exchange rate between two currencies
  const getExchangeRate = useCallback((fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return 1

    // Direct rate
    if (exchangeRates[fromCurrency] && exchangeRates[fromCurrency][toCurrency]) {
      return exchangeRates[fromCurrency][toCurrency].rate
    }
    
    // Inverse rate
    if (exchangeRates[toCurrency] && exchangeRates[toCurrency][fromCurrency]) {
      return 1 / exchangeRates[toCurrency][fromCurrency].rate
    }
    
    return null
  }, [exchangeRates])

  return {
    // Data
    supportedCurrencies,
    exchangeRates,
    defaultCurrency,
    isLoading,
    error,
    
    // Functions
    loadCurrencyData,
    getCurrencySymbol,
    getCurrencyName,
    convertPrice,
    formatPrice,
    formatConvertedPrice,
    getExchangeRate
  }
}

export default useCurrency
