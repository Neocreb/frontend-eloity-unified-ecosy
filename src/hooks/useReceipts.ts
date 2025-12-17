import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Transaction } from '@/types/wallet';
import { receiptService, Receipt, ReceiptData } from '@/services/receiptService';

interface UseReceiptsReturn {
  receipts: Receipt[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  generateReceipt: (transaction: Transaction) => Promise<Receipt | null>;
  getReceipt: (transactionId: string) => Promise<Receipt | null>;
  loadUserReceipts: () => Promise<void>;
  downloadReceiptPDF: (transaction: ReceiptData, receiptNumber: string) => Promise<void>;
  emailReceipt: (transactionId: string, userEmail: string) => Promise<boolean>;
}

export const useReceipts = (): UseReceiptsReturn => {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserReceipts = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const userReceipts = await receiptService.getUserReceipts(user.id);
      setReceipts(userReceipts);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load receipts. Please check that the receipts table has been created in Supabase.';
      setError(message);
      console.error('Error loading receipts:', message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const generateReceipt = useCallback(
    async (transaction: Transaction): Promise<Receipt | null> => {
      if (!user?.id) {
        setError('User not authenticated');
        return null;
      }

      try {
        setIsGenerating(true);
        setError(null);
        const receipt = await receiptService.generateReceipt(transaction, user.id);
        setReceipts(prev => [receipt, ...prev]);
        return receipt;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate receipt';
        setError(message);
        console.error('Error generating receipt:', err);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [user?.id]
  );

  const getReceipt = useCallback(async (transactionId: string): Promise<Receipt | null> => {
    try {
      setError(null);
      const receipt = await receiptService.getReceipt(transactionId);
      return receipt;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get receipt';
      setError(message);
      return null;
    }
  }, []);

  const downloadReceiptPDF = useCallback(
    async (transaction: ReceiptData, receiptNumber: string) => {
      try {
        setError(null);
        await receiptService.downloadReceiptAsPDF(transaction, receiptNumber);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to download receipt';
        setError(message);
        console.error('Error downloading receipt:', err);
      }
    },
    []
  );

  const emailReceipt = useCallback(
    async (transactionId: string, userEmail: string): Promise<boolean> => {
      if (!user?.id) {
        setError('User not authenticated');
        return false;
      }

      try {
        setError(null);
        const success = await receiptService.emailReceipt(transactionId, user.id, userEmail);
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to email receipt';
        setError(message);
        return false;
      }
    },
    [user?.id]
  );

  useEffect(() => {
    loadUserReceipts();
  }, [loadUserReceipts]);

  return {
    receipts,
    isLoading,
    isGenerating,
    error,
    generateReceipt,
    getReceipt,
    loadUserReceipts,
    downloadReceiptPDF,
    emailReceipt,
  };
};
