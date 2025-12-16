import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { messagingService, ChatMessage, ChatConversation } from '@/services/messagingService';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/use-notification';

export const useRealtimeMessaging = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const notification = useNotification();

  // Load user conversations
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const userConversations = await messagingService.getUserConversations(user.id);
      setConversations(userConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load messages for active conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const conversationMessages = await messagingService.getMessages(conversationId);
      setMessages(conversationMessages);
      
      // Mark messages as read
      if (user?.id) {
        await messagingService.markMessagesAsRead(conversationId, user.id);
      }
    } catch (error) {
      console.error('Error loading messages:', error instanceof Error ? error.message : JSON.stringify(error));
    }
  }, [user?.id]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!activeConversation || !user?.id || !content.trim()) return;

    try {
      const message = await messagingService.sendMessage(activeConversation, user.id, content);
      if (message) {
        setMessages(prev => [...prev, message]);
        // Refresh conversations to update last message
        loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      notification.error('Failed to send message');
    }
  }, [activeConversation, user?.id, loadConversations, notification]);

  // Start conversation with user
  const startConversation = useCallback(async (otherUserId: string) => {
    if (!user?.id) return null;

    try {
      const conversationId = await messagingService.getOrCreateConversation(user.id, otherUserId);
      if (conversationId) {
        setActiveConversation(conversationId);
        await loadMessages(conversationId);
        await loadConversations();
      }
      return conversationId;
    } catch (error) {
      console.error('Error starting conversation:', error);
      return null;
    }
  }, [user?.id, loadMessages, loadConversations]);

  // Set active conversation
  const selectConversation = useCallback(async (conversationId: string) => {
    setActiveConversation(conversationId);
    await loadMessages(conversationId);
  }, [loadMessages]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMessage = payload.new as any;
          
          // Only add message if it's for the active conversation
          if (newMessage.conversation_id === activeConversation) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.find(msg => msg.id === newMessage.id)) return prev;
              return [...prev, {
                id: newMessage.id,
                sender_id: newMessage.sender_id,
                conversation_id: newMessage.conversation_id,
                content: newMessage.content,
                created_at: newMessage.created_at,
                read: newMessage.read
              }];
            });
          }

          // Show notification for messages not from current user
          if (newMessage.sender_id !== user.id) {
            notification.info('New message received');
          }

          // Refresh conversations to update last message and unread counts
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activeConversation, notification, loadConversations]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id, loadConversations]);

  return {
    conversations,
    activeConversation,
    messages,
    loading,
    sendMessage,
    startConversation,
    selectConversation,
    loadConversations
  };
};
