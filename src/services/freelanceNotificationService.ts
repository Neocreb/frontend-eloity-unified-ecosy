import { supabase } from '@/lib/supabase/client';

export interface FreelanceNotification {
  id: string;
  user_id: string;
  project_id?: string;
  proposal_id?: string;
  contract_id?: string;
  type: 'proposal_received' | 'proposal_accepted' | 'proposal_rejected' | 'milestone_created' | 'milestone_approved' | 'payment_released' | 'message_received' | 'review_posted' | 'dispute_filed' | 'withdrawal_completed' | 'deadline_reminder';
  title: string;
  description?: string;
  actor_id?: string;
  actor_name?: string;
  actor_avatar?: string;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

/**
 * FreelanceNotificationService
 * Manages notifications for freelance activities including:
 * - Proposal received/accepted/rejected
 * - Milestone created/approved
 * - Payments released/withdrawn
 * - Messages received
 * - Reviews posted
 * - Disputes filed
 * - Deadline reminders
 */

export class FreelanceNotificationService {
  /**
   * Create a notification for a freelance activity
   */
  static async createNotification(
    userId: string,
    type: FreelanceNotification['type'],
    title: string,
    description?: string,
    projectId?: string,
    proposalId?: string,
    contractId?: string,
    actorId?: string,
    actorName?: string,
    actorAvatar?: string,
    actionUrl?: string,
    metadata?: any
  ): Promise<FreelanceNotification | null> {
    try {
      const { data, error } = await supabase
        .from('freelance_notifications')
        .insert({
          user_id: userId,
          type,
          title,
          description,
          project_id: projectId,
          proposal_id: proposalId,
          contract_id: contractId,
          actor_id: actorId,
          actor_name: actorName,
          actor_avatar: actorAvatar,
          action_url: actionUrl,
          metadata,
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return null;
      }

      return data as FreelanceNotification;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return null;
    }
  }

  /**
   * Get notifications for a user
   */
  static async getNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Promise<FreelanceNotification[]> {
    try {
      let query = supabase
        .from('freelance_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data as FreelanceNotification[];
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return [];
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('freelance_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('freelance_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('freelance_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return false;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('freelance_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      return false;
    }
  }

  /**
   * Clear all notifications for a user
   */
  static async clearAllNotifications(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('freelance_notifications')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing notifications:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in clearAllNotifications:', error);
      return false;
    }
  }

  /**
   * Get notifications for a specific project
   */
  static async getProjectNotifications(
    projectId: string,
    limit: number = 20
  ): Promise<FreelanceNotification[]> {
    try {
      const { data, error } = await supabase
        .from('freelance_notifications')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching project notifications:', error);
        return [];
      }

      return data as FreelanceNotification[];
    } catch (error) {
      console.error('Error in getProjectNotifications:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  static subscribeToNotifications(
    userId: string,
    callback: (notification: FreelanceNotification) => void
  ): (() => void) | null {
    try {
      const subscription = supabase
        .from(`freelance_notifications:user_id=eq.${userId}`)
        .on('INSERT', (payload: any) => {
          callback(payload.new as FreelanceNotification);
        })
        .subscribe();

      return () => {
        supabase.removeSubscription(subscription);
      };
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      return null;
    }
  }

  /**
   * Notification helper methods for specific events
   */

  static async notifyProposalReceived(
    clientId: string,
    projectId: string,
    proposalId: string,
    freelancerId: string,
    freelancerName: string,
    freelancerAvatar?: string,
    jobTitle?: string
  ): Promise<FreelanceNotification | null> {
    return this.createNotification(
      clientId,
      'proposal_received',
      `New proposal from ${freelancerName}`,
      `${freelancerName} submitted a proposal for your job`,
      projectId,
      proposalId,
      undefined,
      freelancerId,
      freelancerName,
      freelancerAvatar,
      `/app/freelance/client-dashboard?proposal=${proposalId}`,
      { job_title: jobTitle }
    );
  }

  static async notifyProposalAccepted(
    freelancerId: string,
    projectId: string,
    proposalId: string,
    clientId: string,
    clientName: string,
    clientAvatar?: string,
    jobTitle?: string
  ): Promise<FreelanceNotification | null> {
    return this.createNotification(
      freelancerId,
      'proposal_accepted',
      `Proposal accepted by ${clientName}`,
      `Your proposal has been accepted! Project starting soon.`,
      projectId,
      proposalId,
      undefined,
      clientId,
      clientName,
      clientAvatar,
      `/app/freelance/freelancer-dashboard?project=${projectId}`,
      { job_title: jobTitle }
    );
  }

  static async notifyMilestoneApproved(
    freelancerId: string,
    projectId: string,
    contractId: string,
    clientId: string,
    clientName: string,
    clientAvatar?: string,
    milestoneAmount?: number
  ): Promise<FreelanceNotification | null> {
    return this.createNotification(
      freelancerId,
      'milestone_approved',
      `Milestone approved by ${clientName}`,
      `Your milestone has been approved. Payment will be released shortly.`,
      projectId,
      undefined,
      contractId,
      clientId,
      clientName,
      clientAvatar,
      `/app/freelance/freelancer-dashboard?project=${projectId}`,
      { milestone_amount: milestoneAmount }
    );
  }

  static async notifyPaymentReleased(
    freelancerId: string,
    projectId: string,
    contractId: string,
    amount: number,
    currency: string = 'USD'
  ): Promise<FreelanceNotification | null> {
    return this.createNotification(
      freelancerId,
      'payment_released',
      `Payment released - ${amount} ${currency}`,
      `Your milestone payment of ${amount} ${currency} has been released to your wallet.`,
      projectId,
      undefined,
      contractId,
      undefined,
      'System',
      undefined,
      `/app/wallet`,
      { amount, currency }
    );
  }

  static async notifyDeadlineReminder(
    userId: string,
    projectId: string,
    contractId: string,
    deadlineDate: string,
    hoursRemaining: number
  ): Promise<FreelanceNotification | null> {
    const timeLabel = hoursRemaining > 24 ? `${Math.floor(hoursRemaining / 24)} days` : `${hoursRemaining} hours`;
    return this.createNotification(
      userId,
      'deadline_reminder',
      `Project deadline: ${timeLabel} remaining`,
      `Your project deadline is coming up. Make sure to complete and submit your work on time.`,
      projectId,
      undefined,
      contractId,
      undefined,
      'System',
      undefined,
      `/app/freelance/freelancer-dashboard?project=${projectId}`,
      { deadline_date: deadlineDate, hours_remaining: hoursRemaining }
    );
  }

  static async notifyDisputeFiled(
    defendantId: string,
    projectId: string,
    contractId: string,
    claimantId: string,
    claimantName: string,
    claimantAvatar?: string,
    reason?: string
  ): Promise<FreelanceNotification | null> {
    return this.createNotification(
      defendantId,
      'dispute_filed',
      `Dispute filed by ${claimantName}`,
      `A dispute has been filed regarding your project. Please review the details and respond.`,
      projectId,
      undefined,
      contractId,
      claimantId,
      claimantName,
      claimantAvatar,
      `/app/freelance/disputes?contract=${contractId}`,
      { reason }
    );
  }
}

export default FreelanceNotificationService;
