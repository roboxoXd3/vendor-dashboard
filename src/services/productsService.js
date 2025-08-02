import { supabase } from '@/lib/supabase'

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

      console.log('📦 Fetching products for vendor:', vendorId, { page, limit, search })

      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name)
        `)
        .eq('vendor_id', vendorId)

      // Add filters
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
      }

      if (category) {
        query = query.eq('category_id', category)
      }

      if (status) {
        query = query.eq('status', status)
      }

      // Add sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Add pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      console.log(`✅ Retrieved ${data?.length || 0} products`)
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
      console.error('❌ Error fetching vendor products:', error)
      return { data: [], pagination: null, error }
    }
  },

  // Get single product
  async getProduct(productId) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          reviews(rating, comment, created_at, profiles(full_name))
        `)
        .eq('id', productId)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('❌ Error fetching product:', error)
      return { data: null, error }
    }
  },

  // Create new product
  async createProduct(vendorId, productData) {
    try {
      console.log('➕ Creating new product for vendor:', vendorId)

      const newProduct = {
        vendor_id: vendorId,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        images: productData.images || null,
        sizes: productData.sizes || [],
        colors: productData.colors || [],
        category_id: productData.category_id,
        brand: productData.brand || '',
        stock_quantity: productData.stock_quantity || 0,
        sku: productData.sku || `SKU-${Date.now()}`,
        status: 'active',
        approval_status: 'pending',
        in_stock: productData.stock_quantity > 0,
        is_featured: false,
        is_new_arrival: true,
        shipping_required: productData.shipping_required !== false,
        weight: productData.weight || null,
        dimensions: productData.dimensions || null,
        tags: productData.tags || null,
        meta_title: productData.meta_title || null,
        meta_description: productData.meta_description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()
        .single()

      if (error) throw error

      console.log('✅ Product created successfully:', data.id)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error creating product:', error)
      return { data: null, error }
    }
  },

  // Update product
  async updateProduct(productId, updates) {
    try {
      console.log('✏️ Updating product:', productId)

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      // Update stock status based on quantity
      if (updates.stock_quantity !== undefined) {
        updateData.in_stock = updates.stock_quantity > 0
      }

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Product updated successfully')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error updating product:', error)
      return { data: null, error }
    }
  },

  // Delete product
  async deleteProduct(productId) {
    try {
      console.log('🗑️ Deleting product:', productId)

      // Soft delete by updating status
      const { data, error } = await supabase
        .from('products')
        .update({
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Product deleted successfully')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error deleting product:', error)
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
        .select('*')
        .order('name')

      if (error) throw error

      return { data: data || [], error: null }
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

      console.log('✅ Bulk update completed')
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error in bulk update:', error)
      return { data: [], error }
    }
  }
}