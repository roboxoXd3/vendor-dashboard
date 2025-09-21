import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseServer } from '@/lib/supabase-server'

// Helper function to get vendor from session
async function getVendorFromSession() {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    
    if (!sessionToken) {
      return { error: 'No session token found', status: 401 }
    }

    const supabase = getSupabaseServer()

    // Get vendor session
    const { data: session, error: sessionError } = await supabase
      .from('vendor_sessions')
      .select('vendor_id, user_id')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !session) {
      return { error: 'Invalid or expired session', status: 401 }
    }

    // Get vendor data separately
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, business_name, status')
      .eq('id', session.vendor_id)
      .single()

    if (vendorError || !vendor) {
      return { error: 'Vendor not found', status: 401 }
    }

    return { vendor, user_id: session.user_id }
  } catch (error) {
    console.error('Error getting vendor from session:', error)
    return { error: 'Session validation failed', status: 500 }
  }
}

// GET - Get messages for a specific ticket
export async function GET(request, { params }) {
  try {
    const { vendor, user_id, error, status } = await getVendorFromSession()
    
    if (error) {
      return NextResponse.json({ error }, { status })
    }

    const ticketId = params.id
    const supabase = getSupabaseServer()

    // First verify the ticket belongs to this vendor
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, subject, status, priority, category, created_at, last_updated')
      .eq('id', ticketId)
      .eq('vendor_id', vendor.id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ 
        error: 'Ticket not found or access denied' 
      }, { status: 404 })
    }

    // Get messages for this ticket
    const { data: messages, error: messagesError } = await supabase
      .from('support_messages')
      .select(`
        id,
        sender_id,
        sender_role,
        message_content,
        created_at
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Format messages
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      from: msg.sender_role, // 'vendor' or 'admin'
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
export async function POST(request, { params }) {
  try {
    const { vendor, user_id, error, status } = await getVendorFromSession()
    
    if (error) {
      return NextResponse.json({ error }, { status })
    }

    const ticketId = params.id
    const body = await request.json()
    const { message } = body

    // Validate message
    if (!message || !message.trim()) {
      return NextResponse.json({ 
        error: 'Message content is required' 
      }, { status: 400 })
    }

    const supabase = getSupabaseServer()

    // Verify the ticket belongs to this vendor and is not closed
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, status')
      .eq('id', ticketId)
      .eq('vendor_id', vendor.id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ 
        error: 'Ticket not found or access denied' 
      }, { status: 404 })
    }

    if (ticket.status === 'closed') {
      return NextResponse.json({ 
        error: 'Cannot send messages to closed tickets' 
      }, { status: 400 })
    }

    // Create the message
    const { data: newMessage, error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user_id,
        sender_role: 'vendor',
        message_content: message.trim()
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Update ticket's last_updated timestamp and status to in_progress if it was open
    const updateData = { 
      last_updated: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (ticket.status === 'open') {
      updateData.status = 'in_progress'
    }

    const { error: updateError } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId)

    if (updateError) {
      console.error('Error updating ticket timestamp:', updateError)
      // Don't fail the request if timestamp update fails
    }

    // Format and return the new message
    const formattedMessage = {
      id: newMessage.id,
      from: 'vendor',
      text: newMessage.message_content,
      time: formatMessageTime(newMessage.created_at),
      timestamp: newMessage.created_at
    }

    return NextResponse.json({
      success: true,
      message: formattedMessage
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/vendor/support/tickets/[id]/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to format message time
function formatMessageTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const timeString = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
  
  if (messageDate.getTime() === today.getTime()) {
    return `Today, ${timeString}`
  } else if (messageDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
    return `Yesterday, ${timeString}`
  } else {
    return date.toLocaleDateString() + ', ' + timeString
  }
}
