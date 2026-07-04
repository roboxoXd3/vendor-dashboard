import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

async function fetchAllOwnProducts() {
  const all = []
  let path = '/api/vendors/own-products/'
  for (let i = 0; i < 50 && path; i++) {
    const { response, error } = await besmartRequest(path)
    if (error || !response.ok) break
    const data = await response.json()
    all.push(...(data.results || []))
    path = data.next ? data.next.replace(/^https?:\/\/[^/]+/, '') : null
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
