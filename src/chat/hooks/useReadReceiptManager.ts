import { useCallback, useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import { realtimeService } from '@/services/chatPersistenceService';

/**
 * Hook for managing read receipts with automatic state synchronization
 * Tracks which messages have been read and by whom
 */
export const useReadReceiptManager = () => {
  const readReceiptsRef = useRef<Map<string, string[]>>(new Map());

  // Update read receipts locally
  const updateReadReceipts = useCallback((messageId: string, readBy: string[]) => {
    readReceiptsRef.current.set(messageId, readBy);
  }, []);

  // Get read receipts for a message
  const getReadReceipts = useCallback((messageId: string): string[] => {
    return readReceiptsRef.current.get(messageId) || [];
  }, []);

  // Apply read receipts to messages
  const applyReadReceiptsToMessages = useCallback((messages: ChatMessage[]): ChatMessage[] => {
    return messages.map((msg) => ({
      ...msg,
      readBy: readReceiptsRef.current.get(msg.id) || msg.readBy || [],
    }));
  }, []);

  // Clear all read receipts (useful for cleanup)
  const clearReadReceipts = useCallback(() => {
    readReceiptsRef.current.clear();
  }, []);

  return {
    updateReadReceipts,
    getReadReceipts,
    applyReadReceiptsToMessages,
    clearReadReceipts,
  };
};

/**
 * Advanced hook for real-time read receipt synchronization
 * Automatically subscribes to read receipt updates for a conversation
 */
export const useRealtimeSyncedReadReceipts = (
  conversationId?: string,
  onUpdate?: (messageId: string, readBy: string[]) => void
) => {
  const manager = useReadReceiptManager();
  const subscriptionKeyRef = useRef<string | null>(null);

  const setupSubscription = useCallback(() => {
    if (!conversationId) return;

    const channel = realtimeService.subscribeToReadReceipts(
      conversationId,
      (messageId: string, readBy: string[]) => {
        // Update local state
        manager.updateReadReceipts(messageId, readBy);

        // Notify caller
        if (onUpdate) {
          onUpdate(messageId, readBy);
        }
      },
      (error) => {
        console.error('Error in read receipt subscription:', error);
      }
    );

    if (channel) {
      subscriptionKeyRef.current = `reads:${conversationId}`;
    }
  }, [conversationId, manager, onUpdate]);

  const cleanup = useCallback(() => {
    if (subscriptionKeyRef.current) {
      realtimeService.unsubscribe(subscriptionKeyRef.current);
      subscriptionKeyRef.current = null;
    }
  }, []);

  return {
    ...manager,
    setupSubscription,
    cleanup,
  };
};
