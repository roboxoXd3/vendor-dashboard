// Reviews Service - API calls for review management
export const reviewsService = {
  // Get vendor reviews with filters
  async getVendorReviews(vendorId, options = {}) {
    try {
      const params = new URLSearchParams({
        vendorId,
        page: options.page || 1,
        limit: options.limit || 20,
        sortBy: options.sortBy || 'created_at',
        sortOrder: options.sortOrder || 'desc'
      })

      // Add optional filters
      if (options.productId) {
        params.append('productId', options.productId)
      }
      if (options.rating) {
        params.append('rating', options.rating)
      }
      if (options.status && options.status !== 'all') {
        params.append('status', options.status)
      }
      if (options.hasResponse !== undefined) {
        params.append('hasResponse', options.hasResponse)
      }


      const response = await fetch(`/api/reviews?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch reviews')
      }

      const data = await response.json()
      
      return data.data
    } catch (error) {
      console.error('Error fetching reviews:', error)
      throw error
    }
  },

  // Respond to a review
  async respondToReview(reviewId, vendorResponse) {
    try {
      console.log('📝 Responding to review:', reviewId)

      const response = await fetch('/api/reviews', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          vendorResponse,
          action: 'respond'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to respond to review')
      }

      const data = await response.json()
      
      return data.data
    } catch (error) {
      console.error('Error responding to review:', error)
      throw error
    }
  },

  // Hide/Show review
  async updateReviewVisibility(reviewId, action) {
    try {

      const response = await fetch('/api/reviews', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          action // 'hide' or 'show'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update review visibility')
      }

      const data = await response.json()
      
      return data.data
    } catch (error) {
      console.error('Error updating review visibility:', error)
      throw error
    }
  },

  // Export reviews data
  async exportReviews(vendorId, options = {}) {
    try {
      console.log('📊 Exporting reviews for vendor:', vendorId)

      const params = new URLSearchParams({
        vendorId,
        limit: 1000, // Get all reviews for export
        ...options
      })

      const response = await fetch(`/api/reviews?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to export reviews')
      }

      const data = await response.json()
      
      // Convert to CSV format
      const reviews = data.data.reviews
      const csvHeaders = [
        'Review ID',
        'Product Name',
        'Customer Name',
        'Rating',
        'Title',
        'Content',
        'Verified Purchase',
        'Vendor Response',
        'Status',
        'Created Date',
        'Response Date'
      ]

      const csvRows = reviews.map(review => [
        review.id,
        review.products?.name || 'N/A',
        review.profiles?.full_name || 'Anonymous',
        review.rating,
        review.title || '',
        review.content.replace(/"/g, '""'), // Escape quotes
        review.verified_purchase ? 'Yes' : 'No',
        review.vendor_response || '',
        review.status,
        new Date(review.created_at).toLocaleDateString(),
        review.vendor_response_date ? new Date(review.vendor_response_date).toLocaleDateString() : ''
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reviews-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      
      return { success: true, count: reviews.length }
    } catch (error) {
      console.error('Error exporting reviews:', error)
      throw error
    }
  }
}
