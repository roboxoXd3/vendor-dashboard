import { getSupabase } from '@/lib/supabase'

export const vendorService = {
  // Get vendor dashboard stats
  async getDashboardStats(vendorId) {
    try {
      console.log('📊 Fetching dashboard stats for vendor:', vendorId)

      // Check if vendorId is provided
      if (!vendorId) {
        console.warn('⚠️ No vendor ID provided for getDashboardStats')
        return { data: null, error: null }
      }

      // Get total products
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId)
        .eq('status', 'active')

      // Initialize default values for orders-related stats
      let orderCount = 0
      let totalSales = 0
      let pendingOrders = 0
      let monthlyRevenue = {}
      let recentOrders = []

      try {
        // Get total orders
        const { count: orderCountResult } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendorId)
        orderCount = orderCountResult || 0

        // Get total sales (completed orders)
        const { data: salesData } = await supabase
          .from('orders')
          .select('total')
          .eq('vendor_id', vendorId)
          .in('status', ['completed', 'delivered'])
        totalSales = salesData?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0

        // Get pending orders
        const { count: pendingOrdersResult } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendorId)
          .eq('status', 'pending')
        pendingOrders = pendingOrdersResult || 0

        // Get recent orders for chart data
        const { data: recentOrdersResult } = await supabase
          .from('orders')
          .select('created_at, total, status')
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false })
          .limit(30)
        recentOrders = recentOrdersResult || []

        // Get monthly revenue for last 6 months
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const { data: monthlyData } = await supabase
          .from('orders')
          .select('created_at, total')
          .eq('vendor_id', vendorId)
          .in('status', ['completed', 'delivered'])
          .gte('created_at', sixMonthsAgo.toISOString())
          .order('created_at', { ascending: true })

        // Process monthly revenue data
        monthlyRevenue = {}
        monthlyData?.forEach(order => {
          const month = new Date(order.created_at).toISOString().slice(0, 7) // YYYY-MM
          monthlyRevenue[month] = (monthlyRevenue[month] || 0) + parseFloat(order.total)
        })

      } catch (ordersError) {
        // If orders table doesn't exist, log warning but continue with default values
        if (ordersError.code === 'PGRST116' || ordersError.message?.includes('relation') || ordersError.message?.includes('does not exist')) {
          console.warn('⚠️ Orders table not found, using default values for order statistics')
        } else {
          console.warn('⚠️ Error fetching order statistics:', ordersError.message)
        }
      }

      const stats = {
        totalProducts: productCount || 0,
        totalOrders: orderCount,
        totalSales: totalSales,
        pendingOrders: pendingOrders,
        monthlyRevenue: monthlyRevenue,
        recentOrders: recentOrders
      }

      console.log('✅ Dashboard stats retrieved:', stats)
      return { data: stats, error: null }

    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error)
      return { data: null, error }
    }
  },

  // Get recent orders for dashboard
  async getRecentOrders(vendorId, limit = 5) {
    try {
      // Check if vendorId is provided
      if (!vendorId) {
        console.warn('⚠️ No vendor ID provided for getRecentOrders')
        return { data: [], error: null }
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total,
          status,
          created_at,
          user_id,
          profiles!inner(full_name, email)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        // If the table doesn't exist or there's a schema error, return empty data
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.warn('⚠️ Orders table not found, returning empty data')
          return { data: [], error: null }
        }
        throw error
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error fetching recent orders:', error)
      // Return empty data instead of error to prevent UI crashes
      return { data: [], error: null }
    }
  },

  // Get vendor profile
  async getVendorProfile(vendorId) {
    try {
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

      console.log('✅ Vendor profile updated successfully')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error updating vendor profile:', error)
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