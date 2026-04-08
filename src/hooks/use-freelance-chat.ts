import { useState, useEffect, useCallback } from 'react';
import { freelanceMessagingService, FreelanceMessageWithSender } from '@/services/freelanceMessagingService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UsFreelanceChatResult {
  messages: FreelanceMessageWithSender[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string, messageType?: string) => Promise<void>;
  markAsRead: (messageIds: string[]) => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  unreadCount: number;
}

export const useFreelanceChat = (projectId: string): UsFreelanceChatResult => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<FreelanceMessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 50;
  const [unreadCount, setUnreadCount] = useState(0);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!projectId) {
        setError('Project ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await freelanceMessagingService.getProjectMessages(
          projectId,
          limit,
          0
        );
        setMessages(result.messages);
        setHasMore(result.hasMore);
        setOffset(limit);
        setError(null);
        
        // Count unread messages
        const unread = result.messages.filter(msg => !msg.read && msg.senderId !== user?.id).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [projectId, user?.id]);

  // Subscribe to new messages
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`freelance_messages:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'freelance_messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          const messageWithSender: FreelanceMessageWithSender = {
            id: newMessage.id,
            projectId: newMessage.project_id,
            senderId: newMessage.sender_id,
            content: newMessage.content,
            attachments: newMessage.attachments || [],
            messageType: newMessage.message_type || 'text',
            read: newMessage.read || false,
            createdAt: new Date(newMessage.created_at),
            sender: {
              id: newMessage.sender_id,
              name: newMessage.sender?.full_name || 'Unknown User',
              avatar: newMessage.sender?.avatar_url || '/placeholder.svg',
            },
          };
          setMessages(prev => [...prev, messageWithSender]);
          
          // Increment unread count if message is from someone else
          if (newMessage.sender_id !== user?.id) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, user?.id]);

  const sendMessage = useCallback(
    async (content: string, messageType = 'text') => {
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      if (!projectId) {
        setError('Project ID is required');
        return;
      }

      try {
        const newMessage = await freelanceMessagingService.sendMessage({
          projectId,
          senderId: user.id,
          content,
          messageType: messageType as 'text' | 'file' | 'milestone' | 'payment',
        });
        setMessages(prev => [...prev, newMessage]);
        setError(null);
      } catch (err) {
        console.error('Error sending message:', err);
        setError('Failed to send message');
        throw err;
      }
    },
    [projectId, user?.id]
  );

  const markAsRead = useCallback(
    async (messageIds: string[]) => {
      try {
        const { error: markError } = await supabase
          .from('freelance_messages')
          .update({ read: true })
          .in('id', messageIds);

        if (markError) throw markError;

        // Update local messages
        setMessages(prev =>
          prev.map(msg =>
            messageIds.includes(msg.id) ? { ...msg, read: true } : msg
          )
        );

        // Update unread count
        const readCount = messages.filter(
          msg => messageIds.includes(msg.id) && msg.senderId !== user?.id
        ).length;
        setUnreadCount(prev => Math.max(0, prev - readCount));
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    },
    [messages, user?.id]
  );

  const loadMore = useCallback(async () => {
    if (!projectId || !hasMore) return;

    try {
      const result = await freelanceMessagingService.getProjectMessages(
        projectId,
        limit,
        offset
      );
      setMessages(prev => [...result.messages, ...prev]);
      setHasMore(result.hasMore);
      setOffset(prev => prev + limit);
    } catch (err) {
      console.error('Error loading more messages:', err);
      setError('Failed to load more messages');
    }
  }, [projectId, hasMore, offset]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    hasMore,
    loadMore,
    unreadCount,
  };
};
