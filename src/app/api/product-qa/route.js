import { getSupabaseServer } from '@/lib/supabase-server'

// GET /api/product-qa - Get product Q&A for vendor with filters and pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const productId = searchParams.get('productId')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const status = searchParams.get('status') || 'pending'
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const hasAnswer = searchParams.get('hasAnswer') || ''

    if (!vendorId) {
      return Response.json({ 
        error: 'Vendor ID is required' 
      }, { status: 400 })
    }

    console.log('❓ Fetching Q&A for vendor:', vendorId, 'with filters:', {
      productId, page, limit, status, sortBy, sortOrder, hasAnswer
    })

    const supabase = getSupabaseServer()
    
    // Build the query - get Q&A with product info
    let query = supabase
      .from('product_qa')
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

    if (hasAnswer === 'true') {
      query = query.not('answer', 'is', null)
    } else if (hasAnswer === 'false') {
      query = query.is('answer', null)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: questions, error: questionsError } = await query

    if (questionsError) {
      console.error('❌ Error fetching Q&A:', questionsError)
      return Response.json({ 
        error: 'Failed to fetch Q&A',
        details: questionsError.message 
      }, { status: 500 })
    }

    // Fetch user profiles for the questions
    let questionsWithProfiles = questions || []
    if (questions && questions.length > 0) {
      const userIds = [...new Set(questions.map(q => q.user_id).filter(Boolean))]
      
      if (userIds.length > 0) {
        // Fetch profiles using the correct column names
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, image_path')
          .in('id', userIds)

        // Create profiles map from existing profiles
        const profilesMap = {}
        if (!profilesError && profiles && profiles.length > 0) {
          profiles.forEach(profile => {
            profilesMap[profile.id] = profile
          })
        }

        // For users without profiles, fetch their email from auth.users
        const missingUserIds = userIds.filter(id => !profilesMap[id])
        if (missingUserIds.length > 0) {
          const { data: authUsers, error: authError } = await supabase
            .from('auth.users')
            .select('id, email')
            .in('id', missingUserIds)

          if (!authError && authUsers && authUsers.length > 0) {
            authUsers.forEach(user => {
              profilesMap[user.id] = {
                id: user.id,
                full_name: user.email?.split('@')[0] || 'User',
                image_path: null
              }
            })
          }
        }

        questionsWithProfiles = questions.map(question => ({
          ...question,
          profiles: question.user_id ? profilesMap[question.user_id] || null : null
        }))
      }
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('product_qa')
      .select('id, products!inner(vendor_id)', { count: 'exact', head: true })
      .eq('products.vendor_id', vendorId)

    if (productId) countQuery = countQuery.eq('product_id', productId)
    if (status && status !== 'all') countQuery = countQuery.eq('status', status)
    if (hasAnswer === 'true') countQuery = countQuery.not('answer', 'is', null)
    else if (hasAnswer === 'false') countQuery = countQuery.is('answer', null)

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('❌ Error getting Q&A count:', countError)
    }

    // Get Q&A statistics
    const { data: stats, error: statsError } = await supabase
      .from('product_qa')
      .select(`
        status,
        answer,
        products!inner(vendor_id)
      `)
      .eq('products.vendor_id', vendorId)

    let qaStats = {
      total: count || 0,
      byStatus: { pending: 0, answered: 0, hidden: 0 },
      needingAnswer: 0,
      answerRate: 0
    }

    if (stats && !statsError) {
      stats.forEach(qa => {
        qaStats.byStatus[qa.status] = (qaStats.byStatus[qa.status] || 0) + 1
        if (!qa.answer) {
          qaStats.needingAnswer++
        }
      })
      
      const totalQuestions = stats.length
      const answeredQuestions = stats.filter(qa => qa.answer).length
      if (totalQuestions > 0) {
        qaStats.answerRate = ((answeredQuestions / totalQuestions) * 100).toFixed(1)
      }
    }

    console.log('✅ Q&A fetched successfully:', {
      count: questions?.length,
      total: count,
      stats: qaStats
    })

    return Response.json({
      success: true,
      data: {
        questions: questionsWithProfiles,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        },
        stats: qaStats
      }
    })

  } catch (error) {
    console.error('❌ Q&A API error:', error)
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

// PUT /api/product-qa - Update Q&A (vendor answer)
export async function PUT(request) {
  try {
    const body = await request.json()
    const { questionId, answer, action, vendorId } = body

    if (!questionId) {
      return Response.json({ 
        error: 'Question ID is required' 
      }, { status: 400 })
    }

    console.log('❓ Updating Q&A:', questionId, 'action:', action)

    const supabase = getSupabaseServer()

    let updateData = {}

    if (action === 'answer' && answer) {
      updateData = {
        answer: answer,
        answered_at: new Date().toISOString(),
        status: 'answered',
        vendor_id: vendorId,
        vendor_response: answer,
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
        status: 'pending',
        updated_at: new Date().toISOString()
      }
    } else if (action === 'approve') {
      // For approve, we keep status as pending but mark it as reviewed by vendor
      updateData = {
        status: 'pending', // Keep as pending since 'approved' is not allowed by DB constraint
        vendor_id: vendorId, // Mark that vendor has reviewed it
        updated_at: new Date().toISOString()
      }
    } else {
      return Response.json({ 
        error: 'Invalid action or missing answer' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('product_qa')
      .update(updateData)
      .eq('id', questionId)
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
      console.error('❌ Error updating Q&A:', error)
      return Response.json({ 
        error: 'Failed to update Q&A',
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ Q&A updated successfully:', data.id)

    return Response.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('❌ Q&A update error:', error)
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
