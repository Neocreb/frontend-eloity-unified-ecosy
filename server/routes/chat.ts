import { Router, Request, Response } from 'express';
import { supabaseServer as supabase } from '../supabaseServer.js';
import { authenticateToken } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  messageType: z.enum(['text', 'image', 'file', 'voice', 'video', 'system', 'call']).default('text'),
  attachments: z.array(z.string()).optional(),
  replyToId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const createConversationSchema = z.object({
  participants: z.array(z.string().uuid()).min(1),
  name: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['direct', 'group']).default('direct'),
  avatar: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

const markAsReadSchema = z.object({
  conversationId: z.string().uuid(),
  lastReadMessageId: z.string().uuid(),
});

// Middleware to verify authentication
router.use(authenticateToken);

// ============================================================================
// GET ENDPOINTS
// ============================================================================

// Get all conversations for current user
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) {
      console.error('[Chat] No user ID found in request', {
        hasUser: !!(req as any).user,
        hasUserId: !!(req as any).userId,
        headers: Object.keys(req.headers)
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select(`
        id,
        type,
        name,
        description,
        avatar,
        participants,
        created_by,
        last_message_id,
        last_activity,
        is_archived,
        settings,
        created_at,
        updated_at,
        chat_participants!inner(
          user_id,
          last_read_message_id,
          last_read_at
        )
      `)
      .contains('participants', [userId])
      .eq('is_archived', false)
      .order('last_activity', { ascending: false });

    if (error) throw error;

    return res.json(conversations || []);
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get specific conversation with messages
router.get('/conversations/:conversationId', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        chat_participants!inner(*)
      `)
      .eq('id', conversationId)
      .contains('participants', [userId])
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify user is a participant
    const isParticipant = conversation.chat_participants.some((p: any) => p.user_id === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to access this conversation' });
    }

    return res.json(conversation);
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get messages for a conversation with pagination
router.get('/conversations/:conversationId/messages', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user is a participant
    const { data: participant, error: partError } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (partError || !participant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        chat_files(*)
      `)
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return res.json({
      messages: (messages || []).reverse(), // Return in chronological order
      total: messages?.length || 0,
      hasMore: (messages?.length || 0) >= limit,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get typing indicators for a conversation
router.get('/conversations/:conversationId/typing', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const { data: typingUsers, error } = await supabase
      .from('typing_indicators')
      .select(`
        user_id,
        users!inner(id, username, avatar)
      `)
      .eq('conversation_id', conversationId)
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    return res.json(typingUsers || []);
  } catch (error: any) {
    console.error('Error fetching typing indicators:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST ENDPOINTS
// ============================================================================

// Create new conversation
router.post('/conversations', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = createConversationSchema.parse(req.body);

    // Ensure current user is in participants
    const participants = [...new Set([...validated.participants, userId])];

    // Check if direct conversation already exists
    if (validated.type === 'direct' && participants.length === 2) {
      const { data: existing } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('type', 'direct')
        .contains('participants', participants)
        .limit(1)
        .maybeSingle();

      if (existing) {
        return res.status(200).json(existing);
      }
    }

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .insert({
        type: validated.type,
        participants,
        name: validated.name,
        description: validated.description,
        avatar: validated.avatar,
        created_by: userId,
        settings: validated.settings || {},
      })
      .select()
      .single();

    if (convError) throw convError;

    // Add participants
    const participantRecords = participants.map((pId) => ({
      conversation_id: conversation.id,
      user_id: pId,
      role: pId === userId ? 'admin' : 'member',
    }));

    const { error: partError } = await supabase
      .from('chat_participants')
      .insert(participantRecords);

    if (partError) throw partError;

    return res.status(201).json(conversation);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating conversation:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Send message
router.post('/messages', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = sendMessageSchema.parse(req.body);

    // Verify user is a participant
    const { data: participant, error: partError } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('conversation_id', validated.conversationId)
      .eq('user_id', userId)
      .single();

    if (partError || !participant) {
      return res.status(403).json({ error: 'Not authorized to send messages in this conversation' });
    }

    // Create message
    const { data: message, error: msgError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: validated.conversationId,
        sender_id: userId,
        content: validated.content,
        message_type: validated.messageType,
        attachments: validated.attachments || [],
        reply_to_id: validated.replyToId,
        metadata: validated.metadata || {},
        read_by: [userId],
        delivered_to: [userId],
      })
      .select()
      .single();

    if (msgError) throw msgError;

    // Update conversation last_activity and last_message_id
    const { error: updateError } = await supabase
      .from('chat_conversations')
      .update({
        last_message_id: message.id,
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.conversationId);

    if (updateError) throw updateError;

    // Handle file attachments if any
    if (validated.attachments && validated.attachments.length > 0) {
      const fileRecords = validated.attachments.map((url) => ({
        message_id: message.id,
        file_url: url,
        file_name: url.split('/').pop() || 'file',
        uploaded_by: userId,
      }));

      const { error: fileError } = await supabase
        .from('chat_files')
        .insert(fileRecords);

      if (fileError) console.error('Error creating file records:', fileError);
    }

    return res.status(201).json(message);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error sending message:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Mark message as read
router.post('/messages/:messageId/read', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: message, error: msgError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (msgError || !message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Add user to read_by array if not already there
    const readBy = message.read_by || [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);

      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ read_by: readBy, updated_at: new Date().toISOString() })
        .eq('id', messageId);

      if (updateError) throw updateError;
    }

    // Update participant's last_read_message_id
    const { error: partError } = await supabase
      .from('chat_participants')
      .update({
        last_read_message_id: messageId,
        last_read_at: new Date().toISOString(),
      })
      .eq('conversation_id', message.conversation_id)
      .eq('user_id', userId);

    if (partError) throw partError;

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error marking message as read:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Mark all messages as read
router.post('/conversations/:conversationId/read', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = markAsReadSchema.parse({
      conversationId,
      lastReadMessageId: req.body.lastReadMessageId,
    });

    // Get all messages up to lastReadMessageId
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('conversation_id', validated.conversationId)
      .lte('created_at', new Date().toISOString());

    if (msgError) throw msgError;

    // Mark all as read
    if (messages && messages.length > 0) {
      const messageIds = messages.map((m) => m.id);

      // Batch update - mark messages as read
      for (const messageId of messageIds) {
        const { data: msg } = await supabase
          .from('chat_messages')
          .select('read_by')
          .eq('id', messageId)
          .single();

        if (msg) {
          const readBy = msg.read_by || [];
          if (!readBy.includes(userId)) {
            readBy.push(userId);
            await supabase
              .from('chat_messages')
              .update({ read_by: readBy })
              .eq('id', messageId);
          }
        }
      }
    }

    // Update participant last_read_message_id
    await supabase
      .from('chat_participants')
      .update({
        last_read_message_id: validated.lastReadMessageId,
        last_read_at: new Date().toISOString(),
      })
      .eq('conversation_id', validated.conversationId)
      .eq('user_id', userId);

    return res.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error marking conversation as read:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Send typing indicator
router.post('/conversations/:conversationId/typing', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete old typing indicator
    await supabase
      .from('typing_indicators')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    // Add new typing indicator
    const { error } = await supabase
      .from('typing_indicators')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        expires_at: new Date(Date.now() + 10000).toISOString(), // 10 seconds
      });

    if (error) throw error;

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error sending typing indicator:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Add reaction to message
router.post('/messages/:messageId/reactions', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user?.id;

    if (!userId || !emoji) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: message, error: msgError } = await supabase
      .from('chat_messages')
      .select('reactions')
      .eq('id', messageId)
      .single();

    if (msgError) throw msgError;

    const reactions = message?.reactions || {};
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    if (!reactions[emoji].includes(userId)) {
      reactions[emoji].push(userId);
    }

    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({ reactions, updated_at: new Date().toISOString() })
      .eq('id', messageId);

    if (updateError) throw updateError;

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error adding reaction:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Delete message
router.delete('/messages/:messageId', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: message, error: msgError } = await supabase
      .from('chat_messages')
      .select('sender_id')
      .eq('id', messageId)
      .single();

    if (msgError || !message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only allow sender to delete their own message
    if (message.sender_id !== userId) {
      return res.status(403).json({ error: 'Only sender can delete message' });
    }

    const { error: deleteError } = await supabase
      .from('chat_messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        content: '[Deleted]',
      })
      .eq('id', messageId);

    if (deleteError) throw deleteError;

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Update conversation
router.put('/conversations/:conversationId', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;
    const { name, description, avatar, settings, is_archived, is_muted } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user is admin or creator
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('created_by, chat_participants!inner(*)')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const participant = conversation.chat_participants.find((p: any) => p.user_id === userId);
    if (conversation.created_by !== userId && participant?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update conversation' });
    }

    const { error: updateError } = await supabase
      .from('chat_conversations')
      .update({
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        avatar: avatar !== undefined ? avatar : undefined,
        settings: settings !== undefined ? settings : undefined,
        is_archived: is_archived !== undefined ? is_archived : undefined,
        is_muted: is_muted !== undefined ? is_muted : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (updateError) throw updateError;

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating conversation:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
