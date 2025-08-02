import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ 
        error: 'Authorization header required' 
      }, { status: 401 })
    }

    // Get the token and verify it with Supabase
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ Authentication failed in vendor profile fetch:', authError)
      return Response.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    console.log('🔄 Fetching vendor profile for user:', user.email)

    // Fetch vendor profile for the authenticated user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (vendorError && vendorError.code !== 'PGRST116') {
      console.error('❌ Error fetching vendor profile:', vendorError)
      return Response.json({ 
        error: 'Database error while fetching vendor profile' 
      }, { status: 500 })
    }

    if (!vendor) {
      console.log('ℹ️ No vendor profile found for user:', user.email)
      return Response.json({ 
        vendor: null 
      })
    }

    console.log('✅ Vendor profile found:', vendor.business_name, vendor.status)
    return Response.json({ 
      vendor: {
        id: vendor.id,
        business_name: vendor.business_name,
        status: vendor.status,
        verification_status: vendor.verification_status,
        is_active: vendor.is_active,
        created_at: vendor.created_at,
        updated_at: vendor.updated_at
      }
    })

  } catch (error) {
    console.error('❌ Vendor profile API error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}