import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'
import { fetchAllVendorOrders } from '@/lib/besmart-orders-api'

// GET /api/escrow - Fetch vendor escrow transactions
//
// Note: Django tracks escrow via a dedicated EscrowTransaction model (not
// fields on Order like the old Supabase schema); customer name/email are
// resolved via the order's customer_name/customer_email fields.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    const djangoStatus = status === 'pending' ? 'held' : status // Django has no separate "pending" bucket
    const query = djangoStatus !== 'all' ? `?status=${djangoStatus}` : ''

    const { response, error, status: httpStatus } = await besmartRequest(`/api/vendors/escrow/${query}`)
    if (error) {
      return Response.json({ error }, { status: httpStatus })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: 'Failed to fetch escrow orders', details: message }, { status: response.status })
    }
    const { data: transactions } = await response.json()

    let ordersById = new Map()
    try {
      const orders = await fetchAllVendorOrders()
      ordersById = new Map(orders.map((o) => [o.id, o]))
    } catch {
      // Non-critical — escrow list still returns without order-derived fields
    }

    const processed = (transactions || []).map((txn) => {
      const order = ordersById.get(txn.order_id)

      let statusDisplay = 'Unknown'
      let statusClass = 'bg-gray-100 text-gray-700'
      if (txn.status === 'held') {
        const releaseDate = txn.release_date ? new Date(txn.release_date) : null
        const daysUntilRelease = releaseDate ? Math.ceil((releaseDate - new Date()) / (1000 * 60 * 60 * 24)) : null
        if (daysUntilRelease != null && daysUntilRelease > 0) {
          statusDisplay = `Pending (${daysUntilRelease} days)`
          statusClass = 'bg-yellow-100 text-yellow-700'
        } else {
          statusDisplay = 'Ready for Release'
          statusClass = 'bg-blue-100 text-blue-700'
        }
      } else if (txn.status === 'released') {
        statusDisplay = 'Released'
        statusClass = 'bg-green-100 text-green-700'
      } else if (txn.status === 'refunded') {
        statusDisplay = 'Refunded'
        statusClass = 'bg-red-100 text-red-700'
      }

      const releaseDateFormatted = txn.release_date
        ? new Date(txn.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'N/A'

      return {
        id: txn.id,
        customer: order?.customer_name || 'Unknown Customer',
        customerEmail: order?.customer_email || '',
        amount: Number(txn.amount || 0).toFixed(2),
        currency: order?.order_items?.[0]?.products?.currency || 'NGN',
        status: statusDisplay,
        statusClass,
        releaseDate: releaseDateFormatted,
        escrowStatus: txn.status,
        createdAt: txn.created_at
      }
    })

    return Response.json({
      success: true,
      data: processed
    })

  } catch (error) {
    console.error('❌ Escrow API error:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
