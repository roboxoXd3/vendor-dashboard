import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

// Safety cap on pages fetched from Django when assembling the full order
// history for aggregation views (escrow, exports, stats) that need every
// order rather than one filtered page.
const MAX_PAGES = 50

export async function fetchAllVendorOrders({ createdAtGte } = {}) {
  const all = []
  let path = createdAtGte
    ? `/api/vendors/orders/?created_at__gte=${encodeURIComponent(createdAtGte)}`
    : '/api/vendors/orders/'

  for (let i = 0; i < MAX_PAGES && path; i++) {
    const { response, error, status } = await besmartRequest(path)
    if (error) {
      const err = new Error(error)
      err.status = status
      throw err
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      const err = new Error(message)
      err.status = response.status
      throw err
    }

    const data = await response.json()
    all.push(...(data.results || []))
    path = data.next ? data.next.replace(/^https?:\/\/[^/]+/, '') : null
  }

  return all
}

export function filterVendorOrders(orders, { status, dateFrom, dateTo } = {}) {
  let filtered = orders
  if (status && status !== 'All Orders') {
    const wanted = status.toLowerCase()
    filtered = filtered.filter((o) => (o.status || '').toLowerCase() === wanted)
  }
  if (dateFrom) {
    filtered = filtered.filter((o) => o.created_at >= dateFrom)
  }
  if (dateTo) {
    filtered = filtered.filter((o) => o.created_at <= dateTo)
  }
  return filtered
}

function parseProductImages(images) {
  if (!images) return []
  if (Array.isArray(images)) return images
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return typeof images === 'string' ? [images] : []
  }
}

// Django's Order model is single-vendor (order.vendor_id), so every order
// this endpoint returns already belongs entirely to the logged-in vendor —
// no need to filter individual order_items by vendor like the old
// multi-vendor-per-order Supabase model required.
export function transformVendorOrder(order) {
  const orderItems = (order.order_items || []).map((item) => ({
    ...item,
    products: item.products
      ? { ...item.products, images: parseProductImages(item.products.images) }
      : item.products,
  }))

  return {
    ...order,
    order_items: orderItems,
    vendor_subtotal: Number(order.total) || 0,
    order_number: order.order_number || `ORD-${order.id.slice(-8).toUpperCase()}`,
    profiles: { full_name: order.customer_name || null, email: order.customer_email || null },
  }
}
