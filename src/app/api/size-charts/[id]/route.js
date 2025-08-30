import { getSupabaseServer } from '@/lib/supabase-server'

// PUT - Update a size chart
export async function PUT(request, { params }) {
  const supabase = getSupabaseServer()
  const { id } = params
  const body = await request.json()

  try {
    const { data, error } = await supabase
      .from('vendor_size_chart_templates')
      .update({
        name: body.name,
        category_id: body.category_id || null,
        measurement_types: body.measurement_types,
        measurement_instructions: body.measurement_instructions,
        template_data: {
          entries: body.entries
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return Response.json({ 
      success: true, 
      sizeChart: data,
      message: 'Size chart updated successfully'
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete a size chart
export async function DELETE(request, { params }) {
  const supabase = getSupabaseServer()
  const { id } = params

  try {
    const { error } = await supabase
      .from('vendor_size_chart_templates')
      .delete()
      .eq('id', id)

    if (error) throw error

    return Response.json({ 
      success: true,
      message: 'Size chart deleted successfully'
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
