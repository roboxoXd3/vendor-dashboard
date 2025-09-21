# Vendor Support System

A complete support ticket system for vendors in the vendor panel application, integrated with Supabase backend.

## 🚀 Features

### Core Features
- **Create New Tickets**: Vendors can create support tickets with subject, category, priority, and detailed message
- **View All Tickets**: List all tickets created by the logged-in vendor with filtering and search
- **Real-time Chat**: View full conversation history and send messages to admin support
- **Filtering & Search**: Filter tickets by status, priority, and search by subject or ID
- **Real-time Updates**: Auto-refresh messages every 30 seconds and tickets every 2 minutes

### Categories Available
- **General Support**: General questions and support
- **Payment Issues**: Payment-related problems and queries
- **Technical Problems**: Technical issues with the platform
- **Inventory Management**: Inventory sync and management issues
- **Integration Help**: API and integration assistance

### Priority Levels
- **Low**: Non-urgent issues
- **Normal**: Standard priority (default)
- **High**: Important issues requiring faster response
- **Urgent**: Critical issues requiring immediate attention

### Status Types
- **Open**: New ticket, waiting for admin response
- **In Progress**: Admin is working on the ticket
- **Closed**: Ticket has been resolved

## 🏗️ Architecture

### Backend Components

#### API Endpoints
- `GET /api/vendor/support/tickets` - List vendor's tickets with filtering
- `POST /api/vendor/support/tickets` - Create new ticket
- `GET /api/vendor/support/tickets/[id]/messages` - Get ticket messages
- `POST /api/vendor/support/tickets/[id]/messages` - Send new message

#### Database Tables
- `support_tickets`: Stores ticket information
- `support_messages`: Stores conversation messages
- `vendors`: Vendor information for authentication
- `vendor_sessions`: Session management

### Frontend Components

#### Main Components
- `SupportPage.jsx`: Main page with state management
- `SupportSidebarSection.jsx`: Ticket list with filtering
- `SupportChatWindow.jsx`: Chat interface for messages
- `VendorTicketForm.jsx`: Modal form for creating new tickets

#### Services
- `supportService.js`: API communication layer
- `useSupport.js`: Custom hook for support functionality

## 🔒 Security Features

### Authentication
- Cookie-based session authentication
- Vendor-specific access control (vendors can only see their own tickets)
- Row Level Security (RLS) policies in Supabase

### Data Validation
- Input sanitization on both frontend and backend
- Required field validation
- Category and priority validation
- Message length limits

### Session Management
- Automatic session validation
- Token-based authentication with HTTP-only cookies
- Session expiry handling

## 🎨 User Experience

### Responsive Design
- Mobile-friendly interface
- Adaptive layouts for different screen sizes
- Touch-friendly interactions

### Real-time Features
- Auto-refresh for new messages
- Live typing indicators
- Instant message delivery confirmation

### Loading States
- Skeleton loading for tickets list
- Message sending indicators
- Proper error handling with user feedback

## 🛠️ Technical Implementation

### State Management
- React hooks for local state
- Custom `useSupport` hook for shared logic
- Optimistic updates for better UX

### API Communication
- RESTful API design
- Proper error handling
- Request debouncing for search

### Database Design
- Normalized table structure
- Foreign key relationships
- Indexed columns for performance

## 📱 Usage Instructions

### For Vendors

1. **Access Support**: Navigate to the Support tab in the vendor dashboard
2. **Create Ticket**: Click "New Ticket" button to open the creation form
3. **Fill Details**: 
   - Enter a clear subject line
   - Select appropriate category and priority
   - Provide detailed description of the issue
4. **Submit**: Click "Create Ticket" to submit
5. **Track Progress**: View ticket in the sidebar, click to open chat
6. **Communicate**: Send messages to admin support team
7. **Monitor Status**: Watch for status changes and admin responses

### For Admins (Future Enhancement)
- Admin panel integration needed
- Ticket assignment functionality
- Status management capabilities
- Response templates and canned responses

## 🔧 Configuration

### Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup
The following tables are required:
- `support_tickets` (with RLS enabled)
- `support_messages` (with RLS enabled)
- `vendors` (existing table)
- `vendor_sessions` (existing table)

## 🚦 API Response Format

### Tickets List Response
```json
{
  "tickets": [
    {
      "id": "uuid",
      "subject": "string",
      "status": "open|in_progress|closed",
      "priority": "low|normal|high|urgent",
      "category": "general|payment|technical|inventory|integration",
      "created_at": "timestamp",
      "last_updated": "timestamp",
      "message_count": 0,
      "time_ago": "2h ago"
    }
  ],
  "total": 10,
  "has_more": false
}
```

### Messages Response
```json
{
  "ticket": {
    "id": "uuid",
    "subject": "string",
    "status": "string",
    "priority": "string",
    "category": "string"
  },
  "messages": [
    {
      "id": "uuid",
      "from": "vendor|admin",
      "text": "message content",
      "time": "Today, 2:30 PM",
      "timestamp": "timestamp"
    }
  ]
}
```

## 🎯 Key Differences from Admin Panel

| Feature | Vendor Panel | Admin Panel |
|---------|-------------|-------------|
| Create Tickets | ✅ Yes | ❌ No |
| View Own Tickets | ✅ Yes | ✅ All Tickets |
| Change Status | ❌ No | ✅ Yes |
| Assign Tickets | ❌ No | ✅ Yes |
| Close Tickets | ❌ No | ✅ Yes |
| Message Replies | ✅ Yes | ✅ Yes |

## 🔄 Real-time Updates

- **Messages**: Auto-refresh every 30 seconds when viewing a ticket
- **Tickets List**: Auto-refresh every 2 minutes
- **Manual Refresh**: Pull-to-refresh functionality available
- **Background Updates**: Continues when tab is active

## 🎨 Styling & Theming

- Tailwind CSS for consistent styling
- Custom color schemes for different priorities and statuses
- Responsive breakpoints for mobile optimization
- Loading animations and transitions

## 🧪 Testing Considerations

### Manual Testing Checklist
- [ ] Create new ticket with all fields
- [ ] Search and filter functionality
- [ ] Send messages in existing tickets
- [ ] Real-time message updates
- [ ] Mobile responsiveness
- [ ] Error handling (network issues)
- [ ] Authentication edge cases

### Performance Testing
- [ ] Load time with many tickets
- [ ] Message history with long conversations
- [ ] Search performance with large datasets
- [ ] Real-time update efficiency

## 🚀 Future Enhancements

### Planned Features
- File attachments in messages
- Email notifications for new messages
- Ticket templates for common issues
- Satisfaction ratings after resolution
- Advanced analytics and reporting

### Technical Improvements
- WebSocket integration for real-time updates
- Message encryption for sensitive data
- Offline support with sync
- Advanced search with full-text indexing

## 🐛 Troubleshooting

### Common Issues
1. **Tickets not loading**: Check vendor authentication and session validity
2. **Messages not sending**: Verify ticket is not closed and user has permissions
3. **Real-time updates not working**: Check network connectivity and session status
4. **Form validation errors**: Ensure all required fields are filled correctly

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` to see detailed API logs.

---

## 📞 Support

For technical support with this system, contact the development team or create a ticket in the admin panel.

**System Status**: ✅ Active and Operational
**Last Updated**: September 2025
**Version**: 1.0.0
