import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

// GET /api/product-qa - Get product Q&A for vendor with filters and pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const page = parseInt(searchParams.get('page')) || 1
    const status = searchParams.get('status') || 'pending'
    const hasAnswer = searchParams.get('hasAnswer') || ''

    const djangoParams = new URLSearchParams({ page: String(page) })
    if (productId) djangoParams.set('product_id', productId)
    if (status && status !== 'all') djangoParams.set('status', status)
    if (hasAnswer) djangoParams.set('has_answer', hasAnswer)

    const { response, error, status: httpStatus } = await besmartRequest(`/api/vendors/product-qa/?${djangoParams}`)
    if (error) {
      return Response.json({ error }, { status: httpStatus })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: 'Failed to fetch Q&A', details: message }, { status: response.status })
    }

    const { count, results } = await response.json()
    const limit = 20 // Django's PAGE_SIZE — not client-overridable, see docs/BACKEND_ACTION_ITEMS

    // Stats always reflect *all* of the vendor's Q&A (unfiltered), same as
    // the previous Supabase-direct implementation — fetch every page once
    // since Django has no aggregate stats endpoint for this.
    const allQuestions = []
    let statsPath = '/api/vendors/product-qa/'
    for (let i = 0; i < 50 && statsPath; i++) {
      const page_ = await besmartRequest(statsPath)
      if (page_.error || !page_.response.ok) break
      const data = await page_.response.json()
      allQuestions.push(...(data.results || []))
      statsPath = data.next ? data.next.replace(/^https?:\/\/[^/]+/, '') : null
    }

    const qaStats = {
      total: allQuestions.length,
      byStatus: { pending: 0, answered: 0, hidden: 0 },
      needingAnswer: 0,
      answerRate: 0
    }
    allQuestions.forEach((qa) => {
      qaStats.byStatus[qa.status] = (qaStats.byStatus[qa.status] || 0) + 1
      if (!qa.answer) qaStats.needingAnswer++
    })
    const answered = allQuestions.filter((qa) => qa.answer).length
    if (allQuestions.length > 0) {
      qaStats.answerRate = ((answered / allQuestions.length) * 100).toFixed(1)
    }

    return Response.json({
      success: true,
      data: {
        questions: results || [],
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
    const { questionId, answer, action } = body

    if (!questionId) {
      return Response.json({
        error: 'Question ID is required'
      }, { status: 400 })
    }

    if (!['answer', 'hide', 'show', 'approve'].includes(action) || (action === 'answer' && !answer)) {
      return Response.json({
        error: 'Invalid action or missing answer'
      }, { status: 400 })
    }

    const payload = { action, ...(answer ? { answer } : {}) }

    const { response, error, status } = await besmartRequest(`/api/vendors/product-qa/${questionId}/`, {
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
        { error: response.status === 404 ? 'Question not found' : 'Failed to update Q&A', details: message },
        { status: response.status }
      )
    }

    const data = await response.json()

    return Response.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('❌ Q&A update error:', error)
    return Response.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
