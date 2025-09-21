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

// GET - List vendor's tickets with filtering
export async function GET(request) {
  try {
    const { vendor, user_id, error, status } = await getVendorFromSession()
    
    if (error) {
      return NextResponse.json({ error }, { status })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const priorityFilter = searchParams.get('priority')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = getSupabaseServer()

    // Build query
    let query = supabase
      .from('support_tickets')
      .select(`
        id,
        subject,
        status,
        priority,
        category,
        created_at,
        last_updated,
        resolved_at,
        support_messages(count)
      `)
      .eq('vendor_id', vendor.id)
      .order('last_updated', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (priorityFilter && priorityFilter !== 'all') {
      query = query.eq('priority', priorityFilter)
    }

    if (search) {
      query = query.or(`subject.ilike.%${search}%,id.ilike.%${search}%`)
    }

    const { data: tickets, error: ticketsError } = await query

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    // Format the response
    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      created_at: ticket.created_at,
      last_updated: ticket.last_updated,
      resolved_at: ticket.resolved_at,
      message_count: ticket.support_messages[0]?.count || 0,
      time_ago: getTimeAgo(ticket.last_updated)
    }))

    return NextResponse.json({ 
      tickets: formattedTickets,
      total: tickets.length,
      has_more: tickets.length === limit
    })

  } catch (error) {
    console.error('Error in GET /api/vendor/support/tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new ticket
export async function POST(request) {
  try {
    const { vendor, user_id, error, status } = await getVendorFromSession()
    
    if (error) {
      return NextResponse.json({ error }, { status })
    }

    const body = await request.json()
    const { subject, category, priority, message } = body

    // Validate required fields
    if (!subject || !message) {
      return NextResponse.json({ 
        error: 'Subject and message are required' 
      }, { status: 400 })
    }

    // Validate category and priority
    const validCategories = ['general', 'payment', 'technical', 'inventory', 'integration']
    const validPriorities = ['low', 'normal', 'high', 'urgent']

    if (category && !validCategories.includes(category)) {
      return NextResponse.json({ 
        error: 'Invalid category' 
      }, { status: 400 })
    }

    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ 
        error: 'Invalid priority' 
      }, { status: 400 })
    }

    const supabase = getSupabaseServer()

    // Create the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        vendor_id: vendor.id,
        subject: subject.trim(),
        category: category || 'general',
        priority: priority || 'normal',
        status: 'open'
      })
      .select()
      .single()

    if (ticketError) {
      console.error('Error creating ticket:', ticketError)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    // Create the initial message
    const { error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: user_id,
        sender_role: 'vendor',
        message_content: message.trim()
      })

    if (messageError) {
      console.error('Error creating initial message:', messageError)
      // Try to clean up the ticket if message creation failed
      await supabase.from('support_tickets').delete().eq('id', ticket.id)
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

// Helper function to get time ago string
function getTimeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now - date
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`
  } else {
    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}w ago`
  }
}
