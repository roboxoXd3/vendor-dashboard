import { isValidUuid } from '@/lib/validators'

/**
 * Product create/update helpers for BeSmart (Django) API.
 *
 * Option B flow (create):
 * 1. POST /api/vendors/own-products/  →  product ID from Django
 * 2. Upsert same ID to Supabase  →  dashboard list
 * 3. Upload images/video via /api/products/{id}/upload-*  →  R2
 * 4. PUT /api/products/{id}  →  save R2 URLs in Supabase
 */

function cleanStringArray(values) {
  if (!Array.isArray(values)) return []
  return values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
}

function stringifyJsonField(value, fallback = '{}') {
  if (value == null || value === '') return fallback
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function sanitizeDimensions(dimensions) {
  if (!dimensions || typeof dimensions !== 'object') return null
  const length = parseFloat(dimensions.length) || 0
  const width = parseFloat(dimensions.width) || 0
  const height = parseFloat(dimensions.height) || 0
  if (length === 0 && width === 0 && height === 0) return null
  return { length, width, height }
}

/** Strip image_url from colors — media is uploaded after create */
function sanitizeColorsForBesmart(colors) {
  const sanitized = {}
  for (const [name, data] of Object.entries(colors || {})) {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      sanitized[name] = {
        hex: data.hex || '#808080',
        sizes: data.sizes || {},
      }
    } else if (typeof data === 'string' && data.trim()) {
      sanitized[name] = { hex: data.trim(), sizes: {} }
    }
  }
  return sanitized
}

/**
 * Build payload for POST /api/vendors/own-products/
 * colors / color_images / dimensions must be JSON objects (not strings) so upload APIs can mutate them.
 * Omits read-only fields: search_vector, embedding, rating, reviews, orders_count.
 */
export function buildBesmartProductCreatePayload(productData, vendorId, approvalStatus = 'pending') {
  const colorsObj = sanitizeColorsForBesmart(productData.colors)
  const stockFromColors = Object.values(colorsObj).reduce((total, colorData) => {
    if (colorData?.sizes) {
      return total + Object.values(colorData.sizes).reduce((s, qty) => s + (Number(qty) || 0), 0)
    }
    return total
  }, 0)
  const stockQuantity = Number(productData.stock_quantity) || stockFromColors || 0
  const uniqueSku =
    productData.sku && String(productData.sku).trim()
      ? String(productData.sku).trim()
      : `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const dimensions = sanitizeDimensions(productData.dimensions)
  const tags = cleanStringArray(productData.tags)
  const boxContents = cleanStringArray(productData.box_contents)
  const usageInstructions = cleanStringArray(productData.usage_instructions)
  const careInstructions = cleanStringArray(productData.care_instructions)
  const safetyNotes = cleanStringArray(productData.safety_notes)

  const payload = {
    name: String(productData.name || '').trim(),
    description: productData.description?.trim() || '',
    price: String(Number(productData.price) || 0),
    images: stringifyJsonField(productData.images, '[]'),
    sizes: cleanStringArray(productData.sizes),
    in_stock: stockQuantity > 0,
    brand: productData.brand?.trim() || '',
    is_featured: !!productData.is_featured,
    is_new_arrival: productData.is_new_arrival ?? true,
    approval_status: approvalStatus,
    sku: uniqueSku,
    stock_quantity: stockQuantity,
    weight:
      productData.weight && Number(productData.weight) > 0
        ? String(productData.weight)
        : '0',
    status: productData.status || 'active',
    colors: colorsObj,
    shipping_required: productData.shipping_required !== false,
    meta_title: productData.meta_title?.trim() || '',
    meta_description: productData.meta_description?.trim() || '',
    tags,
    color_images: {},
    size_guide_type: productData.size_guide_type || 'template',
    subtitle: productData.subtitle?.trim() || '',
    currency: productData.currency || 'NGN',
    box_contents: boxContents,
    usage_instructions: usageInstructions,
    care_instructions: careInstructions,
    safety_notes: safetyNotes,
    size_chart_override: productData.size_chart_override || 'auto',
    cod_allowed: productData.cod_allowed === true,
  }

  if (dimensions) {
    payload.dimensions = dimensions
  }

  if (isValidUuid(vendorId)) {
    payload.vendor_id = vendorId
  }

  const categoryId = isValidUuid(productData.category_id) ? productData.category_id : null
  if (categoryId) payload.category_id = categoryId

  const subcategoryId = isValidUuid(productData.subcategory_id) ? productData.subcategory_id : null
  if (subcategoryId) payload.subcategory_id = subcategoryId

  const sizeChartTemplateId = isValidUuid(productData.size_chart_template_id)
    ? productData.size_chart_template_id
    : null
  if (sizeChartTemplateId) payload.size_chart_template_id = sizeChartTemplateId

  if (productData.sale_price && Number(productData.sale_price) > 0) {
    payload.sale_price = String(productData.sale_price)
  }

  if (productData.mrp && Number(productData.mrp) > 0) {
    payload.mrp = String(productData.mrp)
  }

  if (productData.custom_size_chart_data) {
    payload.custom_size_chart_data = stringifyJsonField(productData.custom_size_chart_data)
  }

  // video_url / main images uploaded after create via separate endpoints
  // search_vector, embedding, rating, reviews, orders_count — read-only, never send

  return payload
}

export function parseProductImages(images) {
  if (!images) return []
  if (Array.isArray(images)) return images
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return typeof images === 'string' ? [images] : []
  }
}

export function transformBesmartProduct(product) {
  if (!product) return product
  return {
    ...product,
    images: parseProductImages(product.images),
    price: product.price != null ? Number(product.price) : product.price,
    sale_price: product.sale_price != null ? Number(product.sale_price) : product.sale_price,
  }
}
