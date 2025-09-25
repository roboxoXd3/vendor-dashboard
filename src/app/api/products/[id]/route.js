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

    // Handle images field - convert array to JSON string if it's an array
    let imagesField = updates.images
    if (updates.images && Array.isArray(updates.images)) {
      imagesField = JSON.stringify(updates.images)
    }

    // Handle UUID fields - convert empty strings to null
    let categoryId = updates.category_id
    if (categoryId === '') {
      categoryId = null
    }
    
    let subcategoryId = updates.subcategory_id
    if (subcategoryId === '') {
      subcategoryId = null
    }
    
    let sizeChartTemplateId = updates.size_chart_template_id
    if (sizeChartTemplateId === '') {
      sizeChartTemplateId = null
    }

    // Debug: Log the data being sent
    console.log('🔍 Debug - RPC function parameters:', {
      p_product_id: id,
      p_category_id: categoryId,
      p_size_chart_template_id: sizeChartTemplateId,
      p_size_chart_override: updates.size_chart_override
    })

    // Use the robust RPC function to update the product
    const { data, error } = await supabase
      .rpc('update_product_complete', {
        p_product_id: id,
        p_name: updates.name,
        p_description: updates.description,
        p_price: updates.price ? Number(updates.price) : null,
        p_mrp: updates.mrp ? Number(updates.mrp) : null,
        p_sale_price: updates.sale_price ? Number(updates.sale_price) : null,
        p_stock_quantity: updates.stock_quantity ? Number(updates.stock_quantity) : null,
        p_weight: updates.weight ? Number(updates.weight) : null,
        p_category_id: categoryId,
        p_subcategory_id: subcategoryId,
        p_brand: updates.brand,
        p_sku: updates.sku,
        p_images: imagesField,
        p_video_url: updates.video_url,
        p_sizes: updates.sizes,
        p_colors: updates.colors,
        p_tags: updates.tags,
        p_color_images: updates.color_images,
        p_dimensions: updates.dimensions,
        p_box_contents: updates.box_contents,
        p_usage_instructions: updates.usage_instructions,
        p_care_instructions: updates.care_instructions,
        p_safety_notes: updates.safety_notes,
        p_is_featured: updates.is_featured,
        p_is_new_arrival: updates.is_new_arrival,
        p_shipping_required: updates.shipping_required,
        p_size_chart_override: updates.size_chart_override,
        p_size_chart_template_id: sizeChartTemplateId,
        p_size_guide_type: updates.size_guide_type,
        p_custom_size_chart_data: updates.custom_size_chart_data,
        p_subtitle: updates.subtitle,
        p_currency: updates.currency
      })

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
