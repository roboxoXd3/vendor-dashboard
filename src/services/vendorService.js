export const vendorService = {
  // Get vendor dashboard stats using server-side API
  async getDashboardStats(vendorId, filters = {}) {
    try {

      // Check if vendorId is provided
      if (!vendorId) {
        console.warn('No vendor ID provided for getDashboardStats')
        return { data: null, error: null }
      }

      // Build query parameters
      const params = new URLSearchParams({
        vendorId,
        ...filters
      });

      // Call server-side API endpoint
      const response = await fetch(`/api/dashboard-stats?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch dashboard stats')
      }

      const result = await response.json()
      
      return { data: result.data, error: null }

    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return { data: null, error: error.message }
    }
  },

  // Get recent orders using server-side API
  async getRecentOrders(vendorId, limit = 5, filters = {}) {
    try {
      // Check if vendorId is provided
      if (!vendorId) {
        console.warn('No vendor ID provided for getRecentOrders')
        return { data: [], error: null }
      }

      // Build query parameters
      const params = new URLSearchParams({
        vendorId,
        limit,
        ...filters
      });

      // Call server-side API endpoint
      const response = await fetch(`/api/recent-orders?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Recent orders API error:', errorData)
        return { data: [], error: errorData.error }
      }

      const result = await response.json()
      
      return { data: result.data || [], error: null }
    } catch (error) {
      console.error('Error fetching recent orders:', error)
      // Return empty data instead of error to prevent UI crashes
      return { data: [], error: error.message }
    }
  },

  // Get vendor profile (Django via BFF)
  async getVendorProfile(vendorId) {
    try {
      const response = await fetch('/api/vendor-profile', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch vendor profile')
      }

      return { data: result.vendor || result.data || result, error: null }
    } catch (error) {
      console.error('❌ Error fetching vendor profile:', error)
      return { data: null, error }
    }
  },

  // Update vendor profile (Django via BFF)
  async updateVendorProfile(vendorId, updates) {
    try {
      const response = await fetch('/api/vendor-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update vendor profile')
      }

      return { data: result.vendor || result.data || result, error: null }
    } catch (error) {
      console.error('Error updating vendor profile:', error)
      return { data: null, error }
    }
  },

  // Get best selling products (Django analytics/performance via BFF)
  async getBestSellingProducts(vendorId, limit = 5, filters = {}) {
    try {
      if (!vendorId) {
        console.warn('No vendor ID provided for getBestSellingProducts')
        return { data: [], error: null }
      }

      const params = new URLSearchParams({
        limit: String(limit),
        ...filters,
      })

      const response = await fetch(`/api/dashboard/best-sellers?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch best selling products')
      }

      const result = await response.json()
      return { data: result.data || [], error: null }
    } catch (error) {
      console.error('Error fetching best selling products:', error)
      return { data: [], error }
    }
  },

  // Get inventory status (Django own-products/statistics via BFF)
  async getInventoryStatus(vendorId, filters = {}) {
    try {
      if (!vendorId) {
        console.warn('No vendor ID provided for getInventoryStatus')
        return { data: null, error: null }
      }

      const response = await fetch('/api/dashboard/inventory-status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch inventory status')
      }

      const result = await response.json()
      return { data: result.data || null, error: null }
    } catch (error) {
      console.error('❌ Error fetching inventory status:', error)
      return { data: null, error }
    }
  },

  // Get sales analytics
  async getSalesAnalytics(vendorId, period = '30d', filters = {}) {
    try {
      if (!vendorId) {
        console.warn('No vendor ID provided for getSalesAnalytics')
        return { data: null, error: null }
      }

      // Build query parameters
      const params = new URLSearchParams({
        vendorId,
        period,
        ...filters
      });

      // Call server-side API endpoint
      const response = await fetch(`/api/analytics/sales?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Sales analytics API error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch sales analytics')
      }

      const result = await response.json()
      return { data: result.data, error: null }

    } catch (error) {
      console.error('Error fetching sales analytics:', error)
      return { data: null, error: error.message }
    }
  },

  // Get analytics metrics
  async getAnalyticsMetrics(vendorId, filters = {}) {
    try {
      
      if (!vendorId) {
        console.warn('No vendor ID provided for getAnalyticsMetrics')
        return { data: null, error: null }
      }

      // Build query parameters
      const params = new URLSearchParams({
        vendorId,
        ...filters
      });

      // Call server-side API endpoint
      const response = await fetch(`/api/analytics/metrics?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Analytics metrics API error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch analytics metrics')
      }

      const result = await response.json()
      return { data: result.data, error: null }

    } catch (error) {
      console.error('Error fetching analytics metrics:', error)
      return { data: null, error: error.message }
    }
  },

  // Get conversion funnel
  async getConversionFunnel(vendorId, filters = {}) {
    try {
      if (!vendorId) {
        console.warn('No vendor ID provided for getConversionFunnel')
        return { data: null, error: null }
      }

      // Build query parameters
      const params = new URLSearchParams({
        vendorId,
        ...filters
      });

      // Call server-side API endpoint
      const response = await fetch(`/api/analytics/funnel?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Conversion funnel API error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch conversion funnel')
      }

      const result = await response.json()
      return { data: result.data, error: null }

    } catch (error) {
      console.error('Error fetching conversion funnel:', error)
      return { data: null, error: error.message }
    }
  },

  // Get product performance
  async getProductPerformance(vendorId, filters = {}) {
    try {
      if (!vendorId) {
        console.warn('No vendor ID provided for getProductPerformance')
        return { data: [], error: null }
      }

      // Build query parameters
      const params = new URLSearchParams({
        vendorId,
        ...filters
      });

      // Call server-side API endpoint
      const response = await fetch(`/api/analytics/performance?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Product performance API error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch product performance')
      }

      const result = await response.json()
      return { data: result.data || [], error: null }

    } catch (error) {
      console.error('Error fetching product performance:', error)
      return { data: [], error: error.message }
    }
  },

  // Get daily product view counts for the period
  async getViewsOverTime(vendorId, filters = {}) {
    try {
      if (!vendorId) {
        console.warn('No vendor ID provided for getViewsOverTime')
        return { data: [], error: null }
      }

      const params = new URLSearchParams({
        vendorId,
        ...filters
      });

      const response = await fetch(`/api/analytics/views-over-time?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Views over time API error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch views over time')
      }

      const result = await response.json()
      return { data: result.data || [], error: null }

    } catch (error) {
      console.error('Error fetching views over time:', error)
      return { data: [], error: error.message }
    }
  }
}