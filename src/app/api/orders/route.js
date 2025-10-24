import { getSupabaseServer } from '@/lib/supabase-server'

// GET /api/orders - List vendor orders with filters and pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const status = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    if (!vendorId) {
      return Response.json({ 
        error: 'Vendor ID is required' 
      }, { status: 400 })
    }

    console.log('📦 Fetching orders for vendor:', vendorId, 'with filters:', { status, dateFrom, dateTo, sortBy, sortOrder })
    
    const supabase = getSupabaseServer()
    
    // First check if vendor exists
    const { data: vendorCheck, error: vendorCheckError } = await supabase
      .from('vendors')
      .select('id, business_name, status, is_active')
      .eq('id', vendorId)
      .single()
    
    console.log('👤 Vendor check result:', vendorCheck)
    console.log('👤 Vendor check error:', vendorCheckError)
    
    // Build the query to get orders for this vendor
    // We need to join with order_items to filter by vendor's products
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items!inner(
          *,
          products!inner(
            id,
            name,
            images,
            sku,
            vendor_id,
            currency
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
      `, { count: 'exact' })
      .eq('order_items.products.vendor_id', vendorId)
    
    console.log('🔍 Base query created for vendor_id:', vendorId)

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
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Add pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    console.log('📊 Query results:', { 
      count, 
      dataLength: data?.length, 
      error: error?.message,
      sampleData: data?.slice(0, 2)?.map(o => ({ id: o.id, status: o.status, total: o.total }))
    })

    if (error) {
      console.error('❌ Error fetching orders:', error)
      throw error
    }

    // Process the data to match the expected format
    const processedData = data?.map(order => {
      // Get the first order item for this vendor (there might be multiple vendors per order)
      const vendorOrderItems = order.order_items.filter(item => 
        item.products.vendor_id === vendorId
      )
      
      // Calculate totals for this vendor's items only
      const vendorSubtotal = vendorOrderItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      )
      
      // Parse product images
      const processedItems = vendorOrderItems.map(item => {
        let images = []
        if (item.products.images) {
          try {
            images = JSON.parse(item.products.images)
            if (!Array.isArray(images)) {
              images = [images]
            }
          } catch (e) {
            images = [item.products.images]
          }
        }
        
        return {
          ...item,
          products: {
            ...item.products,
            images
          }
        }
      })

      return {
        ...order,
        order_items: processedItems,
        vendor_subtotal: vendorSubtotal,
        // Generate order number if not exists
        order_number: order.order_number || `ORD-${order.id.slice(-8).toUpperCase()}`
      }
    }) || []

    return Response.json({
      success: true,
      data: processedData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('❌ Error in orders API:', error)
    return Response.json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 })
  }
}

// PUT /api/orders - Update order status
export async function PUT(request) {
  try {
    const body = await request.json()
    const { orderId, status, vendorId, trackingNumber, notes } = body

    if (!orderId || !status || !vendorId) {
      return Response.json({ 
        error: 'Order ID, status, and vendor ID are required' 
      }, { status: 400 })
    }

    console.log('📦 Updating order status:', { orderId, status, vendorId })
    
    const supabase = getSupabaseServer()

    // Verify that this vendor has items in this order
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        products!inner(vendor_id)
      `)
      .eq('order_id', orderId)
      .eq('products.vendor_id', vendorId)

    if (itemsError) {
      console.error('❌ Error checking order items:', itemsError)
      throw itemsError
    }

    if (!orderItems || orderItems.length === 0) {
      return Response.json({ 
        error: 'Order not found or not associated with this vendor' 
      }, { status: 404 })
    }

    // Update the order
    const updateData = { 
      status: status.toLowerCase(),
      updated_at: new Date().toISOString()
    }

    if (trackingNumber) {
      updateData.tracking_number = trackingNumber
    }

    if (notes) {
      updateData.notes = notes
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating order:', error)
      throw error
    }

    console.log('✅ Order updated successfully:', data.id)

    return Response.json({
      success: true,
      data,
      message: 'Order updated successfully'
    })

  } catch (error) {
    console.error('❌ Error updating order:', error)
    return Response.json({ 
      success: false,
      error: 'Failed to update order',
      message: error.message 
    }, { status: 500 })
  }
}
