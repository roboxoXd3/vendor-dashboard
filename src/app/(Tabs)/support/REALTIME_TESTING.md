# Supabase Realtime Testing Guide

This document provides comprehensive test cases for verifying the realtime functionality in the vendor support system.

## 🧪 Test Cases

### 1. Basic Realtime Connection Test

**Objective**: Verify that the realtime connection is established successfully.

**Steps**:
1. Open the vendor dashboard and navigate to the Support section
2. Select any existing ticket
3. Check the connection status indicator in the chat header
4. Verify that the status shows "Live" with a green dot

**Expected Result**: 
- Connection status shows "Live" 
- Green indicator dot is visible
- No error messages in console

### 2. Message Delivery Test

**Objective**: Verify that new messages are received in real-time.

**Steps**:
1. Open the support chat in two different browser windows/tabs
2. In one window, send a message as a vendor
3. In the other window, verify the message appears immediately
4. Repeat with admin messages (if testing with admin panel)

**Expected Result**:
- Messages appear instantly without page refresh
- Toast notification appears for new admin messages
- Message count updates in real-time

### 3. Connection Error Handling Test

**Objective**: Verify graceful handling of connection issues.

**Steps**:
1. Open the support chat
2. Disconnect internet connection temporarily
3. Reconnect internet
4. Verify the connection status updates appropriately

**Expected Result**:
- Status changes to "Offline" when disconnected
- "Reconnect" button appears when offline
- Connection restores automatically when internet returns
- Error toast appears for connection issues

### 4. Manual Reconnection Test

**Objective**: Verify manual reconnection functionality.

**Steps**:
1. Open the support chat
2. Click the "Reconnect" button (if offline)
3. Verify the connection status updates

**Expected Result**:
- Connection status updates to "Live"
- Reconnect button disappears
- Messages resume real-time updates

### 5. Multiple Ticket Switching Test

**Objective**: Verify that subscriptions work correctly when switching between tickets.

**Steps**:
1. Open multiple tickets in sequence
2. Send messages to different tickets
3. Verify that messages only appear for the currently selected ticket

**Expected Result**:
- Only messages for the active ticket are displayed
- No cross-ticket message leakage
- Connection status remains stable

### 6. Performance Test

**Objective**: Verify that realtime doesn't impact performance.

**Steps**:
1. Open the support chat
2. Send multiple messages rapidly
3. Monitor browser performance and memory usage

**Expected Result**:
- No memory leaks
- Smooth UI performance
- No excessive API calls

## 🔧 Debugging Tools

### Console Logging

The realtime implementation includes comprehensive logging:

```javascript
// Connection status
console.log('🔄 Realtime status:', status);

// Message events
console.log('📨 New message received:', payload);
console.log('✏️ Message updated:', payload);
console.log('🗑️ Message deleted:', payload);

// Error handling
console.error('❌ Realtime error:', error);
```

### Browser DevTools

1. **Network Tab**: Monitor WebSocket connections
2. **Console Tab**: Check for realtime logs and errors
3. **Application Tab**: Verify Supabase client configuration

## 🚨 Common Issues and Solutions

### Issue: Connection Status Shows "Offline"

**Possible Causes**:
- Internet connection issues
- Supabase service unavailable
- RLS policies blocking access
- Invalid authentication

**Solutions**:
1. Check internet connection
2. Verify Supabase service status
3. Check browser console for errors
4. Verify user authentication

### Issue: Messages Not Appearing in Real-time

**Possible Causes**:
- Realtime subscription not active
- RLS policies preventing access
- Message filtering issues

**Solutions**:
1. Check connection status indicator
2. Verify RLS policies for support_messages table
3. Check browser console for subscription errors
4. Test with manual message sending

### Issue: Excessive Reconnection Attempts

**Possible Causes**:
- Network instability
- Supabase service issues
- Client configuration problems

**Solutions**:
1. Check network stability
2. Verify Supabase service status
3. Review client configuration
4. Consider implementing exponential backoff

## 📊 Monitoring and Metrics

### Key Metrics to Monitor

1. **Connection Success Rate**: Percentage of successful connections
2. **Message Delivery Latency**: Time between message creation and display
3. **Reconnection Frequency**: How often reconnections occur
4. **Error Rate**: Frequency of connection errors

### Performance Benchmarks

- **Connection Time**: < 2 seconds
- **Message Delivery**: < 500ms
- **Reconnection Time**: < 5 seconds
- **Memory Usage**: Stable over time

## 🧪 Test Data Setup

### Sample Test Messages

```javascript
// Vendor message
{
  ticket_id: "test-ticket-id",
  sender_id: "vendor-user-id",
  sender_role: "vendor",
  message_content: "Test message from vendor"
}

// Admin message
{
  ticket_id: "test-ticket-id", 
  sender_id: "admin-user-id",
  sender_role: "admin",
  message_content: "Test message from admin"
}
```

## 🔒 Security Considerations

### RLS Policy Verification

Ensure the following RLS policies are in place:

1. **Vendors can view own ticket messages**
2. **Admins can view all messages**
3. **Vendors can create messages for own tickets**
4. **Admins can create messages**

### Authentication Requirements

- Valid vendor session required
- Proper user authentication
- Session token validation

## 📝 Test Results Template

```
Test Date: ___________
Tester: ___________
Browser: ___________
Version: ___________

✅ Basic Connection Test: PASS/FAIL
✅ Message Delivery Test: PASS/FAIL  
✅ Error Handling Test: PASS/FAIL
✅ Manual Reconnection Test: PASS/FAIL
✅ Multiple Ticket Test: PASS/FAIL
✅ Performance Test: PASS/FAIL

Notes:
- Connection time: _____ seconds
- Message delivery latency: _____ ms
- Any issues encountered: ___________
- Recommendations: ___________
```

## 🚀 Production Deployment Checklist

- [ ] Realtime enabled for support_messages table
- [ ] RLS policies configured correctly
- [ ] Error handling implemented
- [ ] Connection monitoring in place
- [ ] Performance benchmarks met
- [ ] Security policies verified
- [ ] User acceptance testing completed
