import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'
import { fetchAllVendorOrders } from '@/lib/besmart-orders-api'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

// GET /api/transactions - Fetch vendor transaction history (earnings, withdrawals, refunds)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const type = searchParams.get('type') || 'all'

    let orders = []
    try {
      orders = await fetchAllVendorOrders()
    } catch (err) {
      // Surface auth failures (don't silently return an empty list for a
      // logged-out user); other errors are non-critical — continue.
      if (err.status === 401) {
        return Response.json({ error: err.message || 'Authentication required' }, { status: 401 })
      }
    }

    const allTransactions = []

    // 1. Earnings from completed orders
    orders
      .filter((o) => o.payment_status === 'completed')
      .forEach((order) => {
        allTransactions.push({
          id: `ORD-${order.id.slice(0, 8)}`,
          type: 'Earning',
          description: `Order #${order.id.slice(0, 8)}`,
          amount: Number(order.total) || 0,
          currency: order.order_items?.[0]?.products?.currency || 'NGN',
          date: formatDate(order.created_at),
          created_at: order.created_at,
          status: order.escrow_status || 'completed',
          orderId: order.id
        })
      })

    // 2. Withdrawals from payout requests
    const payoutsRes = await besmartRequest('/api/vendors/payouts/')
    if (!payoutsRes.error && payoutsRes.response.ok) {
      const payoutsData = await payoutsRes.response.json()
      const payouts = payoutsData.results || payoutsData || []

      let bankAccountsById = new Map()
      const bankRes = await besmartRequest('/api/vendors/bank-accounts/')
      if (!bankRes.error && bankRes.response.ok) {
        const bankData = await bankRes.response.json()
        bankAccountsById = new Map((bankData.results || bankData || []).map((a) => [a.id, a]))
      }

      payouts.forEach((payout) => {
        let transactionType = 'Withdrawal'
        let description = 'Payout request'
        const account = bankAccountsById.get(payout.bank_account)

        if (payout.status === 'completed') {
          description = `Payout to ${account?.account_number ? `****${String(account.account_number).slice(-4)}` : 'bank account'}`
        } else if (payout.status === 'failed') {
          description = 'Failed payout attempt'
          transactionType = 'Failed Withdrawal'
        } else if (payout.status === 'pending') {
          description = 'Pending payout request'
        }

        allTransactions.push({
          id: `PAY-${payout.id.slice(0, 8)}`,
          type: transactionType,
          description,
          amount: -(Number(payout.amount) || 0),
          currency: payout.currency || 'NGN',
          date: formatDate(payout.requested_at),
          created_at: payout.requested_at,
          status: payout.status
        })
      })
    }

    // 3. Refunds from refunded orders
    orders
      .filter((o) => o.payment_status === 'refunded')
      .forEach((order) => {
        allTransactions.push({
          id: `REF-${order.id.slice(0, 8)}`,
          type: 'Refund',
          description: `Refund for Order #${order.id.slice(0, 8)}`,
          amount: -(Number(order.total) || 0),
          currency: order.order_items?.[0]?.products?.currency || 'NGN',
          date: formatDate(order.updated_at || order.created_at),
          created_at: order.updated_at || order.created_at,
          status: 'refunded',
          orderId: order.id
        })
      })

    allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    const filteredTransactions =
      type === 'all'
        ? allTransactions
        : allTransactions.filter((t) => t.type.toLowerCase() === type.toLowerCase())

    const offset = (page - 1) * limit
    const paginatedTransactions = filteredTransactions.slice(offset, offset + limit)

    return Response.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          page,
          limit,
          total: filteredTransactions.length,
          pages: Math.ceil(filteredTransactions.length / limit)
        },
        summary: {
          totalTransactions: allTransactions.length,
          earnings: allTransactions.filter((t) => t.type === 'Earning').length,
          withdrawals: allTransactions.filter((t) => t.type === 'Withdrawal').length,
          refunds: allTransactions.filter((t) => t.type === 'Refund').length
        }
      }
    })

  } catch (error) {
    console.error('❌ Transaction history API error:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
