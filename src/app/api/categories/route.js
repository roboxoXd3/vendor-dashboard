import { getSupabaseServer } from '@/lib/supabase-server'

export async function GET() {
  const supabase = getSupabaseServer()

  try {
    // Fetch categories with their subcategories
    const { data, error } = await supabase
      .from('categories')
      .select(`
        id, 
        name, 
        description,
        subcategories (
          id,
          name,
          description,
          is_active
        )
      `)
      .eq('is_active', true)
      .order('name')

    if (error) throw error

    // Transform the data to include subcategories in a more accessible format
    const categoriesWithSubcategories = data.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      subcategories: category.subcategories?.filter(sub => sub.is_active) || []
    }))

    return Response.json({ 
      success: true,
      categories: categoriesWithSubcategories 
    })
  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
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
