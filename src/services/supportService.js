// Vendor Support Service
// Handles all API calls for vendor support functionality

class SupportService {
  constructor() {
    this.baseUrl = '/api/vendor/support'
  }

  // Get all tickets for the current vendor
  async getTickets({ status = null, priority = null, search = null, limit = 50, offset = 0 } = {}) {
    try {
      const params = new URLSearchParams()
      
      if (status && status !== 'all') params.append('status', status)
      if (priority && priority !== 'all') params.append('priority', priority)
      if (search) params.append('search', search)
      if (limit) params.append('limit', limit.toString())
      if (offset) params.append('offset', offset.toString())

      const response = await fetch(`${this.baseUrl}/tickets?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch tickets')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching tickets:', error)
      throw error
    }
  }

  // Create a new support ticket
  async createTicket({ subject, category, priority, message }) {
    try {
      const response = await fetch(`${this.baseUrl}/tickets`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: subject.trim(),
          category: category || 'general',
          priority: priority || 'normal',
          message: message.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create ticket')
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating ticket:', error)
      throw error
    }
  }

  // Get messages for a specific ticket
  async getTicketMessages(ticketId) {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/messages`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch ticket messages')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching ticket messages:', error)
      throw error
    }
  }

  // Send a new message to a ticket
  async sendMessage(ticketId, message) {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      return await response.json()
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  // Get available categories for tickets
  getCategories() {
    return [
      { value: 'general', label: 'General Support' },
      { value: 'payment', label: 'Payment Issues' },
      { value: 'technical', label: 'Technical Problems' },
      { value: 'inventory', label: 'Inventory Management' },
      { value: 'integration', label: 'Integration Help' }
    ]
  }

  // Get available priorities for tickets
  getPriorities() {
    return [
      { value: 'low', label: 'Low' },
      { value: 'normal', label: 'Normal' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' }
    ]
  }

  // Get available statuses for filtering
  getStatuses() {
    return [
      { value: 'all', label: 'All Status' },
      { value: 'open', label: 'Open' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'closed', label: 'Closed' }
    ]
  }

  // Format status for display
  formatStatus(status) {
    const statusMap = {
      'open': 'Open',
      'in_progress': 'In Progress',
      'closed': 'Closed'
    }
    return statusMap[status] || status
  }

  // Format priority for display
  formatPriority(priority) {
    const priorityMap = {
      'low': 'Low',
      'normal': 'Normal',
      'high': 'High',
      'urgent': 'Urgent'
    }
    return priorityMap[priority] || priority
  }

  // Format category for display
  formatCategory(category) {
    const categoryMap = {
      'general': 'General Support',
      'payment': 'Payment Issues',
      'technical': 'Technical Problems',
      'inventory': 'Inventory Management',
      'integration': 'Integration Help'
    }
    return categoryMap[category] || category
  }

  // Get priority color class
  getPriorityColor(priority) {
    const colorMap = {
      'low': 'text-green-600 bg-green-100',
      'normal': 'text-blue-600 bg-blue-100',
      'high': 'text-orange-600 bg-orange-100',
      'urgent': 'text-red-600 bg-red-100'
    }
    return colorMap[priority] || 'text-gray-600 bg-gray-100'
  }

  // Get status color class
  getStatusColor(status) {
    const colorMap = {
      'open': 'text-yellow-600 bg-yellow-100',
      'in_progress': 'text-blue-600 bg-blue-100',
      'closed': 'text-green-600 bg-green-100'
    }
    return colorMap[status] || 'text-gray-600 bg-gray-100'
  }
}

// Export a singleton instance
export const supportService = new SupportService()
export default supportService
