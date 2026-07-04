import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'
import { buildBesmartProductCreatePayload, transformBesmartProduct } from '@/lib/besmart-product-api'

// Safety cap on pages fetched from Django when assembling the full catalog
// for client-side search/filter/sort. Django's own-products list has no
// filterset_fields/search_fields and a fixed page size (20, not overridable),
// so there's no way to ask it for filtered/sorted results directly — see
// docs/BACKEND_ACTION_ITEMS for the follow-up needed to remove this.
const MAX_PAGES = 50

async function fetchAllOwnProducts() {
  const all = []
  let path = '/api/vendors/own-products/'

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

    // Django returns a full absolute URL in `next` — reduce to path+query
    // since besmartRequest expects a path relative to the BeSmart base URL.
    path = data.next ? data.next.replace(/^https?:\/\/[^/]+/, '') : null
  }

  return all
}

// GET /api/products - List vendor products with filters, search, sort, pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const search = (searchParams.get('search') || '').trim().toLowerCase()
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let products
    try {
      products = await fetchAllOwnProducts()
    } catch (err) {
      return Response.json({ success: false, error: err.message }, { status: err.status || 500 })
    }

    products = products.map(transformBesmartProduct)

    if (search) {
      products = products.filter((p) =>
        (p.name || '').toLowerCase().includes(search) ||
        (p.sku || '').toLowerCase().includes(search) ||
        (p.category || '').toLowerCase().includes(search)
      )
    }

    if (category) {
      products = products.filter((p) => p.category_id === category)
    }

    if (status) {
      products = products.filter((p) => p.status === status)
    }

    // Django's list is already ordered newest-first (added_date desc), which
    // is our best proxy for created_at since that field isn't exposed by
    // ProductListSerializer. Only name/price are sortable with real values.
    if (sortBy === 'name') {
      products.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      if (sortOrder === 'desc') products.reverse()
    } else if (sortBy === 'price') {
      products.sort((a, b) => (a.price || 0) - (b.price || 0))
      if (sortOrder === 'desc') products.reverse()
    } else if (sortBy === 'created_at' && sortOrder === 'asc') {
      products.reverse()
    }

    const total = products.length
    const from = (page - 1) * limit
    const pageItems = products.slice(from, from + limit)

    return Response.json({
      success: true,
      data: pageItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
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
    const { productData } = body

    if (!productData?.name || !productData?.price) {
      return Response.json({
        error: 'Product name and price are required'
      }, { status: 400 })
    }

    // All new products require admin approval
    const approvalStatus = 'pending'

    const payload = buildBesmartProductCreatePayload(productData, null, approvalStatus)

    const { response, error, status } = await besmartRequest('/api/vendors/own-products/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (error) {
      return Response.json({ success: false, error }, { status })
    }

    if (!response.ok) {
      const message = await parseBesmartError(response)
      const isAuthError =
        response.status === 401 ||
        response.status === 403 ||
        message.toLowerCase().includes('authentication') ||
        message.toLowerCase().includes('credentials')

      const friendlyError = isAuthError
        ? 'BeSmart authentication failed. Please log out and log in again, then retry.'
        : message

      return Response.json(
        { success: false, error: friendlyError, message: friendlyError },
        { status: isAuthError ? 401 : response.status >= 500 ? 502 : response.status }
      )
    }

    const data = await response.json()

    return Response.json({
      success: true,
      data: transformBesmartProduct(data),
      message: 'Product created successfully',
      media_ready: true,
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
