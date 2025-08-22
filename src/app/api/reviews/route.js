import { getSupabaseServer } from '@/lib/supabase-server'

// GET /api/reviews - Get product reviews for vendor with filters and pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const productId = searchParams.get('productId')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const rating = searchParams.get('rating') || ''
    const status = searchParams.get('status') || 'published'
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const hasResponse = searchParams.get('hasResponse') || ''

    if (!vendorId) {
      return Response.json({ 
        error: 'Vendor ID is required' 
      }, { status: 400 })
    }

    console.log('📝 Fetching reviews for vendor:', vendorId, 'with filters:', {
      productId, page, limit, rating, status, sortBy, sortOrder, hasResponse
    })

    const supabase = getSupabaseServer()
    
    // Build the query - get reviews with product and user info
    let query = supabase
      .from('product_reviews')
      .select(`
        *,
        products!inner(
          id,
          name,
          images,
          vendor_id
        )
      `)
      .eq('products.vendor_id', vendorId)

    // Apply filters
    if (productId) {
      query = query.eq('product_id', productId)
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (rating) {
      query = query.eq('rating', parseInt(rating))
    }

    if (hasResponse === 'true') {
      query = query.not('vendor_response', 'is', null)
    } else if (hasResponse === 'false') {
      query = query.is('vendor_response', null)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: reviews, error: reviewsError } = await query

    if (reviewsError) {
      console.error('❌ Error fetching reviews:', reviewsError)
      return Response.json({ 
        error: 'Failed to fetch reviews',
        details: reviewsError.message 
      }, { status: 500 })
    }

    // Fetch user profiles for the reviews
    let reviewsWithProfiles = reviews || []
    if (reviews && reviews.length > 0) {
      const userIds = [...new Set(reviews.map(r => r.user_id).filter(Boolean))]
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, image_path')
          .in('id', userIds)

        if (!profilesError && profiles) {
          const profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile
            return acc
          }, {})

          reviewsWithProfiles = reviews.map(review => ({
            ...review,
            profiles: review.user_id ? profilesMap[review.user_id] || null : null
          }))
        }
      }
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('product_reviews')
      .select('id, products!inner(vendor_id)', { count: 'exact', head: true })
      .eq('products.vendor_id', vendorId)

    if (productId) countQuery = countQuery.eq('product_id', productId)
    if (status && status !== 'all') countQuery = countQuery.eq('status', status)
    if (rating) countQuery = countQuery.eq('rating', parseInt(rating))
    if (hasResponse === 'true') countQuery = countQuery.not('vendor_response', 'is', null)
    else if (hasResponse === 'false') countQuery = countQuery.is('vendor_response', null)

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('❌ Error getting reviews count:', countError)
    }

    // Get review statistics
    const { data: stats, error: statsError } = await supabase
      .from('product_reviews')
      .select(`
        rating,
        status,
        vendor_response,
        products!inner(vendor_id)
      `)
      .eq('products.vendor_id', vendorId)

    let reviewStats = {
      total: count || 0,
      byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      byStatus: { published: 0, hidden: 0, pending_moderation: 0 },
      needingResponse: 0,
      averageRating: 0
    }

    if (stats && !statsError) {
      stats.forEach(review => {
        reviewStats.byRating[review.rating] = (reviewStats.byRating[review.rating] || 0) + 1
        reviewStats.byStatus[review.status] = (reviewStats.byStatus[review.status] || 0) + 1
        if (!review.vendor_response) {
          reviewStats.needingResponse++
        }
      })
      
      const totalRatings = Object.values(reviewStats.byRating).reduce((sum, count) => sum + count, 0)
      if (totalRatings > 0) {
        const weightedSum = Object.entries(reviewStats.byRating).reduce((sum, [rating, count]) => {
          return sum + (parseInt(rating) * count)
        }, 0)
        reviewStats.averageRating = (weightedSum / totalRatings).toFixed(1)
      }
    }

    console.log('✅ Reviews fetched successfully:', {
      count: reviews?.length,
      total: count,
      stats: reviewStats
    })

    return Response.json({
      success: true,
      data: {
        reviews: reviewsWithProfiles,
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

    console.log('📝 Updating review:', reviewId, 'action:', action)

    const supabase = getSupabaseServer()

    let updateData = {}

    if (action === 'respond' && vendorResponse) {
      updateData = {
        vendor_response: vendorResponse,
        vendor_response_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    } else if (action === 'hide') {
      updateData = {
        status: 'hidden',
        updated_at: new Date().toISOString()
      }
    } else if (action === 'show') {
      updateData = {
        status: 'published',
        updated_at: new Date().toISOString()
      }
    } else {
      return Response.json({ 
        error: 'Invalid action or missing vendor response' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('product_reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select(`
        *,
        products(
          id,
          name,
          vendor_id
        )
      `)
      .single()

    if (error) {
      console.error('❌ Error updating review:', error)
      return Response.json({ 
        error: 'Failed to update review',
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ Review updated successfully:', data.id)

    return Response.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('❌ Review update error:', error)
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
