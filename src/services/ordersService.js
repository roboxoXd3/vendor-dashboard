import { supabase } from '@/lib/supabase'

export const ordersService = {
  // Get all orders for a vendor
  async getVendorOrders(vendorId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status = '',
        search = '',
        dateFrom = '',
        dateTo = '',
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options

      console.log('📋 Fetching orders for vendor:', vendorId, { page, limit, status })

      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles!inner(full_name, email, phone),
          addresses!inner(
            street_address,
            city,
            state,
            postal_code,
            country
          )
        `)
        .eq('vendor_id', vendorId)

      // Add filters
      if (status) {
        query = query.eq('status', status)
      }

      if (search) {
        query = query.or(`order_number.ilike.%${search}%,profiles.full_name.ilike.%${search}%`)
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo)
      }

      // Add sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Add pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      console.log(`✅ Retrieved ${data?.length || 0} orders`)
      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil((count || 0) / limit)
        },
        error: null
      }
    } catch (error) {
      console.error('❌ Error fetching vendor orders:', error)
      return { data: [], pagination: null, error }
    }
  },

  // Get single order with full details
  async getOrderDetails(orderId) {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!inner(full_name, email, phone),
          addresses!inner(
            street_address,
            city,
            state,
            postal_code,
            country
          )
        `)
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      // Get order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products!inner(
            name,
            images,
            price,
            sku,
            brand
          )
        `)
        .eq('order_id', orderId)

      if (itemsError) throw itemsError

      return {
        data: {
          ...order,
          items: orderItems || []
        },
        error: null
      }
    } catch (error) {
      console.error('❌ Error fetching order details:', error)
      return { data: null, error }
    }
  },

  // Update order status
  async updateOrderStatus(orderId, newStatus, trackingNumber = null) {
    try {
      console.log('📦 Updating order status:', orderId, 'to', newStatus)

      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      if (trackingNumber) {
        updateData.tracking_number = trackingNumber
      }

      // Set estimated delivery for shipped orders
      if (newStatus === 'shipped') {
        const estimatedDelivery = new Date()
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 5) // 5 days from now
        updateData.estimated_delivery = estimatedDelivery.toISOString()
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Order status updated successfully')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error updating order status:', error)
      return { data: null, error }
    }
  },

  // Get order statistics
  async getOrderStats(vendorId, period = '30d') {
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
        default:
          startDate.setDate(startDate.getDate() - 30)
      }

      const { data, error } = await supabase
        .from('orders')
        .select('status, total, created_at')
        .eq('vendor_id', vendorId)
        .gte('created_at', startDate.toISOString())

      if (error) throw error

      // Calculate statistics
      const stats = {
        totalOrders: data?.length || 0,
        totalRevenue: 0,
        statusCounts: {
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0
        },
        averageOrderValue: 0
      }

      data?.forEach(order => {
        const amount = parseFloat(order.total)
        stats.totalRevenue += amount
        stats.statusCounts[order.status] = (stats.statusCounts[order.status] || 0) + 1
      })

      stats.averageOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0

      return { data: stats, error: null }
    } catch (error) {
      console.error('❌ Error fetching order stats:', error)
      return { data: null, error }
    }
  },

  // Get recent orders
  async getRecentOrders(vendorId, limit = 10) {
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
          profiles!inner(full_name)
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

  // Add tracking number
  async addTrackingNumber(orderId, trackingNumber, carrier = '') {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          tracking_number: trackingNumber,
          shipping_carrier: carrier,
          status: 'shipped',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Tracking number added successfully')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error adding tracking number:', error)
      return { data: null, error }
    }
  },

  // Cancel order
  async cancelOrder(orderId, reason = '') {
    try {
      console.log('❌ Cancelling order:', orderId)

      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Order cancelled successfully')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error cancelling order:', error)
      return { data: null, error }
    }
  },

  // Get orders by status
  async getOrdersByStatus(vendorId, status) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!inner(full_name, email)
        `)
        .eq('vendor_id', vendorId)
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error fetching orders by status:', error)
      return { data: [], error }
    }
  },

  // Export orders data
  async exportOrders(vendorId, options = {}) {
    try {
      const {
        dateFrom = '',
        dateTo = '',
        status = ''
      } = options

      let query = supabase
        .from('orders')
        .select(`
          order_number,
          created_at,
          status,
          total,
          profiles!inner(full_name, email)
        `)
        .eq('vendor_id', vendorId)

      if (status) query = query.eq('status', status)
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error exporting orders:', error)
      return { data: [], error }
    }
  }
}