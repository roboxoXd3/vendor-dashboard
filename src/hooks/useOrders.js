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
  stats: (vendorId, period) => [...orderKeys.all, 'stats', vendorId, period],
  recent: (vendorId) => [...orderKeys.all, 'recent', vendorId],
  byStatus: (vendorId, status) => [...orderKeys.all, 'by-status', vendorId, status],
}

// Get Vendor Orders Hook
export function useVendorOrders(options = {}) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: orderKeys.list(vendor?.id, options),
    queryFn: () => ordersService.getVendorOrders(vendor?.id, options),
    enabled: !!vendor?.id,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Get Order Details Hook
export function useOrderDetails(orderId) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => ordersService.getOrderDetails(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get Order Stats Hook
export function useOrderStats(period = '30d') {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: orderKeys.stats(vendor?.id, period),
    queryFn: () => ordersService.getOrderStats(vendor?.id, period),
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get Recent Orders Hook
export function useRecentOrders(limit = 10) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: orderKeys.recent(vendor?.id),
    queryFn: () => ordersService.getRecentOrders(vendor?.id, limit),
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 1, // 1 minute
  })
}

// Get Orders by Status Hook
export function useOrdersByStatus(status) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: orderKeys.byStatus(vendor?.id, status),
    queryFn: () => ordersService.getOrdersByStatus(vendor?.id, status),
    enabled: !!vendor?.id && !!status,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Update Order Status Mutation
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  const { vendor } = useAuth()

  return useMutation({
    mutationFn: ({ orderId, newStatus, trackingNumber }) => 
      ordersService.updateOrderStatus(orderId, newStatus, trackingNumber),
    onSuccess: (data, variables) => {
      // Update the specific order in cache
      queryClient.setQueryData(
        orderKeys.detail(variables.orderId),
        (oldData) => {
          if (oldData?.data) {
            return {
              ...oldData,
              data: {
                ...oldData.data,
                status: variables.newStatus,
                tracking_number: variables.trackingNumber || oldData.data.tracking_number,
                updated_at: new Date().toISOString()
              }
            }
          }
          return oldData
        }
      )
      
      // Invalidate orders list to refetch
      queryClient.invalidateQueries({
        queryKey: orderKeys.lists()
      })
      
      // Invalidate stats and recent orders
      queryClient.invalidateQueries({
        queryKey: orderKeys.stats(vendor?.id)
      })
      queryClient.invalidateQueries({
        queryKey: orderKeys.recent(vendor?.id)
      })
      
      // Invalidate dashboard stats
      queryClient.invalidateQueries({
        queryKey: ['vendor', 'dashboard-stats', vendor?.id]
      })
    },
    onError: (error) => {
      console.error('Failed to update order status:', error)
    }
  })
}

// Add Tracking Number Mutation
export function useAddTrackingNumber() {
  const queryClient = useQueryClient()
  const { vendor } = useAuth()

  return useMutation({
    mutationFn: ({ orderId, trackingNumber, carrier }) => 
      ordersService.addTrackingNumber(orderId, trackingNumber, carrier),
    onSuccess: (data, variables) => {
      // Update the specific order in cache
      queryClient.setQueryData(
        orderKeys.detail(variables.orderId),
        (oldData) => {
          if (oldData?.data) {
            return {
              ...oldData,
              data: {
                ...oldData.data,
                tracking_number: variables.trackingNumber,
                shipping_carrier: variables.carrier,
                status: 'shipped',
                updated_at: new Date().toISOString()
              }
            }
          }
          return oldData
        }
      )
      
      // Invalidate orders list
      queryClient.invalidateQueries({
        queryKey: orderKeys.lists()
      })
      
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: orderKeys.stats(vendor?.id)
      })
    },
    onError: (error) => {
      console.error('Failed to add tracking number:', error)
    }
  })
}

// Cancel Order Mutation
export function useCancelOrder() {
  const queryClient = useQueryClient()
  const { vendor } = useAuth()

  return useMutation({
    mutationFn: ({ orderId, reason }) => ordersService.cancelOrder(orderId, reason),
    onSuccess: (data, variables) => {
      // Update the specific order in cache
      queryClient.setQueryData(
        orderKeys.detail(variables.orderId),
        (oldData) => {
          if (oldData?.data) {
            return {
              ...oldData,
              data: {
                ...oldData.data,
                status: 'cancelled',
                cancellation_reason: variables.reason,
                updated_at: new Date().toISOString()
              }
            }
          }
          return oldData
        }
      )
      
      // Invalidate orders list and stats
      queryClient.invalidateQueries({
        queryKey: orderKeys.lists()
      })
      queryClient.invalidateQueries({
        queryKey: orderKeys.stats(vendor?.id)
      })
      
      // Invalidate dashboard stats
      queryClient.invalidateQueries({
        queryKey: ['vendor', 'dashboard-stats', vendor?.id]
      })
    },
    onError: (error) => {
      console.error('Failed to cancel order:', error)
    }
  })
}

// Export Orders Hook
export function useExportOrders() {
  const { vendor } = useAuth()

  return useMutation({
    mutationFn: (options) => ordersService.exportOrders(vendor?.id, options),
    onError: (error) => {
      console.error('Failed to export orders:', error)
    }
  })
}