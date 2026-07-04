import { getBesmartBaseUrl } from '@/lib/besmart-api'

// GET /api/categories - Public category list (Django, no auth needed)
export async function GET() {
  try {
    const response = await fetch(`${getBesmartBaseUrl()}/api/categories/`)

    if (!response.ok) {
      return Response.json({ success: false, error: 'Failed to fetch categories' }, { status: response.status })
    }

    const data = await response.json()
    const categories = Array.isArray(data) ? data : data.results || []

    const categoriesWithSubcategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      subcategories: (category.subcategories || []).filter((sub) => sub.is_active)
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
