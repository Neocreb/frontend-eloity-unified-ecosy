// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export interface PaymentRequest {
  id: string;
  projectId: string;
  freelancerId: string;
  clientId: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed" | "disputed";
  paymentMethod: string;
  description: string;
  createdAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export class FreelancePaymentService {
  // ============================================================================
  // PAYMENT PROCESSING
  // ============================================================================

  static async createPaymentRequest(
    projectId: string,
    freelancerId: string,
    clientId: string,
    amount: number,
    description: string,
    currency: string = "USD"
  ): Promise<PaymentRequest | null> {
    try {
      const { data, error } = await supabase
        .from("freelance_payments")
        .insert([
          {
            project_id: projectId,
            freelancer_id: freelancerId,
            client_id: clientId,
            amount,
            currency,
            status: "pending",
            description,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return this.mapPaymentData(data);
    } catch (error) {
      console.error("Error creating payment request:", error);
      return null;
    }
  }

  static async processPayment(
    paymentId: string,
    paymentMethod: string = "wallet"
  ): Promise<boolean> {
    try {
      const payment = await this.getPayment(paymentId);
      if (!payment) throw new Error("Payment not found");

      // Deduct from client's wallet
      const clientResponse = await fetch(
        `/api/wallet/deduct?userId=${payment.clientId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: payment.amount,
            type: "freelance_payment",
            description: payment.description,
          }),
        }
      );

      if (!clientResponse.ok) throw new Error("Failed to deduct from client wallet");

      // Add to freelancer's wallet
      const freelancerResponse = await fetch(
        `/api/wallet/add?userId=${payment.freelancerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: payment.amount,
            type: "freelance_payment",
            description: `Payment for project: ${payment.description}`,
          }),
        }
      );

      if (!freelancerResponse.ok) throw new Error("Failed to add to freelancer wallet");

      // Update payment status
      const { error } = await supabase
        .from("freelance_payments")
        .update({
          status: "completed",
          payment_method: paymentMethod,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error("Error processing payment:", error);

      // Mark payment as failed
      await supabase
        .from("freelance_payments")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      return false;
    }
  }

  static async releaseEscrow(
    projectId: string,
    amount: number
  ): Promise<boolean> {
    try {
      // Create escrow release payment
      const { error } = await supabase.from("freelance_payments").insert([
        {
          project_id: projectId,
          amount,
          status: "completed",
          description: "Escrow release",
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error("Error releasing escrow:", error);
      return false;
    }
  }

  static async refundPayment(paymentId: string): Promise<boolean> {
    try {
      const payment = await this.getPayment(paymentId);
      if (!payment) throw new Error("Payment not found");

      // Return amount to client
      const clientResponse = await fetch(
        `/api/wallet/add?userId=${payment.clientId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: payment.amount,
            type: "freelance_refund",
            description: `Refund for: ${payment.description}`,
          }),
        }
      );

      if (!clientResponse.ok) throw new Error("Failed to refund to client");

      // Update payment status
      const { error } = await supabase
        .from("freelance_payments")
        .update({
          status: "refunded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error("Error refunding payment:", error);
      return false;
    }
  }

  // ============================================================================
  // PAYMENT RETRIEVAL
  // ============================================================================

  static async getPayment(paymentId: string): Promise<PaymentRequest | null> {
    try {
      const { data, error } = await supabase
        .from("freelance_payments")
        .select("*")
        .eq("id", paymentId)
        .single();

      if (error) return null;

      return this.mapPaymentData(data);
    } catch (error) {
      console.error("Error fetching payment:", error);
      return null;
    }
  }

  static async getProjectPayments(
    projectId: string
  ): Promise<PaymentRequest[]> {
    try {
      const { data, error } = await supabase
        .from("freelance_payments")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((p) => this.mapPaymentData(p));
    } catch (error) {
      console.error("Error fetching project payments:", error);
      return [];
    }
  }

  static async getFreelancerPayments(
    freelancerId: string,
    status?: PaymentRequest["status"]
  ): Promise<PaymentRequest[]> {
    try {
      let query = supabase
        .from("freelance_payments")
        .select("*")
        .eq("freelancer_id", freelancerId);

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      return (data || []).map((p) => this.mapPaymentData(p));
    } catch (error) {
      console.error("Error fetching freelancer payments:", error);
      return [];
    }
  }

  static async getClientPayments(clientId: string): Promise<PaymentRequest[]> {
    try {
      const { data, error } = await supabase
        .from("freelance_payments")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((p) => this.mapPaymentData(p));
    } catch (error) {
      console.error("Error fetching client payments:", error);
      return [];
    }
  }

  // ============================================================================
  // PAYMENT STATISTICS
  // ============================================================================

  static async getTotalPaymentsForFreelancer(
    freelancerId: string
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("freelance_payments")
        .select("amount")
        .eq("freelancer_id", freelancerId)
        .eq("status", "completed");

      if (error) throw error;

      return (data || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    } catch (error) {
      console.error("Error calculating total payments:", error);
      return 0;
    }
  }

  static async getMonthlyPaymentsForFreelancer(
    freelancerId: string,
    year: number,
    month: number
  ): Promise<number> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const { data, error } = await supabase
        .from("freelance_payments")
        .select("amount")
        .eq("freelancer_id", freelancerId)
        .eq("status", "completed")
        .gte("completed_at", startDate.toISOString())
        .lte("completed_at", endDate.toISOString());

      if (error) throw error;

      return (data || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    } catch (error) {
      console.error("Error calculating monthly payments:", error);
      return 0;
    }
  }

  static async getPaymentStats(
    freelancerId: string
  ): Promise<{
    totalEarnings: number;
    totalPayments: number;
    pendingPayments: number;
    averagePaymentAmount: number;
  } | null> {
    try {
      const { data, error } = await supabase
        .from("freelance_payments")
        .select("amount, status")
        .eq("freelancer_id", freelancerId);

      if (error) throw error;

      const payments = data || [];
      const completedPayments = payments.filter((p: any) => p.status === "completed");
      const pendingPayments = payments.filter((p: any) => p.status === "pending");

      const totalEarnings = completedPayments.reduce(
        (sum: number, p: any) => sum + (p.amount || 0),
        0
      );
      const pendingAmount = pendingPayments.reduce(
        (sum: number, p: any) => sum + (p.amount || 0),
        0
      );
      const averageAmount =
        completedPayments.length > 0
          ? totalEarnings / completedPayments.length
          : 0;

      return {
        totalEarnings,
        totalPayments: completedPayments.length,
        pendingPayments: pendingAmount,
        averagePaymentAmount: averageAmount,
      };
    } catch (error) {
      console.error("Error fetching payment stats:", error);
      return null;
    }
  }

  // ============================================================================
  // DISPUTE HANDLING
  // ============================================================================

  static async disputePayment(
    paymentId: string,
    reason: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("freelance_payments")
        .update({
          status: "disputed",
          dispute_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error("Error disputing payment:", error);
      return false;
    }
  }

  static async resolveDispute(
    paymentId: string,
    resolution: "refund" | "completed"
  ): Promise<boolean> {
    try {
      const payment = await this.getPayment(paymentId);
      if (!payment) throw new Error("Payment not found");

      if (resolution === "refund") {
        return await this.refundPayment(paymentId);
      } else {
        return await this.processPayment(paymentId);
      }
    } catch (error) {
      console.error("Error resolving dispute:", error);
      return false;
    }
  }

  // ============================================================================
  // DATA MAPPING
  // ============================================================================

  private static mapPaymentData(data: any): PaymentRequest {
    return {
      id: data.id,
      projectId: data.project_id,
      freelancerId: data.freelancer_id,
      clientId: data.client_id,
      amount: data.amount,
      currency: data.currency || "USD",
      status: data.status || "pending",
      paymentMethod: data.payment_method || "wallet",
      description: data.description,
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      metadata: data.metadata || {},
    };
  }
}
