import { getSupabaseServer } from '@/lib/supabase-server'

// GET /api/products/[id] - Get single product
export async function GET(request, { params }) {
  try {
    const { id } = await params

    // Fetching product
    const supabase = getSupabaseServer()

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json({ 
          success: false,
          error: 'Product not found' 
        }, { status: 404 })
      }
      throw error
    }

    // Parse images field from JSON string to array (handle both old single URL format and new JSON array format)
    let images = []
    if (data.images) {
      try {
        // Try to parse as JSON array first
        images = JSON.parse(data.images)
        // If it's not an array, make it one
        if (!Array.isArray(images)) {
          images = [images]
        }
      } catch (e) {
        // If parsing fails, treat as single URL string
        images = [data.images]
      }
    }
    
    const processedData = {
      ...data,
      images
    }

    // Product retrieved successfully
    
    return Response.json({
      success: true,
      data: processedData
    })

  } catch (error) {
    console.error('❌ Error fetching product:', error)
    return Response.json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 })
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { updates } = body

    if (!updates || Object.keys(updates).length === 0) {
      return Response.json({ 
        error: 'No updates provided' 
      }, { status: 400 })
    }

    // Updating product
    const supabase = getSupabaseServer()

    // Prepare updates with proper data types
    const productUpdates = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    // Handle images field - convert array to JSON string if it's an array
    if (productUpdates.images && Array.isArray(productUpdates.images)) {
      productUpdates.images = JSON.stringify(productUpdates.images)
    }

    // Handle UUID fields - convert empty strings to null
    if (productUpdates.category_id === '') {
      productUpdates.category_id = null
    }

    // Handle numeric fields
    if (productUpdates.price) {
      productUpdates.price = Number(productUpdates.price)
    }
    if (productUpdates.stock_quantity !== undefined) {
      productUpdates.stock_quantity = Number(productUpdates.stock_quantity)
      productUpdates.in_stock = productUpdates.stock_quantity > 0
    }
    if (productUpdates.weight) {
      productUpdates.weight = Number(productUpdates.weight)
    }

    // Final update object prepared

    const { data, error } = await supabase
      .from('products')
      .update(productUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json({ 
          success: false,
          error: 'Product not found' 
        }, { status: 404 })
      }
      throw error
    }

    // Parse images field back to array for response (handle both old single URL format and new JSON array format)
    let images = []
    if (data.images) {
      try {
        // Try to parse as JSON array first
        images = JSON.parse(data.images)
        // If it's not an array, make it one
        if (!Array.isArray(images)) {
          images = [images]
        }
      } catch (e) {
        // If parsing fails, treat as single URL string
        images = [data.images]
      }
    }
    
    const processedData = {
      ...data,
      images
    }

    // Product updated successfully
    
    return Response.json({
      success: true,
      data: processedData,
      message: 'Product updated successfully'
    })

  } catch (error) {
    console.error('❌ Error updating product:', error)
    return Response.json({ 
      success: false,
      error: 'Failed to update product',
      message: error.message 
    }, { status: 500 })
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    // Deleting product
    const supabase = getSupabaseServer()

    // First check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return Response.json({ 
          success: false,
          error: 'Product not found' 
        }, { status: 404 })
      }
      throw fetchError
    }

    // Delete the product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    // Product deleted successfully
    
    return Response.json({
      success: true,
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error deleting product:', error)
    return Response.json({ 
      success: false,
      error: 'Failed to delete product',
      message: error.message 
    }, { status: 500 })
  }
}
