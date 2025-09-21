import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

/**
 * Test component for verifying realtime functionality
 * This component can be temporarily added to test realtime message delivery
 */
export default function RealtimeTestPanel({ ticketId, onMessageReceived }) {
  const [testMessage, setTestMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    if (!ticketId) return;

    const supabase = getSupabase();
    
    // Subscribe to realtime changes
    const subscription = supabase
      .channel(`test-support-messages-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload) => {
          console.log('🧪 Test: New message received:', payload);
          setMessageCount(prev => prev + 1);
          
          if (onMessageReceived) {
            onMessageReceived(payload.new);
          }
          
          toast.success(`Test: New message received! (Total: ${messageCount + 1})`, {
            duration: 3000,
            icon: '🧪'
          });
        }
      )
      .subscribe((status) => {
        console.log('🧪 Test subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [ticketId, onMessageReceived, messageCount]);

  const sendTestMessage = async () => {
    if (!testMessage.trim() || !ticketId) return;

    try {
      const supabase = getSupabase();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error('Not authenticated');
        return;
      }

      // Insert test message
      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          sender_role: 'vendor',
          message_content: `[TEST] ${testMessage}`
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending test message:', error);
        toast.error('Failed to send test message');
        return;
      }

      toast.success('Test message sent!');
      setTestMessage('');
    } catch (error) {
      console.error('Error sending test message:', error);
      toast.error('Failed to send test message');
    }
  };

  if (!ticketId) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          Select a ticket to test realtime functionality
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4">
      <h3 className="text-sm font-semibold text-blue-800 mb-2">
        🧪 Realtime Test Panel
      </h3>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-xs text-blue-700">
            Status: {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <div className="text-xs text-blue-600">
          Messages received: {messageCount}
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Test message..."
            className="flex-1 text-xs px-2 py-1 border border-blue-300 rounded"
            onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
          />
          <button
            onClick={sendTestMessage}
            disabled={!testMessage.trim()}
            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Send Test
          </button>
        </div>
        
        <p className="text-xs text-blue-600">
          This panel helps verify that realtime messages are working correctly.
        </p>
      </div>
    </div>
  );
}
