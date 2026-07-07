import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

// TODO(backend): this widget only needs simple counts (total/active/out-of-stock/
// featured), but Django has no aggregate stats endpoint for a vendor's own
// products (the master handoff doc mentions a planned `products/statistics/`
// endpoint that was never built) — see docs/BACKEND_ISSUES.md. Until that
// exists, we page through every product with the full serializer just to
// count them. Mitigated here by using Django's max page_size (100, cutting
// round-trips ~5x for large catalogs) and fetching pages in parallel once the
// total count is known, instead of one page at a time sequentially.
const MAX_PAGES = 50
const PAGE_SIZE = 100

async function fetchAllOwnProducts() {
  const firstRes = await besmartRequest(`/api/vendors/own-products/?page=1&page_size=${PAGE_SIZE}`)
  if (firstRes.error || !firstRes.response.ok) return []
  const firstData = await firstRes.response.json()
  const all = [...(firstData.results || [])]

  const totalPages = Math.min(Math.ceil((firstData.count || all.length) / PAGE_SIZE), MAX_PAGES)
  if (totalPages > 1) {
    const remaining = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => i + 2).map((page) =>
        besmartRequest(`/api/vendors/own-products/?page=${page}&page_size=${PAGE_SIZE}`)
      )
    )
    for (const { response, error } of remaining) {
      if (error || !response.ok) continue
      const data = await response.json()
      all.push(...(data.results || []))
    }
  }

  return all
}

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

    const products = await fetchAllOwnProducts()

    let followerCount = 0
    const followersRes = await besmartRequest(`/api/vendors/${vendor.id}/followers/`)
    if (!followersRes.error && followersRes.response.ok) {
      const followersData = await followersRes.response.json()
      followerCount = followersData.count || 0
    }

    const stats = {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.status === 'active').length,
      outOfStock: products.filter((p) => p.status === 'active' && (p.stock_quantity ?? 0) <= 0).length,
      featuredProducts: products.filter((p) => p.is_featured).length,
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
