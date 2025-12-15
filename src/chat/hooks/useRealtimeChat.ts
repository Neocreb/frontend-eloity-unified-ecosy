import { useEffect, useCallback, useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import { realtimeService } from '@/services/chatPersistenceService';

interface UseRealtimeChatOptions {
  conversationId?: string;
  enabled?: boolean;
}

interface RealtimeChatHooks {
  onNewMessage?: (message: ChatMessage) => void;
  onTypingUsers?: (typingUsers: any[]) => void;
  onReadReceipt?: (messageId: string, readBy: string[]) => void;
  onPresenceChange?: (presenceUsers: any[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for real-time chat updates using Supabase subscriptions
 * Automatically handles message updates, typing indicators, read receipts, and presence
 */
export const useRealtimeChat = (
  options: UseRealtimeChatOptions,
  callbacks: RealtimeChatHooks
) => {
  const { conversationId, enabled = true } = options;
  const subscriptionKeysRef = useRef<string[]>([]);

  // Subscribe to messages
  useEffect(() => {
    if (!conversationId || !enabled) return;

    const unsubscribe = realtimeService.subscribeToMessages(
      conversationId,
      (message: ChatMessage) => {
        if (callbacks.onNewMessage) {
          callbacks.onNewMessage(message);
        }
      },
      (error: Error) => {
        console.error('Error in message subscription:', error);
        if (callbacks.onError) {
          callbacks.onError(error);
        }
      }
    );

    if (unsubscribe) {
      subscriptionKeysRef.current.push(`messages:${conversationId}`);
    }

    return () => {
      realtimeService.unsubscribe(`messages:${conversationId}`);
    };
  }, [conversationId, enabled, callbacks]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!conversationId || !enabled) return;

    const unsubscribe = realtimeService.subscribeToTyping(
      conversationId,
      (typingUsers: any[]) => {
        if (callbacks.onTypingUsers) {
          callbacks.onTypingUsers(typingUsers);
        }
      },
      (error: Error) => {
        console.error('Error in typing subscription:', error);
        if (callbacks.onError) {
          callbacks.onError(error);
        }
      }
    );

    if (unsubscribe) {
      subscriptionKeysRef.current.push(`typing:${conversationId}`);
    }

    return () => {
      realtimeService.unsubscribe(`typing:${conversationId}`);
    };
  }, [conversationId, enabled, callbacks]);

  // Subscribe to read receipts
  useEffect(() => {
    if (!conversationId || !enabled) return;

    const unsubscribe = realtimeService.subscribeToReadReceipts(
      conversationId,
      (messageId: string, readBy: string[]) => {
        if (callbacks.onReadReceipt) {
          callbacks.onReadReceipt(messageId, readBy);
        }
      },
      (error: Error) => {
        console.error('Error in read receipt subscription:', error);
        if (callbacks.onError) {
          callbacks.onError(error);
        }
      }
    );

    if (unsubscribe) {
      subscriptionKeysRef.current.push(`reads:${conversationId}`);
    }

    return () => {
      realtimeService.unsubscribe(`reads:${conversationId}`);
    };
  }, [conversationId, enabled, callbacks]);

  // Subscribe to presence
  useEffect(() => {
    if (!conversationId || !enabled) return;

    const unsubscribe = realtimeService.subscribeToPresence(
      conversationId,
      (presenceUsers: any[]) => {
        if (callbacks.onPresenceChange) {
          callbacks.onPresenceChange(presenceUsers);
        }
      }
    );

    if (unsubscribe) {
      subscriptionKeysRef.current.push(`presence:${conversationId}`);
    }

    return () => {
      realtimeService.unsubscribe(`presence:${conversationId}`);
    };
  }, [conversationId, enabled, callbacks]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    subscriptionKeysRef.current.forEach((key) => {
      realtimeService.unsubscribe(key);
    });
    subscriptionKeysRef.current = [];
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    cleanup,
    isConnected: !!conversationId && enabled,
  };
};

/**
 * Simplified hook for just message updates
 */
export const useRealtimeMessages = (
  conversationId?: string,
  onNewMessage?: (message: ChatMessage) => void
) => {
  useRealtimeChat(
    { conversationId, enabled: !!conversationId },
    { onNewMessage }
  );
};

/**
 * Hook for typing indicators only
 */
export const useRealtimeTyping = (
  conversationId?: string,
  onTypingUsers?: (typingUsers: any[]) => void
) => {
  useRealtimeChat(
    { conversationId, enabled: !!conversationId },
    { onTypingUsers }
  );
};

/**
 * Hook for read receipts only
 */
export const useRealtimeReadReceipts = (
  conversationId?: string,
  onReadReceipt?: (messageId: string, readBy: string[]) => void
) => {
  useRealtimeChat(
    { conversationId, enabled: !!conversationId },
    { onReadReceipt }
  );
};
