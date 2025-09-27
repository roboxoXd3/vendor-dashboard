import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorService } from '@/services/vendorService'
import { useAuth } from '@/contexts/AuthContext'

// Query keys
export const vendorKeys = {
  all: ['vendor'],
  dashboardStats: (vendorId, filters) => [...vendorKeys.all, 'dashboard-stats', vendorId, filters],
  recentOrders: (vendorId, filters) => [...vendorKeys.all, 'recent-orders', vendorId, filters],
  profile: (vendorId) => [...vendorKeys.all, 'profile', vendorId],
  analytics: (vendorId, period) => [...vendorKeys.all, 'analytics', vendorId, period],
  bestSelling: (vendorId, filters) => [...vendorKeys.all, 'best-selling', vendorId, filters],
  inventory: (vendorId, filters) => [...vendorKeys.all, 'inventory', vendorId, filters],
}

// Dashboard Stats Hook
export function useDashboardStats(filters = {}) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: vendorKeys.dashboardStats(vendor?.id, filters),
    queryFn: () => vendorService.getDashboardStats(vendor?.id, filters),
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Recent Orders Hook
export function useRecentOrders(limit = 5, filters = {}) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: vendorKeys.recentOrders(vendor?.id, filters),
    queryFn: () => vendorService.getRecentOrders(vendor?.id, limit, filters),
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
export function useSalesAnalytics(period = '30d', filters = {}) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: vendorKeys.analytics(vendor?.id, period, filters),
    queryFn: () => vendorService.getSalesAnalytics(vendor?.id, period, filters),
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Analytics Metrics Hook
export function useAnalyticsMetrics(filters = {}) {
  const { vendor } = useAuth()
  
  
  return useQuery({
    queryKey: vendorKeys.analytics(vendor?.id, 'metrics', filters),
    queryFn: () => vendorService.getAnalyticsMetrics(vendor?.id, filters),
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Conversion Funnel Hook
export function useConversionFunnel(filters = {}) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: vendorKeys.analytics(vendor?.id, 'funnel', filters),
    queryFn: () => vendorService.getConversionFunnel(vendor?.id, filters),
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Product Performance Hook
export function useProductPerformance(filters = {}) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: vendorKeys.analytics(vendor?.id, 'performance', filters),
    queryFn: () => vendorService.getProductPerformance(vendor?.id, filters),
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Best Selling Products Hook
export function useBestSellingProducts(limit = 5, filters = {}) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: vendorKeys.bestSelling(vendor?.id, filters),
    queryFn: () => vendorService.getBestSellingProducts(vendor?.id, limit, filters),
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Inventory Status Hook
export function useInventoryStatus(filters = {}) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: vendorKeys.inventory(vendor?.id, filters),
    queryFn: () => vendorService.getInventoryStatus(vendor?.id, filters),
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