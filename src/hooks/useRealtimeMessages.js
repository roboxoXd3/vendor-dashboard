'use client'

import { useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import supportService from '@/services/supportService'

/**
 * Poll Django support messages while a ticket is open.
 * Supabase realtime is not wired to Django tickets, so polling is the reliable path.
 */
export const useRealtimeMessages = ({
  ticketId,
  onMessageReceived,
  onError,
  enabled = true,
  intervalMs = 8000,
}) => {
  const seenIdsRef = useRef(new Set())
  const pollRef = useRef(null)
  const initialLoadDoneRef = useRef(false)

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const pollOnce = useCallback(async () => {
    if (!ticketId || !enabled) return

    try {
      const response = await supportService.getTicketMessages(ticketId)
      const messages = response.messages || []

      if (!initialLoadDoneRef.current) {
        seenIdsRef.current = new Set(messages.map((m) => m.id))
        initialLoadDoneRef.current = true
        return
      }

      for (const message of messages) {
        if (!seenIdsRef.current.has(message.id)) {
          seenIdsRef.current.add(message.id)
          onMessageReceived?.(message)
        }
      }
    } catch (error) {
      onError?.(error)
    }
  }, [ticketId, enabled, onMessageReceived, onError])

  const setupSubscription = useCallback(() => {
    cleanup()
    initialLoadDoneRef.current = false
    seenIdsRef.current = new Set()

    if (!ticketId || !enabled) return

    pollOnce()
    pollRef.current = setInterval(pollOnce, intervalMs)
  }, [ticketId, enabled, intervalMs, pollOnce, cleanup])

  useEffect(() => {
    if (ticketId && enabled) {
      setupSubscription()
    } else {
      cleanup()
    }
    return cleanup
  }, [ticketId, enabled, setupSubscription, cleanup])

  const reconnect = useCallback(() => {
    toast.success('Refreshing messages…')
    setupSubscription()
  }, [setupSubscription])

  const isConnected = useCallback(() => {
    return Boolean(ticketId && enabled && pollRef.current)
  }, [ticketId, enabled])

  return {
    reconnect,
    isConnected,
    cleanup,
  }
}

export default useRealtimeMessages
