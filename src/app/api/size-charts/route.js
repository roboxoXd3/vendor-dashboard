import { getSupabaseServer } from '@/lib/supabase-server'

// GET - List size charts for a vendor
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const vendorId = searchParams.get('vendorId')
  
  if (!vendorId) {
    return Response.json({ error: 'Vendor ID is required' }, { status: 400 })
  }

  const supabase = getSupabaseServer()

  try {
    const { data, error } = await supabase
      .from('vendor_size_chart_templates')
      .select(`
        *,
        categories(name)
      `)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform data to include category name
    const sizeCharts = data.map(chart => ({
      ...chart,
      category_name: chart.categories?.name || null,
      categories: undefined // Remove the nested object
    }))

    return Response.json({ sizeCharts })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new size chart
export async function POST(request) {
  const supabase = getSupabaseServer()
  const body = await request.json()

  try {
    const { data, error } = await supabase
      .from('vendor_size_chart_templates')
      .insert({
        vendor_id: body.vendor_id,
        name: body.name,
        category_id: body.category_id || null,
        measurement_types: body.measurement_types,
        measurement_instructions: body.measurement_instructions,
        template_data: {
          entries: body.entries
        },
        approval_status: 'pending',
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ 
      success: true, 
      sizeChart: data,
      message: 'Size chart created successfully'
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
