// Q&A Service - API calls for Q&A management
export const qaService = {
  // Get vendor Q&A with filters
  async getVendorQA(vendorId, options = {}) {
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
      if (options.status && options.status !== 'all') {
        params.append('status', options.status)
      }
      if (options.hasAnswer !== undefined) {
        params.append('hasAnswer', options.hasAnswer)
      }

      console.log('🔍 Fetching Q&A with params:', params.toString())

      const response = await fetch(`/api/product-qa?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch Q&A')
      }

      const data = await response.json()
      console.log('✅ Q&A fetched:', data.data.questions.length, 'questions')
      
      return data.data
    } catch (error) {
      console.error('❌ Error fetching Q&A:', error)
      throw error
    }
  },

  // Answer a question
  async answerQuestion(questionId, answer, vendorId) {
    try {
      console.log('💬 Answering question:', questionId)

      const response = await fetch('/api/product-qa', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          answer,
          vendorId,
          action: 'answer'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to answer question')
      }

      const data = await response.json()
      console.log('✅ Question answered successfully')
      
      return data.data
    } catch (error) {
      console.error('❌ Error answering question:', error)
      throw error
    }
  },

  // Hide/Show question
  async updateQuestionVisibility(questionId, action) {
    try {
      console.log('👁️ Updating question visibility:', questionId, action)

      const response = await fetch('/api/product-qa', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          action // 'hide' or 'show'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update question visibility')
      }

      const data = await response.json()
      console.log('✅ Question visibility updated successfully')
      
      return data.data
    } catch (error) {
      console.error('❌ Error updating question visibility:', error)
      throw error
    }
  },

  // Export Q&A data
  async exportQA(vendorId, options = {}) {
    try {
      console.log('📊 Exporting Q&A for vendor:', vendorId)

      const params = new URLSearchParams({
        vendorId,
        limit: 1000, // Get all Q&A for export
        ...options
      })

      const response = await fetch(`/api/product-qa?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to export Q&A')
      }

      const data = await response.json()
      
      // Convert to CSV format
      const questions = data.data.questions
      const csvHeaders = [
        'Question ID',
        'Product Name',
        'Customer Name',
        'Question',
        'Answer',
        'Status',
        'Helpful Count',
        'Is Verified',
        'Created Date',
        'Answered Date'
      ]

      const csvRows = questions.map(qa => [
        qa.id,
        qa.products?.name || 'N/A',
        qa.profiles?.full_name || 'Anonymous',
        qa.question.replace(/"/g, '""'), // Escape quotes
        qa.answer || '',
        qa.status,
        qa.is_helpful_count || 0,
        qa.is_verified ? 'Yes' : 'No',
        new Date(qa.created_at).toLocaleDateString(),
        qa.answered_at ? new Date(qa.answered_at).toLocaleDateString() : ''
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
      link.download = `qa-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log('✅ Q&A exported successfully')
      
      return { success: true, count: questions.length }
    } catch (error) {
      console.error('❌ Error exporting Q&A:', error)
      throw error
    }
  }
}
