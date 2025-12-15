import { useEffect, useCallback, useRef } from 'react';
import { realtimeService } from '@/services/chatPersistenceService';

interface ReadReceiptUpdate {
  messageId: string;
  readBy: string[];
  readAt?: string;
}

interface UseRealtimeReadReceiptsOptions {
  conversationId?: string;
  enabled?: boolean;
}

/**
 * Hook for real-time read receipt updates
 * Handles read status changes for messages in a conversation
 */
export const useRealtimeReadReceipts = (
  conversationId?: string,
  onReadReceiptUpdate?: (update: ReadReceiptUpdate) => void,
  enabled: boolean = true
) => {
  const subscriptionKeyRef = useRef<string | null>(null);

  const handleReadReceiptUpdate = useCallback((messageId: string, readBy: string[]) => {
    if (onReadReceiptUpdate) {
      onReadReceiptUpdate({
        messageId,
        readBy,
        readAt: new Date().toISOString(),
      });
    }
  }, [onReadReceiptUpdate]);

  useEffect(() => {
    if (!conversationId || !enabled) return;

    const channel = realtimeService.subscribeToReadReceipts(
      conversationId,
      handleReadReceiptUpdate,
      (error) => {
        console.error('Error in read receipt subscription:', error);
      }
    );

    if (channel) {
      subscriptionKeyRef.current = `reads:${conversationId}`;
    }

    return () => {
      if (subscriptionKeyRef.current) {
        realtimeService.unsubscribe(subscriptionKeyRef.current);
      }
    };
  }, [conversationId, enabled, handleReadReceiptUpdate]);

  return {
    isConnected: !!conversationId && enabled,
  };
};
