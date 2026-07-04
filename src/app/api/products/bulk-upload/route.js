import { NextResponse } from 'next/server'
import { besmartRequest, parseBesmartError, getBesmartBaseUrl } from '@/lib/besmart-api'

async function fetchCategoryNameToIdMap() {
  const map = new Map()
  try {
    const res = await fetch(`${getBesmartBaseUrl()}/api/categories/`)
    if (res.ok) {
      const categories = await res.json()
      for (const cat of Array.isArray(categories) ? categories : categories.results || []) {
        if (cat.name) map.set(cat.name.toLowerCase(), cat.id)
      }
    }
  } catch {
    // fall through with an empty map — category_id just won't be set
  }
  return map
}

async function fetchOwnProductSkuMap() {
  const skuToId = new Map()
  let path = '/api/vendors/own-products/'

  for (let i = 0; i < 50 && path; i++) {
    const { response, error } = await besmartRequest(path)
    if (error || !response.ok) break

    const data = await response.json()
    for (const product of data.results || []) {
      if (product.sku) skuToId.set(product.sku, product.id)
    }
    path = data.next ? data.next.replace(/^https?:\/\/[^/]+/, '') : null
  }

  return skuToId
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { products } = body

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Products array is required and cannot be empty'
      }, { status: 400 })
    }

    // Fetch existing SKUs for this vendor so same-SKU rows update instead of
    // creating a duplicate (Product.sku is globally unique in Django).
    let existingSkus
    try {
      existingSkus = await fetchOwnProductSkuMap()
    } catch {
      existingSkus = new Map()
    }
    const categoryMap = await fetchCategoryNameToIdMap()

    const errors = []
    const processedProducts = []

    products.forEach((product, i) => {
      const rowNumber = i + 2 // account for header row

      if (!product.name?.trim()) {
        errors.push(`Row ${rowNumber}: Product name is required`)
        return
      }
      if (!product.price || isNaN(parseFloat(product.price))) {
        errors.push(`Row ${rowNumber}: Valid price is required`)
        return
      }

      let categoryId
      if (product.category_name?.trim()) {
        categoryId = categoryMap.get(product.category_name.trim().toLowerCase())
        if (!categoryId) {
          errors.push(`Row ${rowNumber}: Category "${product.category_name}" not found. Available categories: ${Array.from(categoryMap.keys()).join(', ')}`)
          return
        }
      }

      const processArray = (value) =>
        !value ? [] : value.split('|').map((item) => item.trim()).filter(Boolean)

      const dimensions = {}
      if (product.length) dimensions.length = parseFloat(product.length) || 0
      if (product.width) dimensions.width = parseFloat(product.width) || 0
      if (product.height) dimensions.height = parseFloat(product.height) || 0

      const processBoolean = (value) =>
        !!value && ['true', '1', 'yes'].includes(value.toString().toLowerCase())

      const sku = product.sku?.trim() || `SKU-${Date.now()}-${i}`
      const existingId = existingSkus.get(sku)

      const processed = {
        ...(existingId ? { id: existingId } : {}),
        name: product.name.trim(),
        subtitle: product.subtitle?.trim() || '',
        description: product.description?.trim() || '',
        brand: product.brand?.trim() || '',
        sku,
        category_id: categoryId,
        price: String(parseFloat(product.price)),
        mrp: product.mrp ? String(parseFloat(product.mrp)) : undefined,
        sale_price: product.sale_price ? String(parseFloat(product.sale_price)) : undefined,
        currency: product.currency?.trim() || 'NGN',
        stock_quantity: parseInt(product.stock_quantity) || 0,
        weight: product.weight ? String(parseFloat(product.weight)) : '0',
        dimensions: Object.keys(dimensions).length > 0 ? dimensions : undefined,
        sizes: processArray(product.sizes),
        tags: processArray(product.tags),
        box_contents: processArray(product.box_contents),
        usage_instructions: processArray(product.usage_instructions),
        care_instructions: processArray(product.care_instructions),
        safety_notes: processArray(product.safety_notes),
        video_url: product.video_url?.trim() || null,
        is_featured: processBoolean(product.is_featured),
        is_new_arrival: product.is_new_arrival ? processBoolean(product.is_new_arrival) : true,
        shipping_required: product.shipping_required !== 'false' && product.shipping_required !== false,
        status: product.status?.trim() || 'active',
        meta_title: product.meta_title?.trim() || undefined,
        meta_description: product.meta_description?.trim() || undefined,
        size_chart_override: product.size_chart_override?.trim() || 'auto',
        approval_status: 'pending',
        in_stock: product.in_stock ? processBoolean(product.in_stock) : (parseInt(product.stock_quantity) > 0),
      }

      processedProducts.push(processed)
    })

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation errors found',
        errors,
        processedCount: 0,
        totalCount: products.length
      }, { status: 400 })
    }

    const { response, error, status } = await besmartRequest('/api/vendors/own-products/bulk-upload/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: processedProducts }),
    })

    if (error) {
      return NextResponse.json({ success: false, error }, { status })
    }

    if (!response.ok) {
      const message = await parseBesmartError(response)
      return NextResponse.json({ success: false, error: message }, { status: response.status })
    }

    const result = await response.json()
    const processedCount = (result.created_count || 0) + (result.updated_count || 0)

    return NextResponse.json({
      success: true,
      message: result.message || `Successfully processed ${processedCount} products`,
      processedCount,
      totalCount: products.length,
      summary: {
        totalUploaded: products.length,
        totalProcessed: processedCount,
        inserted: result.created_count || 0,
        updated: result.updated_count || 0,
      },
      // Django's bulk-upload only returns aggregate counts, not a per-item
      // breakdown — see docs/BACKEND_ACTION_ITEMS for the follow-up needed.
      data: [],
    })

  } catch (error) {
    console.error('❌ Bulk upload error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}

// GET method to check API availability
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Bulk upload API is available',
    endpoints: {
      POST: 'Upload products via CSV data'
    }
  })
}
