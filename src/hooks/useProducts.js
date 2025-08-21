import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService } from '@/services/productsService'
import { useAuth } from '@/contexts/AuthContext'

// Query keys
export const productKeys = {
  all: ['products'],
  lists: () => [...productKeys.all, 'list'],
  list: (vendorId, filters) => [...productKeys.lists(), vendorId, filters],
  details: () => [...productKeys.all, 'detail'],
  detail: (id) => [...productKeys.details(), id],
  categories: () => [...productKeys.all, 'categories'],
  lowStock: (vendorId) => [...productKeys.all, 'low-stock', vendorId],
}

// Get Vendor Products Hook
export function useVendorProducts(options = {}) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: productKeys.list(vendor?.id, options),
    queryFn: () => productsService.getVendorProducts(vendor?.id, options),
    enabled: !!vendor?.id,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get Single Product Hook
export function useProduct(productId) {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => productsService.getProduct(productId),
    enabled: !!productId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Get Categories Hook
export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: () => productsService.getCategories(),
    staleTime: 1000 * 60 * 30, // 30 minutes - categories don't change often
  })
}

// Get Low Stock Products Hook
export function useLowStockProducts(threshold = 10) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: productKeys.lowStock(vendor?.id),
    queryFn: () => productsService.getLowStockProducts(vendor?.id, threshold),
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Create Product Mutation
export function useCreateProduct() {
  const queryClient = useQueryClient()
  const { vendor } = useAuth()

  return useMutation({
    mutationFn: (productData) => productsService.createProduct(vendor?.id, productData),
    onSuccess: () => {
      // Invalidate products list to refetch
      queryClient.invalidateQueries({
        queryKey: productKeys.lists()
      })
      
      // Invalidate dashboard stats
      queryClient.invalidateQueries({
        queryKey: ['vendor', 'dashboard-stats', vendor?.id]
      })
      
      // Invalidate product stats
      queryClient.invalidateQueries({
        queryKey: ['product-stats', vendor?.id]
      })
    },
    onError: (error) => {
      console.error('Failed to create product:', error)
    }
  })
}

// Update Product Mutation
export function useUpdateProduct() {
  const queryClient = useQueryClient()
  const { vendor } = useAuth()

  return useMutation({
    mutationFn: ({ productId, updates }) => productsService.updateProduct(productId, updates),
    onSuccess: (data, variables) => {
      // Update the specific product in cache
      queryClient.setQueryData(
        productKeys.detail(variables.productId),
        { data: data.data, error: null }
      )
      
      // Invalidate products list to show updated data
      queryClient.invalidateQueries({
        queryKey: productKeys.lists()
      })
      
      // Invalidate low stock if stock was updated
      if (variables.updates.stock_quantity !== undefined) {
        queryClient.invalidateQueries({
          queryKey: productKeys.lowStock(vendor?.id)
        })
      }
    },
    onError: (error) => {
      console.error('Failed to update product:', error)
    }
  })
}

// Delete Product Mutation
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  const { vendor } = useAuth()

  return useMutation({
    mutationFn: (productId) => productsService.deleteProduct(productId),
    onSuccess: () => {
      // Invalidate products list
      queryClient.invalidateQueries({
        queryKey: productKeys.lists()
      })
      
      // Invalidate dashboard stats
      queryClient.invalidateQueries({
        queryKey: ['vendor', 'dashboard-stats', vendor?.id]
      })
      
      // Invalidate product stats
      queryClient.invalidateQueries({
        queryKey: ['product-stats', vendor?.id]
      })
    },
    onError: (error) => {
      console.error('Failed to delete product:', error)
    }
  })
}

// Update Stock Mutation
export function useUpdateStock() {
  const queryClient = useQueryClient()
  const { vendor } = useAuth()

  return useMutation({
    mutationFn: ({ productId, stockQuantity }) => 
      productsService.updateStock(productId, stockQuantity),
    onSuccess: (data, variables) => {
      // Update the specific product in cache
      queryClient.setQueryData(
        productKeys.detail(variables.productId),
        (oldData) => {
          if (oldData?.data) {
            return {
              ...oldData,
              data: {
                ...oldData.data,
                stock_quantity: variables.stockQuantity,
                in_stock: variables.stockQuantity > 0
              }
            }
          }
          return oldData
        }
      )
      
      // Invalidate products list and low stock
      queryClient.invalidateQueries({
        queryKey: productKeys.lists()
      })
      queryClient.invalidateQueries({
        queryKey: productKeys.lowStock(vendor?.id)
      })
    },
    onError: (error) => {
      console.error('Failed to update stock:', error)
    }
  })
}

// Bulk Update Products Mutation
export function useBulkUpdateProducts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productUpdates) => productsService.bulkUpdateProducts(productUpdates),
    onSuccess: () => {
      // Invalidate all product-related queries
      queryClient.invalidateQueries({
        queryKey: productKeys.all
      })
    },
    onError: (error) => {
      console.error('Failed to bulk update products:', error)
    }
  })
}