// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export interface Withdrawal {
  id: string;
  freelancerId: string;
  amount: number;
  currency: string;
  method: "bank_transfer" | "paypal" | "crypto" | "mobile_money";
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    routingNumber?: string;
    swiftCode?: string;
  };
  paypalEmail?: string;
  cryptoAddress?: string;
  cryptoNetwork?: string;
  mobileNumber?: string;
  mobileProvider?: string;
  fee: number;
  netAmount: number;
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export class FreelanceWithdrawalService {
  // ============================================================================
  // WITHDRAWAL MANAGEMENT
  // ============================================================================

  static async requestWithdrawal(
    freelancerId: string,
    amount: number,
    method: Withdrawal["method"],
    bankDetails?: any
  ): Promise<Withdrawal | null> {
    try {
      // Check available balance
      const balance = await this.getAvailableBalance(freelancerId);
      if (balance < amount) {
        throw new Error("Insufficient balance");
      }

      // Calculate fees
      const { fee, netAmount } = this.calculateWithdrawalFee(amount, method);

      const { data, error } = await supabase
        .from("freelance_withdrawals")
        .insert([
          {
            freelancer_id: freelancerId,
            amount,
            currency: "USD",
            method,
            status: "pending",
            fee,
            net_amount: netAmount,
            bank_details: bankDetails || null,
            requested_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logWithdrawalActivity(freelancerId, "withdrawal_requested", data.id);

      return this.mapWithdrawalData(data);
    } catch (error) {
      console.error("Error requesting withdrawal:", error);
      return null;
    }
  }

  static async approveWithdrawal(
    withdrawalId: string
  ): Promise<Withdrawal | null> {
    try {
      const { error } = await supabase
        .from("freelance_withdrawals")
        .update({
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId);

      if (error) throw error;

      // Get withdrawal details
      const withdrawal = await this.getWithdrawal(withdrawalId);
      if (withdrawal) {
        await this.logWithdrawalActivity(
          withdrawal.freelancerId,
          "withdrawal_approved",
          withdrawalId
        );
      }

      return withdrawal;
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      return null;
    }
  }

  static async completeWithdrawal(
    withdrawalId: string
  ): Promise<Withdrawal | null> {
    try {
      const withdrawal = await this.getWithdrawal(withdrawalId);
      if (!withdrawal) throw new Error("Withdrawal not found");

      // Deduct from freelancer's wallet
      const response = await fetch(
        `/api/wallet/deduct?userId=${withdrawal.freelancerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: withdrawal.amount,
            type: "withdrawal_processing",
            description: `Withdrawal via ${withdrawal.method}`,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to deduct from wallet");
      }

      // Update withdrawal status
      const { error } = await supabase
        .from("freelance_withdrawals")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId);

      if (error) throw error;

      await this.logWithdrawalActivity(
        withdrawal.freelancerId,
        "withdrawal_completed",
        withdrawalId
      );

      return await this.getWithdrawal(withdrawalId);
    } catch (error) {
      console.error("Error completing withdrawal:", error);
      return null;
    }
  }

  static async cancelWithdrawal(
    withdrawalId: string,
    reason?: string
  ): Promise<Withdrawal | null> {
    try {
      const withdrawal = await this.getWithdrawal(withdrawalId);
      if (!withdrawal) throw new Error("Withdrawal not found");

      // Return amount to wallet if already processed
      if (withdrawal.status === "processing" || withdrawal.status === "completed") {
        await fetch(`/api/wallet/add?userId=${withdrawal.freelancerId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: withdrawal.netAmount,
            type: "withdrawal_refund",
            description: `Withdrawal cancellation refund`,
          }),
        });
      }

      // Update status
      const { error } = await supabase
        .from("freelance_withdrawals")
        .update({
          status: "cancelled",
          failure_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId);

      if (error) throw error;

      await this.logWithdrawalActivity(
        withdrawal.freelancerId,
        "withdrawal_cancelled",
        withdrawalId
      );

      return await this.getWithdrawal(withdrawalId);
    } catch (error) {
      console.error("Error cancelling withdrawal:", error);
      return null;
    }
  }

  static async failWithdrawal(
    withdrawalId: string,
    reason: string
  ): Promise<Withdrawal | null> {
    try {
      const withdrawal = await this.getWithdrawal(withdrawalId);
      if (!withdrawal) throw new Error("Withdrawal not found");

      // Refund amount to wallet
      await fetch(`/api/wallet/add?userId=${withdrawal.freelancerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawal.amount,
          type: "withdrawal_failed",
          description: `Withdrawal failed: ${reason}`,
        }),
      });

      // Update status
      const { error } = await supabase
        .from("freelance_withdrawals")
        .update({
          status: "failed",
          failure_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId);

      if (error) throw error;

      await this.logWithdrawalActivity(
        withdrawal.freelancerId,
        "withdrawal_failed",
        withdrawalId
      );

      return await this.getWithdrawal(withdrawalId);
    } catch (error) {
      console.error("Error failing withdrawal:", error);
      return null;
    }
  }

  // ============================================================================
  // WITHDRAWAL RETRIEVAL
  // ============================================================================

  static async getWithdrawal(withdrawalId: string): Promise<Withdrawal | null> {
    try {
      const { data, error } = await supabase
        .from("freelance_withdrawals")
        .select("*")
        .eq("id", withdrawalId)
        .single();

      if (error) return null;

      return this.mapWithdrawalData(data);
    } catch (error) {
      console.error("Error fetching withdrawal:", error);
      return null;
    }
  }

  static async getFreelancerWithdrawals(
    freelancerId: string,
    status?: Withdrawal["status"]
  ): Promise<Withdrawal[]> {
    try {
      let query = supabase
        .from("freelance_withdrawals")
        .select("*")
        .eq("freelancer_id", freelancerId);

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query.order("requested_at", {
        ascending: false,
      });

      if (error) throw error;

      return (data || []).map((w) => this.mapWithdrawalData(w));
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      return [];
    }
  }

  static async getPendingWithdrawals(): Promise<Withdrawal[]> {
    try {
      const { data, error } = await supabase
        .from("freelance_withdrawals")
        .select("*")
        .in("status", ["pending", "processing"])
        .order("requested_at", { ascending: true });

      if (error) throw error;

      return (data || []).map((w) => this.mapWithdrawalData(w));
    } catch (error) {
      console.error("Error fetching pending withdrawals:", error);
      return [];
    }
  }

  // ============================================================================
  // BALANCE AND LIMITS
  // ============================================================================

  static async getAvailableBalance(freelancerId: string): Promise<number> {
    try {
      const response = await fetch(
        `/api/wallet/balance?userId=${freelancerId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.data?.balances?.freelance || 0;
      }
      return 0;
    } catch (error) {
      console.error("Error fetching balance:", error);
      return 0;
    }
  }

  static async getWithdrawalLimits(): Promise<{
    minAmount: number;
    maxAmount: number;
    dailyLimit: number;
    monthlyLimit: number;
  }> {
    return {
      minAmount: 10,
      maxAmount: 10000,
      dailyLimit: 5000,
      monthlyLimit: 50000,
    };
  }

  static async checkWithdrawalEligibility(freelancerId: string): Promise<{
    eligible: boolean;
    reason?: string;
    minBalance?: number;
    currentBalance?: number;
  }> {
    try {
      const balance = await this.getAvailableBalance(freelancerId);

      // Check if balance meets minimum
      if (balance < 10) {
        return {
          eligible: false,
          reason: "Minimum balance of $10 required",
          minBalance: 10,
          currentBalance: balance,
        };
      }

      // Check withdrawal history
      const withdrawals = await this.getFreelancerWithdrawals(
        freelancerId,
        "failed"
      );
      if (withdrawals.length > 3) {
        return {
          eligible: false,
          reason: "Too many failed withdrawal attempts. Please contact support.",
        };
      }

      return {
        eligible: true,
        currentBalance: balance,
      };
    } catch (error) {
      console.error("Error checking eligibility:", error);
      return {
        eligible: false,
        reason: "Error checking eligibility",
      };
    }
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  static async getWithdrawalStats(
    freelancerId: string
  ): Promise<{
    totalWithdrawn: number;
    totalPending: number;
    totalFailed: number;
    lastWithdrawalDate?: Date;
    averageAmount: number;
  } | null> {
    try {
      const { data, error } = await supabase
        .from("freelance_withdrawals")
        .select("amount, status, requested_at")
        .eq("freelancer_id", freelancerId);

      if (error) throw error;

      const withdrawals = data || [];
      const completed = withdrawals.filter(
        (w: any) => w.status === "completed"
      );
      const pending = withdrawals.filter((w: any) => w.status === "pending");
      const failed = withdrawals.filter((w: any) => w.status === "failed");

      const totalWithdrawn = completed.reduce(
        (sum: number, w: any) => sum + (w.amount || 0),
        0
      );
      const totalPending = pending.reduce(
        (sum: number, w: any) => sum + (w.amount || 0),
        0
      );
      const totalFailed = failed.reduce(
        (sum: number, w: any) => sum + (w.amount || 0),
        0
      );
      const averageAmount =
        completed.length > 0 ? totalWithdrawn / completed.length : 0;

      const lastWithdrawal = completed.length > 0 ? completed[0] : null;

      return {
        totalWithdrawn,
        totalPending,
        totalFailed,
        lastWithdrawalDate: lastWithdrawal
          ? new Date(lastWithdrawal.requested_at)
          : undefined,
        averageAmount,
      };
    } catch (error) {
      console.error("Error fetching withdrawal stats:", error);
      return null;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  static calculateWithdrawalFee(
    amount: number,
    method: Withdrawal["method"]
  ): { fee: number; netAmount: number } {
    let feePercentage = 0;
    let flatFee = 0;

    switch (method) {
      case "bank_transfer":
        feePercentage = 1;
        flatFee = 2.5;
        break;
      case "paypal":
        feePercentage = 2;
        flatFee = 0.3;
        break;
      case "crypto":
        feePercentage = 0.5;
        flatFee = 0;
        break;
      case "mobile_money":
        feePercentage = 1.5;
        flatFee = 1;
        break;
      default:
        feePercentage = 1;
    }

    const fee = amount * (feePercentage / 100) + flatFee;
    const netAmount = amount - fee;

    return { fee: Math.round(fee * 100) / 100, netAmount: Math.round(netAmount * 100) / 100 };
  }

  private static mapWithdrawalData(data: any): Withdrawal {
    return {
      id: data.id,
      freelancerId: data.freelancer_id,
      amount: data.amount,
      currency: data.currency || "USD",
      method: data.method || "bank_transfer",
      status: data.status || "pending",
      bankDetails: data.bank_details,
      paypalEmail: data.paypal_email,
      cryptoAddress: data.crypto_address,
      cryptoNetwork: data.crypto_network,
      mobileNumber: data.mobile_number,
      mobileProvider: data.mobile_provider,
      fee: data.fee || 0,
      netAmount: data.net_amount || data.amount,
      requestedAt: new Date(data.requested_at),
      processedAt: data.processed_at ? new Date(data.processed_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      failureReason: data.failure_reason,
      metadata: data.metadata || {},
    };
  }

  private static async logWithdrawalActivity(
    freelancerId: string,
    activityType: string,
    withdrawalId: string
  ): Promise<void> {
    try {
      await supabase.from("freelance_activity_logs").insert([
        {
          user_id: freelancerId,
          activity_type: activityType,
          entity_type: "withdrawal",
          entity_id: withdrawalId,
          description: `${activityType.replace(/_/g, " ")}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error logging withdrawal activity:", error);
    }
  }
}
