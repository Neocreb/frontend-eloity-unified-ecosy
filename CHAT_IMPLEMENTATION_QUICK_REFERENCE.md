# Chat System - Quick Reference Guide

## 🎯 Quick Start

### 1. Display Chat Interface
```tsx
import { EnhancedChatInterface } from '@/components/chat/EnhancedChatInterface';

<EnhancedChatInterface threadId={conversationId} />
```

### 2. Display Conversation List
```tsx
import { ChatListSidebar } from '@/components/chat/ChatListSidebar';

<ChatListSidebar
  selectedChatId={currentId}
  onSelectChat={(id) => navigate(`/chat/${id}`)}
/>
```

### 3. Send a Message
```tsx
const { sendMessage } = useChatThread(conversationId);
await sendMessage("Hello!");
```

---

## 📋 Key API Endpoints

### GET Endpoints
```
GET /api/chat/conversations              # List all
GET /api/chat/conversations/:id          # Get specific
GET /api/chat/conversations/:id/messages # Get messages (paginated)
GET /api/chat/conversations/:id/typing   # Get typing indicators
```

### POST Endpoints
```
POST /api/chat/conversations             # Create new
POST /api/chat/messages                  # Send message
POST /api/chat/messages/:id/read         # Mark as read
POST /api/chat/conversations/:id/read    # Mark all read
POST /api/chat/conversations/:id/typing  # Send typing indicator
POST /api/chat/messages/:id/reactions    # Add reaction
```

### PUT/DELETE Endpoints
```
PUT /api/chat/conversations/:id          # Update conversation
DELETE /api/chat/messages/:id            # Delete message
```

---

## 🎣 Useful Hooks

### useChatThread
```tsx
const {
  thread,              // Conversation metadata
  messages,            // Array of messages
  loading,             // Loading state
  error,               // Error message
  sendMessage,         // Send text message
  sendFile,            // Upload and send file
  addReaction,         // Add emoji reaction
  deleteMessage,       // Delete message
  markAsRead,          // Mark as read
  refresh,             // Reload messages
} = useChatThread(conversationId);
```

### useRealtimeChat
```tsx
useRealtimeChat(
  { conversationId, enabled: true },
  {
    onNewMessage: (msg) => {},       // New message arrived
    onTypingUsers: (users) => {},    // Users typing
    onReadReceipt: (msgId, readBy) => {},  // Message read
    onPresenceChange: (users) => {}, // User presence
    onError: (err) => {},            // Subscription error
  }
);
```

---

## 💬 Message Interface

```typescript
interface ChatMessage {
  id: string;                    // Unique ID
  threadId: string;             // Conversation ID
  senderId: string;             // Sender user ID
  content: string;              // Message text
  timestamp: string;            // ISO timestamp
  readBy: string[];             // Users who read
  deliveredTo: string[];        // Users who received
  messageType: 'text' | 'image' | 'file' | 'voice' | 'video';
  attachments?: Array<{         // Files/images
    url: string;
    type: string;
    name: string;
  }>;
  reactions?: Record<string, string[]>;  // emoji -> [userIds]
  replyTo?: string;             // Reply to message ID
  metadata?: Record<string, any>;
  isEdited: boolean;
  isDeleted: boolean;
}
```

---

## 🗨️ Conversation Interface

```typescript
interface ChatThread {
  id: string;                    // Unique ID
  type: 'direct' | 'social' | 'freelance';
  participants: string[];        // User IDs
  lastMessage: string;           // Last message text
  lastMessageAt: string;         // ISO timestamp
  updatedAt: string;             // Last update
  isGroup: boolean;
  groupName?: string;            // Group name
  groupAvatar?: string;          // Group avatar
  createdAt: string;
  unreadCount: number;
  contextData?: Record<string, any>;
  referenceId?: string;
}
```

---

## 🔌 Real-time Subscriptions

### Subscribe to Messages
```typescript
import { realtimeService } from '@/services/chatPersistenceService';

const channel = realtimeService.subscribeToMessages(
  conversationId,
  (message) => {
    console.log('New message:', message);
  },
  (error) => {
    console.error('Subscription error:', error);
  }
);

// Cleanup
realtimeService.unsubscribe(`messages:${conversationId}`);
```

### Subscribe to Typing
```typescript
const channel = realtimeService.subscribeToTyping(
  conversationId,
  (typingUsers) => {
    setTypingUsers(typingUsers);
  }
);
```

### Subscribe to Read Receipts
```typescript
const channel = realtimeService.subscribeToReadReceipts(
  conversationId,
  (messageId, readBy) => {
    updateMessageReadStatus(messageId, readBy);
  }
);
```

---

## 📝 Common Tasks

### Send a Message with File
```tsx
const { sendFile } = useChatThread(conversationId);
const file = event.target.files[0];
await sendFile(file);
```

### Add Reaction to Message
```tsx
const { addReaction } = useChatThread(conversationId);
await addReaction(messageId, '👍');
```

### Delete Message
```tsx
const { deleteMessage } = useChatThread(conversationId);
await deleteMessage(messageId);
```

### Mark Conversation as Read
```tsx
const { markAsRead } = useChatThread(conversationId);
await markAsRead();
```

### Search Messages
```tsx
const { searchMessages } = chatPersistenceService;
const results = await searchMessages('keyword', conversationId);
```

### Archive Conversation
```tsx
await chatPersistenceService.archiveConversation(conversationId);
```

### Mute Conversation
```tsx
await chatPersistenceService.muteConversation(conversationId);
```

---

## 🎨 Component Props

### EnhancedChatInterface
```tsx
interface EnhancedChatInterfaceProps {
  threadId?: string;         // Conversation ID
  recipientName?: string;    // Display name
}
```

### ChatListSidebar
```tsx
interface ChatListSidebarProps {
  onSelectChat?: (conversationId: string) => void;
  selectedChatId?: string;
  className?: string;
}
```

### ChatMessage
```tsx
interface ChatMessageProps {
  message: any;
  isOwn: boolean;           // Is own message?
  showAvatar: boolean;      // Show sender avatar?
  currentUserId?: string;
  onReply?: (message: any) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  recipientName?: string;
}
```

---

## 🔍 Debugging

### Check message state
```javascript
// In browser console
const { messages, thread } = useChatThread('conv-id');
console.log(messages);
console.log(thread);
```

### Test API endpoint
```bash
# Send message
curl -X POST http://localhost:5000/api/chat/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-id",
    "content": "Test message"
  }'
```

### Check real-time connection
```javascript
// Verify subscriptions
console.log(realtimeService);
// Should show methods:
// - subscribeToMessages
// - subscribeToTyping
// - subscribeToReadReceipts
// - subscribeToPresence
```

### Monitor Supabase
```javascript
// Check connection
import { supabase } from '@/integrations/supabase/client';
supabase.getChannels().forEach(channel => {
  console.log('Channel:', channel.topic, 'Status:', channel.state);
});
```

---

## ⚠️ Common Issues

### Messages not appearing
1. Check Supabase connection
2. Verify user is participant
3. Check network tab for errors
4. Verify auth token valid

### Typing indicator not showing
1. Check typing_indicators table
2. Verify subscription active
3. Check browser console for errors

### Read receipts not updating
1. Verify RLS policies allow updates
2. Check Supabase subscription
3. Ensure markMessageAsRead called

### Real-time sync not working
1. Check Supabase project active
2. Verify real-time enabled
3. Check network connectivity
4. Refresh browser

---

## 🎯 Feature Checklist

- [x] Send/receive messages
- [x] File uploads (images/docs)
- [x] Message persistence
- [x] Read receipts (3 states)
- [x] Typing indicators
- [x] Emoji reactions
- [x] Message deletion
- [x] Search messages
- [x] Conversation list
- [x] Pin conversations
- [x] Mute conversations
- [x] Archive conversations
- [x] Real-time sync
- [x] Multi-user support

---

## 📦 Dependencies

### Frontend Libraries Used
- React 18.3.1
- React Router DOM 6.24
- Supabase JS 2.50
- Date-fns 4.1
- Zod 4.1
- Lucide React 0.454

### Backend Libraries Used
- Express 5.2.1
- Supabase Node 2.51
- JWT 9.0.2
- Zod 4.1

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Environment variables set
- [ ] Supabase project configured
- [ ] RLS policies applied
- [ ] Database migrations run
- [ ] Backend deployed
- [ ] Frontend built
- [ ] CORS configured
- [ ] Error tracking setup
- [ ] Monitoring enabled

---

## 📞 Quick Support

**Issue**: Something not working?

1. Check the TestingGuide: `CHAT_SYSTEM_TESTING_GUIDE.md`
2. Review component code: `src/components/chat/`
3. Check API route: `server/routes/chat.ts`
4. Read service code: `src/services/chatPersistenceService.ts`
5. Review hooks: `src/chat/hooks/`

---

## 📚 Related Documentation

- `CHAT_SYSTEM_COMPLETION_GUIDE.md` - Full implementation guide
- `CHAT_SYSTEM_TESTING_GUIDE.md` - Testing procedures (60+ tests)
- `CHAT_SYSTEM_IMPLEMENTATION_FINAL_SUMMARY.md` - Complete summary

---

**Last Updated**: December 2025  
**Status**: Production Ready ✅  
**Version**: 2.0
