import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorService } from '@/services/vendorService'
import { useAuth } from '@/contexts/AuthContext'

// Query keys
export const vendorKeys = {
  all: ['vendor'],
  dashboardStats: (vendorId) => [...vendorKeys.all, 'dashboard-stats', vendorId],
  recentOrders: (vendorId) => [...vendorKeys.all, 'recent-orders', vendorId],
  profile: (vendorId) => [...vendorKeys.all, 'profile', vendorId],
  analytics: (vendorId, period) => [...vendorKeys.all, 'analytics', vendorId, period],
  bestSelling: (vendorId) => [...vendorKeys.all, 'best-selling', vendorId],
  inventory: (vendorId) => [...vendorKeys.all, 'inventory', vendorId],
}

// Dashboard Stats Hook
export function useDashboardStats() {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: vendorKeys.dashboardStats(vendor?.id),
    queryFn: () => vendorService.getDashboardStats(vendor?.id),
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Recent Orders Hook
export function useRecentOrders(limit = 5) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: vendorKeys.recentOrders(vendor?.id),
    queryFn: () => vendorService.getRecentOrders(vendor?.id, limit),
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 1, // 1 minute
  })
}

// Vendor Profile Hook
export function useVendorProfile() {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: vendorKeys.profile(vendor?.id),
    queryFn: () => vendorService.getVendorProfile(vendor?.id),
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Sales Analytics Hook
export function useSalesAnalytics(period = '30d') {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: vendorKeys.analytics(vendor?.id, period),
    queryFn: () => vendorService.getSalesAnalytics(vendor?.id, period),
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Best Selling Products Hook
export function useBestSellingProducts(limit = 5) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: vendorKeys.bestSelling(vendor?.id),
    queryFn: () => vendorService.getBestSellingProducts(vendor?.id, limit),
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Inventory Status Hook
export function useInventoryStatus() {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: vendorKeys.inventory(vendor?.id),
    queryFn: () => vendorService.getInventoryStatus(vendor?.id),
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Update Vendor Profile Mutation
export function useUpdateVendorProfile() {
  const queryClient = useQueryClient()
  const { vendor } = useAuth()

  return useMutation({
    mutationFn: (updates) => vendorService.updateVendorProfile(vendor?.id, updates),
    onSuccess: (data) => {
      // Invalidate and refetch vendor profile
      queryClient.invalidateQueries({
        queryKey: vendorKeys.profile(vendor?.id)
      })
      
      // Update the cache optimistically
      queryClient.setQueryData(vendorKeys.profile(vendor?.id), { data: data.data, error: null })
    },
    onError: (error) => {
      console.error('Failed to update vendor profile:', error)
    }
  })
}