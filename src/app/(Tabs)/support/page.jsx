"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import SupportSidebarSection from "./components/SupportSidebarSection";
import SupportChatWindow from "./components/SupportChatWindow";
import VendorTicketForm from "./components/VendorTicketForm";
import supportService from "@/services/supportService";
import useRealtimeMessages from "@/hooks/useRealtimeMessages";
import toast from "react-hot-toast";

export default function SupportPage() {
  const { isAuthenticated, isVendor, loading: authLoading } = useAuth();
  
  // State management
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "all"
  });

  // Fetch tickets with current filters
  const fetchTickets = useCallback(async () => {
    if (!isAuthenticated || !isVendor) return;
    
    try {
      setLoading(true);
      const response = await supportService.getTickets({
        status: filters.status === 'all' ? null : filters.status,
        priority: filters.priority === 'all' ? null : filters.priority,
        search: filters.search || null,
        limit: 50
      });
      
      setTickets(response.tickets);
      
      // If we have an active ticket, update it with the latest data
      setActiveTicket(prevActiveTicket => {
        if (prevActiveTicket) {
          const updatedTicket = response.tickets.find(t => t.id === prevActiveTicket.id);
          return updatedTicket || prevActiveTicket;
        }
        return prevActiveTicket;
      });
    } catch (error) {
      toast.error(error.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isVendor, filters]);

  // Fetch messages for active ticket (initial load only)
  const fetchMessages = useCallback(async (ticketId) => {
    if (!ticketId) return;
    
    try {
      setMessagesLoading(true);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
      });
      
      const response = await Promise.race([
        supportService.getTicketMessages(ticketId),
        timeoutPromise
      ]);
      
      // Update messages (initial load only)
      setMessages(response.messages || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load messages');
      
      // Set empty messages array on error to prevent infinite loading
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!authLoading && isAuthenticated && isVendor) {
      fetchTickets();
    }
  }, [authLoading, isAuthenticated, isVendor]);

  // Refetch tickets when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (isAuthenticated && isVendor) {
        fetchTickets();
      }
    }, 300); // Debounce search

    return () => clearTimeout(debounceTimer);
  }, [filters.search, filters.status, filters.priority, isAuthenticated, isVendor]);

  // Realtime message handlers
  const handleNewMessage = useCallback((newMessage) => {
    // Add the new message to the current messages list
    setMessages(prevMessages => {
      // Check if message already exists to avoid duplicates
      const exists = prevMessages.some(msg => msg.id === newMessage.id);
      if (exists) return prevMessages;
      
      return [...prevMessages, newMessage];
    });

    // Update the tickets list to reflect the new message
    setTickets(prevTickets => 
      prevTickets.map(ticket => 
        ticket.id === activeTicket?.id 
          ? { ...ticket, last_updated: new Date().toISOString() }
          : ticket
      )
    );

    // Show notification for new admin messages
    if (newMessage.sender_role === 'admin') {
      toast.success('New message from admin!', {
        duration: 3000,
        icon: '💬'
      });
    }
  }, [activeTicket]);

  const handleMessageUpdated = useCallback((updatedMessage, oldMessage) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      )
    );
  }, []);

  const handleMessageDeleted = useCallback((deletedMessage) => {
    setMessages(prevMessages => 
      prevMessages.filter(msg => msg.id !== deletedMessage.id)
    );
  }, []);

  const handleRealtimeError = useCallback((error) => {
    setRealtimeConnected(false);
    
    // Show user-friendly error message
    toast.error('Connection issue. Messages may not update in real-time.', {
      duration: 5000,
      icon: '⚠️'
    });
  }, []);

  // Setup realtime subscription
  const { reconnect: reconnectRealtime, isConnected } = useRealtimeMessages({
    ticketId: activeTicket?.id,
    onMessageReceived: handleNewMessage,
    onMessageUpdated: handleMessageUpdated,
    onMessageDeleted: handleMessageDeleted,
    onError: handleRealtimeError,
    enabled: !!activeTicket && isAuthenticated && isVendor
  });

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      const connected = isConnected();
      setRealtimeConnected(connected);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10 seconds (reduced frequency)

    return () => clearInterval(interval);
  }, [isConnected]);

  // Fetch messages when active ticket ID changes (initial load only)
  useEffect(() => {
    const ticketId = activeTicket?.id;
    
    if (ticketId) {
      fetchMessages(ticketId);
      
      // Fallback: Clear loading state after 15 seconds if it gets stuck
      const fallbackTimer = setTimeout(() => {
        setMessagesLoading(false);
      }, 15000);
      
      return () => clearTimeout(fallbackTimer);
    } else {
      setMessages([]);
      setMessagesLoading(false); // Clear loading when no ticket selected
    }
  }, [activeTicket?.id]); // Only depend on ticket ID, not the entire object

  // Handle ticket selection
  const handleTicketSelect = (ticket) => {
    setActiveTicket(ticket);
  };

  // Handle sending a message
  const handleSendMessage = async (messageText) => {
    if (!activeTicket || !messageText.trim()) return;

    setSendingMessage(true);
    try {
      const response = await supportService.sendMessage(activeTicket.id, messageText);
      
      // Add the new message to the list immediately for better UX
      setMessages(prevMessages => [...prevMessages, response.message]);
      
      // Update the tickets list to reflect the new message count and timestamp
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === activeTicket.id 
            ? { ...ticket, last_updated: new Date().toISOString() }
            : ticket
        )
      );
      
      toast.success('Message sent successfully');
    } catch (error) {
      throw error; // Re-throw so the component can handle it
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle new ticket creation
  const handleNewTicket = () => {
    setShowNewTicketForm(true);
  };

  // Handle ticket created
  const handleTicketCreated = (newTicket) => {
    // Refresh tickets list
    fetchTickets();
    
    // Select the new ticket
    setActiveTicket(newTicket);
    
    toast.success('Ticket created successfully');
  };

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(prevFilters => {
      // Only update if filters actually changed
      if (
        prevFilters.search !== newFilters.search ||
        prevFilters.status !== newFilters.status ||
        prevFilters.priority !== newFilters.priority
      ) {
        return newFilters;
      }
      return prevFilters;
    });
  }, []);

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show auth error if not authenticated
  if (!isAuthenticated || !isVendor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500 mb-4">You need to be logged in as a vendor to access support.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">
      <div className="w-full lg:w-1/3">
        <SupportSidebarSection
          tickets={tickets}
          activeTicketId={activeTicket?.id}
          onTicketSelect={handleTicketSelect}
          onNewTicket={handleNewTicket}
          loading={loading}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      <div className="w-full lg:w-2/3">
        <SupportChatWindow
          ticket={activeTicket}
          messages={messages}
          onSendMessage={handleSendMessage}
          loading={messagesLoading}
          sendingMessage={sendingMessage}
          realtimeConnected={realtimeConnected}
          onReconnect={reconnectRealtime}
        />
      </div>

      {/* New Ticket Form Modal */}
      {showNewTicketForm && (
        <VendorTicketForm
          onClose={() => setShowNewTicketForm(false)}
          onTicketCreated={handleTicketCreated}
        />
      )}
    </div>
  );
}
