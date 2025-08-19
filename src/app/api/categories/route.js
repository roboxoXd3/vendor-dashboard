import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// GET /api/categories - Get all categories
export async function GET(request) {
  try {
    console.log('📂 Fetching categories')

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      throw error
    }

    console.log(`✅ Retrieved ${data?.length || 0} categories`)
    
    return Response.json({
      success: true,
      categories: data || []
    })

  } catch (error) {
    console.error('❌ Error fetching categories:', error)
    return Response.json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 })
  }
}
