import { paymentLinkService } from "./paymentLinkService";
import { freelanceInvoiceIntegrationService } from "./freelanceInvoiceIntegrationService";
import type { PaymentLink } from "./paymentLinkService";

/**
 * FreelancePaymentIntegrationService
 * 
 * Handles payment collection for freelance invoices using the unified payment link system.
 * Leverages existing payment link infrastructure to avoid duplication.
 */
export class FreelancePaymentIntegrationService {
  /**
   * Create a payment link for freelance invoice
   * Uses the unified payment link system
   * 
   * @param invoiceId - The invoice ID
   * @param freelancerId - The freelancer's user ID (receiver)
   * @param clientId - The client's user ID (payer)
   * @param amount - Payment amount in USD
   * @param description - Payment description
   * @param projectTitle - Title of the project
   * @returns Payment link URL or null if failed
   */
  static async createPaymentLink(
    invoiceId: string,
    freelancerId: string,
    clientId: string,
    amount: number,
    description: string,
    projectTitle: string
  ): Promise<string | null> {
    try {
      const paymentLink = await paymentLinkService.createPaymentLink(
        freelancerId,
        {
          amount,
          description: `${description} - ${projectTitle}`,
          paymentType: "freelance_invoice",
          linkCategory: "freelance",
          metadata: {
            invoiceId,
            freelancerId,
            clientId,
            projectTitle,
            type: "freelance_payment",
          },
          successRedirectUrl: `/app/freelance/invoices/${invoiceId}?paid=true`,
        }
      );

      return paymentLink.shareUrl;
    } catch (error) {
      console.error("Error creating payment link:", error);
      return null;
    }
  }

  /**
   * Get payment link details by code
   * 
   * @param code - The payment link code
   * @returns Payment link object or null
   */
  static async getPaymentLink(code: string): Promise<PaymentLink | null> {
    try {
      return await paymentLinkService.getPaymentLinkByCode(code);
    } catch (error) {
      console.error("Error fetching payment link:", error);
      return null;
    }
  }

  /**
   * Process freelance payment when client pays invoice
   * Updates invoice status and freelancer balance
   * 
   * @param invoiceId - The invoice ID
   * @param freelancerId - The freelancer's user ID
   * @param clientId - The client's user ID
   * @param amount - Payment amount
   * @returns true if successful
   */
  static async processInvoicePayment(
    invoiceId: string,
    freelancerId: string,
    clientId: string,
    amount: number
  ): Promise<boolean> {
    try {
      // Mark invoice as paid
      const success = await freelanceInvoiceIntegrationService.markInvoiceAsPaid(
        invoiceId,
        freelancerId,
        amount
      );

      if (!success) {
        throw new Error("Failed to mark invoice as paid");
      }

      // Record payment transaction
      await this.recordPaymentTransaction(
        invoiceId,
        freelancerId,
        clientId,
        amount
      );

      return true;
    } catch (error) {
      console.error("Error processing invoice payment:", error);
      return false;
    }
  }

  /**
   * Record payment transaction in wallet system
   * 
   * @param invoiceId - The invoice ID
   * @param freelancerId - The freelancer's user ID
   * @param clientId - The client's user ID
   * @param amount - Payment amount
   */
  private static async recordPaymentTransaction(
    invoiceId: string,
    freelancerId: string,
    clientId: string,
    amount: number
  ): Promise<void> {
    try {
      // Record in wallet transactions for both freelancer and client
      const { error: freelancerError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: freelancerId,
          transaction_type: "payment_received",
          amount: amount,
          balance_type: "freelance",
          description: `Invoice payment received for freelance work`,
          invoice_id: invoiceId,
          status: "completed",
          created_at: new Date().toISOString(),
          metadata: {
            clientId,
            invoiceId,
            type: "freelance_payment",
          },
        });

      if (freelancerError) {
        throw freelancerError;
      }

      // Also record for client
      await supabase
        .from("wallet_transactions")
        .insert({
          user_id: clientId,
          transaction_type: "payment_sent",
          amount: amount,
          balance_type: "ecommerce",
          description: `Payment sent for freelance work invoice`,
          invoice_id: invoiceId,
          status: "completed",
          created_at: new Date().toISOString(),
          metadata: {
            freelancerId,
            invoiceId,
            type: "freelance_payment",
          },
        });
    } catch (error) {
      console.error("Error recording payment transaction:", error);
      throw error;
    }
  }

  /**
   * Deactivate a payment link
   * 
   * @param linkId - The payment link ID
   * @returns true if successful
   */
  static async deactivatePaymentLink(linkId: string): Promise<boolean> {
    try {
      return await paymentLinkService.deactivatePaymentLink(linkId);
    } catch (error) {
      console.error("Error deactivating payment link:", error);
      return false;
    }
  }

  /**
   * Check if a payment link is valid and can be used
   * 
   * @param code - The payment link code
   * @returns true if valid
   */
  static async isPaymentLinkValid(code: string): Promise<boolean> {
    try {
      return await paymentLinkService.isPaymentLinkValid(code);
    } catch (error) {
      console.error("Error checking payment link validity:", error);
      return false;
    }
  }

  /**
   * Get all payment links for a freelancer
   * 
   * @param freelancerId - The freelancer's user ID
   * @returns Array of payment links
   */
  static async getFreelancerPaymentLinks(
    freelancerId: string
  ): Promise<PaymentLink[]> {
    try {
      const links = await paymentLinkService.getUserPaymentLinks(freelancerId);
      // Filter to only freelance-related links
      return links.filter((link) => link.linkCategory === "freelance");
    } catch (error) {
      console.error("Error fetching freelancer payment links:", error);
      return [];
    }
  }
}

// Import supabase for wallet transaction recording
import { supabase } from "@/integrations/supabase/client";

export const freelancePaymentIntegrationService =
  new FreelancePaymentIntegrationService();
