import { supabase } from "@/integrations/supabase/client";

/**
 * FreelancePaymentReminderService
 * 
 * Manages automatic payment reminders and automation rules for freelance invoices
 * Supports scheduled reminders, overdue notifications, and custom automation rules
 */

export interface ReminderRule {
  id?: string;
  freelancerId: string;
  name: string;
  description?: string;
  triggers: ReminderTrigger[];
  actions: ReminderAction[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReminderTrigger {
  type: 'overdue' | 'upcoming_due' | 'unpaid_invoice' | 'payment_received' | 'scheduled';
  daysBeforeDue?: number; // For upcoming_due trigger
  daysAfterDue?: number; // For overdue trigger
  scheduleTime?: string; // For scheduled trigger (HH:mm format)
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly'; // For scheduled trigger
}

export interface ReminderAction {
  type: 'email' | 'sms' | 'in_app' | 'webhook';
  recipients: string[]; // Email addresses or phone numbers
  template: string; // Template name or custom message
  attachments?: 'invoice_pdf' | 'payment_link' | 'both' | 'none';
}

export interface PaymentReminder {
  id: string;
  invoiceId: string;
  freelancerId: string;
  clientId: string;
  reminderType: 'payment_due' | 'overdue' | 'upcoming' | 'payment_received';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  scheduledFor: string;
  sentAt?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceForReminder {
  id: string;
  invoiceNumber: string;
  projectTitle: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: string;
  issueDate: string;
}

export class FreelancePaymentReminderService {
  /**
   * Create a new reminder rule
   */
  static async createReminderRule(rule: ReminderRule): Promise<ReminderRule | null> {
    try {
      const { data, error } = await supabase
        .from('freelance_reminder_rules')
        .insert([
          {
            freelancer_id: rule.freelancerId,
            name: rule.name,
            description: rule.description,
            triggers: rule.triggers,
            actions: rule.actions,
            is_active: rule.isActive,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as any;
    } catch (error) {
      console.error('Error creating reminder rule:', error);
      return null;
    }
  }

  /**
   * Get all reminder rules for a freelancer
   */
  static async getReminderRules(freelancerId: string): Promise<ReminderRule[]> {
    try {
      const { data, error } = await supabase
        .from('freelance_reminder_rules')
        .select('*')
        .eq('freelancer_id', freelancerId)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      return data as any;
    } catch (error) {
      console.error('Error fetching reminder rules:', error);
      return [];
    }
  }

  /**
   * Update reminder rule
   */
  static async updateReminderRule(ruleId: string, updates: Partial<ReminderRule>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('freelance_reminder_rules')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.triggers && { triggers: updates.triggers }),
          ...(updates.actions && { actions: updates.actions }),
          ...(updates.isActive !== undefined && { is_active: updates.isActive }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', ruleId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating reminder rule:', error);
      return false;
    }
  }

  /**
   * Delete reminder rule
   */
  static async deleteReminderRule(ruleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('freelance_reminder_rules')
        .delete()
        .eq('id', ruleId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting reminder rule:', error);
      return false;
    }
  }

  /**
   * Schedule a payment reminder for an invoice
   */
  static async scheduleReminder(
    invoiceId: string,
    freelancerId: string,
    clientId: string,
    reminderType: 'payment_due' | 'overdue' | 'upcoming' | 'payment_received',
    scheduledFor: Date
  ): Promise<PaymentReminder | null> {
    try {
      const { data, error } = await supabase
        .from('payment_reminders')
        .insert([
          {
            invoice_id: invoiceId,
            freelancer_id: freelancerId,
            client_id: clientId,
            reminder_type: reminderType,
            status: 'pending',
            scheduled_for: scheduledFor.toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as any;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return null;
    }
  }

  /**
   * Get overdue invoices that need reminders
   */
  static async getOverdueInvoices(freelancerId: string): Promise<InvoiceForReminder[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          project_title,
          client_name,
          client_email,
          amount,
          currency,
          due_date,
          status,
          issue_date
        `)
        .eq('freelancer_id', freelancerId)
        .lt('due_date', today)
        .neq('status', 'paid')
        .neq('status', 'cancelled');

      if (error) {
        throw error;
      }

      return data as any;
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
      return [];
    }
  }

  /**
   * Get invoices due soon (within N days)
   */
  static async getUpcomingDueInvoices(
    freelancerId: string,
    daysUntilDue: number = 3
  ): Promise<InvoiceForReminder[]> {
    try {
      const today = new Date();
      const upcomingDate = new Date(today);
      upcomingDate.setDate(upcomingDate.getDate() + daysUntilDue);

      const todayStr = today.toISOString().split('T')[0];
      const upcomingStr = upcomingDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          project_title,
          client_name,
          client_email,
          amount,
          currency,
          due_date,
          status,
          issue_date
        `)
        .eq('freelancer_id', freelancerId)
        .gte('due_date', todayStr)
        .lte('due_date', upcomingStr)
        .neq('status', 'paid')
        .neq('status', 'cancelled');

      if (error) {
        throw error;
      }

      return data as any;
    } catch (error) {
      console.error('Error fetching upcoming invoices:', error);
      return [];
    }
  }

  /**
   * Get pending reminders for a freelancer
   */
  static async getPendingReminders(freelancerId: string): Promise<PaymentReminder[]> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('payment_reminders')
        .select('*')
        .eq('freelancer_id', freelancerId)
        .eq('status', 'pending')
        .lte('scheduled_for', now)
        .order('scheduled_for', { ascending: true });

      if (error) {
        throw error;
      }

      return data as any;
    } catch (error) {
      console.error('Error fetching pending reminders:', error);
      return [];
    }
  }

  /**
   * Mark reminder as sent
   */
  static async markReminderAsSent(reminderId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_reminders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', reminderId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error marking reminder as sent:', error);
      return false;
    }
  }

  /**
   * Mark reminder as failed
   */
  static async markReminderAsFailed(reminderId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_reminders')
        .update({
          status: 'failed',
          failure_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reminderId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error marking reminder as failed:', error);
      return false;
    }
  }

  /**
   * Cancel pending reminders for an invoice
   */
  static async cancelRemindersForInvoice(invoiceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_reminders')
        .update({ status: 'cancelled' })
        .eq('invoice_id', invoiceId)
        .eq('status', 'pending');

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error cancelling reminders:', error);
      return false;
    }
  }

  /**
   * Get reminder history for a freelancer
   */
  static async getReminderHistory(
    freelancerId: string,
    limit: number = 50
  ): Promise<PaymentReminder[]> {
    try {
      const { data, error } = await supabase
        .from('payment_reminders')
        .select('*')
        .eq('freelancer_id', freelancerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data as any;
    } catch (error) {
      console.error('Error fetching reminder history:', error);
      return [];
    }
  }

  /**
   * Auto-schedule reminders based on configured rules
   */
  static async autoScheduleReminders(freelancerId: string): Promise<number> {
    try {
      const rules = await this.getReminderRules(freelancerId);
      let remindersCreated = 0;

      for (const rule of rules) {
        for (const trigger of rule.triggers) {
          if (trigger.type === 'overdue') {
            const overdueInvoices = await this.getOverdueInvoices(freelancerId);
            for (const invoice of overdueInvoices) {
              const existingReminder = await supabase
                .from('payment_reminders')
                .select('id')
                .eq('invoice_id', invoice.id)
                .eq('status', 'pending')
                .single();

              // Only create if no pending reminder exists
              if (!existingReminder.data) {
                const scheduledFor = new Date();
                scheduledFor.setHours(9, 0, 0, 0); // Schedule for 9 AM

                const reminder = await this.scheduleReminder(
                  invoice.id,
                  freelancerId,
                  invoice.clientId || '',
                  'overdue',
                  scheduledFor
                );

                if (reminder) {
                  remindersCreated++;
                }
              }
            }
          } else if (trigger.type === 'upcoming_due' && trigger.daysBeforeDue) {
            const upcomingInvoices = await this.getUpcomingDueInvoices(
              freelancerId,
              trigger.daysBeforeDue
            );

            for (const invoice of upcomingInvoices) {
              const existingReminder = await supabase
                .from('payment_reminders')
                .select('id')
                .eq('invoice_id', invoice.id)
                .eq('status', 'pending')
                .single();

              // Only create if no pending reminder exists
              if (!existingReminder.data) {
                const scheduledFor = new Date(invoice.dueDate);
                scheduledFor.setHours(10, 0, 0, 0); // 10 AM on due date

                const reminder = await this.scheduleReminder(
                  invoice.id,
                  freelancerId,
                  invoice.clientId || '',
                  'upcoming',
                  scheduledFor
                );

                if (reminder) {
                  remindersCreated++;
                }
              }
            }
          }
        }
      }

      return remindersCreated;
    } catch (error) {
      console.error('Error auto-scheduling reminders:', error);
      return 0;
    }
  }

  /**
   * Get reminder statistics for a freelancer
   */
  static async getReminderStats(freelancerId: string): Promise<{
    totalReminders: number;
    pendingReminders: number;
    sentReminders: number;
    failedReminders: number;
    overduInvoices: number;
    upcomingInvoices: number;
  }> {
    try {
      // Total reminders
      const { count: totalCount } = await supabase
        .from('payment_reminders')
        .select('*', { count: 'exact', head: true })
        .eq('freelancer_id', freelancerId);

      // Pending reminders
      const { count: pendingCount } = await supabase
        .from('payment_reminders')
        .select('*', { count: 'exact', head: true })
        .eq('freelancer_id', freelancerId)
        .eq('status', 'pending');

      // Sent reminders
      const { count: sentCount } = await supabase
        .from('payment_reminders')
        .select('*', { count: 'exact', head: true })
        .eq('freelancer_id', freelancerId)
        .eq('status', 'sent');

      // Failed reminders
      const { count: failedCount } = await supabase
        .from('payment_reminders')
        .select('*', { count: 'exact', head: true })
        .eq('freelancer_id', freelancerId)
        .eq('status', 'failed');

      // Overdue invoices
      const overdueInvoices = await this.getOverdueInvoices(freelancerId);

      // Upcoming invoices
      const upcomingInvoices = await this.getUpcomingDueInvoices(freelancerId);

      return {
        totalReminders: totalCount || 0,
        pendingReminders: pendingCount || 0,
        sentReminders: sentCount || 0,
        failedReminders: failedCount || 0,
        overduInvoices: overdueInvoices.length,
        upcomingInvoices: upcomingInvoices.length,
      };
    } catch (error) {
      console.error('Error getting reminder stats:', error);
      return {
        totalReminders: 0,
        pendingReminders: 0,
        sentReminders: 0,
        failedReminders: 0,
        overduInvoices: 0,
        upcomingInvoices: 0,
      };
    }
  }
}

export const freelancePaymentReminderService = new FreelancePaymentReminderService();
