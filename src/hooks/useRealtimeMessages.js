import { useEffect, useRef, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing real-time message subscriptions
 * @param {string} ticketId - The ticket ID to subscribe to
 * @param {function} onMessageReceived - Callback when a new message is received
 * @param {function} onMessageUpdated - Callback when a message is updated
 * @param {function} onMessageDeleted - Callback when a message is deleted
 * @param {function} onError - Callback for handling errors
 * @param {boolean} enabled - Whether the subscription should be active
 */
export const useRealtimeMessages = ({
  ticketId,
  onMessageReceived,
  onMessageUpdated,
  onMessageDeleted,
  onError,
  enabled = true
}) => {
  const subscriptionRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second

  // Clean up subscription
  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Handle connection errors and implement reconnection logic
  const handleConnectionError = useCallback((error) => {
    if (onError) {
      onError(error);
    }

    // Implement exponential backoff for reconnection
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
      reconnectAttemptsRef.current++;
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (ticketId && enabled) {
          setupSubscription();
        }
      }, delay);
    } else {
      toast.error('Connection lost. Please refresh the page to reconnect.');
    }
  }, [ticketId, enabled, onError]);

  // Setup the realtime subscription
  const setupSubscription = useCallback(() => {
    if (!ticketId || !enabled) return;

    try {
      const supabase = getSupabase();
      
      // Clean up existing subscription
      cleanup();

      subscriptionRef.current = supabase
        .channel(`support-messages-${ticketId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `ticket_id=eq.${ticketId}`
          },
          (payload) => {
            if (onMessageReceived) {
              onMessageReceived(payload.new);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'support_messages',
            filter: `ticket_id=eq.${ticketId}`
          },
          (payload) => {
            if (onMessageUpdated) {
              onMessageUpdated(payload.new, payload.old);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'support_messages',
            filter: `ticket_id=eq.${ticketId}`
          },
          (payload) => {
            if (onMessageDeleted) {
              onMessageDeleted(payload.old);
            }
          }
        )
        .on('system', {}, (status) => {
          if (status === 'SUBSCRIBED') {
            reconnectAttemptsRef.current = 0; // Reset reconnection attempts on successful connection
          } else if (status === 'CHANNEL_ERROR') {
            handleConnectionError(new Error('Channel error occurred'));
          } else if (status === 'TIMED_OUT') {
            handleConnectionError(new Error('Connection timed out'));
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            reconnectAttemptsRef.current = 0;
          } else if (status === 'CHANNEL_ERROR') {
            handleConnectionError(new Error('Channel error occurred'));
          } else if (status === 'TIMED_OUT') {
            handleConnectionError(new Error('Connection timed out'));
          }
        });

    } catch (error) {
      handleConnectionError(error);
    }
  }, [ticketId, enabled, onMessageReceived, onMessageUpdated, onMessageDeleted, cleanup, handleConnectionError]);

  // Setup subscription when ticketId changes or component mounts
  useEffect(() => {
    if (ticketId && enabled) {
      setupSubscription();
    } else {
      cleanup();
    }

    // Cleanup on unmount
    return cleanup;
  }, [ticketId, enabled, setupSubscription, cleanup]);

  // Manual reconnection function
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    cleanup();
    if (ticketId && enabled) {
      setupSubscription();
    }
  }, [ticketId, enabled, setupSubscription, cleanup]);

  // Check connection status
  const isConnected = useCallback(() => {
    return subscriptionRef.current && subscriptionRef.current.state === 'joined';
  }, []);

  return {
    reconnect,
    isConnected,
    cleanup
  };
};

export default useRealtimeMessages;
