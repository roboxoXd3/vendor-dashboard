import { getSupabaseClient } from '@/lib/supabase-server'

// GET /api/categories - Get all categories
export async function GET(request) {
  try {
    console.log('📂 Fetching categories')

    const supabase = getSupabaseClient()
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
