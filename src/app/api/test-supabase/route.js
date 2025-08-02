import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('API Route - Supabase URL:', supabaseUrl)
    console.log('API Route - Key exists:', !!supabaseAnonKey)
    console.log('API Route - Key length:', supabaseAnonKey?.length)
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json({ 
        error: 'Missing environment variables',
        url: !!supabaseUrl,
        key: !!supabaseAnonKey
      }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Test simple query
    const { data, error } = await supabase
      .from('vendors')
      .select('business_name')
      .limit(1)
    
    if (error) {
      return Response.json({ 
        error: 'Supabase query failed',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }
    
    return Response.json({ 
      success: true,
      message: 'Supabase connection working',
      vendorCount: data?.length || 0,
      environment: {
        url: supabaseUrl,
        keyLength: supabaseAnonKey.length
      }
    })
    
  } catch (error) {
    return Response.json({ 
      error: 'API Route error',
      message: error.message
    }, { status: 500 })
  }
}