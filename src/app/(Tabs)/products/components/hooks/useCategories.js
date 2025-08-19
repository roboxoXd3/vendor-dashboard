'use client'
import { useState, useEffect } from 'react'

export const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      console.log('📂 Categories API response:', data)
      
      if (data.success && data.categories) {
        console.log('📂 Setting categories:', data.categories)
        setCategories(data.categories)
      } else {
        console.log('📂 No categories found in response')
        setCategories([])
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError(err.message)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const refetch = () => {
    fetchCategories()
  }

  return {
    categories,
    loading,
    error,
    refetch
  }
}
