import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

// GET /api/reviews - Get product reviews for vendor with filters and pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const page = parseInt(searchParams.get('page')) || 1
    const rating = searchParams.get('rating') || ''
    const status = searchParams.get('status') || 'published'
    const hasResponse = searchParams.get('hasResponse') || ''

    const djangoParams = new URLSearchParams({ page: String(page) })
    if (productId) djangoParams.set('product_id', productId)
    if (rating) djangoParams.set('rating', rating)
    if (status && status !== 'all') djangoParams.set('status', status)
    if (hasResponse) djangoParams.set('has_response', hasResponse)

    const { response, error, status: httpStatus } = await besmartRequest(`/api/vendors/reviews/?${djangoParams}`)
    if (error) {
      return Response.json({ error }, { status: httpStatus })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: 'Failed to fetch reviews', details: message }, { status: response.status })
    }

    const { count, results } = await response.json()
    const limit = 20 // Django's PAGE_SIZE — not client-overridable, see docs/BACKEND_ACTION_ITEMS

    // Stats always reflect *all* of the vendor's reviews (unfiltered), same
    // as the previous Supabase-direct implementation — fetch every page once
    // to compute them since Django has no aggregate stats endpoint for this.
    const allReviews = []
    let statsPath = '/api/vendors/reviews/'
    for (let i = 0; i < 50 && statsPath; i++) {
      const page_ = await besmartRequest(statsPath)
      if (page_.error || !page_.response.ok) break
      const data = await page_.response.json()
      allReviews.push(...(data.results || []))
      statsPath = data.next ? data.next.replace(/^https?:\/\/[^/]+/, '') : null
    }

    const reviewStats = {
      total: allReviews.length,
      byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      byStatus: { published: 0, hidden: 0, pending_moderation: 0 },
      needingResponse: 0,
      averageRating: 0
    }
    allReviews.forEach((review) => {
      reviewStats.byRating[review.rating] = (reviewStats.byRating[review.rating] || 0) + 1
      reviewStats.byStatus[review.status] = (reviewStats.byStatus[review.status] || 0) + 1
      if (!review.vendor_response) reviewStats.needingResponse++
    })
    const totalRatings = Object.values(reviewStats.byRating).reduce((sum, c) => sum + c, 0)
    if (totalRatings > 0) {
      const weightedSum = Object.entries(reviewStats.byRating).reduce(
        (sum, [r, c]) => sum + Number(r) * c, 0
      )
      reviewStats.averageRating = (weightedSum / totalRatings).toFixed(1)
    }

    return Response.json({
      success: true,
      data: {
        reviews: results || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        },
        stats: reviewStats
      }
    })

  } catch (error) {
    console.error('❌ Reviews API error:', error)
    return Response.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// PUT /api/reviews - Update review (vendor response)
export async function PUT(request) {
  try {
    const body = await request.json()
    const { reviewId, vendorResponse, action } = body

    if (!reviewId) {
      return Response.json({
        error: 'Review ID is required'
      }, { status: 400 })
    }

    if (!['respond', 'hide', 'show'].includes(action) || (action === 'respond' && !vendorResponse)) {
      return Response.json({
        error: 'Invalid action or missing vendor response'
      }, { status: 400 })
    }

    const payload = { action, ...(vendorResponse ? { vendor_response: vendorResponse } : {}) }

    const { response, error, status } = await besmartRequest(`/api/vendors/reviews/${reviewId}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (error) {
      return Response.json({ error }, { status })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json(
        { error: response.status === 404 ? 'Review not found' : 'Failed to update review', details: message },
        { status: response.status }
      )
    }

    const data = await response.json()

    return Response.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('❌ Review update error:', error)
    return Response.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
