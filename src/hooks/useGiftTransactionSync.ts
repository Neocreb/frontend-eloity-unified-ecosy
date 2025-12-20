import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { virtualGiftsService, GiftTransaction, TipTransaction } from '@/services/virtualGiftsService';

export interface GiftTransactionUpdate {
  type: 'gift_sent' | 'gift_received' | 'tip_sent' | 'tip_received';
  transaction: GiftTransaction | TipTransaction;
  timestamp: string;
}

interface UseGiftTransactionSyncOptions {
  onNewTransaction?: (update: GiftTransactionUpdate) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useGiftTransactionSync = (options: UseGiftTransactionSyncOptions = {}) => {
  const { user } = useAuth();
  const { onNewTransaction, autoRefresh = true, refreshInterval = 5000 } = options;

  const [giftsSent, setGiftsSent] = useState<GiftTransaction[]>([]);
  const [giftsReceived, setGiftsReceived] = useState<GiftTransaction[]>([]);
  const [tipsSent, setTipsSent] = useState<TipTransaction[]>([]);
  const [tipsReceived, setTipsReceived] = useState<TipTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Load initial data
  const loadTransactionData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setError(null);
      const [sent, received, tipsSentData, tipsReceivedData] = await Promise.all([
        virtualGiftsService.getSentGifts(user.id, 100),
        virtualGiftsService.getReceivedGifts(user.id, 100),
        virtualGiftsService.getReceivedTips(user.id, 100).catch(() => []),
        virtualGiftsService.getReceivedTips(user.id, 100).catch(() => []),
      ]);

      setGiftsSent(sent || []);
      setGiftsReceived(received || []);
      setTipsSent(tipsSentData || []);
      setTipsReceived(tipsReceivedData || []);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load transaction data';
      setError(errorMsg);
      console.error('Error loading gift transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Set up real-time subscriptions for gift transactions
  useEffect(() => {
    if (!user?.id) return;

    loadTransactionData();

    // Subscribe to gift_transactions table
    const giftSubscription = supabase
      .channel(`gift_transactions:user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gift_transactions',
          filter: `from_user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newGift = payload.new as GiftTransaction;
            setGiftsSent((prev) => [newGift, ...prev]);
            onNewTransaction?.({
              type: 'gift_sent',
              transaction: newGift,
              timestamp: new Date().toISOString(),
            });
          }
        }
      )
      .subscribe();

    // Subscribe to received gifts
    const receivedGiftSubscription = supabase
      .channel(`gift_transactions:to_user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gift_transactions',
          filter: `to_user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newGift = payload.new as GiftTransaction;
            setGiftsReceived((prev) => [newGift, ...prev]);
            onNewTransaction?.({
              type: 'gift_received',
              transaction: newGift,
              timestamp: new Date().toISOString(),
            });
          }
        }
      )
      .subscribe();

    // Subscribe to tip_transactions table
    const tipSubscription = supabase
      .channel(`tip_transactions:to_user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tip_transactions',
          filter: `to_user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTip = payload.new as TipTransaction;
            setTipsReceived((prev) => [newTip, ...prev]);
            onNewTransaction?.({
              type: 'tip_received',
              transaction: newTip,
              timestamp: new Date().toISOString(),
            });
          }
        }
      )
      .subscribe();

    // Auto-refresh interval if enabled
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(loadTransactionData, refreshInterval);
    }

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(giftSubscription);
      supabase.removeChannel(receivedGiftSubscription);
      supabase.removeChannel(tipSubscription);
      if (intervalId) clearInterval(intervalId);
    };
  }, [user?.id, loadTransactionData, autoRefresh, refreshInterval, onNewTransaction]);

  const refresh = useCallback(async () => {
    await loadTransactionData();
  }, [loadTransactionData]);

  return {
    giftsSent,
    giftsReceived,
    tipsSent,
    tipsReceived,
    isLoading,
    error,
    lastUpdate,
    refresh,
    totalGiftsSent: giftsSent.length,
    totalGiftsReceived: giftsReceived.length,
    totalTipsSent: tipsSent.length,
    totalTipsReceived: tipsReceived.length,
  };
};
