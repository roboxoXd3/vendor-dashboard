import { getSupabase } from '@/lib/supabase'

export const productsService = {
  // Get all products for a vendor
  async getVendorProducts(vendorId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        category = '',
        status = '',
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options

      // Build query parameters
      const params = new URLSearchParams({
        vendorId,
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      })

      if (search) params.append('search', search)
      if (category) params.append('category', category)
      if (status) params.append('status', status)

      const response = await fetch(`/api/products?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch products')
      }

      return {
        data: result.data || [],
        pagination: result.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 0
        },
        error: null
      }
    } catch (error) {
      console.error('❌ Error fetching vendor products:', error)
      return { data: [], pagination: null, error }
    }
  },

  // Get single product
  async getProduct(productId) {
    try {
      console.log('📦 Fetching single product:', productId)
      
      const response = await fetch(`/api/products/${productId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch product')
      }

      return { data: result.data, error: null }
    } catch (error) {
      console.error('Error fetching product:', error)
      return { data: null, error }
    }
  },

  // Create new product
  async createProduct(vendorId, productData) {
    try {

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId,
          productData
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create product')
      }

      return { data: result.data, error: null }
    } catch (error) {
      console.error('Error creating product:', error)
      return { data: null, error }
    }
  },

  // Update product
  async updateProduct(productId, updates) {
    try {

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update product')
      }

      return { data: result.data, error: null }
    } catch (error) {
      console.error('Error updating product:', error)
      return { data: null, error }
    }
  },

  // Delete product
  async deleteProduct(productId) {
    try {

      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete product')
      }

      return { data: result.data, error: null }
    } catch (error) {
      console.error('Error deleting product:', error)
      return { data: null, error }
    }
  },

  // Update product stock
  async updateStock(productId, stockQuantity) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          stock_quantity: stockQuantity,
          in_stock: stockQuantity > 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('❌ Error updating stock:', error)
      return { data: null, error }
    }
  },

  // Get product categories
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id, 
          name, 
          description,
          subcategories (
            id,
            name,
            description,
            is_active
          )
        `)
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      // Transform the data to include subcategories in a more accessible format
      const categoriesWithSubcategories = data.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        subcategories: category.subcategories?.filter(sub => sub.is_active) || []
      }))

      return { data: categoriesWithSubcategories || [], error: null }
    } catch (error) {
      console.error('❌ Error fetching categories:', error)
      return { data: [], error }
    }
  },

  // Get low stock products
  async getLowStockProducts(vendorId, threshold = 10) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, sku')
        .eq('vendor_id', vendorId)
        .eq('status', 'active')
        .lte('stock_quantity', threshold)
        .order('stock_quantity', { ascending: true })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error fetching low stock products:', error)
      return { data: [], error }
    }
  },

  // Bulk update products
  async bulkUpdateProducts(productUpdates) {
    try {
      console.log('📝 Bulk updating products:', productUpdates.length)

      const updates = productUpdates.map(update => ({
        ...update,
        updated_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from('products')
        .upsert(updates)
        .select()

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in bulk update:', error)
      return { data: [], error }
    }
  }
}