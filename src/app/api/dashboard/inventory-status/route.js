import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

/**
 * GET /api/dashboard/inventory-status
 * Uses Django own-products/statistics/ which now returns inStock / lowStock.
 */
export async function GET() {
  try {
    const statsRes = await besmartRequest('/api/vendors/own-products/statistics/')
    if (statsRes.error) {
      return Response.json({ error: statsRes.error }, { status: statsRes.status })
    }
    if (!statsRes.response.ok) {
      const message = await parseBesmartError(statsRes.response)
      return Response.json({ error: message }, { status: statsRes.response.status })
    }

    const productStats = await statsRes.response.json()

    return Response.json({
      data: {
        totalProducts: productStats.activeProducts || productStats.totalProducts || 0,
        inStock: productStats.inStock || 0,
        lowStock: productStats.lowStock || 0,
        outOfStock: productStats.outOfStock || 0,
      },
    })
  } catch (error) {
    console.error('❌ Error fetching inventory status:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
