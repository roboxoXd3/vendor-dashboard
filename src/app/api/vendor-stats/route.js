import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

// Backed by Django's real aggregate endpoint (GET /api/vendors/own-products/statistics/,
// added in commit c6e7107), which returns {totalProducts, activeProducts, outOfStock,
// featuredProducts} via a single DB-side .aggregate() — no more paginating through
// every product just to count them.
export async function GET() {
  try {
    const profileRes = await besmartRequest('/api/vendors/profile/')
    if (profileRes.error) {
      return Response.json({ error: profileRes.error }, { status: profileRes.status })
    }
    if (!profileRes.response.ok) {
      const message = await parseBesmartError(profileRes.response)
      return Response.json({ error: message }, { status: profileRes.response.status })
    }
    const vendor = await profileRes.response.json()

    const statsRes = await besmartRequest('/api/vendors/own-products/statistics/')
    if (statsRes.error) {
      return Response.json({ error: statsRes.error }, { status: statsRes.status })
    }
    if (!statsRes.response.ok) {
      const message = await parseBesmartError(statsRes.response)
      return Response.json({ error: message }, { status: statsRes.response.status })
    }
    const productStats = await statsRes.response.json()

    let followerCount = 0
    const followersRes = await besmartRequest(`/api/vendors/${vendor.id}/followers/`)
    if (!followersRes.error && followersRes.response.ok) {
      const followersData = await followersRes.response.json()
      followerCount = followersData.count || 0
    }

    const stats = {
      totalProducts: productStats.totalProducts || 0,
      activeProducts: productStats.activeProducts || 0,
      outOfStock: productStats.outOfStock || 0,
      featuredProducts: productStats.featuredProducts || 0,
      inStock: productStats.inStock || 0,
      lowStock: productStats.lowStock || 0,
      followerCount
    }

    return Response.json({ data: stats })

  } catch (error) {
    console.error('❌ Error fetching product stats:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
