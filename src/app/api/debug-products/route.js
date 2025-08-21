import { getSupabaseServer } from '@/lib/supabase-server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    
    if (!vendorId) {
      return Response.json({ 
        error: 'Vendor ID is required' 
      }, { status: 400 })
    }

    console.log('🔍 Debug: Checking products for vendor:', vendorId)
    
    const supabase = getSupabaseServer()
    
    // First, let's check if the vendor exists
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, business_name, status')
      .eq('id', vendorId)
      .single()
    
    console.log('🔍 Debug: Vendor data:', vendor)
    console.log('🔍 Debug: Vendor error:', vendorError)
    
    // Check all products in the database (to see if there are any products at all)
    const { data: allProducts, error: allProductsError, count: totalProductCount } = await supabase
      .from('products')
      .select('id, name, vendor_id', { count: 'exact' })
      .limit(10)
    
    console.log('🔍 Debug: Total products in database:', totalProductCount)
    console.log('🔍 Debug: Sample products:', allProducts)
    console.log('🔍 Debug: All products error:', allProductsError)
    
    // Check products specifically for this vendor
    const { data: vendorProducts, error: vendorProductsError, count: vendorProductCount } = await supabase
      .from('products')
      .select('id, name, vendor_id, status, created_at', { count: 'exact' })
      .eq('vendor_id', vendorId)
    
    console.log('🔍 Debug: Vendor products count:', vendorProductCount)
    console.log('🔍 Debug: Vendor products:', vendorProducts)
    console.log('🔍 Debug: Vendor products error:', vendorProductsError)
    
    // Check if there are products with similar vendor IDs (in case of UUID format issues)
    const { data: similarVendorIds, error: similarError } = await supabase
      .from('products')
      .select('vendor_id')
      .limit(20)
    
    const uniqueVendorIds = [...new Set(similarVendorIds?.map(p => p.vendor_id) || [])]
    console.log('🔍 Debug: Unique vendor IDs in products table:', uniqueVendorIds)
    
    return Response.json({
      success: true,
      debug: {
        requestedVendorId: vendorId,
        vendor: vendor,
        vendorError: vendorError,
        totalProductsInDb: totalProductCount,
        sampleProducts: allProducts,
        vendorProductsCount: vendorProductCount,
        vendorProducts: vendorProducts,
        vendorProductsError: vendorProductsError,
        uniqueVendorIdsInProducts: uniqueVendorIds
      }
    })
    
  } catch (error) {
    console.error('❌ Debug products error:', error)
    return Response.json({ 
      error: 'Debug failed',
      message: error.message 
    }, { status: 500 })
  }
}
