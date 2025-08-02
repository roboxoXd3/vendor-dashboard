import { supabase } from './supabase'

// Test Supabase connection and verify vendor data
export async function testSupabaseConnection() {
  try {
    console.log('🔄 Testing Supabase connection...')
    console.log('🔧 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('🔧 Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log('🔧 Supabase client:', supabase)
    
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('vendors')
      .select('count', { count: 'exact', head: true })
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError)
      return { success: false, error: connectionError }
    }
    
    console.log('✅ Supabase connection successful!')
    console.log(`📊 Found ${connectionTest} vendors in database`)
    
    // Test vendor data fetch
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .limit(1)
    
    if (vendorError) {
      console.error('❌ Vendor fetch failed:', vendorError)
      return { success: false, error: vendorError }
    }
    
    if (vendors && vendors.length > 0) {
      console.log('✅ Vendor data fetched successfully!')
      console.log('🏪 Sample vendor:', vendors[0].business_name)
      console.log('📧 Business email:', vendors[0].business_email)
      console.log('✅ Status:', vendors[0].status)
    }
    
    return { 
      success: true, 
      vendorCount: connectionTest,
      sampleVendor: vendors[0] || null
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error)
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return { success: false, error: {
      message: error.message || 'Unknown error',
      details: error.toString(),
      type: error.name || 'Exception'
    }}
  }
}

// Test authentication status
export async function testAuthStatus() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('ℹ️  No authenticated user (expected for initial setup)')
      return { authenticated: false, user: null }
    }
    
    if (user) {
      console.log('✅ User authenticated:', user.email)
      return { authenticated: true, user }
    }
    
    console.log('ℹ️  No user session found')
    return { authenticated: false, user: null }
    
  } catch (error) {
    console.error('❌ Auth test failed:', error)
    return { authenticated: false, error }
  }
}