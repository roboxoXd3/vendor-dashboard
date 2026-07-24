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
        sortOrder = 'desc',
      } = options

      const params = new URLSearchParams({
        vendorId,
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      })

      if (search) params.append('search', search)
      if (category) params.append('category', category)
      if (status) params.append('status', status)

      const response = await fetch(`/api/products?${params}`, {
        credentials: 'include',
      })
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
          totalPages: 0,
        },
        error: null,
      }
    } catch (error) {
      console.error('❌ Error fetching vendor products:', error)
      return { data: [], pagination: null, error }
    }
  },

  // Get single product (vendorId optional, for vendor-scoped requests)
  async getProduct(productId, vendorId = null) {
    try {
      const url = vendorId
        ? `/api/products/${productId}?vendorId=${vendorId}`
        : `/api/products/${productId}`
      const response = await fetch(url, { credentials: 'include' })
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ vendorId, productData }),
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ updates }),
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

  // Update product stock via Django PATCH …/stock/
  async updateStock(productId, stockQuantity) {
    try {
      const response = await fetch(`/api/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ stock_quantity: stockQuantity }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update stock')
      }

      return { data: result.data || result, error: null }
    } catch (error) {
      console.error('❌ Error updating stock:', error)
      return { data: null, error }
    }
  },

  // Get product categories (Django via BFF)
  async getCategories() {
    try {
      const response = await fetch('/api/categories', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch categories')
      }

      return { data: result.data || result.categories || [], error: null }
    } catch (error) {
      console.error('❌ Error fetching categories:', error)
      return { data: [], error }
    }
  },

  // Get low stock products (Django own-products, filtered by threshold)
  async getLowStockProducts(vendorId, threshold = 10) {
    try {
      const response = await fetch(
        `/api/products?vendorId=${vendorId}&status=active&limit=100&sortBy=created_at`,
        { credentials: 'include' }
      )
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch products')
      }

      const lowStock = (result.data || [])
        .filter((p) => Number(p.stock_quantity ?? 0) <= threshold)
        .map((p) => ({
          id: p.id,
          name: p.name,
          stock_quantity: p.stock_quantity,
          sku: p.sku,
        }))
        .sort((a, b) => Number(a.stock_quantity) - Number(b.stock_quantity))

      return { data: lowStock, error: null }
    } catch (error) {
      console.error('❌ Error fetching low stock products:', error)
      return { data: [], error }
    }
  },

  // Bulk update products via sequential PUT (no Django bulk-update endpoint)
  async bulkUpdateProducts(productUpdates) {
    try {
      const results = []
      for (const update of productUpdates) {
        const { id, ...updates } = update
        if (!id) continue
        const response = await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ updates }),
        })
        const result = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(result.error || `Failed to update product ${id}`)
        }
        results.push(result.data)
      }
      return { data: results, error: null }
    } catch (error) {
      console.error('Error in bulk update:', error)
      return { data: [], error }
    }
  },
}
