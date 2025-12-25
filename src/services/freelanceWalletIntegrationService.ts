// @ts-nocheck
/**
 * Freelance Wallet Integration Service
 * Handles wallet operations for freelance platform:
 * - Payment processing and wallet updates
 * - Earnings tracking and balance updates
 * - Withdrawal management
 * - Escrow and milestone releases
 * 
 * Integration Points:
 * - WalletService: Main wallet balance calculations
 * - FreelancePaymentService: Payment creation and status
 * - FreelanceWithdrawalService: Withdrawal operations
 */

import { supabase } from "@/integrations/supabase/client";
import { apiCall } from "@/lib/api";
import { FreelancePaymentService } from "./freelancePaymentService";
import { FreelanceWithdrawalService } from "./freelanceWithdrawalService";

interface WalletTransaction {
  userId: string;
  amount: number;
  currency: string;
  type: "freelance_payment" | "freelance_earning" | "freelance_withdrawal" | "freelance_refund";
  description: string;
  sourceId?: string; // payment/project/milestone ID
  metadata?: Record<string, any>;
}

interface WalletBalanceUpdate {
  freelancerId: string;
  newBalance: number;
  transactionId: string;
  description: string;
}

export class FreelanceWalletIntegrationService {
  /**
   * Release payment when milestone is completed
   * Updates wallet and creates transaction record
   */
  static async releaseMilestonePayment(
    projectId: string,
    milestoneId: string,
    freelancerId: string,
    clientId: string,
    amount: number,
    description: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Create payment record in database
      const { data: payment, error: paymentError } = await supabase
        .from("freelance_payments")
        .insert([
          {
            project_id: projectId,
            payer_id: clientId,
            payee_id: freelancerId,
            amount,
            currency: "USD",
            status: "pending",
            description: `Milestone payment: ${description}`,
            type: "milestone",
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Log the transaction for wallet visibility
      await this.logWalletTransaction({
        userId: freelancerId,
        amount,
        currency: "USD",
        type: "freelance_earning",
        description: `Milestone completed: ${description}`,
        sourceId: milestoneId,
        metadata: {
          projectId,
          paymentId: payment.id,
          type: "milestone_completion",
        },
      });

      // Update milestone status
      await supabase
        .from("freelance_milestones")
        .update({
          status: "payment_released",
          payment_released_at: new Date().toISOString(),
          payment_id: payment.id,
        })
        .eq("id", milestoneId);

      return {
        success: true,
        transactionId: payment.id,
      };
    } catch (error) {
      console.error("Error releasing milestone payment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Record freelancer earnings from project completion
   */
  static async recordFreelancerEarnings(
    freelancerId: string,
    projectId: string,
    amount: number,
    description: string
  ): Promise<{ success: boolean; earningsId?: string }> {
    try {
      // Create earnings record
      const { data: earnings, error } = await supabase
        .from("freelance_earnings")
        .insert([
          {
            freelancer_id: freelancerId,
            project_id: projectId,
            amount,
            currency: "USD",
            type: "project_completion",
            description,
            status: "available",
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Log transaction
      await this.logWalletTransaction({
        userId: freelancerId,
        amount,
        currency: "USD",
        type: "freelance_earning",
        description: `Earnings: ${description}`,
        sourceId: projectId,
        metadata: {
          earningsId: earnings.id,
          type: "project_completion",
        },
      });

      return {
        success: true,
        earningsId: earnings.id,
      };
    } catch (error) {
      console.error("Error recording freelancer earnings:", error);
      return { success: false };
    }
  }

  /**
   * Process freelancer withdrawal
   * Deducts from freelance balance and creates withdrawal record
   */
  static async processWithdrawal(
    freelancerId: string,
    amount: number,
    withdrawalMethod: string
  ): Promise<{ success: boolean; withdrawalId?: string }> {
    try {
      // Verify sufficient balance
      const { data: balances } = await supabase
        .from("freelance_stats")
        .select("available_earnings")
        .eq("freelancer_id", freelancerId)
        .single();

      if (!balances || (balances.available_earnings || 0) < amount) {
        throw new Error("Insufficient balance for withdrawal");
      }

      // Create withdrawal record
      const { data: withdrawal, error } = await supabase
        .from("freelance_withdrawals")
        .insert([
          {
            freelancer_id: freelancerId,
            amount,
            method: withdrawalMethod,
            currency: "USD",
            status: "pending",
            description: `Withdrawal via ${withdrawalMethod}`,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Log transaction
      await this.logWalletTransaction({
        userId: freelancerId,
        amount: -amount, // Negative for debit
        currency: "USD",
        type: "freelance_withdrawal",
        description: `Withdrawal via ${withdrawalMethod}`,
        sourceId: withdrawal.id,
        metadata: {
          withdrawalId: withdrawal.id,
          method: withdrawalMethod,
        },
      });

      // Update available balance
      await supabase
        .from("freelance_stats")
        .update({
          available_earnings: (balances.available_earnings || 0) - amount,
          total_withdrawn: (balances.total_withdrawn || 0) + amount,
        })
        .eq("freelancer_id", freelancerId);

      return {
        success: true,
        withdrawalId: withdrawal.id,
      };
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      return { success: false };
    }
  }

  /**
   * Refund payment when project is cancelled or disputed
   * Returns funds to client wallet
   */
  static async refundPaymentToClient(
    paymentId: string,
    reason: string
  ): Promise<{ success: boolean }> {
    try {
      // Get payment details
      const { data: payment, error: fetchError } = await supabase
        .from("freelance_payments")
        .select("*")
        .eq("id", paymentId)
        .single();

      if (fetchError) throw fetchError;

      // Update payment status
      const { error: updateError } = await supabase
        .from("freelance_payments")
        .update({
          status: "refunded",
          refund_reason: reason,
          refunded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (updateError) throw updateError;

      // Log refund transaction
      await this.logWalletTransaction({
        userId: payment.payer_id,
        amount: payment.amount,
        currency: "USD",
        type: "freelance_refund",
        description: `Refund: ${reason}`,
        sourceId: paymentId,
        metadata: {
          originalPaymentId: paymentId,
          reason,
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Error refunding payment:", error);
      return { success: false };
    }
  }

  /**
   * Get freelancer wallet balance specifically for freelance earnings
   */
  static async getFreelanceWalletBalance(
    freelancerId: string
  ): Promise<{
    total: number;
    available: number;
    pending: number;
    withdrawn: number;
  }> {
    try {
      // Get stats
      const { data: stats, error } = await supabase
        .from("freelance_stats")
        .select("*")
        .eq("freelancer_id", freelancerId)
        .single();

      if (error) throw error;

      return {
        total: stats?.total_earned || 0,
        available: stats?.available_earnings || 0,
        pending: stats?.pending_earnings || 0,
        withdrawn: stats?.total_withdrawn || 0,
      };
    } catch (error) {
      console.error("Error fetching freelance wallet balance:", error);
      return { total: 0, available: 0, pending: 0, withdrawn: 0 };
    }
  }

  /**
   * Log wallet transaction for audit trail
   * This helps track all wallet-related activities
   */
  static async logWalletTransaction(transaction: WalletTransaction): Promise<void> {
    try {
      await supabase.from("freelance_activity_logs").insert([
        {
          freelancer_id: transaction.userId,
          activity_type: transaction.type,
          activity_description: transaction.description,
          metadata: {
            ...transaction.metadata,
            amount: transaction.amount,
            currency: transaction.currency,
          },
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error logging wallet transaction:", error);
      // Don't throw - logging failure shouldn't block main operations
    }
  }

  /**
   * Get payment history for a freelancer
   * Useful for wallet transaction display
   */
  static async getPaymentHistory(
    freelancerId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("freelance_payments")
        .select("*")
        .eq("payee_id", freelancerId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error fetching payment history:", error);
      return [];
    }
  }

  /**
   * Calculate earnings for a specific project
   */
  static async calculateProjectEarnings(
    projectId: string
  ): Promise<{
    freelancerId: string;
    totalAmount: number;
    milestonePayments: number;
    bonus: number;
  }> {
    try {
      const { data: payments, error } = await supabase
        .from("freelance_payments")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "completed");

      if (error) throw error;

      const freelancerId = payments?.[0]?.payee_id;
      const totalAmount = (payments || []).reduce(
        (sum: number, p: any) => sum + (parseFloat(p.amount) || 0),
        0
      );

      return {
        freelancerId: freelancerId || "",
        totalAmount,
        milestonePayments: totalAmount,
        bonus: 0,
      };
    } catch (error) {
      console.error("Error calculating project earnings:", error);
      return {
        freelancerId: "",
        totalAmount: 0,
        milestonePayments: 0,
        bonus: 0,
      };
    }
  }

  /**
   * Sync freelance wallet with main wallet system
   * Called periodically to ensure balance consistency
   */
  static async syncFreelanceWallet(freelancerId: string): Promise<void> {
    try {
      // Get freelance earnings
      const { data: earnings } = await supabase
        .from("freelance_payments")
        .select("amount, status")
        .eq("payee_id", freelancerId);

      if (!earnings) return;

      // Calculate balance
      const completedEarnings = (earnings || [])
        .filter((p: any) => p.status === "completed")
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      // Update stats
      await supabase
        .from("freelance_stats")
        .update({
          total_earned: completedEarnings,
          updated_at: new Date().toISOString(),
        })
        .eq("freelancer_id", freelancerId);
    } catch (error) {
      console.error("Error syncing freelance wallet:", error);
    }
  }
}
