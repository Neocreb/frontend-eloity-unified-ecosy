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
    },
    currency?: string
  ): Promise<string | null> {
    try {
      // Validate balance first
      const eligibility = await this.checkWithdrawalEligibility(
        freelancerId
      );

      if (!eligibility.isEligible) {
        throw new Error(eligibility.reason || "No balance available for withdrawal");
      }

      if (amount <= 0) {
        throw new Error("Withdrawal amount must be greater than 0");
      }

      if (amount > eligibility.balance) {
        throw new Error("Insufficient freelance balance");
      }

      // Get user's currency if not provided
      const userCurrency = currency || (await this.getUserCurrency(freelancerId));

      // Create withdrawal request in unified system
      const { data, error } = await supabase
        .from("withdrawals")
        .insert([
          {
            user_id: freelancerId,
            amount: amount,
            currency: userCurrency,
            withdrawal_method: withdrawalMethod,
            withdrawal_details: withdrawalDetails,
            status: "pending",
            withdrawal_type: "freelance_earnings",
            metadata: {
              source: "freelance_platform",
              method: withdrawalMethod,
              currency: userCurrency,
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
        data.id,
        userCurrency
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
   * @param currency - The currency used
   */
  private static async recordWithdrawalTransaction(
    userId: string,
    amount: number,
    balanceType: string,
    withdrawalId: string,
    currency?: string
  ): Promise<void> {
    try {
      const userCurrency = currency || (await this.getUserCurrency(userId));

      await supabase.from("wallet_transactions").insert([
        {
          user_id: userId,
          transaction_type: "withdrawal",
          amount: amount,
          currency: userCurrency,
          balance_type: balanceType,
          withdrawal_id: withdrawalId,
          description: `Withdrawal request from ${balanceType} balance`,
          status: "pending",
          created_at: new Date().toISOString(),
          metadata: {
            withdrawalId,
            type: "freelance_withdrawal",
            currency: userCurrency,
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
   * Since withdrawals to unified wallet (internal transfer) have no minimum,
   * eligibility is simply having a positive balance.
   *
   * @param freelancerId - The freelancer's user ID
   * @returns Eligibility object with balance and reason if not eligible
   */
  static async checkWithdrawalEligibility(
    freelancerId: string
  ): Promise<{
    isEligible: boolean;
    balance: number;
    reason?: string;
  }> {
    try {
      const balance = await walletService.getWalletBalance();
      const freelanceBalance = balance.freelance || 0;

      // Eligible if balance > 0 (no minimum for internal wallet transfers)
      const isEligible = freelanceBalance > 0;

      return {
        isEligible,
        balance: freelanceBalance,
        reason:
          freelanceBalance <= 0
            ? "No balance available for withdrawal"
            : undefined,
      };
    } catch (error) {
      console.error("Error checking withdrawal eligibility:", error);
      return {
        isEligible: false,
        balance: 0,
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
   * Get user's preferred currency
   * Checks user settings first, then falls back to automatic detection
   *
   * @param userId - The user's ID
   * @returns Currency code (e.g., 'USD', 'EUR', 'GBP')
   */
  private static async getUserCurrency(userId: string): Promise<string> {
    try {
      // Try to get from user profile/settings first
      const { data, error } = await supabase
        .from("user_settings")
        .select("preferred_currency")
        .eq("user_id", userId)
        .single();

      if (!error && data?.preferred_currency) {
        return data.preferred_currency;
      }

      // Fall back to automatic detection based on timezone/location
      return this.detectCurrencyByLocation();
    } catch (error) {
      console.warn("Error getting user currency, using default:", error);
      return "USD"; // Default fallback
    }
  }

  /**
   * Detect currency based on user's timezone/location
   * Uses browser timezone to infer currency
   */
  private static detectCurrencyByLocation(): string {
    try {
      if (typeof window === "undefined") return "USD";

      // First, check localStorage for saved preference
      const savedCurrency = localStorage.getItem("preferred_currency");
      if (savedCurrency) return savedCurrency;

      // Detect based on timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Simple mapping based on timezone
      const currencyMap: Record<string, string> = {
        "Europe/": "EUR",
        "Europe/London": "GBP",
        "Europe/Paris": "EUR",
        "Europe/Berlin": "EUR",
        "Africa/Lagos": "NGN",
        "Africa/Accra": "GHS",
        "Africa/Johannesburg": "ZAR",
        "Africa/Nairobi": "KES",
        "Africa/Kampala": "UGX",
        "Africa/Cairo": "EGP",
        "Asia/Tokyo": "JPY",
        "Asia/Shanghai": "CNY",
        "Asia/Hong_Kong": "HKD",
        "Asia/Singapore": "SGD",
        "Asia/Dubai": "AED",
        "America/New_York": "USD",
        "America/Toronto": "CAD",
        "America/Mexico_City": "MXN",
        "America/Sao_Paulo": "BRL",
        "Australia/Sydney": "AUD",
      };

      for (const [tzPattern, currency] of Object.entries(currencyMap)) {
        if (timezone.includes(tzPattern)) {
          return currency;
        }
      }

      // Default to USD if no match
      return "USD";
    } catch (error) {
      console.warn("Error detecting currency by location:", error);
      return "USD";
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
