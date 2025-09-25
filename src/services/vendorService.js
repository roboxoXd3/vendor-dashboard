import { getSupabase } from '@/lib/supabase'

export const vendorService = {
  // Get vendor dashboard stats using server-side API
  async getDashboardStats(vendorId) {
    try {

      // Check if vendorId is provided
      if (!vendorId) {
        console.warn('No vendor ID provided for getDashboardStats')
        return { data: null, error: null }
      }

      // Call server-side API endpoint
      const response = await fetch(`/api/dashboard-stats?vendorId=${vendorId}`, {
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
  async getRecentOrders(vendorId, limit = 5) {
    try {
      // Check if vendorId is provided
      if (!vendorId) {
        console.warn('No vendor ID provided for getRecentOrders')
        return { data: [], error: null }
      }

      // Call server-side API endpoint
      const response = await fetch(`/api/recent-orders?vendorId=${vendorId}&limit=${limit}`, {
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
  async getBestSellingProducts(vendorId, limit = 5) {
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
  async getInventoryStatus(vendorId) {
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
  async getSalesAnalytics(vendorId, period = '30d') {
    try {
      const startDate = new Date()
      
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(startDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(startDate.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
        default:
          startDate.setDate(startDate.getDate() - 30)
      }

      const supabase = getSupabase()
      const { data: analyticsData } = await supabase
        .from('orders')
        .select('created_at, total, status')
        .eq('vendor_id', vendorId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      // Process the data for charts
      const dailySales = {}
      const statusCounts = { pending: 0, processing: 0, completed: 0, cancelled: 0 }
      let totalRevenue = 0

      analyticsData?.forEach(order => {
        const date = order.created_at.split('T')[0] // YYYY-MM-DD
        const amount = parseFloat(order.total)

        dailySales[date] = (dailySales[date] || 0) + amount
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
        
        if (['completed', 'delivered'].includes(order.status)) {
          totalRevenue += amount
        }
      })

      return {
        data: {
          dailySales,
          statusCounts,
          totalRevenue,
          totalOrders: analyticsData?.length || 0,
          period
        },
        error: null
      }
    } catch (error) {
      console.error('❌ Error fetching sales analytics:', error)
      return { data: null, error }
    }
  }
}