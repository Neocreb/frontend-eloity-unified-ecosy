import { supabase } from "@/integrations/supabase/client";
import { walletService } from "./walletService";

/**
 * FreelanceWithdrawalIntegrationService
 * 
 * Manages freelance earnings withdrawals using the unified wallet system.
 * All freelance withdrawals are created in the shared 'withdrawals' table.
 * This ensures a single source of truth for all platform payouts.
 */
export class FreelanceWithdrawalIntegrationService {
  /**
   * Request withdrawal from freelance earnings
   * Uses unified wallet withdrawal system
   * 
   * @param freelancerId - The freelancer's user ID
   * @param amount - Amount to withdraw
   * @param withdrawalMethod - Method of withdrawal ('bank_transfer' | 'paypal' | 'crypto' | 'mobile_money')
   * @param withdrawalDetails - Details specific to the withdrawal method
   * @returns Withdrawal ID or null if failed
   */
  static async requestWithdrawal(
    freelancerId: string,
    amount: number,
    withdrawalMethod: "bank_transfer" | "paypal" | "crypto" | "mobile_money",
    withdrawalDetails: {
      bankName?: string;
      accountNumber?: string;
      routingNumber?: string;
      paypalEmail?: string;
      cryptoAddress?: string;
      cryptoNetwork?: string;
      mobileMoneyNumber?: string;
      mobileMoneyCountry?: string;
    }
  ): Promise<string | null> {
    try {
      // Validate balance first
      const eligibility = await this.checkWithdrawalEligibility(
        freelancerId
      );

      if (!eligibility.isEligible) {
        throw new Error(eligibility.reason || "Not eligible for withdrawal");
      }

      if (amount < eligibility.minimumWithdrawal) {
        throw new Error(
          `Minimum withdrawal is $${eligibility.minimumWithdrawal}`
        );
      }

      if (amount > eligibility.balance) {
        throw new Error("Insufficient freelance balance");
      }

      // Create withdrawal request in unified system
      const { data, error } = await supabase
        .from("withdrawals")
        .insert([
          {
            user_id: freelancerId,
            amount: amount,
            withdrawal_method: withdrawalMethod,
            withdrawal_details: withdrawalDetails,
            status: "pending",
            withdrawal_type: "freelance_earnings",
            metadata: {
              source: "freelance_platform",
              method: withdrawalMethod,
              processed_at: new Date().toISOString(),
            },
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Record in wallet transaction history
      await this.recordWithdrawalTransaction(
        freelancerId,
        amount,
        "freelance",
        data.id
      );

      return data.id;
    } catch (error) {
      console.error("Error requesting withdrawal:", error);
      return null;
    }
  }

  /**
   * Record withdrawal in wallet transaction history
   * 
   * @param userId - The user's ID
   * @param amount - Withdrawal amount
   * @param balanceType - Type of balance ('freelance', 'ecommerce', 'crypto', 'rewards')
   * @param withdrawalId - The withdrawal request ID
   */
  private static async recordWithdrawalTransaction(
    userId: string,
    amount: number,
    balanceType: string,
    withdrawalId: string
  ): Promise<void> {
    try {
      await supabase.from("wallet_transactions").insert([
        {
          user_id: userId,
          transaction_type: "withdrawal",
          amount: amount,
          balance_type: balanceType,
          withdrawal_id: withdrawalId,
          description: `Withdrawal request from ${balanceType} balance`,
          status: "pending",
          created_at: new Date().toISOString(),
          metadata: {
            withdrawalId,
            type: "freelance_withdrawal",
          },
        },
      ]);
    } catch (error) {
      console.error("Error recording withdrawal transaction:", error);
    }
  }

  /**
   * Get freelancer's pending and completed withdrawals
   * 
   * @param freelancerId - The freelancer's user ID
   * @returns Array of withdrawal records
   */
  static async getFreelancerWithdrawals(freelancerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", freelancerId)
        .eq("withdrawal_type", "freelance_earnings")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      return [];
    }
  }

  /**
   * Get a specific withdrawal by ID
   * 
   * @param withdrawalId - The withdrawal ID
   * @returns Withdrawal object or null
   */
  static async getWithdrawal(withdrawalId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("id", withdrawalId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error("Error fetching withdrawal:", error);
      return null;
    }
  }

  /**
   * Cancel a pending withdrawal
   * 
   * @param withdrawalId - The withdrawal ID
   * @returns true if successful
   */
  static async cancelWithdrawal(withdrawalId: string): Promise<boolean> {
    try {
      const withdrawal = await this.getWithdrawal(withdrawalId);

      if (!withdrawal) {
        throw new Error("Withdrawal not found");
      }

      if (withdrawal.status !== "pending") {
        throw new Error("Only pending withdrawals can be cancelled");
      }

      // Update withdrawal status
      const { error } = await supabase
        .from("withdrawals")
        .update({ status: "cancelled" })
        .eq("id", withdrawalId);

      if (error) {
        throw error;
      }

      // Update transaction status
      await supabase
        .from("wallet_transactions")
        .update({ status: "cancelled" })
        .eq("withdrawal_id", withdrawalId);

      return true;
    } catch (error) {
      console.error("Error cancelling withdrawal:", error);
      return false;
    }
  }

  /**
   * Check freelancer withdrawal eligibility
   * 
   * @param freelancerId - The freelancer's user ID
   * @returns Eligibility object with balance, minimum withdrawal, and reason if not eligible
   */
  static async checkWithdrawalEligibility(
    freelancerId: string
  ): Promise<{
    isEligible: boolean;
    balance: number;
    minimumWithdrawal: number;
    maximumWithdrawal: number;
    reason?: string;
  }> {
    try {
      const balance = await walletService.getWalletBalance();
      const freelanceBalance = balance.freelance || 0;
      const minimumWithdrawal = 10; // Minimum $10 withdrawal
      const maximumWithdrawal = 100000; // Maximum $100,000 per withdrawal

      const isEligible =
        freelanceBalance >= minimumWithdrawal && freelanceBalance > 0;

      return {
        isEligible,
        balance: freelanceBalance,
        minimumWithdrawal,
        maximumWithdrawal,
        reason:
          freelanceBalance < minimumWithdrawal
            ? `Minimum withdrawal is $${minimumWithdrawal}`
            : undefined,
      };
    } catch (error) {
      console.error("Error checking withdrawal eligibility:", error);
      return {
        isEligible: false,
        balance: 0,
        minimumWithdrawal: 10,
        maximumWithdrawal: 100000,
        reason: "Error checking eligibility",
      };
    }
  }

  /**
   * Get withdrawal statistics for a freelancer
   * 
   * @param freelancerId - The freelancer's user ID
   * @returns Statistics object
   */
  static async getWithdrawalStats(
    freelancerId: string
  ): Promise<{
    totalWithdrawn: number;
    pendingAmount: number;
    completedAmount: number;
    withdrawalCount: number;
    averageWithdrawal: number;
  }> {
    try {
      const withdrawals = await this.getFreelancerWithdrawals(freelancerId);

      const totalWithdrawn = withdrawals.reduce(
        (sum, w) => sum + (w.amount || 0),
        0
      );

      const pending = withdrawals
        .filter((w) => w.status === "pending")
        .reduce((sum, w) => sum + (w.amount || 0), 0);

      const completed = withdrawals
        .filter((w) => w.status === "completed")
        .reduce((sum, w) => sum + (w.amount || 0), 0);

      return {
        totalWithdrawn,
        pendingAmount: pending,
        completedAmount: completed,
        withdrawalCount: withdrawals.length,
        averageWithdrawal:
          withdrawals.length > 0 ? totalWithdrawn / withdrawals.length : 0,
      };
    } catch (error) {
      console.error("Error fetching withdrawal stats:", error);
      return {
        totalWithdrawn: 0,
        pendingAmount: 0,
        completedAmount: 0,
        withdrawalCount: 0,
        averageWithdrawal: 0,
      };
    }
  }

  /**
   * Update withdrawal status (admin/backend operation)
   * 
   * @param withdrawalId - The withdrawal ID
   * @param status - New status ('pending' | 'completed' | 'failed' | 'cancelled')
   * @returns true if successful
   */
  static async updateWithdrawalStatus(
    withdrawalId: string,
    status: "pending" | "completed" | "failed" | "cancelled"
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("withdrawals")
        .update({
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId);

      if (error) {
        throw error;
      }

      // Update corresponding transaction status
      if (status === "completed") {
        await supabase
          .from("wallet_transactions")
          .update({ status: "completed" })
          .eq("withdrawal_id", withdrawalId);
      }

      return true;
    } catch (error) {
      console.error("Error updating withdrawal status:", error);
      return false;
    }
  }
}

export const freelanceWithdrawalIntegrationService =
  new FreelanceWithdrawalIntegrationService();
