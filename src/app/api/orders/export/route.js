import { getSupabaseServer } from '@/lib/supabase-server'

// GET /api/orders/export - Export vendor orders as CSV
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const format = searchParams.get('format') || 'csv'
    const status = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    if (!vendorId) {
      return Response.json({ 
        error: 'Vendor ID is required' 
      }, { status: 400 })
    }

    console.log('📦 Exporting orders for vendor:', vendorId, 'with filters:', { status, dateFrom, dateTo, format })
    
    const supabase = getSupabaseServer()
    
    // Build the query to get orders for this vendor
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items!inner(
          *,
          products!inner(
            id,
            name,
            sku,
            vendor_id
          )
        ),
        shipping_addresses(
          name,
          phone,
          address_line1,
          address_line2,
          city,
          state,
          zip,
          country
        )
      `)
      .eq('order_items.products.vendor_id', vendorId)
    
    // Add status filter
    if (status && status !== 'All Orders') {
      query = query.eq('status', status.toLowerCase())
    }

    // Add date filters
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    // Add sorting
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('❌ Error fetching orders for export:', error)
      throw error
    }

    // Process the data for export
    const processedData = data?.map(order => {
      // Get the first order item for this vendor
      const vendorOrderItems = order.order_items.filter(item => 
        item.products.vendor_id === vendorId
      )
      
      // Calculate totals for this vendor's items only
      const vendorSubtotal = vendorOrderItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      )
      
      // Get shipping address
      const shippingAddress = order.shipping_addresses?.[0]
      
      return {
        ...order,
        vendor_subtotal: vendorSubtotal,
        order_number: order.order_number || `ORD-${order.id.slice(-8).toUpperCase()}`,
        shipping_name: shippingAddress?.name || '',
        shipping_phone: shippingAddress?.phone || '',
        shipping_address: [
          shippingAddress?.address_line1 || '',
          shippingAddress?.address_line2 || '',
          shippingAddress?.city || '',
          shippingAddress?.state || '',
          shippingAddress?.zip || '',
          shippingAddress?.country || ''
        ].filter(Boolean).join(', '),
        items_count: vendorOrderItems.length,
        items_details: vendorOrderItems.map(item => 
          `${item.products.name} (${item.products.sku}) x${item.quantity} @ $${item.price}`
        ).join('; ')
      }
    }) || []

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = [
        'Order ID',
        'Order Number',
        'Status',
        'Total Amount',
        'Vendor Subtotal',
        'Items Count',
        'Items Details',
        'Customer Name',
        'Customer Phone',
        'Shipping Address',
        'Created Date',
        'Updated Date'
      ]

      const csvRows = processedData.map(order => [
        order.id,
        order.order_number,
        order.status,
        order.total,
        order.vendor_subtotal,
        order.items_count,
        order.items_details.replace(/"/g, '""'), // Escape quotes
        order.shipping_name,
        order.shipping_phone,
        order.shipping_address.replace(/"/g, '""'), // Escape quotes
        new Date(order.created_at).toLocaleDateString(),
        new Date(order.updated_at).toLocaleDateString()
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n')

      // Return CSV file
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Default to JSON response
    return Response.json({
      success: true,
      data: processedData,
      count: processedData.length
    })

  } catch (error) {
    console.error('❌ Error in orders export API:', error)
    return Response.json({ 
      success: false,
      error: 'Failed to export orders',
      message: error.message 
    }, { status: 500 })
  }
}
