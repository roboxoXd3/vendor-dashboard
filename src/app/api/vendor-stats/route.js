import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    
    if (!vendorId) {
      return Response.json({ 
        error: 'Vendor ID is required' 
      }, { status: 400 })
    }

    console.log('📊 Fetching product stats for vendor:', vendorId)

    // Get total products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)

    // Get active products
    const { count: activeProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .eq('status', 'active')

    // Get out of stock products
    const { count: outOfStock } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .eq('status', 'active')
      .lte('stock_quantity', 0)

    // Get featured products
    const { count: featuredProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .eq('is_featured', true)

    const stats = {
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      outOfStock: outOfStock || 0,
      featuredProducts: featuredProducts || 0
    }

    console.log('✅ Product stats retrieved:', stats)
    return Response.json({ data: stats })

  } catch (error) {
    console.error('❌ Error fetching product stats:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}