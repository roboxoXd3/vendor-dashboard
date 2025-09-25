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

// GET /api/products - List vendor products with filters and pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    if (!vendorId) {
      return Response.json({ 
        error: 'Vendor ID is required' 
      }, { status: 400 })
    }

    console.log('📦 Fetching products for vendor:', vendorId, 'with filters:', { search, category, status, sortBy, sortOrder })
    
    const supabase = getSupabaseServer()
    
    // Debug: Check current role and auth context
    console.log('🔍 Debug: Checking Supabase client configuration...')
    
    // First check if vendor exists
    const { data: vendorCheck, error: vendorCheckError } = await supabase
      .from('vendors')
      .select('id, business_name, status, is_active')
      .eq('id', vendorId)
      .single()
    
    console.log('👤 Vendor check result:', vendorCheck)
    console.log('👤 Vendor check error:', vendorCheckError)
    
    let query = supabase
      .from('products')
      .select(`
        *,
        categories(name)
      `, { count: 'exact' })
      .eq('vendor_id', vendorId)
    
    console.log('🔍 Base query created for vendor_id:', vendorId)

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

    console.log('📊 Query results:', { 
      count, 
      dataLength: data?.length, 
      error: error?.message,
      sampleData: data?.slice(0, 2)?.map(p => ({ id: p.id, name: p.name, vendor_id: p.vendor_id }))
    })

    if (error) {
      console.error('❌ Error fetching products:', error)
      throw error
    }

    // Parse images field from JSON string to array (handle both old single URL format and new JSON array format)
    const processedData = data?.map(product => {
      let images = []
      if (product.images) {
        try {
          // Try to parse as JSON array first
          images = JSON.parse(product.images)
          // If it's not an array, make it one
          if (!Array.isArray(images)) {
            images = [images]
          }
        } catch (e) {
          // If parsing fails, treat as single URL string
          images = [product.images]
        }
      }

      // Ensure colors field is properly formatted as an object
      let colors = {}
      if (product.colors) {
        if (typeof product.colors === 'object' && !Array.isArray(product.colors)) {
          colors = product.colors
        } else if (Array.isArray(product.colors)) {
          // Convert array format to object format for consistency
          const colorObject = {}
          product.colors.forEach(color => {
            if (typeof color === 'string' && color.trim()) {
              colorObject[color.trim()] = getDefaultColorHex(color.trim())
            }
          })
          colors = colorObject
        }
      }

      return {
        ...product,
        images,
        colors
      }
    }) || []


    // Products retrieved successfully
    
    return Response.json({
      success: true,
      data: processedData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('❌ Error in products API:', error)
    return Response.json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 })
  }
}

// POST /api/products - Create new product
export async function POST(request) {
  try {
    const body = await request.json()
    const { vendorId, productData } = body

    if (!vendorId) {
      return Response.json({ 
        error: 'Vendor ID is required' 
      }, { status: 400 })
    }

    if (!productData.name || !productData.price) {
      return Response.json({ 
        error: 'Product name and price are required' 
      }, { status: 400 })
    }

    // Creating new product for vendor
    const supabase = getSupabaseServer()

    // Check vendor approval status to determine product approval status
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('status, is_active')
      .eq('id', vendorId)
      .single()

    if (vendorError) {
      console.error('❌ Error fetching vendor status:', vendorError)
      return Response.json({ 
        error: 'Failed to verify vendor status' 
      }, { status: 500 })
    }

    if (!vendor) {
      return Response.json({ 
        error: 'Vendor not found' 
      }, { status: 404 })
    }

    // All new products require admin approval
    const approvalStatus = 'pending'

    console.log(`📦 Creating product for vendor with status: ${vendor.status}, product approval_status: ${approvalStatus}`)

    // Handle array fields - ensure they are properly formatted arrays
    let sizesField = productData.sizes
    if (sizesField && !Array.isArray(sizesField)) {
      if (typeof sizesField === 'string') {
        sizesField = sizesField.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        sizesField = []
      }
    }

    let tagsField = productData.tags
    if (tagsField && !Array.isArray(tagsField)) {
      if (typeof tagsField === 'string') {
        tagsField = tagsField.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        tagsField = []
      }
    }

    let boxContentsField = productData.box_contents
    if (boxContentsField && !Array.isArray(boxContentsField)) {
      if (typeof boxContentsField === 'string') {
        boxContentsField = boxContentsField.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        boxContentsField = []
      }
    }

    let usageInstructionsField = productData.usage_instructions
    if (usageInstructionsField && !Array.isArray(usageInstructionsField)) {
      if (typeof usageInstructionsField === 'string') {
        usageInstructionsField = usageInstructionsField.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        usageInstructionsField = []
      }
    }

    let careInstructionsField = productData.care_instructions
    if (careInstructionsField && !Array.isArray(careInstructionsField)) {
      if (typeof careInstructionsField === 'string') {
        careInstructionsField = careInstructionsField.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        careInstructionsField = []
      }
    }

    let safetyNotesField = productData.safety_notes
    if (safetyNotesField && !Array.isArray(safetyNotesField)) {
      if (typeof safetyNotesField === 'string') {
        safetyNotesField = safetyNotesField.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        safetyNotesField = []
      }
    }

    // Handle colors field - database expects JSONB object for direct insert
    let colorsField = productData.colors
    if (colorsField) {
      if (typeof colorsField === 'string') {
        try {
          colorsField = JSON.parse(colorsField)
        } catch (e) {
          colorsField = {}
        }
      } else if (Array.isArray(colorsField)) {
        // Convert array format to object format for database storage
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


    let colorImagesField = productData.color_images
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

    let dimensionsField = productData.dimensions
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

    const newProduct = {
      vendor_id: vendorId,
      name: productData.name,
      subtitle: productData.subtitle || '',
      description: productData.description || '',
      price: Number(productData.price),
      mrp: productData.mrp ? Number(productData.mrp) : null,
      sale_price: productData.sale_price ? Number(productData.sale_price) : null,
      images: JSON.stringify(productData.images || []), // Convert array to JSON string
      video_url: productData.video_url || null,
      sizes: sizesField,
      colors: colorsField,
      category_id: productData.category_id === '' ? null : productData.category_id, // Handle empty string
      subcategory_id: productData.subcategory_id === '' ? null : productData.subcategory_id, // Handle empty string
      brand: productData.brand || '',
      stock_quantity: Number(productData.stock_quantity) || 0,
      sku: productData.sku || `SKU-${Date.now()}`,
      status: productData.status || 'active',
      approval_status: approvalStatus,
      in_stock: Number(productData.stock_quantity) > 0,
      is_featured: productData.is_featured || false,
      is_new_arrival: true,
      shipping_required: productData.shipping_required !== false,
      weight: productData.weight ? Number(productData.weight) : null,
      dimensions: dimensionsField,
      tags: tagsField,
      color_images: colorImagesField,
      box_contents: boxContentsField,
      usage_instructions: usageInstructionsField,
      care_instructions: careInstructionsField,
      safety_notes: safetyNotesField,
      size_chart_override: productData.size_chart_override || 'auto',
      size_chart_template_id: productData.size_chart_template_id === '' ? null : productData.size_chart_template_id,
      size_guide_type: productData.size_guide_type || 'template',
      custom_size_chart_data: productData.custom_size_chart_data || null,
      currency: productData.currency || 'USD',
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

    if (error) {
      console.error('❌ Error creating product:', error)
      throw error
    }

    // Parse images field back to array for response
    let images = []
    if (data.images) {
      try {
        images = JSON.parse(data.images)
        if (!Array.isArray(images)) {
          images = [images]
        }
      } catch (e) {
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

    // Product created successfully
    
    return Response.json({
      success: true,
      data: processedData,
      message: 'Product created successfully'
    })

  } catch (error) {
    console.error('❌ Error creating product:', error)
    return Response.json({ 
      success: false,
      error: 'Failed to create product',
      message: error.message 
    }, { status: 500 })
  }
}
