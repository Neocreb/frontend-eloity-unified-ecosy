import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { invoiceService, Invoice, CreateInvoiceInput } from '@/services/invoiceService';

interface UseInvoicesReturn {
  invoices: Invoice[];
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  createInvoice: (input: CreateInvoiceInput) => Promise<Invoice | null>;
  getInvoice: (invoiceId: string) => Promise<Invoice | null>;
  loadUserInvoices: (status?: string) => Promise<void>;
  updateInvoice: (invoiceId: string, updates: Partial<CreateInvoiceInput>) => Promise<Invoice | null>;
  sendInvoice: (invoiceId: string) => Promise<boolean>;
  markAsPaid: (invoiceId: string) => Promise<Invoice | null>;
  cancelInvoice: (invoiceId: string) => Promise<Invoice | null>;
  deleteInvoice: (invoiceId: string) => Promise<boolean>;
  downloadInvoicePDF: (invoiceId: string) => Promise<void>;
}

export const useInvoices = (): UseInvoicesReturn => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserInvoices = useCallback(
    async (status?: string) => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        setError(null);
        const userInvoices = await invoiceService.getUserInvoices(user.id, status);
        setInvoices(userInvoices);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load invoices';
        setError(message);
        console.error('Error loading invoices:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id]
  );

  const createInvoice = useCallback(
    async (input: CreateInvoiceInput): Promise<Invoice | null> => {
      if (!user?.id) {
        setError('User not authenticated');
        return null;
      }

      try {
        setIsCreating(true);
        setError(null);
        const invoice = await invoiceService.createInvoice(user.id, input);
        setInvoices(prev => [invoice, ...prev]);
        return invoice;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create invoice';
        setError(message);
        console.error('Error creating invoice:', err);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [user?.id]
  );

  const getInvoice = useCallback(async (invoiceId: string): Promise<Invoice | null> => {
    try {
      setError(null);
      const invoice = await invoiceService.getInvoice(invoiceId);
      return invoice;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get invoice';
      setError(message);
      return null;
    }
  }, []);

  const updateInvoice = useCallback(
    async (invoiceId: string, updates: Partial<CreateInvoiceInput>): Promise<Invoice | null> => {
      try {
        setError(null);
        const updatedInvoice = await invoiceService.updateInvoice(invoiceId, updates);
        setInvoices(prev =>
          prev.map(invoice => (invoice.id === invoiceId ? updatedInvoice : invoice))
        );
        return updatedInvoice;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update invoice';
        setError(message);
        return null;
      }
    },
    []
  );

  const sendInvoice = useCallback(async (invoiceId: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await invoiceService.sendInvoice(invoiceId);
      if (success) {
        setInvoices(prev =>
          prev.map(inv => (inv.id === invoiceId ? { ...inv, status: 'sent' } : inv))
        );
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invoice';
      setError(message);
      return false;
    }
  }, []);

  const markAsPaid = useCallback(
    async (invoiceId: string): Promise<Invoice | null> => {
      try {
        setError(null);
        const paidInvoice = await invoiceService.markAsPaid(invoiceId);
        setInvoices(prev =>
          prev.map(invoice => (invoice.id === invoiceId ? paidInvoice : invoice))
        );
        return paidInvoice;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to mark as paid';
        setError(message);
        return null;
      }
    },
    []
  );

  const cancelInvoice = useCallback(
    async (invoiceId: string): Promise<Invoice | null> => {
      try {
        setError(null);
        const cancelledInvoice = await invoiceService.cancelInvoice(invoiceId);
        setInvoices(prev =>
          prev.map(invoice => (invoice.id === invoiceId ? cancelledInvoice : invoice))
        );
        return cancelledInvoice;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to cancel invoice';
        setError(message);
        return null;
      }
    },
    []
  );

  const deleteInvoice = useCallback(async (invoiceId: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await invoiceService.deleteInvoice(invoiceId);
      if (success) {
        setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete invoice';
      setError(message);
      return false;
    }
  }, []);

  const downloadInvoicePDF = useCallback(async (invoiceId: string): Promise<void> => {
    try {
      setError(null);
      await invoiceService.downloadInvoicePDF(invoiceId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download invoice';
      setError(message);
      console.error('Error downloading invoice:', err);
    }
  }, []);

  useEffect(() => {
    loadUserInvoices();
  }, [loadUserInvoices]);

  return {
    invoices,
    isLoading,
    isCreating,
    error,
    createInvoice,
    getInvoice,
    loadUserInvoices,
    updateInvoice,
    sendInvoice,
    markAsPaid,
    cancelInvoice,
    deleteInvoice,
    downloadInvoicePDF,
  };
};
