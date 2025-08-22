class CurrencyService {
  constructor() {
    this.cache = {
      currencies: null,
      rates: null,
      lastFetch: null,
      cacheDuration: 5 * 60 * 1000 // 5 minutes
    }
  }

  // Check if cache is valid
  isCacheValid() {
    return this.cache.lastFetch && 
           (Date.now() - this.cache.lastFetch) < this.cache.cacheDuration
  }

  // Get supported currencies and exchange rates
  async getCurrencyData() {
    if (this.isCacheValid() && this.cache.currencies && this.cache.rates) {
      return {
        currencies: this.cache.currencies,
        rates: this.cache.rates,
        fromCache: true
      }
    }

    try {
      const response = await fetch('/api/currency')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        // Update cache
        this.cache.currencies = result.data.supportedCurrencies
        this.cache.rates = result.data.exchangeRates
        this.cache.lastFetch = Date.now()

        return {
          currencies: result.data.supportedCurrencies,
          rates: result.data.exchangeRates,
          defaultCurrency: result.data.defaultCurrency,
          lastUpdated: result.data.lastUpdated,
          fromCache: false
        }
      } else {
        throw new Error(result.error || 'Failed to fetch currency data')
      }
    } catch (error) {
      console.error('Error fetching currency data:', error)
      throw error
    }
  }

  // Get list of supported currencies
  async getSupportedCurrencies() {
    const data = await this.getCurrencyData()
    return data.currencies
  }

  // Get exchange rates
  async getExchangeRates() {
    const data = await this.getCurrencyData()
    return data.rates
  }

  // Convert amount from one currency to another
  async convertAmount(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return amount
    }

    try {
      const response = await fetch(
        `/api/currency/convert?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        return result.data.convertedAmount
      } else {
        throw new Error(result.error || 'Conversion failed')
      }
    } catch (error) {
      console.error('Error converting currency:', error)
      throw error
    }
  }

  // Convert product prices to all supported currencies
  async convertProductPrices(productId, prices, fromCurrency, targetCurrencies = null) {
    try {
      const response = await fetch('/api/currency/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          prices,
          fromCurrency,
          targetCurrencies
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        return result.data.convertedPrices
      } else {
        throw new Error(result.error || 'Price conversion failed')
      }
    } catch (error) {
      console.error('Error converting product prices:', error)
      throw error
    }
  }

  // Update currency rates (admin only)
  async updateCurrencyRates(rates, adminUserId) {
    try {
      const response = await fetch('/api/currency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rates,
          adminUserId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        // Clear cache to force refresh
        this.clearCache()
        return result
      } else {
        throw new Error(result.error || 'Failed to update currency rates')
      }
    } catch (error) {
      console.error('Error updating currency rates:', error)
      throw error
    }
  }

  // Get currency symbol by code
  async getCurrencySymbol(currencyCode) {
    const currencies = await this.getSupportedCurrencies()
    const currency = currencies.find(c => c.code === currencyCode)
    return currency ? currency.symbol : currencyCode
  }

  // Format price with currency symbol
  async formatPrice(amount, currencyCode, locale = 'en-US') {
    const symbol = await this.getCurrencySymbol(currencyCode)
    
    // Use Intl.NumberFormat for proper formatting
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    } catch (error) {
      // Fallback to simple formatting
      return `${symbol}${amount.toFixed(2)}`
    }
  }

  // Clear cache
  clearCache() {
    this.cache = {
      currencies: null,
      rates: null,
      lastFetch: null,
      cacheDuration: 5 * 60 * 1000
    }
  }

  // Get conversion rate between two currencies
  async getConversionRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return 1
    }

    const rates = await this.getExchangeRates()
    
    // Direct rate
    if (rates[fromCurrency] && rates[fromCurrency][toCurrency]) {
      return rates[fromCurrency][toCurrency].rate
    }
    
    // Inverse rate
    if (rates[toCurrency] && rates[toCurrency][fromCurrency]) {
      return 1 / rates[toCurrency][fromCurrency].rate
    }
    
    throw new Error(`No conversion rate found for ${fromCurrency} to ${toCurrency}`)
  }
}

// Create singleton instance
const currencyService = new CurrencyService()

export default currencyService
