import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewsService } from '@/services/reviewsService'
import { useAuth } from '@/contexts/AuthContext'

// Query keys
export const reviewKeys = {
  all: ['reviews'],
  lists: () => [...reviewKeys.all, 'list'],
  list: (vendorId, filters) => [...reviewKeys.lists(), vendorId, filters],
  stats: (vendorId) => [...reviewKeys.all, 'stats', vendorId],
}

// Get Vendor Reviews Hook
export function useVendorReviews(options = {}) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: reviewKeys.list(vendor?.id, options),
    queryFn: () => reviewsService.getVendorReviews(vendor?.id, options),
    enabled: !!vendor?.id,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  })
}

// Respond to Review Hook
export function useRespondToReview() {
  const queryClient = useQueryClient()
  const { vendor } = useAuth()

  return useMutation({
    mutationFn: ({ reviewId, vendorResponse }) => 
      reviewsService.respondToReview(reviewId, vendorResponse),
    onSuccess: (data) => {
      // Invalidate and refetch reviews
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() })
      
      // Update the specific review in cache if possible
      queryClient.setQueriesData(
        { queryKey: reviewKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData
          
          return {
            ...oldData,
            reviews: oldData.reviews.map(review =>
              review.id === data.id ? { ...review, ...data } : review
            )
          }
        }
      )
    },
    onError: (error) => {
      console.error('Failed to respond to review:', error)
    }
  })
}

// Update Review Visibility Hook
export function useUpdateReviewVisibility() {
  const queryClient = useQueryClient()
  const { vendor } = useAuth()

  return useMutation({
    mutationFn: ({ reviewId, action }) => 
      reviewsService.updateReviewVisibility(reviewId, action),
    onSuccess: (data) => {
      // Invalidate and refetch reviews
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() })
      
      // Update the specific review in cache
      queryClient.setQueriesData(
        { queryKey: reviewKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData
          
          return {
            ...oldData,
            reviews: oldData.reviews.map(review =>
              review.id === data.id ? { ...review, ...data } : review
            )
          }
        }
      )
    },
    onError: (error) => {
      console.error('Failed to update review visibility:', error)
    }
  })
}

// Export Reviews Hook
export function useExportReviews() {
  const { vendor } = useAuth()

  return useMutation({
    mutationFn: (options = {}) => 
      reviewsService.exportReviews(vendor?.id, options),
    onError: (error) => {
      console.error('Failed to export reviews:', error)
    }
  })
}

// Review Statistics Hook
export function useReviewStats(options = {}) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: reviewKeys.stats(vendor?.id),
    queryFn: async () => {
      const data = await reviewsService.getVendorReviews(vendor?.id, {
        limit: 1, // We only need stats, not the actual reviews
        ...options
      })
      return data.stats
    },
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  })
}

// Bulk Actions Hook
export function useBulkReviewActions() {
  const queryClient = useQueryClient()
  const respondToReview = useRespondToReview()
  const updateVisibility = useUpdateReviewVisibility()

  return useMutation({
    mutationFn: async ({ reviewIds, action, data }) => {
      const results = []
      
      for (const reviewId of reviewIds) {
        try {
          let result
          if (action === 'respond') {
            result = await respondToReview.mutateAsync({
              reviewId,
              vendorResponse: data.vendorResponse
            })
          } else if (action === 'hide' || action === 'show') {
            result = await updateVisibility.mutateAsync({
              reviewId,
              action
            })
          }
          results.push({ reviewId, success: true, data: result })
        } catch (error) {
          results.push({ reviewId, success: false, error: error.message })
        }
      }
      
      return results
    },
    onSuccess: () => {
      // Invalidate all review queries
      queryClient.invalidateQueries({ queryKey: reviewKeys.all })
    },
    onError: (error) => {
      console.error('Bulk action failed:', error)
    }
  })
}
