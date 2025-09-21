/**
 * Demo script to test Supabase Realtime functionality
 * Run this in the browser console to test realtime message delivery
 */

// Test function to simulate admin message
async function testRealtimeMessage(ticketId, messageContent = 'Test message from admin') {
  try {
    console.log('🧪 Testing realtime message delivery...');
    
    // Get Supabase client
    const { getSupabase } = await import('/src/lib/supabase.js');
    const supabase = getSupabase();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ Not authenticated');
      return;
    }
    
    console.log('👤 Current user:', user.email);
    
    // Insert test message
    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_role: 'admin', // Simulate admin message
        message_content: `[TEST] ${messageContent} - ${new Date().toLocaleTimeString()}`
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error sending test message:', error);
      return;
    }
    
    console.log('✅ Test message sent:', data);
    console.log('📨 Check the chat window for real-time delivery!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test function to check realtime connection
async function testRealtimeConnection(ticketId) {
  try {
    console.log('🔌 Testing realtime connection...');
    
    const { getSupabase } = await import('/src/lib/supabase.js');
    const supabase = getSupabase();
    
    const subscription = supabase
      .channel(`test-connection-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload) => {
          console.log('📨 Realtime message received:', payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 Connection status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully connected to realtime!');
        } else if (status === 'CHANNEL_ERROR') {
          console.log('❌ Connection error');
        }
      });
    
    // Return subscription for cleanup
    return subscription;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

// Usage examples:
console.log(`
🧪 Realtime Testing Functions Available:

1. Test message delivery:
   testRealtimeMessage('your-ticket-id', 'Hello from admin!')

2. Test connection:
   const subscription = await testRealtimeConnection('your-ticket-id')
   
3. Cleanup subscription:
   subscription.unsubscribe()

📝 Replace 'your-ticket-id' with an actual ticket ID from your support system.
`);

// Export functions for use
window.testRealtimeMessage = testRealtimeMessage;
window.testRealtimeConnection = testRealtimeConnection;
