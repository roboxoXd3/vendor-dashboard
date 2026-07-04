import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'
import { fetchAllVendorOrders, filterVendorOrders, transformVendorOrder } from '@/lib/besmart-orders-api'

// GET /api/orders - List vendor orders with filters and pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const status = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let orders
    try {
      orders = await fetchAllVendorOrders()
    } catch (err) {
      return Response.json({ success: false, error: err.message }, { status: err.status || 500 })
    }

    orders = filterVendorOrders(orders, { status, dateFrom, dateTo })

    orders.sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      if (aVal === bVal) return 0
      return aVal > bVal ? 1 : -1
    })
    if (sortOrder === 'desc') orders.reverse()

    const total = orders.length
    const from = (page - 1) * limit
    const pageItems = orders.slice(from, from + limit).map(transformVendorOrder)

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
    console.error('❌ Error in orders API:', error)
    return Response.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}

// PUT /api/orders - Update order status
export async function PUT(request) {
  try {
    const body = await request.json()
    const { orderId, status, trackingNumber, notes } = body

    if (!orderId || !status) {
      return Response.json({
        error: 'Order ID and status are required'
      }, { status: 400 })
    }

    const payload = { status: status.toLowerCase() }
    if (trackingNumber) payload.tracking_number = trackingNumber
    if (notes) payload.notes = notes

    const { response, error, status: httpStatus } = await besmartRequest(
      `/api/vendors/orders/${orderId}/status/`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    if (error) {
      return Response.json({ error }, { status: httpStatus })
    }

    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json(
        { error: response.status === 404 ? 'Order not found or not associated with this vendor' : message },
        { status: response.status }
      )
    }

    const data = await response.json()

    return Response.json({
      success: true,
      data,
      message: 'Order updated successfully'
    })

  } catch (error) {
    console.error('❌ Error updating order:', error)
    return Response.json({
      success: false,
      error: 'Failed to update order',
      message: error.message
    }, { status: 500 })
  }
}
