import { supabase } from "@/integrations/supabase/client";
import { invoiceService } from "./invoiceService";
import type { Invoice } from "./invoiceService";

/**
 * FreelanceInvoiceIntegrationService
 *
 * Bridges freelance invoice operations with the unified wallet invoice system.
 * All freelance invoices are created in the shared 'invoices' table with type = 'freelance'
 * This ensures a single source of truth for all invoices across the platform.
 *
 * Currency is dynamically determined from user settings or auto-detected by location.
 */
export class FreelanceInvoiceIntegrationService {
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
   */
  private static detectCurrencyByLocation(): string {
    try {
      if (typeof window === "undefined") return "USD";

      const savedCurrency = localStorage.getItem("preferred_currency");
      if (savedCurrency) return savedCurrency;

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const currencyMap: Record<string, string> = {
        "Europe/": "EUR",
        "Europe/London": "GBP",
        "Africa/Lagos": "NGN",
        "Africa/Accra": "GHS",
        "Africa/Johannesburg": "ZAR",
        "Africa/Nairobi": "KES",
        "Asia/Tokyo": "JPY",
        "America/New_York": "USD",
        "America/Toronto": "CAD",
        "America/Sao_Paulo": "BRL",
        "Australia/Sydney": "AUD",
      };

      for (const [tzPattern, currency] of Object.entries(currencyMap)) {
        if (timezone.includes(tzPattern)) {
          return currency;
        }
      }

      return "USD";
    } catch (error) {
      console.warn("Error detecting currency by location:", error);
      return "USD";
    }
  }
  /**
   * Create a freelance project invoice
   * Integrates with unified wallet system
   *
   * @param freelancerId - The freelancer's user ID
   * @param clientId - The client's user ID
   * @param projectId - The freelance project ID
   * @param projectTitle - Title of the project/work
   * @param amount - Invoice amount
   * @param description - Optional description
   * @param currency - Optional currency code (auto-detected if not provided)
   * @returns Invoice ID or null if failed
   */
  static async createProjectInvoice(
    freelancerId: string,
    clientId: string,
    projectId: string,
    projectTitle: string,
    amount: number,
    description?: string,
    currency?: string
  ): Promise<string | null> {
    try {
      const userCurrency = currency || (await this.getUserCurrency(freelancerId));

      const invoice = await invoiceService.createInvoice(freelancerId, {
        recipientEmail: "",
        recipientName: "",
        items: [
          {
            description: description || `Payment for: ${projectTitle}`,
            quantity: 1,
            unitPrice: amount,
            amount: amount,
          },
        ],
        type: "freelance",
        sourceType: "freelance_project",
        projectId: projectId,
        freelancerId: freelancerId,
        clientId: clientId,
        currency: userCurrency,
      });

      return invoice.id;
    } catch (error) {
      console.error("Error creating freelance invoice:", error);
      return null;
    }
  }

  /**
   * Create milestone payment invoice
   * Called when freelancer completes a milestone
   * 
   * @param freelancerId - The freelancer's user ID
   * @param clientId - The client's user ID
   * @param projectId - The project ID
   * @param milestoneId - The milestone ID
   * @param milestoneTitle - Title of the milestone
   * @param milestoneAmount - Amount for this milestone
   * @returns Invoice ID or null if failed
   */
  static async createMilestoneInvoice(
    freelancerId: string,
    clientId: string,
    projectId: string,
    milestoneId: string,
    milestoneTitle: string,
    milestoneAmount: number
  ): Promise<string | null> {
    try {
      return await this.createProjectInvoice(
        freelancerId,
        clientId,
        projectId,
        `Milestone: ${milestoneTitle}`,
        milestoneAmount,
        `Payment for milestone: ${milestoneTitle}`
      );
    } catch (error) {
      console.error("Error creating milestone invoice:", error);
      return null;
    }
  }

  /**
   * Get freelancer's invoices from unified system
   * 
   * @param freelancerId - The freelancer's user ID
   * @returns Array of invoices
   */
  static async getFreelancerInvoices(freelancerId: string): Promise<Invoice[]> {
    try {
      return await invoiceService.getFreelanceInvoices(
        freelancerId,
        "freelancer"
      );
    } catch (error) {
      console.error("Error fetching freelancer invoices:", error);
      return [];
    }
  }

  /**
   * Get client's invoices (invoices they need to pay)
   * 
   * @param clientId - The client's user ID
   * @returns Array of invoices
   */
  static async getClientInvoices(clientId: string): Promise<Invoice[]> {
    try {
      return await invoiceService.getFreelanceInvoices(clientId, "client");
    } catch (error) {
      console.error("Error fetching client invoices:", error);
      return [];
    }
  }

  /**
   * Mark invoice as paid and update wallet balance
   * 
   * @param invoiceId - The invoice ID
   * @param freelancerId - The freelancer's user ID
   * @param amount - The payment amount
   * @returns true if successful
   */
  static async markInvoiceAsPaid(
    invoiceId: string,
    freelancerId: string,
    amount: number
  ): Promise<boolean> {
    try {
      // Update invoice status
      await invoiceService.markAsPaid(invoiceId);

      // Update freelancer balance in wallet service
      await this.updateFreelancerBalance(freelancerId, amount);

      return true;
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      return false;
    }
  }

  /**
   * Update freelancer's balance in unified wallet
   * This triggers the wallet system to update the freelance balance category
   * 
   * @param freelancerId - The freelancer's user ID
   * @param amount - Amount to add to freelance balance
   */
  private static async updateFreelancerBalance(
    freelancerId: string,
    amount: number
  ): Promise<void> {
    try {
      const response = await fetch("/api/wallet/update-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: freelancerId,
          amount: amount,
          type: "freelance",
          action: "add",
          source: "invoice_payment",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update balance: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error updating freelancer balance:", error);
      throw error;
    }
  }

  /**
   * Get invoice details by ID
   * 
   * @param invoiceId - The invoice ID
   * @returns Invoice object or null
   */
  static async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      return await invoiceService.getInvoice(invoiceId);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      return null;
    }
  }

  /**
   * Cancel an invoice
   * 
   * @param invoiceId - The invoice ID
   * @returns true if successful
   */
  static async cancelInvoice(invoiceId: string): Promise<boolean> {
    try {
      await invoiceService.cancelInvoice(invoiceId);
      return true;
    } catch (error) {
      console.error("Error cancelling invoice:", error);
      return false;
    }
  }

  /**
   * Download invoice as PDF
   * 
   * @param invoiceId - The invoice ID
   */
  static async downloadInvoice(invoiceId: string): Promise<void> {
    try {
      await invoiceService.downloadInvoicePDF(invoiceId);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      throw error;
    }
  }
}

export const freelanceInvoiceIntegrationService =
  new FreelanceInvoiceIntegrationService();
