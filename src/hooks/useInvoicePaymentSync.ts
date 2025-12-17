import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { invoicePaymentSyncService, InvoicePaymentRecord } from '@/services/invoicePaymentSyncService';

interface ActivitySummary {
  totalInvoicesCreated: number;
  totalInvoicesPaid: number;
  totalPaymentLinksCreated: number;
  totalPaymentLinksUsed: number;
  totalAmountFromInvoices: number;
  totalAmountFromPaymentLinks: number;
}

interface UseInvoicePaymentSyncReturn {
  records: InvoicePaymentRecord[];
  summary: ActivitySummary | null;
  isLoading: boolean;
  error: string | null;
  recordInvoicePayment: (invoiceId: string, amount: number, type?: 'invoice_received' | 'invoice_paid') => Promise<InvoicePaymentRecord | null>;
  recordPaymentLinkCreated: (paymentLinkId: string, amount?: number) => Promise<InvoicePaymentRecord | null>;
  recordPaymentLinkUsed: (paymentLinkId: string, amount: number, payerEmail?: string, payerName?: string) => Promise<InvoicePaymentRecord | null>;
  refreshData: () => Promise<void>;
}

export const useInvoicePaymentSync = (autoLoadOnMount = true): UseInvoicePaymentSyncReturn => {
  const { user } = useAuth();
  const [records, setRecords] = useState<InvoicePaymentRecord[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      const userRecords = await invoicePaymentSyncService.getUserRecords(user.id);
      const activitySummary = await invoicePaymentSyncService.getActivitySummary(user.id, 30);

      setRecords(userRecords);
      setSummary(activitySummary);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load invoice/payment sync data';
      setError(message);
      console.error('Error loading invoice payment sync data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const recordInvoicePayment = useCallback(
    async (invoiceId: string, amount: number, type: 'invoice_received' | 'invoice_paid' = 'invoice_received') => {
      if (!user?.id) return null;

      try {
        const record = await invoicePaymentSyncService.recordInvoicePayment(user.id, invoiceId, amount, type);
        if (record) {
          setRecords(prev => [record, ...prev]);
        }
        return record;
      } catch (err) {
        console.error('Error recording invoice payment:', err);
        return null;
      }
    },
    [user?.id]
  );

  const recordPaymentLinkCreated = useCallback(
    async (paymentLinkId: string, amount?: number) => {
      if (!user?.id) return null;

      try {
        const record = await invoicePaymentSyncService.recordPaymentLinkCreated(user.id, paymentLinkId, amount);
        if (record) {
          setRecords(prev => [record, ...prev]);
        }
        return record;
      } catch (err) {
        console.error('Error recording payment link creation:', err);
        return null;
      }
    },
    [user?.id]
  );

  const recordPaymentLinkUsed = useCallback(
    async (paymentLinkId: string, amount: number, payerEmail?: string, payerName?: string) => {
      if (!user?.id) return null;

      try {
        const record = await invoicePaymentSyncService.recordPaymentLinkUsed(
          user.id,
          paymentLinkId,
          amount,
          payerEmail,
          payerName
        );
        if (record) {
          setRecords(prev => [record, ...prev]);
        }
        return record;
      } catch (err) {
        console.error('Error recording payment link usage:', err);
        return null;
      }
    },
    [user?.id]
  );

  useEffect(() => {
    if (autoLoadOnMount) {
      refreshData();
    }
  }, [autoLoadOnMount, refreshData]);

  return {
    records,
    summary,
    isLoading,
    error,
    recordInvoicePayment,
    recordPaymentLinkCreated,
    recordPaymentLinkUsed,
    refreshData,
  };
};
