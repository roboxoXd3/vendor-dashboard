import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'
import { buildBesmartProductCreatePayload, transformBesmartProduct } from '@/lib/besmart-product-api'

// Django's ordering_fields for VendorOwnProductViewSet are name/price/added_date.
// created_at isn't exposed by the serializer, so we proxy sortBy=created_at to
// added_date, Django's real newest-first field.
const ORDERING_FIELD = { name: 'name', price: 'price', created_at: 'added_date' }

// GET /api/products - List vendor products with filters, search, sort, pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const search = (searchParams.get('search') || '').trim()
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('page_size', String(limit))
    if (search) params.set('search', search)
    if (category) params.set('category_id', category)
    if (status) params.set('status', status)
    const orderingField = ORDERING_FIELD[sortBy] || 'added_date'
    params.set('ordering', sortOrder === 'asc' ? orderingField : `-${orderingField}`)

    const { response, error, status: httpStatus } = await besmartRequest(`/api/vendors/own-products/?${params.toString()}`)
    if (error) {
      return Response.json({ success: false, error }, { status: httpStatus })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ success: false, error: message }, { status: response.status })
    }

    const data = await response.json()
    const products = (data.results || []).map(transformBesmartProduct)
    const total = data.count ?? products.length

    return Response.json({
      success: true,
      data: products,
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
