# 🚀 Chat System - Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Supabase project connected ✓
- Backend running (`npm run dev:backend`)
- Frontend running (`npm run dev:frontend`)
- Database migrations applied ✓

### Step 1: Verify Backend is Running
```bash
# Check that /api/chat endpoints are accessible
curl http://localhost:5000/api/chat/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 2: Test Message Send
```bash
# Create a conversation
curl -X POST http://localhost:5000/api/chat/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participants": ["user-id-1", "user-id-2"],
    "type": "direct"
  }'

# Send a message
curl -X POST http://localhost:5000/api/chat/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-id",
    "content": "Hello!",
    "messageType": "text"
  }'
```

### Step 3: Start Using in App
```tsx
import { chatPersistenceService } from '@/services/chatPersistenceService';

// Get user's conversations
const conversations = await chatPersistenceService.getConversations();

// Get messages from a conversation
const messages = await chatPersistenceService.getMessages(conversationId);

// Send a message
const msg = await chatPersistenceService.sendMessage(
  conversationId,
  'Hello World'
);
```

---

## Common Tasks

### Create a New Conversation
```typescript
const conversation = await chatPersistenceService.createConversation({
  participants: [currentUserId, recipientUserId],
  type: 'direct'
});
```

### Send a Message
```typescript
const message = await chatPersistenceService.sendMessage(
  conversationId,
  'Message content',
  { messageType: 'text' }
);
```

### Upload a File
```typescript
const fileUrl = await chatPersistenceService.uploadFile(file);
const message = await chatPersistenceService.sendMessage(
  conversationId,
  'Check this file',
  { 
    attachments: [fileUrl],
    messageType: 'file'
  }
);
```

### Get Conversation Messages
```typescript
// Get first 50 messages
const messages = await chatPersistenceService.getMessages(
  conversationId,
  50,  // limit
  0    // offset
);

// Get next 50 (pagination)
const moreMessages = await chatPersistenceService.getMessages(
  conversationId,
  50,
  50   // offset
);
```

### Mark Message as Read
```typescript
await chatPersistenceService.markMessageAsRead(messageId);
```

### Mark Entire Conversation as Read
```typescript
// Need the ID of the last message
const lastMessage = messages[messages.length - 1];
await chatPersistenceService.markConversationAsRead(
  conversationId,
  lastMessage.id
);
```

### Add Emoji Reaction
```typescript
await chatPersistenceService.addReaction(messageId, '👍');
```

### Delete a Message
```typescript
await chatPersistenceService.deleteMessage(messageId);
```

### Archive a Conversation
```typescript
await chatPersistenceService.archiveConversation(conversationId);
```

### Search Messages
```typescript
const results = await chatPersistenceService.searchMessages(
  'search query',
  conversationId // optional
);
```

---

## API Reference

### Conversations API
```
GET    /api/chat/conversations              # List conversations
GET    /api/chat/conversations/:id          # Get conversation
POST   /api/chat/conversations              # Create conversation
PUT    /api/chat/conversations/:id          # Update conversation
```

### Messages API
```
GET    /api/chat/conversations/:id/messages # Get messages
POST   /api/chat/messages                   # Send message
POST   /api/chat/messages/:id/read          # Mark as read
DELETE /api/chat/messages/:id               # Delete message
```

### Reactions API
```
POST   /api/chat/messages/:id/reactions     # Add reaction
DELETE /api/chat/messages/:id/reactions/:emoji # Remove reaction
```

### Real-time API
```
POST   /api/chat/conversations/:id/typing   # Send typing indicator
GET    /api/chat/conversations/:id/typing   # Get typing users
```

---

## Using Hooks

### In React Components
```tsx
import { useChatThread } from '@/chat/hooks/useChatThread';
import { useSendMessage } from '@/chat/hooks/useSendMessage';

export const ChatComponent: React.FC = () => {
  const { messages, sendMessage } = useChatThread(conversationId);
  const { sendTextMessage } = useSendMessage(conversationId);

  const handleSend = async () => {
    await sendTextMessage('Hello!');
  };

  return (
    <div>
      {messages.map(msg => <p key={msg.id}>{msg.content}</p>)}
      <button onClick={handleSend}>Send</button>
    </div>
  );
};
```

---

## Error Handling

All methods return results or throw errors. Always wrap in try-catch:

```typescript
try {
  const message = await chatPersistenceService.sendMessage(
    conversationId,
    content
  );
} catch (error) {
  console.error('Failed to send message:', error);
  // Show error to user
}
```

---

## Database Schema

### chat_conversations
```
id: uuid (primary key)
type: 'direct' | 'group'
name: string (group name, null for direct)
participants: uuid[] (array of user IDs)
created_by: uuid
last_message_id: uuid
last_activity: timestamp
is_archived: boolean
is_muted: boolean
created_at: timestamp
updated_at: timestamp
```

### chat_messages
```
id: uuid (primary key)
conversation_id: uuid
sender_id: uuid
content: text
message_type: 'text' | 'image' | 'file' | 'voice' | 'video'
attachments: jsonb (array of URLs)
reply_to_id: uuid (for replies)
read_by: uuid[] (array of user IDs who read)
reactions: jsonb ({emoji: [userIds...]})
is_deleted: boolean
is_edited: boolean
created_at: timestamp
updated_at: timestamp
```

### chat_participants
```
id: uuid (primary key)
conversation_id: uuid
user_id: uuid
role: 'admin' | 'member'
last_read_message_id: uuid
last_read_at: timestamp
is_muted: boolean
joined_at: timestamp
left_at: timestamp
```

### typing_indicators
```
id: uuid (primary key)
conversation_id: uuid
user_id: uuid
started_at: timestamp
expires_at: timestamp (auto-expires after 10 seconds)
```

---

## Debugging

### Check API Connection
```bash
# Test API is running
curl http://localhost:5000/api/health

# Test chat endpoint
curl http://localhost:5000/api/chat/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Enable Logging
```typescript
// In console
localStorage.setItem('debug', 'chat:*');

// See logs
console.log('Sending message...'); // Add these manually
```

### Verify Database
```sql
-- Check conversations table
SELECT COUNT(*) FROM chat_conversations;

-- Check messages
SELECT COUNT(*) FROM chat_messages;

-- Check participants
SELECT COUNT(*) FROM chat_participants;

-- Check typing indicators
SELECT * FROM typing_indicators 
WHERE expires_at > NOW();
```

---

## Troubleshooting

### "Not authenticated" Error
- Check JWT token is being sent
- Verify token is stored in localStorage with key 'accessToken'
- Token may be expired, need to refresh

### "Message not persisting"
- Check database connection
- Verify chat_messages table exists
- Check API response in network tab
- Look at server logs for SQL errors

### "Typing indicator not showing"
- Typing indicator backend is ready, frontend display needs adding
- Check `/api/chat/conversations/:id/typing` endpoint works
- Add subscription/polling in component

### "Read receipts not showing"
- Read receipt data is being saved (check database)
- Frontend UI needs to display checkmarks
- Need to show different icons based on readBy count

---

## Performance Tips

1. **Pagination**: Always use limit/offset for large conversations
   ```typescript
   // Good: paginate messages
   const messages = await chatPersistenceService.getMessages(id, 50, 0);
   
   // Bad: load all messages at once
   // Don't do: await getMessages(id, 10000);
   ```

2. **Caching**: Keep conversation list in state
   ```typescript
   const [conversations, setConversations] = useState([]);
   useEffect(() => {
     chatPersistenceService.getConversations().then(setConversations);
   }, []);
   ```

3. **Debounce typing**: Don't send on every keystroke
   ```typescript
   const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout>();
   
   const handleTyping = () => {
     clearTimeout(typingTimeout);
     chatPersistenceService.sendTypingIndicator(conversationId);
     setTypingTimeout(setTimeout(() => {}, 2000));
   };
   ```

4. **Virtual scrolling**: For 1000+ messages use react-window

---

## Next Steps

1. ✓ API working
2. ✓ Database connected
3. ⏳ Add real-time subscriptions (Supabase)
4. ⏳ Improve UI/UX
5. ⏳ Test with multiple users
6. ⏳ Deploy to production

---

## Useful Links

- [Backend Chat Routes](server/routes/chat.ts)
- [Persistence Service](src/services/chatPersistenceService.ts)
- [Chat Service](src/services/chatService.ts)
- [Hooks](src/chat/hooks/)
- [Components](src/components/chat/)
- [Implementation Guide](CHAT_SYSTEM_COMPLETION_GUIDE.md)
- [Full Summary](CHAT_SYSTEM_IMPLEMENTATION_SUMMARY.md)

---

## Support

For detailed information, see:
- `CHAT_SYSTEM_IMPLEMENTATION_SUMMARY.md` - What's been built
- `CHAT_SYSTEM_COMPLETION_GUIDE.md` - How to complete remaining features
- `CHAT_SYSTEM_IMPLEMENTATION.md` - Original requirements

---

**Ready to build!** Start with the Common Tasks section above. 🚀
