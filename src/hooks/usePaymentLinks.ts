import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { paymentLinkService, PaymentLink, CreatePaymentLinkInput } from '@/services/paymentLinkService';

interface UsePaymentLinksReturn {
  paymentLinks: PaymentLink[];
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  createPaymentLink: (input: CreatePaymentLinkInput) => Promise<PaymentLink | null>;
  getPaymentLink: (code: string) => Promise<PaymentLink | null>;
  loadUserPaymentLinks: () => Promise<void>;
  updatePaymentLink: (linkId: string, updates: Partial<CreatePaymentLinkInput>) => Promise<PaymentLink | null>;
  deactivatePaymentLink: (linkId: string) => Promise<boolean>;
  deletePaymentLink: (linkId: string) => Promise<boolean>;
  isPaymentLinkValid: (code: string) => Promise<boolean>;
  recordPaymentLinkUsage: (code: string) => Promise<PaymentLink | null>;
  copyLinkToClipboard: (shareUrl: string) => Promise<void>;
}

export const usePaymentLinks = (): UsePaymentLinksReturn => {
  const { user } = useAuth();
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserPaymentLinks = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      const links = await paymentLinkService.getUserPaymentLinks(user.id);
      setPaymentLinks(links);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load payment links';
      setError(message);
      console.error('Error loading payment links:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const createPaymentLink = useCallback(
    async (input: CreatePaymentLinkInput): Promise<PaymentLink | null> => {
      if (!user?.id) {
        setError('User not authenticated');
        return null;
      }

      try {
        setIsCreating(true);
        setError(null);
        const link = await paymentLinkService.createPaymentLink(user.id, input);
        setPaymentLinks(prev => [link, ...prev]);
        return link;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create payment link';
        setError(message);
        console.error('Error creating payment link:', err);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [user?.id]
  );

  const getPaymentLink = useCallback(async (code: string): Promise<PaymentLink | null> => {
    try {
      setError(null);
      const link = await paymentLinkService.getPaymentLinkByCode(code);
      return link;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get payment link';
      setError(message);
      return null;
    }
  }, []);

  const updatePaymentLink = useCallback(
    async (linkId: string, updates: Partial<CreatePaymentLinkInput>): Promise<PaymentLink | null> => {
      try {
        setError(null);
        const updatedLink = await paymentLinkService.updatePaymentLink(linkId, updates);
        setPaymentLinks(prev =>
          prev.map(link => (link.id === linkId ? updatedLink : link))
        );
        return updatedLink;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update payment link';
        setError(message);
        return null;
      }
    },
    []
  );

  const deactivatePaymentLink = useCallback(async (linkId: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await paymentLinkService.deactivatePaymentLink(linkId);
      if (success) {
        setPaymentLinks(prev =>
          prev.map(link => (link.id === linkId ? { ...link, isActive: false } : link))
        );
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deactivate payment link';
      setError(message);
      return false;
    }
  }, []);

  const deletePaymentLink = useCallback(async (linkId: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await paymentLinkService.deletePaymentLink(linkId);
      if (success) {
        setPaymentLinks(prev => prev.filter(link => link.id !== linkId));
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete payment link';
      setError(message);
      return false;
    }
  }, []);

  const isPaymentLinkValid = useCallback(async (code: string): Promise<boolean> => {
    try {
      return await paymentLinkService.isPaymentLinkValid(code);
    } catch (err) {
      console.error('Error checking payment link validity:', err);
      return false;
    }
  }, []);

  const recordPaymentLinkUsage = useCallback(async (code: string): Promise<PaymentLink | null> => {
    try {
      setError(null);
      return await paymentLinkService.recordPaymentLinkUsage(code);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record usage';
      setError(message);
      return null;
    }
  }, []);

  const copyLinkToClipboard = useCallback(async (shareUrl: string): Promise<void> => {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  }, []);

  useEffect(() => {
    loadUserPaymentLinks();
  }, [loadUserPaymentLinks]);

  return {
    paymentLinks,
    isLoading,
    isCreating,
    error,
    createPaymentLink,
    getPaymentLink,
    loadUserPaymentLinks,
    updatePaymentLink,
    deactivatePaymentLink,
    deletePaymentLink,
    isPaymentLinkValid,
    recordPaymentLinkUsage,
    copyLinkToClipboard,
  };
};
