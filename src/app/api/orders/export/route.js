import { fetchAllVendorOrders, filterVendorOrders, transformVendorOrder } from '@/lib/besmart-orders-api'

// GET /api/orders/export - Export vendor orders as CSV
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const status = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    let orders
    try {
      orders = await fetchAllVendorOrders()
    } catch (err) {
      return Response.json({ success: false, error: err.message }, { status: err.status || 500 })
    }

    orders = filterVendorOrders(orders, { status, dateFrom, dateTo })
    orders.sort((a, b) => (a.created_at > b.created_at ? -1 : 1))

    const processedData = orders.map(transformVendorOrder).map((order) => {
      const address = order.shipping_address // Django: SerializerMethodField, single object (not an array)

      return {
        ...order,
        shipping_name: address?.name || '',
        shipping_phone: address?.phone || '',
        shipping_address_text: [
          address?.address_line1 || '',
          address?.address_line2 || '',
          address?.city || '',
          address?.state || '',
          address?.zip || '',
          address?.country || ''
        ].filter(Boolean).join(', '),
        items_count: order.order_items.length,
        items_details: order.order_items
          .map((item) => `${item.products?.name || 'Unknown'} (${item.products?.sku || 'N/A'}) x${item.quantity} @ $${item.price}`)
          .join('; ')
      }
    })

    if (format === 'csv') {
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

      const csvRows = processedData.map((order) => [
        order.id,
        order.order_number,
        order.status,
        order.total,
        order.vendor_subtotal,
        order.items_count,
        order.items_details.replace(/"/g, '""'),
        order.shipping_name,
        order.shipping_phone,
        order.shipping_address_text.replace(/"/g, '""'),
        new Date(order.created_at).toLocaleDateString(),
        order.updated_at ? new Date(order.updated_at).toLocaleDateString() : ''
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row) => row.map((field) => `"${field}"`).join(','))
      ].join('\n')

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

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
