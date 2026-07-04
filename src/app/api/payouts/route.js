import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'
import { fetchAllVendorOrders } from '@/lib/besmart-orders-api'

// GET /api/payouts - Fetch vendor payout data
export async function GET() {
  try {
    const { response, error, status } = await besmartRequest('/api/vendors/payouts/summary/')
    if (error) {
      return Response.json({ error }, { status })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: message }, { status: response.status })
    }
    const summary = await response.json()

    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    let thisMonthEarnings = 0
    let lastMonthEarnings = 0

    try {
      const orders = await fetchAllVendorOrders()
      orders
        .filter((o) => o.payment_status === 'completed')
        .forEach((order) => {
          const orderDate = new Date(order.created_at)
          const orderTotal = parseFloat(order.total || 0)
          if (orderDate >= currentMonthStart) {
            thisMonthEarnings += orderTotal
          } else if (orderDate >= lastMonthStart && orderDate <= lastMonthEnd) {
            lastMonthEarnings += orderTotal
          }
        })
    } catch {
      // Non-critical — payout summary still returns without the monthly breakdown
    }

    const payoutData = {
      availableBalance: Number(summary.availableBalance || 0).toFixed(2),
      pendingBalance: Number(summary.pendingBalance || 0).toFixed(2),
      lifetimeEarnings: Number(summary.lifetimeEarnings || 0).toFixed(2),
      thisMonthEarnings: thisMonthEarnings.toFixed(2),
      lastMonthEarnings: lastMonthEarnings.toFixed(2),
      currency: summary.currency || 'NGN'
    }

    return Response.json({
      success: true,
      data: payoutData
    })

  } catch (error) {
    console.error('❌ Payout API error:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
