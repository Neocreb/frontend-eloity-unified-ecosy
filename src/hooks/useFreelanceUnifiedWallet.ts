// @ts-nocheck
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { walletService } from "@/services/walletService";
import { freelanceInvoiceIntegrationService } from "@/services/freelanceInvoiceIntegrationService";
import { freelancePaymentIntegrationService } from "@/services/freelancePaymentIntegrationService";
import { freelanceWithdrawalIntegrationService } from "@/services/freelanceWithdrawalIntegrationService";
import type { Invoice } from "@/services/invoiceService";

export interface FreelanceInvoice extends Invoice {
  freelancerName?: string;
  clientName?: string;
  projectTitle?: string;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  currency: string;
  method: "bank_transfer" | "paypal" | "crypto" | "mobile_money";
  status: "pending" | "completed" | "failed" | "cancelled";
  createdAt: string;
  metadata?: Record<string, any>;
}

export const useFreelanceUnifiedWallet = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [invoices, setInvoices] = useState<FreelanceInvoice[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalStats, setWithdrawalStats] = useState({
    totalWithdrawn: 0,
    pendingAmount: 0,
    completedAmount: 0,
    withdrawalCount: 0,
    averageWithdrawal: 0,
  });

  /**
   * Load freelancer's wallet balance
   */
  const loadBalance = useCallback(async () => {
    if (!user?.id) return;

    try {
      const walletBalance = await walletService.getWalletBalance();
      setBalance(walletBalance.freelance || 0);
      // Store currency (would come from user settings in production)
      const userCurrency = localStorage.getItem("preferred_currency") || "USD";
      setCurrency(userCurrency);
    } catch (error) {
      console.error("Error loading balance:", error);
      toast.error("Failed to load wallet balance");
    }
  }, [user?.id]);

  /**
   * Load freelancer's invoices
   */
  const loadInvoices = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const invoiceList = await freelanceInvoiceIntegrationService.getFreelancerInvoices(user.id);
      setInvoices(invoiceList || []);
    } catch (error) {
      console.error("Error loading invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Load freelancer's withdrawals
   */
  const loadWithdrawals = useCallback(async () => {
    if (!user?.id) return;

    try {
      const withdrawalList = await freelanceWithdrawalIntegrationService.getFreelancerWithdrawals(user.id);
      setWithdrawals(withdrawalList || []);

      const stats = await freelanceWithdrawalIntegrationService.getWithdrawalStats(user.id);
      setWithdrawalStats(stats);
    } catch (error) {
      console.error("Error loading withdrawals:", error);
      toast.error("Failed to load withdrawals");
    }
  }, [user?.id]);

  /**
   * Refresh all data
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([loadBalance(), loadInvoices(), loadWithdrawals()]);
  }, [loadBalance, loadInvoices, loadWithdrawals]);

  /**
   * Create a new invoice
   */
  const createInvoice = useCallback(
    async (
      clientId: string,
      projectId: string,
      projectTitle: string,
      amount: number,
      description?: string
    ) => {
      if (!user?.id) {
        toast.error("User not authenticated");
        return null;
      }

      try {
        setLoading(true);
        const invoiceId = await freelanceInvoiceIntegrationService.createProjectInvoice(
          user.id,
          clientId,
          projectId,
          projectTitle,
          amount,
          description
        );

        if (invoiceId) {
          toast.success("Invoice created successfully");
          await loadInvoices();
          return invoiceId;
        } else {
          throw new Error("Failed to create invoice");
        }
      } catch (error) {
        console.error("Error creating invoice:", error);
        toast.error("Failed to create invoice");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, loadInvoices]
  );

  /**
   * Create a payment link for an invoice
   */
  const createPaymentLink = useCallback(
    async (
      invoiceId: string,
      clientId: string,
      amount: number,
      description: string,
      projectTitle: string
    ) => {
      if (!user?.id) {
        toast.error("User not authenticated");
        return null;
      }

      try {
        setLoading(true);
        const paymentLink = await freelancePaymentIntegrationService.createPaymentLink(
          invoiceId,
          user.id,
          clientId,
          amount,
          description,
          projectTitle,
          currency
        );

        if (paymentLink) {
          toast.success("Payment link created");
          return paymentLink;
        } else {
          throw new Error("Failed to create payment link");
        }
      } catch (error) {
        console.error("Error creating payment link:", error);
        toast.error("Failed to create payment link");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, currency]
  );

  /**
   * Request a withdrawal
   */
  const requestWithdrawal = useCallback(
    async (
      amount: number,
      method: "bank_transfer" | "paypal" | "crypto" | "mobile_money",
      withdrawalDetails: Record<string, any>
    ) => {
      if (!user?.id) {
        toast.error("User not authenticated");
        return null;
      }

      try {
        setLoading(true);

        // Check eligibility
        const eligibility = await freelanceWithdrawalIntegrationService.checkWithdrawalEligibility(user.id);

        if (!eligibility.isEligible) {
          toast.error(eligibility.reason || "Not eligible for withdrawal");
          return null;
        }

        if (amount <= 0) {
          toast.error("Amount must be greater than 0");
          return null;
        }

        if (amount > eligibility.balance) {
          toast.error("Insufficient balance");
          return null;
        }

        const withdrawalId = await freelanceWithdrawalIntegrationService.requestWithdrawal(
          user.id,
          amount,
          method,
          withdrawalDetails,
          currency
        );

        if (withdrawalId) {
          toast.success(`Withdrawal request created successfully`);
          await Promise.all([loadWithdrawals(), loadBalance()]);
          return withdrawalId;
        } else {
          throw new Error("Failed to create withdrawal");
        }
      } catch (error) {
        console.error("Error requesting withdrawal:", error);
        toast.error("Failed to request withdrawal");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, currency, loadWithdrawals, loadBalance]
  );

  /**
   * Check withdrawal eligibility
   */
  const checkWithdrawalEligibility = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const eligibility = await freelanceWithdrawalIntegrationService.checkWithdrawalEligibility(user.id);
      return eligibility;
    } catch (error) {
      console.error("Error checking eligibility:", error);
      return null;
    }
  }, [user?.id]);

  /**
   * Cancel a withdrawal (if pending)
   */
  const cancelWithdrawal = useCallback(
    async (withdrawalId: string) => {
      try {
        setLoading(true);
        const success = await freelanceWithdrawalIntegrationService.cancelWithdrawal(withdrawalId);

        if (success) {
          toast.success("Withdrawal cancelled");
          await loadWithdrawals();
          return true;
        } else {
          toast.error("Failed to cancel withdrawal");
          return false;
        }
      } catch (error) {
        console.error("Error cancelling withdrawal:", error);
        toast.error("Failed to cancel withdrawal");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadWithdrawals]
  );

  /**
   * Get invoices filtered by status
   */
  const getInvoicesByStatus = useCallback(
    (status: string) => {
      return invoices.filter((inv) => inv.status === status);
    },
    [invoices]
  );

  /**
   * Get total earned (from completed invoices)
   */
  const getTotalEarned = useCallback(() => {
    return invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
  }, [invoices]);

  /**
   * Get pending earnings (from unpaid invoices)
   */
  const getPendingEarnings = useCallback(() => {
    return invoices
      .filter((inv) => inv.status !== "paid" && inv.status !== "cancelled")
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
  }, [invoices]);

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      refreshAll();
    }
  }, [user?.id, refreshAll]);

  return {
    // Data
    balance,
    currency,
    invoices,
    withdrawals,
    withdrawalStats,
    loading,

    // Invoice methods
    createInvoice,
    createPaymentLink,
    loadInvoices,
    getInvoicesByStatus,
    getTotalEarned,
    getPendingEarnings,

    // Withdrawal methods
    requestWithdrawal,
    checkWithdrawalEligibility,
    cancelWithdrawal,
    loadWithdrawals,

    // General
    refreshAll,
    loadBalance,
  };
};

export default useFreelanceUnifiedWallet;
