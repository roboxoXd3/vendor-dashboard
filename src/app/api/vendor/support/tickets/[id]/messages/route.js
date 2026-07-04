import { NextResponse } from 'next/server'
import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

function formatMessageTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (messageDate.getTime() === today.getTime()) return `Today, ${timeString}`
  if (messageDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) return `Yesterday, ${timeString}`
  return date.toLocaleDateString() + ', ' + timeString
}

// GET - Get a ticket + its messages
export async function GET(request, { params }) {
  try {
    const { id } = await params

    const ticketRes = await besmartRequest(`/api/support/tickets/${id}/`)
    if (ticketRes.error) {
      return NextResponse.json({ error: ticketRes.error }, { status: ticketRes.status })
    }
    if (!ticketRes.response.ok) {
      const message = await parseBesmartError(ticketRes.response)
      return NextResponse.json(
        { error: ticketRes.response.status === 404 ? 'Ticket not found or access denied' : message },
        { status: ticketRes.response.status }
      )
    }
    const ticket = await ticketRes.response.json()

    const messagesRes = await besmartRequest(`/api/support/tickets/${id}/messages/`)
    if (messagesRes.error) {
      return NextResponse.json({ error: messagesRes.error }, { status: messagesRes.status })
    }
    if (!messagesRes.response.ok) {
      const message = await parseBesmartError(messagesRes.response)
      return NextResponse.json({ error: message }, { status: messagesRes.response.status })
    }
    const messagesData = await messagesRes.response.json()
    const messages = messagesData.results || messagesData || []

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      from: msg.sender_role,
      text: msg.message_content,
      time: formatMessageTime(msg.created_at),
      timestamp: msg.created_at
    }))

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        created_at: ticket.created_at,
        last_updated: ticket.last_updated
      },
      messages: formattedMessages
    })

  } catch (error) {
    console.error('Error in GET /api/vendor/support/tickets/[id]/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Send new message to ticket
//
// Note: the old Supabase-direct version also flipped the ticket's status
// from 'open' to 'in_progress' when a vendor replied. Django marks `status`
// read-only for vendors (matches its ownership/permission model), so that
// side effect isn't carried over here. See docs/BACKEND_ACTION_ITEMS.
export async function POST(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { message } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    const ticketRes = await besmartRequest(`/api/support/tickets/${id}/`)
    if (ticketRes.error) {
      return NextResponse.json({ error: ticketRes.error }, { status: ticketRes.status })
    }
    if (!ticketRes.response.ok) {
      const errMessage = await parseBesmartError(ticketRes.response)
      return NextResponse.json(
        { error: ticketRes.response.status === 404 ? 'Ticket not found or access denied' : errMessage },
        { status: ticketRes.response.status }
      )
    }
    const ticket = await ticketRes.response.json()

    if (ticket.status === 'closed') {
      return NextResponse.json({ error: 'Cannot send messages to closed tickets' }, { status: 400 })
    }

    const { response, error, status } = await besmartRequest(`/api/support/tickets/${id}/messages/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_content: message.trim(), sender_role: 'vendor' }),
    })

    if (error) {
      return NextResponse.json({ error }, { status })
    }
    if (!response.ok) {
      const errMessage = await parseBesmartError(response)
      return NextResponse.json({ error: errMessage || 'Failed to send message' }, { status: response.status })
    }

    const newMessage = await response.json()

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        from: 'vendor',
        text: newMessage.message_content,
        time: formatMessageTime(newMessage.created_at),
        timestamp: newMessage.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/vendor/support/tickets/[id]/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
