import { getSupabaseServer } from '@/lib/supabase-server'

// Helper function to get default hex colors for common color names
function getDefaultColorHex(colorName) {
  const colorMap = {
    'black': '#000000',
    'white': '#FFFFFF',
    'red': '#FF0000',
    'green': '#008000',
    'blue': '#0000FF',
    'yellow': '#FFFF00',
    'orange': '#FFA500',
    'purple': '#800080',
    'pink': '#FFC0CB',
    'brown': '#A52A2A',
    'gray': '#808080',
    'grey': '#808080',
    'silver': '#C0C0C0',
    'gold': '#FFD700',
    'navy': '#000080',
    'maroon': '#800000',
    'teal': '#008080',
    'lime': '#00FF00',
    'cyan': '#00FFFF',
    'magenta': '#FF00FF'
  }
  
  const normalizedName = colorName.toLowerCase().trim()
  return colorMap[normalizedName] || '#808080' // Default to gray if not found
}

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

    // Ensure colors field is properly formatted as an object
    let colors = {}
    if (data.colors) {
      if (typeof data.colors === 'object' && !Array.isArray(data.colors)) {
        colors = data.colors
      } else if (Array.isArray(data.colors)) {
        // Convert array format to object format for consistency
        const colorObject = {}
        data.colors.forEach(color => {
          if (typeof color === 'string' && color.trim()) {
            colorObject[color.trim()] = getDefaultColorHex(color.trim())
          }
        })
        colors = colorObject
      }
    }

    
    const processedData = {
      ...data,
      images,
      colors
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

    // Handle array fields - ensure they are properly formatted arrays
    let sizesField = updates.sizes
    if (sizesField && !Array.isArray(sizesField)) {
      if (typeof sizesField === 'string') {
        sizesField = sizesField.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        sizesField = []
      }
    }

    let tagsField = updates.tags
    if (tagsField && !Array.isArray(tagsField)) {
      if (typeof tagsField === 'string') {
        tagsField = tagsField.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        tagsField = []
      }
    }

    let boxContentsField = updates.box_contents
    if (boxContentsField && !Array.isArray(boxContentsField)) {
      if (typeof boxContentsField === 'string') {
        boxContentsField = boxContentsField.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        boxContentsField = []
      }
    }

    let usageInstructionsField = updates.usage_instructions
    if (usageInstructionsField && !Array.isArray(usageInstructionsField)) {
      if (typeof usageInstructionsField === 'string') {
        usageInstructionsField = usageInstructionsField.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        usageInstructionsField = []
      }
    }

    let careInstructionsField = updates.care_instructions
    if (careInstructionsField && !Array.isArray(careInstructionsField)) {
      if (typeof careInstructionsField === 'string') {
        careInstructionsField = careInstructionsField.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        careInstructionsField = []
      }
    }

    let safetyNotesField = updates.safety_notes
    if (safetyNotesField && !Array.isArray(safetyNotesField)) {
      if (typeof safetyNotesField === 'string') {
        safetyNotesField = safetyNotesField.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        safetyNotesField = []
      }
    }

    // Handle colors field - RPC function now expects JSONB object (fixed)
    let colorsField = updates.colors
    if (colorsField) {
      if (typeof colorsField === 'string') {
        try {
          colorsField = JSON.parse(colorsField)
        } catch (e) {
          colorsField = {}
        }
      } else if (Array.isArray(colorsField)) {
        // Convert array format to object format for RPC function
        // Array: ["Blue", "Silver", "Green"] -> Object: {"Blue": "#0000FF", "Silver": "#C0C0C0", "Green": "#008000"}
        const colorObject = {}
        colorsField.forEach(color => {
          if (typeof color === 'string' && color.trim()) {
            // Use a default hex color if not provided
            colorObject[color.trim()] = getDefaultColorHex(color.trim())
          }
        })
        colorsField = colorObject
      } else if (typeof colorsField !== 'object') {
        colorsField = {}
      }
    } else {
      // Ensure colors field is never null/undefined (database requires NOT NULL)
      colorsField = {}
    }


    let colorImagesField = updates.color_images
    if (colorImagesField && typeof colorImagesField !== 'object') {
      if (typeof colorImagesField === 'string') {
        try {
          colorImagesField = JSON.parse(colorImagesField)
        } catch (e) {
          colorImagesField = {}
        }
      } else {
        colorImagesField = {}
      }
    }

    let dimensionsField = updates.dimensions
    if (dimensionsField && typeof dimensionsField !== 'object') {
      if (typeof dimensionsField === 'string') {
        try {
          dimensionsField = JSON.parse(dimensionsField)
        } catch (e) {
          dimensionsField = {}
        }
      } else {
        dimensionsField = {}
      }
    }

    let customSizeChartDataField = updates.custom_size_chart_data
    if (customSizeChartDataField && typeof customSizeChartDataField !== 'object') {
      if (typeof customSizeChartDataField === 'string') {
        try {
          customSizeChartDataField = JSON.parse(customSizeChartDataField)
        } catch (e) {
          customSizeChartDataField = null
        }
      } else {
        customSizeChartDataField = null
      }
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
      p_size_chart_override: updates.size_chart_override,
      p_sizes: sizesField,
      p_colors: colorsField,
      p_tags: tagsField
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
        p_sizes: sizesField,
        p_colors: colorsField,
        p_tags: tagsField,
        p_color_images: colorImagesField,
        p_dimensions: dimensionsField,
        p_box_contents: boxContentsField,
        p_usage_instructions: usageInstructionsField,
        p_care_instructions: careInstructionsField,
        p_safety_notes: safetyNotesField,
        p_is_featured: updates.is_featured,
        p_is_new_arrival: updates.is_new_arrival,
        p_shipping_required: updates.shipping_required,
        p_size_chart_override: updates.size_chart_override,
        p_size_chart_template_id: sizeChartTemplateId,
        p_size_guide_type: updates.size_guide_type,
        p_custom_size_chart_data: customSizeChartDataField,
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

    // Ensure colors field is properly formatted as an object
    let colors = {}
    if (data.colors) {
      if (typeof data.colors === 'object' && !Array.isArray(data.colors)) {
        colors = data.colors
      } else if (Array.isArray(data.colors)) {
        // Convert array format to object format for consistency
        const colorObject = {}
        data.colors.forEach(color => {
          if (typeof color === 'string' && color.trim()) {
            colorObject[color.trim()] = getDefaultColorHex(color.trim())
          }
        })
        colors = colorObject
      }
    }

    
    const processedData = {
      ...data,
      images,
      colors
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
