import { ChatThread, ChatMessage, ChatFilter, StartChatRequest } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ChatPersistenceService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `/api/chat${endpoint}`;
    
    // Get auth token from localStorage
    const token = localStorage.getItem('accessToken');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================================================
  // CONVERSATION MANAGEMENT
  // ============================================================================

  async getConversations(filter?: ChatFilter): Promise<ChatThread[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.unreadOnly) params.append('unreadOnly', 'true');
      if (filter?.type && filter.type !== 'all') params.append('type', filter.type);
      if (filter?.searchQuery) params.append('search', filter.searchQuery);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const conversations = await this.request<any[]>(`/conversations${queryString}`);

      return conversations.map((conv) => this.transformConversationToThread(conv));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  async getConversation(conversationId: string): Promise<ChatThread | null> {
    try {
      const conversation = await this.request<any>(
        `/conversations/${conversationId}`
      );
      return this.transformConversationToThread(conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }
  }

  async createConversation(request: StartChatRequest): Promise<ChatThread | null> {
    try {
      const payload = {
        participants: request.participants,
        name: request.groupName,
        type: request.groupName ? 'group' : 'direct',
        settings: request.contextData,
      };

      const conversation = await this.request<any>('/conversations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return this.transformConversationToThread(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // ============================================================================
  // MESSAGE MANAGEMENT
  // ============================================================================

  async getMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatMessage[]> {
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });

      const response = await this.request<{
        messages: any[];
        total: number;
        hasMore: boolean;
      }>(`/conversations/${conversationId}/messages?${params.toString()}`);

      return (response.messages || []).map((msg) =>
        this.transformMessageToChat(msg)
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async sendMessage(conversationId: string, content: string, options?: {
    messageType?: 'text' | 'image' | 'file' | 'voice' | 'video';
    attachments?: string[];
    replyToId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ChatMessage | null> {
    try {
      const payload = {
        conversationId,
        content,
        messageType: options?.messageType || 'text',
        attachments: options?.attachments,
        replyToId: options?.replyToId,
        metadata: options?.metadata,
      };

      const message = await this.request<any>('/messages', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return this.transformMessageToChat(message);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async updateMessage(
    messageId: string,
    content: string
  ): Promise<ChatMessage | null> {
    try {
      const payload = { content };
      const message = await this.request<any>(`/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      return this.transformMessageToChat(message);
    } catch (error) {
      console.error('Error updating message:', error);
      return null;
    }
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      await this.request(`/messages/${messageId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  // ============================================================================
  // READ RECEIPTS & STATUS
  // ============================================================================

  async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      await this.request(`/messages/${messageId}/read`, {
        method: 'POST',
      });
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  async markConversationAsRead(
    conversationId: string,
    lastReadMessageId: string
  ): Promise<boolean> {
    try {
      await this.request(`/conversations/${conversationId}/read`, {
        method: 'POST',
        body: JSON.stringify({ lastReadMessageId }),
      });
      return true;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      return false;
    }
  }

  // ============================================================================
  // REACTIONS & INTERACTIONS
  // ============================================================================

  async addReaction(messageId: string, emoji: string): Promise<boolean> {
    try {
      await this.request(`/messages/${messageId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
      return true;
    } catch (error) {
      console.error('Error adding reaction:', error);
      return false;
    }
  }

  async removeReaction(messageId: string, emoji: string): Promise<boolean> {
    try {
      await this.request(`/messages/${messageId}/reactions/${emoji}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Error removing reaction:', error);
      return false;
    }
  }

  // ============================================================================
  // TYPING INDICATORS
  // ============================================================================

  async sendTypingIndicator(conversationId: string): Promise<boolean> {
    try {
      await this.request(`/conversations/${conversationId}/typing`, {
        method: 'POST',
      });
      return true;
    } catch (error) {
      console.error('Error sending typing indicator:', error);
      return false;
    }
  }

  async getTypingIndicators(conversationId: string): Promise<Array<{
    userId: string;
    username?: string;
    avatar?: string;
  }>> {
    try {
      const indicators = await this.request<any[]>(
        `/conversations/${conversationId}/typing`
      );
      return indicators || [];
    } catch (error) {
      console.error('Error fetching typing indicators:', error);
      return [];
    }
  }

  // ============================================================================
  // FILE UPLOADS
  // ============================================================================

  async uploadFile(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('accessToken');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.apiBase}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      return data.fileUrl || '';
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // ============================================================================
  // CONVERSATION SETTINGS
  // ============================================================================

  async updateConversation(
    conversationId: string,
    updates: {
      name?: string;
      description?: string;
      avatar?: string;
      isArchived?: boolean;
      isMuted?: boolean;
      settings?: Record<string, unknown>;
    }
  ): Promise<boolean> {
    try {
      const payload = {
        name: updates.name,
        description: updates.description,
        avatar: updates.avatar,
        is_archived: updates.isArchived,
        is_muted: updates.isMuted,
        settings: updates.settings,
      };

      await this.request(`/conversations/${conversationId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return true;
    } catch (error) {
      console.error('Error updating conversation:', error);
      return false;
    }
  }

  async archiveConversation(conversationId: string): Promise<boolean> {
    return this.updateConversation(conversationId, { isArchived: true });
  }

  async muteConversation(conversationId: string): Promise<boolean> {
    return this.updateConversation(conversationId, { isMuted: true });
  }

  async unmuteConversation(conversationId: string): Promise<boolean> {
    return this.updateConversation(conversationId, { isMuted: false });
  }

  // ============================================================================
  // SEARCH
  // ============================================================================

  async searchMessages(query: string, conversationId?: string): Promise<ChatMessage[]> {
    try {
      const params = new URLSearchParams({ q: query });
      if (conversationId) {
        params.append('conversation', conversationId);
      }

      const messages = await this.request<any[]>(`/search?${params.toString()}`);
      return (messages || []).map((msg) => this.transformMessageToChat(msg));
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  transformConversationToThread(conversation: any): ChatThread {
    const lastMessage = conversation.chat_messages?.[0];
    return {
      id: conversation.id,
      type: conversation.type === 'group' ? 'social' : 'freelance',
      participants: conversation.participants || [],
      lastMessage: lastMessage?.content || '',
      lastMessageAt: conversation.last_activity || new Date().toISOString(),
      updatedAt: conversation.updated_at || new Date().toISOString(),
      isGroup: conversation.type === 'group',
      groupName: conversation.name,
      groupAvatar: conversation.avatar,
      createdAt: conversation.created_at || new Date().toISOString(),
      unreadCount: 0,
      contextData: conversation.settings || {},
      referenceId: conversation.settings?.referenceId,
    };
  }

  transformMessageToChat(message: any): ChatMessage {
    return {
      id: message.id,
      threadId: message.conversation_id,
      senderId: message.sender_id,
      content: message.content,
      timestamp: message.created_at,
      readBy: message.read_by || [],
      deliveredTo: message.delivered_to || [],
      messageType: message.message_type || 'text',
      attachments: message.attachments,
      replyTo: message.reply_to_id,
      reactions: message.reactions,
      metadata: message.metadata,
      isEdited: message.is_edited,
      isDeleted: message.is_deleted,
    };
  }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

// Subscription management
const subscriptions = new Map<string, any>();

export const realtimeService = {
  // Subscribe to new messages in a conversation
  subscribeToMessages(
    conversationId: string,
    callback: (message: ChatMessage) => void,
    onError?: (error: Error) => void
  ) {
    try {
      const channel = supabase
        .channel(`chat:${conversationId}:messages`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload: any) => {
            const message = chatPersistenceService.transformMessageToChat(
              payload.new
            );
            callback(message);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload: any) => {
            const message = chatPersistenceService.transformMessageToChat(
              payload.new
            );
            callback(message);
          }
        )
        .subscribe((status: any) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✓ Subscribed to messages in ${conversationId}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Channel error:', status);
            if (onError) onError(new Error('Channel subscription error'));
          }
        });

      subscriptions.set(`messages:${conversationId}`, channel);
      return channel;
    } catch (error) {
      console.error('Error subscribing to messages:', error);
      if (onError) onError(error as Error);
      return null;
    }
  },

  // Subscribe to typing indicators
  subscribeToTyping(
    conversationId: string,
    callback: (typingUsers: any[]) => void,
    onError?: (error: Error) => void
  ) {
    try {
      const channel = supabase
        .channel(`chat:${conversationId}:typing`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'typing_indicators',
            filter: `conversation_id=eq.${conversationId}`,
          },
          async (payload: any) => {
            // Fetch fresh typing indicators
            const indicators = await chatPersistenceService.getTypingIndicators(
              conversationId
            );
            callback(indicators);
          }
        )
        .subscribe((status: any) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✓ Subscribed to typing in ${conversationId}`);
          }
        });

      subscriptions.set(`typing:${conversationId}`, channel);
      return channel;
    } catch (error) {
      console.error('Error subscribing to typing:', error);
      if (onError) onError(error as Error);
      return null;
    }
  },

  // Subscribe to read receipts
  subscribeToReadReceipts(
    conversationId: string,
    callback: (messageId: string, readBy: string[]) => void,
    onError?: (error: Error) => void
  ) {
    try {
      const channel = supabase
        .channel(`chat:${conversationId}:reads`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload: any) => {
            if (payload.new.read_by) {
              callback(payload.new.id, payload.new.read_by);
            }
          }
        )
        .subscribe();

      subscriptions.set(`reads:${conversationId}`, channel);
      return channel;
    } catch (error) {
      console.error('Error subscribing to read receipts:', error);
      if (onError) onError(error as Error);
      return null;
    }
  },

  // Subscribe to online presence
  subscribeToPresence(
    conversationId: string,
    callback: (presenceUsers: any[]) => void
  ) {
    try {
      const channel = supabase
        .channel(`chat:${conversationId}:presence`, {
          config: { broadcast: { self: true } },
        })
        .on('presence', { event: 'sync' }, () => {
          const presence = channel.presenceState();
          const presenceUsers = Object.values(presence).flat();
          callback(presenceUsers);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log(`User joined: ${key}`);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log(`User left: ${key}`);
        })
        .subscribe(async (status: any) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ user_id: crypto.randomUUID() });
          }
        });

      subscriptions.set(`presence:${conversationId}`, channel);
      return channel;
    } catch (error) {
      console.error('Error subscribing to presence:', error);
      return null;
    }
  },

  // Unsubscribe from a channel
  unsubscribe(key: string) {
    const channel = subscriptions.get(key);
    if (channel) {
      supabase.removeChannel(channel);
      subscriptions.delete(key);
      console.log(`✓ Unsubscribed from ${key}`);
    }
  },

  // Unsubscribe from all channels
  unsubscribeAll() {
    subscriptions.forEach((channel, key) => {
      supabase.removeChannel(channel);
    });
    subscriptions.clear();
    console.log('✓ Unsubscribed from all channels');
  },
};

export const chatPersistenceService = new ChatPersistenceService();
