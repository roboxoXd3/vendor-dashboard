'use client'
import { useRouter } from 'next/navigation'
import ProductForm from '../../(Tabs)/products/components/form/ProductForm'

export default function CreateProductPage() {
  const router = useRouter()

  const handleBack = () => {
    router.push('/products')
  }

  return (
    <ProductForm 
      onBack={handleBack}
      isEdit={false}
    />
  )
}
