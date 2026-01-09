import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UnifiedFreelanceChatService from '@/services/unifiedFreelanceChatService';
import { ChatThread, ChatMessage } from '@/types/chat';

interface UseUnifiedFreelanceChatOptions {
  projectId?: string;
  clientId?: string;
  freelancerId?: string;
  projectTitle?: string;
  autoSubscribe?: boolean;
}

/**
 * Hook for unified freelance chat integration
 * Manages freelance project messaging through the unified chat system
 */
export const useUnifiedFreelanceChat = (options: UseUnifiedFreelanceChatOptions = {}) => {
  const { user } = useAuth();
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef<(() => void) | null>(null);

  const {
    projectId,
    clientId,
    freelancerId,
    projectTitle = 'Project',
    autoSubscribe = true,
  } = options;

  // Load or create chat thread
  const loadOrCreateThread = useCallback(async () => {
    if (!projectId || !clientId || !freelancerId || !user?.id) {
      setError('Missing required parameters');
      return null;
    }

    try {
      setLoading(true);
      const chatThread = await UnifiedFreelanceChatService.getOrCreateProjectChatThread(
        projectId,
        clientId,
        freelancerId,
        projectTitle
      );

      if (!chatThread) {
        setError('Failed to create or fetch chat thread');
        return null;
      }

      setThread(chatThread);
      setError(null);
      return chatThread;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading chat thread:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [projectId, clientId, freelancerId, projectTitle, user?.id]);

  // Load messages
  const loadMessages = useCallback(async (threadId: string) => {
    try {
      const msgs = await UnifiedFreelanceChatService.getProjectMessages(threadId);
      setMessages(msgs);
      setError(null);

      // Mark as read
      if (user?.id) {
        await UnifiedFreelanceChatService.markProjectMessagesAsRead(threadId, user.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading messages:', err);
    }
  }, [user?.id]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, messageType: 'text' | 'image' | 'file' | 'milestone' | 'payment' = 'text') => {
      if (!thread || !user?.id) {
        setError('Chat thread not loaded or user not authenticated');
        return null;
      }

      try {
        const message = await UnifiedFreelanceChatService.sendProjectMessage(
          thread.id,
          user.id,
          content,
          messageType
        );

        if (message) {
          setMessages(prev => [...prev, message]);
          setError(null);
          return message;
        }
        return null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error sending message:', err);
        return null;
      }
    },
    [thread, user?.id]
  );

  // Subscribe to real-time updates
  const subscribe = useCallback((threadId: string) => {
    if (!autoSubscribe) return;

    subscriptionRef.current = UnifiedFreelanceChatService.subscribeToProjectChat(
      threadId,
      (newMessage: ChatMessage) => {
        setMessages(prev => [...prev, newMessage]);
      }
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
    };
  }, [autoSubscribe]);

  // Get unread count
  const getUnreadCount = useCallback(async (threadId: string) => {
    if (!user?.id) return;

    try {
      const count = await UnifiedFreelanceChatService.getUnreadMessageCount(threadId, user.id);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error getting unread count:', err);
    }
  }, [user?.id]);

  // Send project notification
  const sendNotification = useCallback(
    async (
      notificationType: 'milestone' | 'payment' | 'deadline' | 'dispute' | 'system',
      title: string,
      description: string,
      metadata?: any
    ) => {
      if (!projectId || !clientId || !freelancerId) {
        setError('Missing project parameters');
        return null;
      }

      try {
        return await UnifiedFreelanceChatService.sendProjectNotification(
          projectId,
          clientId,
          freelancerId,
          projectTitle,
          notificationType,
          title,
          description,
          metadata
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error sending notification:', err);
        return null;
      }
    },
    [projectId, clientId, freelancerId, projectTitle]
  );

  // Initialize on mount
  useEffect(() => {
    loadOrCreateThread();
  }, [loadOrCreateThread]);

  // Load messages and subscribe when thread is available
  useEffect(() => {
    if (thread?.id) {
      loadMessages(thread.id);
      const unsubscribe = subscribe(thread.id);
      getUnreadCount(thread.id);

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [thread?.id, loadMessages, subscribe, getUnreadCount]);

  return {
    thread,
    messages,
    loading,
    error,
    unreadCount,
    sendMessage,
    sendNotification,
    loadMessages,
    getUnreadCount,
  };
};

export default useUnifiedFreelanceChat;
