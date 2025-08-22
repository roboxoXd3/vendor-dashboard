import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qaService } from '@/services/qaService'
import { useAuth } from '@/contexts/AuthContext'

// Query keys
export const qaKeys = {
  all: ['qa'],
  lists: () => [...qaKeys.all, 'list'],
  list: (vendorId, filters) => [...qaKeys.lists(), vendorId, filters],
  stats: (vendorId) => [...qaKeys.all, 'stats', vendorId],
}

// Get Vendor Q&A Hook
export function useVendorQA(options = {}) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: qaKeys.list(vendor?.id, options),
    queryFn: () => qaService.getVendorQA(vendor?.id, options),
    enabled: !!vendor?.id,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  })
}

// Answer Question Hook
export function useAnswerQuestion() {
  const queryClient = useQueryClient()
  const { vendor } = useAuth()

  return useMutation({
    mutationFn: ({ questionId, answer }) => 
      qaService.answerQuestion(questionId, answer, vendor?.id),
    onSuccess: (data) => {
      // Invalidate and refetch Q&A
      queryClient.invalidateQueries({ queryKey: qaKeys.lists() })
      
      // Update the specific question in cache if possible
      queryClient.setQueriesData(
        { queryKey: qaKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData
          
          return {
            ...oldData,
            questions: oldData.questions.map(question =>
              question.id === data.id ? { ...question, ...data } : question
            )
          }
        }
      )
    },
    onError: (error) => {
      console.error('Failed to answer question:', error)
    }
  })
}

// Update Question Visibility Hook
export function useUpdateQuestionVisibility() {
  const queryClient = useQueryClient()
  const { vendor } = useAuth()

  return useMutation({
    mutationFn: ({ questionId, action }) => 
      qaService.updateQuestionVisibility(questionId, action),
    onSuccess: (data) => {
      // Invalidate and refetch Q&A
      queryClient.invalidateQueries({ queryKey: qaKeys.lists() })
      
      // Update the specific question in cache
      queryClient.setQueriesData(
        { queryKey: qaKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData
          
          return {
            ...oldData,
            questions: oldData.questions.map(question =>
              question.id === data.id ? { ...question, ...data } : question
            )
          }
        }
      )
    },
    onError: (error) => {
      console.error('Failed to update question visibility:', error)
    }
  })
}

// Export Q&A Hook
export function useExportQA() {
  const { vendor } = useAuth()

  return useMutation({
    mutationFn: (options = {}) => 
      qaService.exportQA(vendor?.id, options),
    onError: (error) => {
      console.error('Failed to export Q&A:', error)
    }
  })
}

// Q&A Statistics Hook
export function useQAStats(options = {}) {
  const { vendor } = useAuth()
  
  return useQuery({
    queryKey: qaKeys.stats(vendor?.id),
    queryFn: async () => {
      const data = await qaService.getVendorQA(vendor?.id, {
        limit: 1, // We only need stats, not the actual questions
        ...options
      })
      return data.stats
    },
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  })
}

// Bulk Actions Hook
export function useBulkQAActions() {
  const queryClient = useQueryClient()
  const answerQuestion = useAnswerQuestion()
  const updateVisibility = useUpdateQuestionVisibility()

  return useMutation({
    mutationFn: async ({ questionIds, action, data }) => {
      const results = []
      
      for (const questionId of questionIds) {
        try {
          let result
          if (action === 'answer') {
            result = await answerQuestion.mutateAsync({
              questionId,
              answer: data.answer
            })
          } else if (action === 'hide' || action === 'show' || action === 'approve') {
            result = await updateVisibility.mutateAsync({
              questionId,
              action
            })
          }
          results.push({ questionId, success: true, data: result })
        } catch (error) {
          results.push({ questionId, success: false, error: error.message })
        }
      }
      
      return results
    },
    onSuccess: () => {
      // Invalidate all Q&A queries
      queryClient.invalidateQueries({ queryKey: qaKeys.all })
    },
    onError: (error) => {
      console.error('Bulk Q&A action failed:', error)
    }
  })
}
