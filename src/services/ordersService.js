// Orders Service - API calls for order management
export const ordersService = {
  // Get vendor orders with filters
  async getVendorOrders(vendorId, options = {}) {
    try {
      const params = new URLSearchParams({
        vendorId,
        page: options.page || 1,
        limit: options.limit || 20,
        sortBy: options.sortBy || 'created_at',
        sortOrder: options.sortOrder || 'desc'
      })

      // Add optional filters
      if (options.status && options.status !== 'All Orders') {
        params.append('status', options.status)
      }
      if (options.dateFrom) {
        params.append('dateFrom', options.dateFrom)
      }
      if (options.dateTo) {
        params.append('dateTo', options.dateTo)
      }

      console.log('🔍 Fetching orders with params:', params.toString())

      const response = await fetch(`/api/orders?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch orders')
      }

      console.log('✅ Orders fetched successfully:', data.data?.length, 'orders')
      return data

    } catch (error) {
      console.error('❌ Error fetching orders:', error)
      throw error
    }
  },

  // Update order status
  async updateOrderStatus(orderId, status, vendorId, options = {}) {
    try {
      console.log('🔄 Updating order status:', { orderId, status, vendorId })

      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId,
          status,
          vendorId,
          trackingNumber: options.trackingNumber,
          notes: options.notes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update order')
      }

      console.log('✅ Order status updated successfully:', data.data?.id)
      return data

    } catch (error) {
      console.error('❌ Error updating order status:', error)
      throw error
    }
  },

  // Get order statistics for vendor
  async getOrderStats(vendorId, dateRange = '30d') {
    try {
      const params = new URLSearchParams({
        vendorId,
        dateRange
      })

      const response = await fetch(`/api/orders/stats?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch order stats')
      }

      return data

    } catch (error) {
      console.error('❌ Error fetching order stats:', error)
      throw error
    }
  },

  // Export orders data
  async exportOrders(vendorId, options = {}) {
    try {
      const params = new URLSearchParams({
        vendorId,
        format: options.format || 'csv'
      })

      // Add optional filters
      if (options.status && options.status !== 'All Orders') {
        params.append('status', options.status)
      }
      if (options.dateFrom) {
        params.append('dateFrom', options.dateFrom)
      }
      if (options.dateTo) {
        params.append('dateTo', options.dateTo)
      }

      const response = await fetch(`/api/orders/export?${params}`, {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      // Return blob for file download
      const blob = await response.blob()
      return blob

    } catch (error) {
      console.error('❌ Error exporting orders:', error)
      throw error
    }
  }
}