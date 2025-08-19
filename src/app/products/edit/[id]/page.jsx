'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProductForm from '../../../(Tabs)/products/components/form/ProductForm'

export default function EditProductPage({ params }) {
  const router = useRouter()
  const [productData, setProductData] = useState(null)
  const [productId, setProductId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const resolvedParams = await params
        const id = resolvedParams.id
        setProductId(id)

                       // Loading product for edit

        const response = await fetch(`/api/products/${id}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to load product')
        }

        const product = result.data
        
        // Transform the data to match form structure
        const formData = {
          name: product.name || '',
          subtitle: product.subtitle || '',
          description: product.description || '',
          brand: product.brand || '',
          sku: product.sku || '',
          category_id: product.category_id || '',
          
          price: product.price?.toString() || '',
          mrp: product.mrp?.toString() || '',
          sale_price: product.sale_price?.toString() || '',
          currency: product.currency || 'USD',
          stock_quantity: product.stock_quantity?.toString() || '',
          weight: product.weight?.toString() || '',
          
          images: Array.isArray(product.images) ? product.images : 
                  (typeof product.images === 'string' ? product.images.split(',').filter(Boolean) : []),
          video_url: product.video_url || '',
          
          sizes: product.sizes || [],
          colors: product.colors || [],
          tags: product.tags || [],
          color_images: product.color_images || {},
          dimensions: product.dimensions || {
            length: '',
            width: '',
            height: '',
            unit: 'cm'
          },
          
          box_contents: product.box_contents || [],
          usage_instructions: product.usage_instructions || [],
          care_instructions: product.care_instructions || [],
          safety_notes: product.safety_notes || [],
          
          is_featured: product.is_featured || false,
          is_new_arrival: product.is_new_arrival || false,
          shipping_required: product.shipping_required !== false
        }

                       // Product data loaded successfully
        setProductData(formData)
      } catch (err) {
        console.error('❌ Error loading product:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [params])

  const handleBack = () => {
    router.push('/products')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Product</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }

  return (
    <ProductForm 
      initialData={productData}
      productId={productId}
      onBack={handleBack}
      isEdit={true}
    />
  )
}
