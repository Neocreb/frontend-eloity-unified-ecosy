import { useState, useCallback, useEffect } from 'react';
import { freelancePaymentReminderService } from '@/services/freelancePaymentReminderService';
import type {
  ReminderRule,
  PaymentReminder,
  InvoiceForReminder,
} from '@/services/freelancePaymentReminderService';
import { toast } from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/client';

export const usePaymentReminders = (freelancerId?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<InvoiceForReminder[]>([]);
  const [upcomingInvoices, setUpcomingInvoices] = useState<InvoiceForReminder[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Get current user's ID if not provided
  const [currentUserId, setCurrentUserId] = useState(freelancerId);

  useEffect(() => {
    if (!currentUserId) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setCurrentUserId(user.id);
        }
      });
    }
  }, [currentUserId]);

  /**
   * Load all reminder data
   */
  const loadReminders = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [rulesData, remindersData, overdueData, upcomingData, statsData] =
        await Promise.all([
          freelancePaymentReminderService.getReminderRules(currentUserId),
          freelancePaymentReminderService.getPendingReminders(currentUserId),
          freelancePaymentReminderService.getOverdueInvoices(currentUserId),
          freelancePaymentReminderService.getUpcomingDueInvoices(currentUserId),
          freelancePaymentReminderService.getReminderStats(currentUserId),
        ]);

      setRules(rulesData);
      setReminders(remindersData);
      setOverdueInvoices(overdueData);
      setUpcomingInvoices(upcomingData);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load reminders';
      setError(errorMessage);
      console.error('Error loading reminders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  /**
   * Create a new reminder rule
   */
  const createRule = useCallback(
    async (rule: Omit<ReminderRule, 'id' | 'freelancerId' | 'createdAt' | 'updatedAt'>) => {
      if (!currentUserId) {
        setError('User ID not available');
        return null;
      }

      try {
        const newRule = await freelancePaymentReminderService.createReminderRule({
          ...rule,
          freelancerId: currentUserId,
        });

        if (newRule) {
          setRules(prev => [...prev, newRule]);
          toast.success(`Rule "${rule.name}" created successfully`);
        }

        return newRule;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create rule';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error creating rule:', err);
        return null;
      }
    },
    [currentUserId]
  );

  /**
   * Update a reminder rule
   */
  const updateRule = useCallback(
    async (ruleId: string, updates: Partial<ReminderRule>) => {
      try {
        const success = await freelancePaymentReminderService.updateReminderRule(ruleId, updates);

        if (success) {
          setRules(prev =>
            prev.map(r => (r.id === ruleId ? { ...r, ...updates } : r))
          );
          toast.success('Rule updated successfully');
        }

        return success;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update rule';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error updating rule:', err);
        return false;
      }
    },
    []
  );

  /**
   * Delete a reminder rule
   */
  const deleteRule = useCallback(async (ruleId: string) => {
    try {
      const success = await freelancePaymentReminderService.deleteReminderRule(ruleId);

      if (success) {
        setRules(prev => prev.filter(r => r.id !== ruleId));
        toast.success('Rule deleted successfully');
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete rule';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error deleting rule:', err);
      return false;
    }
  }, []);

  /**
   * Schedule a manual reminder
   */
  const scheduleReminder = useCallback(
    async (
      invoiceId: string,
      clientId: string,
      reminderType: 'payment_due' | 'overdue' | 'upcoming' | 'payment_received',
      scheduledFor: Date
    ) => {
      if (!currentUserId) {
        setError('User ID not available');
        return null;
      }

      try {
        const reminder = await freelancePaymentReminderService.scheduleReminder(
          invoiceId,
          currentUserId,
          clientId,
          reminderType,
          scheduledFor
        );

        if (reminder) {
          setReminders(prev => [...prev, reminder]);
          toast.success('Reminder scheduled successfully');
        }

        return reminder;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to schedule reminder';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error scheduling reminder:', err);
        return null;
      }
    },
    [currentUserId]
  );

  /**
   * Auto-schedule reminders based on rules
   */
  const autoScheduleReminders = useCallback(async () => {
    if (!currentUserId) {
      setError('User ID not available');
      return 0;
    }

    try {
      setIsLoading(true);
      const count = await freelancePaymentReminderService.autoScheduleReminders(currentUserId);
      toast.success(`${count} reminders scheduled automatically`);
      await loadReminders(); // Refresh data
      return count;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to auto-schedule reminders';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error auto-scheduling reminders:', err);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, loadReminders]);

  /**
   * Cancel reminders for an invoice
   */
  const cancelReminders = useCallback(async (invoiceId: string) => {
    try {
      const success = await freelancePaymentReminderService.cancelRemindersForInvoice(invoiceId);

      if (success) {
        setReminders(prev =>
          prev.filter(r => !(r.invoiceId === invoiceId && r.status === 'pending'))
        );
        toast.success('Reminders cancelled');
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel reminders';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error cancelling reminders:', err);
      return false;
    }
  }, []);

  /**
   * Get reminder history
   */
  const getReminderHistory = useCallback(
    async (limit?: number) => {
      if (!currentUserId) {
        setError('User ID not available');
        return [];
      }

      try {
        const history = await freelancePaymentReminderService.getReminderHistory(
          currentUserId,
          limit
        );
        return history;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch history';
        setError(errorMessage);
        console.error('Error fetching history:', err);
        return [];
      }
    },
    [currentUserId]
  );

  return {
    isLoading,
    error,
    rules,
    reminders,
    overdueInvoices,
    upcomingInvoices,
    stats,
    loadReminders,
    createRule,
    updateRule,
    deleteRule,
    scheduleReminder,
    autoScheduleReminders,
    cancelReminders,
    getReminderHistory,
  };
};
