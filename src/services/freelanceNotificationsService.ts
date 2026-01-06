// @ts-nocheck
/**
 * Real-time Freelance Notifications Service
 * Handles notifications for:
 * - Proposal notifications (new proposals, status changes)
 * - Project updates (milestone completions, payments)
 * - Message notifications (new messages from client/freelancer)
 * - Review and rating notifications
 * - Payment notifications
 */

import { supabase } from "@/integrations/supabase/client";

interface NotificationPayload {
  userId: string;
  type:
    | "proposal_received"
    | "proposal_accepted"
    | "proposal_rejected"
    | "milestone_completed"
    | "milestone_approved"
    | "payment_released"
    | "new_message"
    | "review_submitted"
    | "project_completed"
    | "project_cancelled"
    | "dispute_filed"
    | "withdrawal_approved"
    | "withdrawal_failed";
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

export class FreelanceNotificationsService {
  /**
   * Subscribe to real-time notifications for a user
   */
  static subscribeToNotifications(
    userId: string,
    callback: (notification: NotificationPayload) => void,
    onError?: (error: Error) => void
  ) {
    try {
      // Subscribe to freelance notifications table
      const subscription = supabase
        .channel(`freelance-notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "freelance_notifications",
            filter: `recipient_id=eq.${userId}`,
          },
          (payload: any) => {
            callback({
              userId,
              type: payload.new.notification_type,
              title: payload.new.title,
              message: payload.new.message,
              link: payload.new.link,
              metadata: payload.new.metadata,
            });
          }
        )
        .subscribe(
          (status: string) => {
            console.log("Notification subscription status:", status);
          },
          (error: any) => {
            console.error("Notification subscription error:", error);
            if (onError) onError(error);
          }
        );

      return subscription;
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
      throw error;
    }
  }

  /**
   * Send notification when proposal is received
   */
  static async notifyProposalReceived(
    clientId: string,
    freelancerId: string,
    jobTitle: string,
    jobId: string,
    proposalId: string
  ): Promise<void> {
    try {
      const { data: freelancer } = await supabase
        .from("freelancer_profiles")
        .select("title, avatar_url")
        .eq("user_id", freelancerId)
        .single();

      await this.createNotification({
        userId: clientId,
        type: "proposal_received",
        title: `New Proposal on "${jobTitle}"`,
        message: `${freelancer?.title || "A freelancer"} submitted a proposal for your job.`,
        link: `/freelance/proposals/${proposalId}`,
        metadata: {
          jobId,
          proposalId,
          freelancerId,
          freelancerAvatar: freelancer?.avatar_url,
        },
      });
    } catch (error) {
      console.error("Error notifying proposal received:", error);
    }
  }

  /**
   * Send notification when proposal is accepted
   */
  static async notifyProposalAccepted(
    freelancerId: string,
    jobTitle: string,
    projectId: string
  ): Promise<void> {
    try {
      await this.createNotification({
        userId: freelancerId,
        type: "proposal_accepted",
        title: `Proposal Accepted for "${jobTitle}"`,
        message: "Your proposal has been accepted. The project has started!",
        link: `/freelance/projects/${projectId}`,
        metadata: {
          projectId,
          jobTitle,
        },
      });
    } catch (error) {
      console.error("Error notifying proposal accepted:", error);
    }
  }

  /**
   * Send notification when proposal is rejected
   */
  static async notifyProposalRejected(
    freelancerId: string,
    jobTitle: string,
    proposalId: string
  ): Promise<void> {
    try {
      await this.createNotification({
        userId: freelancerId,
        type: "proposal_rejected",
        title: `Proposal Not Selected for "${jobTitle}"`,
        message: "Unfortunately, your proposal was not selected for this project.",
        link: `/freelance/proposals/${proposalId}`,
        metadata: {
          proposalId,
          jobTitle,
        },
      });
    } catch (error) {
      console.error("Error notifying proposal rejected:", error);
    }
  }

  /**
   * Send notification when milestone is completed
   */
  static async notifyMilestoneCompleted(
    clientId: string,
    freelancerId: string,
    projectTitle: string,
    milestoneTitle: string,
    projectId: string,
    milestoneId: string,
    amount: number
  ): Promise<void> {
    try {
      // Notify client
      await this.createNotification({
        userId: clientId,
        type: "milestone_completed",
        title: `Milestone Completed: "${milestoneTitle}"`,
        message: `The freelancer has completed "${milestoneTitle}" in your project. Review and approve to release payment of $${amount}.`,
        link: `/freelance/projects/${projectId}/milestones/${milestoneId}`,
        metadata: {
          projectId,
          milestoneId,
          amount,
          action: "review_milestone",
        },
      });

      // Notify freelancer
      await this.createNotification({
        userId: freelancerId,
        type: "milestone_completed",
        title: `Milestone Submitted: "${milestoneTitle}"`,
        message: "Your milestone has been submitted for review. Awaiting client approval.",
        link: `/freelance/projects/${projectId}`,
        metadata: {
          projectId,
          milestoneId,
        },
      });
    } catch (error) {
      console.error("Error notifying milestone completed:", error);
    }
  }

  /**
   * Send notification when milestone is approved and payment released
   */
  static async notifyMilestoneApproved(
    freelancerId: string,
    projectTitle: string,
    milestoneTitle: string,
    projectId: string,
    amount: number
  ): Promise<void> {
    try {
      await this.createNotification({
        userId: freelancerId,
        type: "milestone_approved",
        title: `Milestone Approved: "${milestoneTitle}"`,
        message: `Your milestone has been approved! Payment of $${amount} has been released to your wallet.`,
        link: `/freelance/earnings`,
        metadata: {
          projectId,
          amount,
          action: "view_earnings",
        },
      });
    } catch (error) {
      console.error("Error notifying milestone approved:", error);
    }
  }

  /**
   * Send notification when payment is released
   */
  static async notifyPaymentReleased(
    freelancerId: string,
    amount: number,
    projectTitle: string,
    projectId: string
  ): Promise<void> {
    try {
      await this.createNotification({
        userId: freelancerId,
        type: "payment_released",
        title: `Payment Received: $${amount}`,
        message: `You received a payment of $${amount} for "${projectTitle}". Check your wallet for details.`,
        link: `/wallet`,
        metadata: {
          projectId,
          amount,
          action: "view_wallet",
        },
      });
    } catch (error) {
      console.error("Error notifying payment released:", error);
    }
  }

  /**
   * Send notification for new messages
   */
  static async notifyNewMessage(
    recipientId: string,
    senderId: string,
    senderName: string,
    projectId: string,
    message: string
  ): Promise<void> {
    try {
      const truncatedMessage = message.substring(0, 100) + (message.length > 100 ? "..." : "");

      await this.createNotification({
        userId: recipientId,
        type: "new_message",
        title: `Message from ${senderName}`,
        message: truncatedMessage,
        link: `/freelance/projects/${projectId}/messages`,
        metadata: {
          projectId,
          senderId,
          messagePreview: truncatedMessage,
        },
      });
    } catch (error) {
      console.error("Error notifying new message:", error);
    }
  }

  /**
   * Send notification when review is submitted
   */
  static async notifyReviewSubmitted(
    receiverId: string,
    reviewerId: string,
    rating: number,
    projectTitle: string,
    projectId: string
  ): Promise<void> {
    try {
      const { data: reviewer } = await supabase
        .from("freelancer_profiles")
        .select("title")
        .eq("user_id", reviewerId)
        .single();

      const starEmoji = "⭐".repeat(Math.floor(rating));

      await this.createNotification({
        userId: receiverId,
        type: "review_submitted",
        title: `${starEmoji} Review on "${projectTitle}"`,
        message: `${reviewer?.title || "A user"} left you a ${Math.floor(rating)}-star review.`,
        link: `/freelance/reviews/${projectId}`,
        metadata: {
          projectId,
          rating,
          reviewerId,
        },
      });
    } catch (error) {
      console.error("Error notifying review submitted:", error);
    }
  }

  /**
   * Send notification when project is completed
   */
  static async notifyProjectCompleted(
    userId: string,
    projectTitle: string,
    projectId: string,
    isFreelancer: boolean
  ): Promise<void> {
    try {
      const roleText = isFreelancer ? "You have successfully completed" : "Your project has been completed by";

      await this.createNotification({
        userId,
        type: "project_completed",
        title: `Project Completed: "${projectTitle}"`,
        message: `${roleText} "${projectTitle}". Thank you for your work!`,
        link: `/freelance/projects/${projectId}`,
        metadata: {
          projectId,
          isFreelancer,
        },
      });
    } catch (error) {
      console.error("Error notifying project completed:", error);
    }
  }

  /**
   * Send notification when dispute is filed
   */
  static async notifyDisputeFiled(
    affectedUserId: string,
    otherPartyName: string,
    projectTitle: string,
    disputeId: string,
    projectId: string
  ): Promise<void> {
    try {
      await this.createNotification({
        userId: affectedUserId,
        type: "dispute_filed",
        title: `Dispute Filed on "${projectTitle}"`,
        message: `A dispute has been filed by ${otherPartyName} regarding "${projectTitle}".`,
        link: `/freelance/disputes/${disputeId}`,
        metadata: {
          projectId,
          disputeId,
          action: "review_dispute",
        },
      });
    } catch (error) {
      console.error("Error notifying dispute filed:", error);
    }
  }

  /**
   * Send notification when withdrawal is approved
   */
  static async notifyWithdrawalApproved(
    freelancerId: string,
    amount: number,
    method: string
  ): Promise<void> {
    try {
      await this.createNotification({
        userId: freelancerId,
        type: "withdrawal_approved",
        title: `Withdrawal Approved: $${amount}`,
        message: `Your withdrawal of $${amount} via ${method} has been approved and is being processed.`,
        link: `/freelance/earnings/withdrawals`,
        metadata: {
          amount,
          method,
          action: "view_withdrawals",
        },
      });
    } catch (error) {
      console.error("Error notifying withdrawal approved:", error);
    }
  }

  /**
   * Send notification when withdrawal fails
   */
  static async notifyWithdrawalFailed(
    freelancerId: string,
    amount: number,
    reason: string
  ): Promise<void> {
    try {
      await this.createNotification({
        userId: freelancerId,
        type: "withdrawal_failed",
        title: `Withdrawal Failed: $${amount}`,
        message: `Your withdrawal of $${amount} failed: ${reason}. Please try again.`,
        link: `/freelance/earnings/withdrawals`,
        metadata: {
          amount,
          reason,
          action: "retry_withdrawal",
        },
      });
    } catch (error) {
      console.error("Error notifying withdrawal failed:", error);
    }
  }

  /**
   * Create a notification in the database
   */
  private static async createNotification(payload: NotificationPayload): Promise<void> {
    try {
      await supabase.from("freelance_notifications").insert([
        {
          recipient_id: payload.userId,
          notification_type: payload.type,
          title: payload.title,
          message: payload.message,
          link: payload.link,
          metadata: payload.metadata,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }

  /**
   * Get unread notifications for a user
   */
  static async getUnreadNotifications(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("freelance_notifications")
        .select("*")
        .eq("recipient_id", userId)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await supabase
        .from("freelance_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await supabase
        .from("freelance_notifications")
        .update({ is_read: true })
        .eq("recipient_id", userId)
        .eq("is_read", false);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      await supabase.from("freelance_notifications").delete().eq("id", notificationId);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }
}
