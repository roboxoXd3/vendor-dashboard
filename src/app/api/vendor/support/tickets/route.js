import { NextResponse } from 'next/server'
import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

function getTimeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now - date
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInDays < 7) return `${diffInDays}d ago`
  return `${Math.floor(diffInDays / 7)}w ago`
}

// GET - List vendor's tickets with filtering (proxies filter/search/pagination to Django)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const priorityFilter = searchParams.get('priority')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const page = Math.floor(offset / limit) + 1

    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('page_size', String(limit))
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
    if (priorityFilter && priorityFilter !== 'all') params.set('priority', priorityFilter)
    if (search) params.set('search', search)

    const { response, error, status } = await besmartRequest(`/api/support/tickets/?${params.toString()}`)
    if (error) return NextResponse.json({ error }, { status })
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return NextResponse.json({ error: message }, { status: response.status })
    }
    const data = await response.json()
    const tickets = data.results || data || []
    const total = data.count ?? tickets.length

    const formattedTickets = tickets.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      created_at: ticket.created_at,
      last_updated: ticket.last_updated,
      resolved_at: ticket.resolved_at,
      message_count: (ticket.messages || []).length,
      time_ago: getTimeAgo(ticket.last_updated)
    }))

    return NextResponse.json({
      tickets: formattedTickets,
      total,
      has_more: offset + limit < total
    })

  } catch (error) {
    console.error('Error in GET /api/vendor/support/tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new ticket
export async function POST(request) {
  try {
    const body = await request.json()
    const { subject, category, priority, message } = body

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    const validCategories = ['general', 'payment', 'technical', 'inventory', 'integration']
    const validPriorities = ['low', 'normal', 'high', 'urgent']

    if (category && !validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
    }

    const { response, error, status } = await besmartRequest('/api/support/tickets/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: subject.trim(),
        category: category || 'general',
        priority: priority || 'normal',
      }),
    })

    if (error) {
      return NextResponse.json({ error }, { status })
    }
    if (!response.ok) {
      const message_ = await parseBesmartError(response)
      return NextResponse.json({ error: message_ || 'Failed to create ticket' }, { status: response.status })
    }

    const ticket = await response.json()

    // Create the initial message on the new ticket
    const messageRes = await besmartRequest(`/api/support/tickets/${ticket.id}/messages/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_content: message.trim(), sender_role: 'vendor' }),
    })

    if (messageRes.error || !messageRes.response.ok) {
      // Best-effort cleanup so a vendor doesn't end up with an empty ticket
      await besmartRequest(`/api/support/tickets/${ticket.id}/`, { method: 'DELETE' }).catch(() => null)
      return NextResponse.json({ error: 'Failed to create ticket message' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        created_at: ticket.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/vendor/support/tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
