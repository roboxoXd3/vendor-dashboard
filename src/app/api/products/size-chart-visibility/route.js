import { getSupabaseServer } from '@/lib/supabase-server'

export async function PATCH(request) {
  const supabase = getSupabaseServer()
  const { productId, sizeChartOverride } = await request.json()

  try {
    // Use raw SQL to avoid PostgREST cache issues
    const { data, error } = await supabase
      .rpc('update_product_size_chart_override', {
        p_product_id: productId,
        p_size_chart_override: sizeChartOverride
      })

    if (error) {
      // Fallback to direct update if RPC doesn't exist
      const { data: updateData, error: updateError } = await supabase
        .from('products')
        .update({ 
          size_chart_override: sizeChartOverride,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select()
        .single()

      if (updateError) throw updateError
      
      return Response.json({ 
        success: true, 
        product: updateData,
        message: `Size chart ${sizeChartOverride === 'hide' ? 'hidden' : 'shown'} for product`
      })
    }

    return Response.json({ 
      success: true, 
      product: data,
      message: `Size chart ${sizeChartOverride === 'hide' ? 'hidden' : 'shown'} for product`
    })
  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
