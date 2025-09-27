import { getSupabase } from '@/lib/supabase'

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

  // Get vendor profile
  async getVendorProfile(vendorId) {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('❌ Error fetching vendor profile:', error)
      return { data: null, error }
    }
  },

  // Update vendor profile
  async updateVendorProfile(vendorId, updates) {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('vendors')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendorId)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error updating vendor profile:', error)
      return { data: null, error }
    }
  },

  // Get best selling products using performance summary view
  async getBestSellingProducts(vendorId, limit = 5, filters = {}) {
    try {
      if (!vendorId) {
        console.warn('No vendor ID provided for getBestSellingProducts')
        return { data: [], error: null }
      }

      const supabase = getSupabase()
      
      // Get vendor's product IDs first
      const { data: vendorProducts, error: productsError } = await supabase
        .from('products')
        .select('id, vendor_id')
        .eq('vendor_id', vendorId)
        .eq('status', 'active')

      if (productsError) throw productsError

      if (!vendorProducts || vendorProducts.length === 0) {
        return { data: [], error: null }
      }

      const productIds = vendorProducts.map(p => p.id)

      // Get best selling products from performance summary view
      const { data: bestSelling, error: summaryError } = await supabase
        .from('product_performance_summary')
        .select(`
          id,
          name,
          orders_count,
          total_revenue,
          total_sold
        `)
        .in('id', productIds)
        .order('orders_count', { ascending: false })
        .limit(limit)

      if (summaryError) throw summaryError

      // Get additional product details
      const { data: productDetails, error: detailsError } = await supabase
        .from('products')
        .select('id, sku, price, images')
        .in('id', productIds)

      if (detailsError) throw detailsError

      // Combine the data
      const combinedData = bestSelling?.map(product => {
        const details = productDetails?.find(d => d.id === product.id)
        return {
          id: product.id,
          name: product.name,
          sku: details?.sku || 'N/A',
          price: details?.price || 0,
          images: details?.images || [],
          orders_count: product.orders_count || 0,
          total_revenue: product.total_revenue || 0,
          total_sold: product.total_sold || 0
        }
      }) || []

      return { data: combinedData, error: null }
    } catch (error) {
      console.error('Error fetching best selling products:', error)
      return { data: [], error }
    }
  },

  // Get inventory status
  async getInventoryStatus(vendorId, filters = {}) {
    try {
      if (!vendorId) {
        console.warn('No vendor ID provided for getInventoryStatus')
        return { data: null, error: null }
      }

      const supabase = getSupabase()

      // Get total products count
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId)
        .eq('status', 'active')

      // Get in stock products (stock_quantity > 10)
      const { count: inStock } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId)
        .eq('status', 'active')
        .gt('stock_quantity', 10)

      // Get low stock products (stock_quantity between 1-10)
      const { count: lowStock } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId)
        .eq('status', 'active')
        .gte('stock_quantity', 1)
        .lte('stock_quantity', 10)

      // Get out of stock products (stock_quantity = 0)
      const { count: outOfStock } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId)
        .eq('status', 'active')
        .eq('stock_quantity', 0)

      const inventoryData = {
        totalProducts: totalProducts || 0,
        inStock: inStock || 0,
        lowStock: lowStock || 0,
        outOfStock: outOfStock || 0
      }

      return { data: inventoryData, error: null }
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
  }
}