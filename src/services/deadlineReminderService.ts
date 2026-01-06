import { supabase } from '@/lib/supabase/client';
import FreelanceNotificationService from './freelanceNotificationService';

export interface DeadlineReminder {
  id: string;
  contract_id: string;
  project_id: string;
  user_id: string;
  reminder_type: 'milestone_deadline' | 'project_deadline' | 'payment_deadline';
  deadline_date: string;
  reminder_dates: string[]; // Dates when reminders should be sent
  reminders_sent: { [date: string]: boolean }; // Track which reminders have been sent
  notification_preferences: {
    email: boolean;
    in_app: boolean;
    sms: boolean;
  };
  is_active: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * DeadlineReminderService
 * Manages automated deadline reminders for freelance projects
 * Sends notifications at 3 days, 1 day, and 2 hours before deadline
 */

export class DeadlineReminderService {
  /**
   * Create a deadline reminder
   */
  static async createReminder(
    contractId: string,
    projectId: string,
    userId: string,
    deadlineDate: Date,
    reminderType: 'milestone_deadline' | 'project_deadline' | 'payment_deadline' = 'milestone_deadline'
  ): Promise<DeadlineReminder | null> {
    try {
      // Calculate reminder dates (3 days, 1 day, 2 hours before)
      const reminderDates = this.calculateReminderDates(deadlineDate);

      const { data, error } = await supabase
        .from('deadline_reminders')
        .insert({
          contract_id: contractId,
          project_id: projectId,
          user_id: userId,
          reminder_type: reminderType,
          deadline_date: deadlineDate.toISOString(),
          reminder_dates: reminderDates.map(d => d.toISOString()),
          reminders_sent: {},
          notification_preferences: {
            email: true,
            in_app: true,
            sms: false,
          },
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating reminder:', error);
        return null;
      }

      return data as DeadlineReminder;
    } catch (error) {
      console.error('Error in createReminder:', error);
      return null;
    }
  }

  /**
   * Get reminders for a user
   */
  static async getUserReminders(userId: string): Promise<DeadlineReminder[]> {
    try {
      const { data, error } = await supabase
        .from('deadline_reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('deadline_date', { ascending: true });

      if (error) {
        console.error('Error fetching user reminders:', error);
        return [];
      }

      return data as DeadlineReminder[];
    } catch (error) {
      console.error('Error in getUserReminders:', error);
      return [];
    }
  }

  /**
   * Get upcoming reminders (within next 7 days)
   */
  static async getUpcomingReminders(): Promise<DeadlineReminder[]> {
    try {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('deadline_reminders')
        .select('*')
        .eq('is_active', true)
        .gte('deadline_date', now.toISOString())
        .lte('deadline_date', nextWeek.toISOString())
        .order('deadline_date', { ascending: true });

      if (error) {
        console.error('Error fetching upcoming reminders:', error);
        return [];
      }

      return data as DeadlineReminder[];
    } catch (error) {
      console.error('Error in getUpcomingReminders:', error);
      return [];
    }
  }

  /**
   * Get reminders that need to be sent now
   */
  static async getRemindersToSend(): Promise<DeadlineReminder[]> {
    try {
      const reminders = await this.getUpcomingReminders();
      const now = new Date();

      // Filter reminders where a reminder date has been reached but not sent
      return reminders.filter(reminder => {
        const reminderDates = reminder.reminder_dates.map(d => new Date(d));
        const sentDates = reminder.reminders_sent ? Object.keys(reminder.reminders_sent) : [];

        return reminderDates.some(date => {
          const timeDiff = date.getTime() - now.getTime();
          // If within 30 minutes of reminder time and not sent
          return timeDiff <= 30 * 60 * 1000 && timeDiff >= -30 * 60 * 1000 && !sentDates.includes(date.toISOString());
        });
      });
    } catch (error) {
      console.error('Error in getRemindersToSend:', error);
      return [];
    }
  }

  /**
   * Send a reminder notification
   */
  static async sendReminder(reminderId: string): Promise<boolean> {
    try {
      const { data: reminder } = await supabase
        .from('deadline_reminders')
        .select('*')
        .eq('id', reminderId)
        .single();

      if (!reminder) return false;

      const deadlineDate = new Date(reminder.deadline_date);
      const now = new Date();
      const hoursRemaining = Math.round((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60));

      // Send notification
      const typeLabel = this.getReminderTypeLabel(reminder.reminder_type);
      const message = `${typeLabel} deadline in ${hoursRemaining} hours`;

      await FreelanceNotificationService.createNotification(
        reminder.user_id,
        'deadline_reminder',
        message,
        `Your ${reminder.reminder_type.replace(/_/g, ' ')} is due on ${deadlineDate.toLocaleDateString()} at ${deadlineDate.toLocaleTimeString()}`,
        reminder.project_id,
        undefined,
        reminder.contract_id,
        undefined,
        'System',
        undefined,
        `/app/freelance/freelancer-dashboard?project=${reminder.project_id}`,
        {
          hours_remaining: hoursRemaining,
          deadline_date: deadlineDate.toISOString(),
        }
      );

      // Mark reminder as sent
      const sentDates = reminder.reminders_sent || {};
      const now_iso = now.toISOString();
      sentDates[now_iso] = true;

      await supabase
        .from('deadline_reminders')
        .update({
          reminders_sent: sentDates,
        })
        .eq('id', reminderId);

      return true;
    } catch (error) {
      console.error('Error in sendReminder:', error);
      return false;
    }
  }

  /**
   * Mark reminder as completed
   */
  static async completeReminder(reminderId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('deadline_reminders')
        .update({
          is_active: false,
          completed_at: new Date().toISOString(),
        })
        .eq('id', reminderId);

      if (error) {
        console.error('Error marking reminder as complete:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in completeReminder:', error);
      return false;
    }
  }

  /**
   * Snooze a reminder (postpone notification)
   */
  static async snoozeReminder(reminderId: string, hoursToSnooze: number = 24): Promise<boolean> {
    try {
      const { data: reminder } = await supabase
        .from('deadline_reminders')
        .select('*')
        .eq('id', reminderId)
        .single();

      if (!reminder) return false;

      // Recalculate reminder dates starting from now
      const now = new Date();
      const newDeadlineDate = new Date(reminder.deadline_date);
      const newReminderDates = this.calculateReminderDates(newDeadlineDate);

      const { error } = await supabase
        .from('deadline_reminders')
        .update({
          reminder_dates: newReminderDates.map(d => d.toISOString()),
          reminders_sent: {}, // Reset sent dates
        })
        .eq('id', reminderId);

      if (error) {
        console.error('Error snoozing reminder:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in snoozeReminder:', error);
      return false;
    }
  }

  /**
   * Update user notification preferences
   */
  static async updateNotificationPreferences(
    reminderId: string,
    preferences: {
      email?: boolean;
      in_app?: boolean;
      sms?: boolean;
    }
  ): Promise<boolean> {
    try {
      const { data: reminder } = await supabase
        .from('deadline_reminders')
        .select('notification_preferences')
        .eq('id', reminderId)
        .single();

      if (!reminder) return false;

      const updatedPreferences = {
        ...reminder.notification_preferences,
        ...preferences,
      };

      const { error } = await supabase
        .from('deadline_reminders')
        .update({
          notification_preferences: updatedPreferences,
        })
        .eq('id', reminderId);

      if (error) {
        console.error('Error updating preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateNotificationPreferences:', error);
      return false;
    }
  }

  /**
   * Process all pending reminders (should be run periodically by a cron job)
   */
  static async processPendingReminders(): Promise<number> {
    try {
      const remindersToSend = await this.getRemindersToSend();

      let sentCount = 0;
      for (const reminder of remindersToSend) {
        const success = await this.sendReminder(reminder.id);
        if (success) sentCount++;
      }

      return sentCount;
    } catch (error) {
      console.error('Error in processPendingReminders:', error);
      return 0;
    }
  }

  /**
   * Get deadline reminder statistics
   */
  static async getReminderStats(): Promise<{
    total_active_reminders: number;
    overdue_deadlines: number;
    reminders_sent_today: number;
    upcoming_reminders: number;
  } | null> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Total active reminders
      const { count: active } = await supabase
        .from('deadline_reminders')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Overdue deadlines
      const { count: overdue } = await supabase
        .from('deadline_reminders')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .lt('deadline_date', now.toISOString());

      // Reminders sent today
      const { count: sentToday } = await supabase
        .from('deadline_reminders')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', today.toISOString());

      // Upcoming (within 7 days)
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const { count: upcoming } = await supabase
        .from('deadline_reminders')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('deadline_date', now.toISOString())
        .lte('deadline_date', nextWeek.toISOString());

      return {
        total_active_reminders: active || 0,
        overdue_deadlines: overdue || 0,
        reminders_sent_today: sentToday || 0,
        upcoming_reminders: upcoming || 0,
      };
    } catch (error) {
      console.error('Error in getReminderStats:', error);
      return null;
    }
  }

  /**
   * Helper methods
   */

  private static calculateReminderDates(deadlineDate: Date): Date[] {
    const dates: Date[] = [];

    // 3 days before
    const threeDaysBefore = new Date(deadlineDate);
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
    dates.push(threeDaysBefore);

    // 1 day before
    const oneDayBefore = new Date(deadlineDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    dates.push(oneDayBefore);

    // 2 hours before
    const twoHoursBefore = new Date(deadlineDate);
    twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);
    dates.push(twoHoursBefore);

    return dates;
  }

  private static getReminderTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      milestone_deadline: 'Milestone',
      project_deadline: 'Project',
      payment_deadline: 'Payment',
    };
    return labels[type] || type;
  }
}

export default DeadlineReminderService;
