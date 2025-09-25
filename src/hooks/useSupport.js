import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import supportService from '@/services/supportService';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing vendor support functionality
 * Handles tickets, messages, and real-time updates
 */
export function useSupport() {
  const { isAuthenticated, isVendor } = useAuth();
  
  // State
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all'
  });

  // Fetch tickets with current filters
  const fetchTickets = useCallback(async (showLoading = true) => {
    if (!isAuthenticated || !isVendor) return;
    
    try {
      if (showLoading) setLoading(true);
      
      const response = await supportService.getTickets({
        status: filters.status === 'all' ? null : filters.status,
        priority: filters.priority === 'all' ? null : filters.priority,
        search: filters.search || null,
        limit: 50
      });
      
      setTickets(response.tickets);
      
      // If we have an active ticket, update it with the latest data
      if (activeTicket) {
        const updatedTicket = response.tickets.find(t => t.id === activeTicket.id);
        if (updatedTicket) {
          setActiveTicket(updatedTicket);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load tickets');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [isAuthenticated, isVendor, filters, activeTicket]);

  // Fetch messages for a specific ticket
  const fetchMessages = useCallback(async (ticketId, showLoading = true) => {
    if (!ticketId) return;
    
    try {
      if (showLoading) setMessagesLoading(true);
      
      const response = await supportService.getTicketMessages(ticketId);
      setMessages(response.messages);
      
      // Update ticket info if it's different
      if (response.ticket && (!activeTicket || activeTicket.id === ticketId)) {
        setActiveTicket(response.ticket);
      }
    } catch (error) {
      if (showLoading) {
        toast.error(error.message || 'Failed to load messages');
      }
    } finally {
      if (showLoading) setMessagesLoading(false);
    }
  }, [activeTicket]);

  // Create a new ticket
  const createTicket = useCallback(async (ticketData) => {
    try {
      const response = await supportService.createTicket(ticketData);
      
      // Refresh tickets list
      await fetchTickets(false);
      
      // Select the new ticket
      const newTicket = response.ticket;
      setActiveTicket(newTicket);
      
      toast.success('Ticket created successfully');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to create ticket');
      throw error;
    }
  }, [fetchTickets]);

  // Send a message to the active ticket
  const sendMessage = useCallback(async (messageText) => {
    if (!activeTicket || !messageText.trim()) return;

    setSendingMessage(true);
    try {
      const response = await supportService.sendMessage(activeTicket.id, messageText);
      
      // Add the new message to the list
      setMessages(prevMessages => [...prevMessages, response.message]);
      
      // Refresh tickets list to update last_updated and message count
      await fetchTickets(false);
      
      return response;
    } catch (error) {
      throw error;
    } finally {
      setSendingMessage(false);
    }
  }, [activeTicket, fetchTickets]);

  // Select a ticket
  const selectTicket = useCallback((ticket) => {
    setActiveTicket(ticket);
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Refresh current data
  const refresh = useCallback(async () => {
    await fetchTickets(false);
    if (activeTicket) {
      await fetchMessages(activeTicket.id, false);
    }
  }, [fetchTickets, fetchMessages, activeTicket]);

  // Auto-refresh tickets every 2 minutes
  useEffect(() => {
    if (!isAuthenticated || !isVendor) return;

    const refreshInterval = setInterval(() => {
      fetchTickets(false);
    }, 120000); // 2 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, isVendor, fetchTickets]);

  // Auto-refresh messages every 30 seconds for active ticket
  useEffect(() => {
    if (!activeTicket || !isAuthenticated || !isVendor) return;

    const messagesInterval = setInterval(() => {
      if (!sendingMessage && !messagesLoading) {
        fetchMessages(activeTicket.id, false);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(messagesInterval);
  }, [activeTicket, isAuthenticated, isVendor, sendingMessage, messagesLoading, fetchMessages]);

  return {
    // State
    tickets,
    activeTicket,
    messages,
    loading,
    messagesLoading,
    sendingMessage,
    filters,
    
    // Actions
    fetchTickets,
    fetchMessages,
    createTicket,
    sendMessage,
    selectTicket,
    updateFilters,
    refresh,
    
    // Computed
    hasTickets: tickets.length > 0,
    hasActiveTicket: !!activeTicket,
    hasMessages: messages.length > 0,
    canSendMessage: activeTicket && activeTicket.status !== 'closed' && !sendingMessage
  };
}

export default useSupport;
