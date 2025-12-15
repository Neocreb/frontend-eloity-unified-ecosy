import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CryptoTransaction {
  id: string;
  type: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | 'SEND' | 'RECEIVE';
  asset: string;
  amount: number;
  price: number;
  value: number;
  fee: number;
  timestamp: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  transactionHash?: string;
  fromAddress?: string;
  toAddress?: string;
  blockNumber?: number;
}

export interface UseCryptoTransactionsReturn {
  transactions: CryptoTransaction[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function useCryptoTransactions(
  walletAddress?: string,
  blockchain: string = 'ethereum',
  network: string = 'mainnet',
  limit: number = 50
): UseCryptoTransactionsReturn {
  const [transactions, setTransactions] = useState<CryptoTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const { user } = useAuth();

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch from local database instead of blockchain API
      const { data, error: dbError } = await supabase
        .from('crypto_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (dbError) {
        throw new Error(dbError.message);
      }

      // Convert database records to CryptoTransaction format
      const parsedTransactions = (data || []).map((tx: any) => ({
        id: tx.id,
        type: tx.transaction_type as any,
        asset: tx.symbol || 'ETH',
        amount: parseFloat(tx.amount) || 0,
        price: parseFloat(tx.price_usd) || 0,
        value: parseFloat(tx.total_value) || 0,
        fee: parseFloat(tx.fee_amount) || 0,
        timestamp: tx.created_at,
        status: tx.status as any,
        transactionHash: tx.transaction_hash,
        fromAddress: tx.from_address,
        toAddress: tx.to_address,
        blockNumber: tx.block_number || 0,
      }));

      setTransactions(parsedTransactions);
      setHasMore(false); // Database query is complete
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching transactions:', errorMessage);
      setError(errorMessage);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const loadMore = useCallback(async () => {
    if (!user?.id || hasMore === false) return;

    setLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from('crypto_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(transactions.length, transactions.length + limit);

      if (dbError) {
        throw new Error(dbError.message);
      }

      const parsedTransactions = (data || []).map((tx: any) => ({
        id: tx.id,
        type: tx.transaction_type as any,
        asset: tx.symbol || 'ETH',
        amount: parseFloat(tx.amount) || 0,
        price: parseFloat(tx.price_usd) || 0,
        value: parseFloat(tx.total_value) || 0,
        fee: parseFloat(tx.fee_amount) || 0,
        timestamp: tx.created_at,
        status: tx.status as any,
        transactionHash: tx.transaction_hash,
        fromAddress: tx.from_address,
        toAddress: tx.to_address,
        blockNumber: tx.block_number || 0,
      }));

      setTransactions([...transactions, ...parsedTransactions]);
      setHasMore(parsedTransactions.length === limit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error loading more transactions:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id, transactions.length, limit, hasMore]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    hasMore,
    loadMore,
  };
}
