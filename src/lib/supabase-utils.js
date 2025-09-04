// Supabase utility functions for better error handling and connection management

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - Result of the function or throws error
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Don't retry on certain errors
      if (error.message?.includes('Invalid credentials') || 
          error.message?.includes('Email not confirmed') ||
          error.status === 401 || 
          error.status === 403) {
        throw error
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        console.error(`❌ Max retries (${maxRetries}) reached for operation`)
        throw error
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      console.warn(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Enhanced fetch with timeout and retry logic
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>} - Fetch response
 */
export async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    
    throw error
  }
}

/**
 * Check if error is a network/connection error
 * @param {Error} error - Error to check
 * @returns {boolean} - True if it's a network error
 */
export function isNetworkError(error) {
  const networkErrorMessages = [
    'fetch failed',
    'network error',
    'connection timeout',
    'connect timeout',
    'request timeout',
    'network request failed',
    'failed to fetch'
  ]
  
  const errorMessage = error.message?.toLowerCase() || ''
  return networkErrorMessages.some(msg => errorMessage.includes(msg))
}

/**
 * Enhanced Supabase operation with retry logic
 * @param {Function} operation - Supabase operation to perform
 * @param {string} operationName - Name of the operation for logging
 * @returns {Promise} - Result of the operation
 */
export async function performSupabaseOperation(operation, operationName = 'Supabase operation') {
  return retryWithBackoff(async () => {
    console.log(`🔄 Performing ${operationName}...`)
    
    try {
      const result = await operation()
      
      if (result.error) {
        console.error(`❌ ${operationName} failed:`, result.error)
        throw new Error(result.error.message || `${operationName} failed`)
      }
      
      console.log(`✅ ${operationName} completed successfully`)
      return result
    } catch (error) {
      console.error(`❌ ${operationName} error:`, error)
      throw error
    }
  }, 3, 1000)
}

/**
 * Test Supabase connection
 * @param {object} supabaseClient - Supabase client instance
 * @returns {Promise<boolean>} - True if connection is successful
 */
export async function testSupabaseConnection(supabaseClient) {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    const { data, error } = await supabaseClient
      .from('vendors')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection test failed:', error)
      return false
    }
    
    console.log('✅ Supabase connection test successful')
    return true
  } catch (error) {
    console.error('❌ Connection test error:', error)
    return false
  }
}

/**
 * Get enhanced error message for user display
 * @param {Error} error - Error object
 * @returns {string} - User-friendly error message
 */
export function getErrorMessage(error) {
  if (isNetworkError(error)) {
    return 'Network connection error. Please check your internet connection and try again.'
  }
  
  if (error.message?.includes('Invalid credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.'
  }
  
  if (error.message?.includes('Email not confirmed')) {
    return 'Please check your email and click the confirmation link before signing in.'
  }
  
  if (error.message?.includes('timeout')) {
    return 'Request timed out. Please try again.'
  }
  
  return error.message || 'An unexpected error occurred. Please try again.'
}
