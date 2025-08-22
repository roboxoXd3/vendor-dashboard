import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersService } from '@/services/ordersService'
import { useAuth } from '@/contexts/AuthContext'

// Query keys
export const orderKeys = {
  all: ['orders'],
  lists: () => [...orderKeys.all, 'list'],
  list: (vendorId, filters) => [...orderKeys.lists(), vendorId, filters],
  details: () => [...orderKeys.all, 'detail'],
  detail: (id) => [...orderKeys.details(), id],
  stats: (vendorId, dateRange) => [...orderKeys.all, 'stats', vendorId, dateRange],
}

// Get Vendor Orders Hook
export function useVendorOrders(options = {}) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: orderKeys.list(vendor?.id, options),
    queryFn: () => ordersService.getVendorOrders(vendor?.id, options),
    enabled: !!vendor?.id,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2, // 2 minutes - orders change more frequently
    refetchInterval: 1000 * 60 * 5, // Auto-refetch every 5 minutes
  })
}

// Get Order Statistics Hook
export function useOrderStats(dateRange = '30d') {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: orderKeys.stats(vendor?.id, dateRange),
    queryFn: () => ordersService.getOrderStats(vendor?.id, dateRange),
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Update Order Status Mutation
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  const { vendor } = useAuth()

  return useMutation({
    mutationFn: ({ orderId, status, options = {} }) => 
      ordersService.updateOrderStatus(orderId, status, vendor?.id, options),
    onSuccess: (data, variables) => {
      // Invalidate orders list to refetch with updated data
      queryClient.invalidateQueries({
        queryKey: orderKeys.lists()
      })
      
      // Invalidate order stats
      queryClient.invalidateQueries({
        queryKey: orderKeys.stats(vendor?.id)
      })
      
      // Invalidate dashboard stats if they exist
      queryClient.invalidateQueries({
        queryKey: ['vendor', 'dashboard-stats', vendor?.id]
      })
    },
    onError: (error) => {
      console.error('Failed to update order status:', error)
    }
  })
}

// Export Orders Mutation
export function useExportOrders() {
  const { vendor } = useAuth()

  return useMutation({
    mutationFn: (options = {}) => ordersService.exportOrders(vendor?.id, options),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0]
      const format = variables.format || 'csv'
      link.download = `orders-${date}.${format}`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      window.URL.revokeObjectURL(url)
    },
    onError: (error) => {
      console.error('Failed to export orders:', error)
    }
  })
}

// Utility hook to get order status counts
export function useOrderStatusCounts(orders = []) {
  const statusCounts = orders.reduce((counts, order) => {
    const status = order.status || 'pending'
    counts[status] = (counts[status] || 0) + 1
    counts.total = (counts.total || 0) + 1
    return counts
  }, {})

  return {
    all: statusCounts.total || 0,
    pending: statusCounts.pending || 0,
    processing: statusCounts.processing || 0,
    shipped: statusCounts.shipped || 0,
    delivered: statusCounts.delivered || 0,
    cancelled: statusCounts.cancelled || 0,
    ...statusCounts
  }
}