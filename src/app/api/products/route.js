import { getSupabaseServer } from '@/lib/supabase-server'

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
      return {
        ...product,
        images
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

    const newProduct = {
      vendor_id: vendorId,
      name: productData.name,
      subtitle: productData.subtitle || '',
      description: productData.description || '',
      price: Number(productData.price),
      images: JSON.stringify(productData.images || []), // Convert array to JSON string
      video_url: productData.video_url || null,
      sizes: productData.sizes || [],
      colors: productData.colors || [],
      category_id: productData.category_id === '' ? null : productData.category_id, // Handle empty string
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
      dimensions: productData.dimensions || null,
      tags: productData.tags || [],
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
    
    const processedData = {
      ...data,
      images
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
