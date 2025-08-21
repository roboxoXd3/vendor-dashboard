import { getSupabaseServer } from '@/lib/supabase-server'

// GET /api/categories - Get all categories
export async function GET(request) {
  try {
    console.log('📂 Fetching categories')

    const supabase = getSupabaseServer()
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

// POST /api/categories - Add new categories
export async function POST(request) {
  try {
    const body = await request.json()
    const { categories } = body

    if (!categories || !Array.isArray(categories)) {
      return Response.json({ 
        success: false,
        error: 'Categories array is required' 
      }, { status: 400 })
    }

    console.log('📂 Adding categories:', categories)

    const supabase = getSupabaseServer()
    
    // Prepare category data
    const categoryData = categories.map(category => ({
      name: category.name,
      description: category.description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()

    if (error) {
      throw error
    }

    console.log(`✅ Added ${data?.length || 0} categories`)
    
    return Response.json({
      success: true,
      message: `Successfully added ${data?.length || 0} categories`,
      categories: data || []
    })

  } catch (error) {
    console.error('❌ Error adding categories:', error)
    return Response.json({ 
      success: false,
      error: 'Failed to add categories',
      message: error.message 
    }, { status: 500 })
  }
}
