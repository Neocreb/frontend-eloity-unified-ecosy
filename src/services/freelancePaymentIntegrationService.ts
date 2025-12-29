// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { invoicePaymentSyncService } from './invoicePaymentSyncService';

/**
 * Freelance Payment Integration Service
 * Creates and manages payment links for freelance invoices
 * Uses the existing unified payment_links system, not creating duplicates
 */

export interface CreatePaymentLinkInput {
  invoiceId: string;
  freelancerId: string;
  clientId: string;
  amount: number;
  description: string;
  projectId?: string;
}

export interface ProcessPaymentInput {
  invoiceId: string;
  paymentLinkId: string;
  freelancerId: string;
  clientId: string;
  amount: number;
}

export class FreelancePaymentIntegrationService {
  /**
   * Create a payment link for a freelance invoice
   * Uses existing payment_links system with freelance tags
   */
  static async createPaymentLink(input: CreatePaymentLinkInput): Promise<string | null> {
    try {
      // Create payment link in the unified system
      const { data: linkData, error: linkError } = await supabase
        .from('payment_links')
        .insert([
          {
            user_id: input.freelancerId, // Receiver is the freelancer
            amount: input.amount.toString(),
            description: input.description,
            status: 'active',
            metadata: {
              type: 'freelance_invoice',
              invoice_id: input.invoiceId,
              freelancer_id: input.freelancerId,
              client_id: input.clientId,
              project_id: input.projectId,
              created_at: new Date().toISOString(),
            },
          },
        ])
        .select()
        .single();

      if (linkError) {
        console.error('Error creating payment link:', linkError);
        return null;
      }

      // Generate public URL for the payment link
      const paymentUrl = `${window.location.origin}/payment-link/${linkData.id}`;

      // Record in sync service
      try {
        await invoicePaymentSyncService.recordPaymentLinkCreated(
          input.clientId, // Client creating the payment request
          linkData.id,
          input.amount
        );
      } catch (syncError) {
        console.warn('Warning: Could not record payment link in sync:', syncError);
      }

      return paymentUrl;
    } catch (error) {
      console.error('Error in createPaymentLink:', error);
      return null;
    }
  }

  /**
   * Get payment link details
   */
  static async getPaymentLink(paymentLinkId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('id', paymentLinkId)
        .single();

      if (error) {
        console.error('Error fetching payment link:', error);
        return null;
      }

      return this.mapPaymentLink(data);
    } catch (error) {
      console.error('Error in getPaymentLink:', error);
      return null;
    }
  }

  /**
   * Get all payment links for a freelancer
   */
  static async getFreelancerPaymentLinks(freelancerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('user_id', freelancerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching freelancer payment links:', error);
        return [];
      }

      return (data || [])
        .filter((link: any) => link.metadata?.type === 'freelance_invoice')
        .map((link: any) => this.mapPaymentLink(link));
    } catch (error) {
      console.error('Error in getFreelancerPaymentLinks:', error);
      return [];
    }
  }

  /**
   * Get all payment links for an invoice
   */
  static async getInvoicePaymentLinks(invoiceId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment links:', error);
        return [];
      }

      // Filter for payment links related to this invoice
      return (data || [])
        .filter(
          (link: any) =>
            link.metadata?.invoice_id === invoiceId &&
            link.metadata?.type === 'freelance_invoice'
        )
        .map((link: any) => this.mapPaymentLink(link));
    } catch (error) {
      console.error('Error in getInvoicePaymentLinks:', error);
      return [];
    }
  }

  /**
   * Process a payment from a payment link
   * Updates invoice status and freelancer balance
   */
  static async processPayment(input: ProcessPaymentInput): Promise<boolean> {
    try {
      // Update payment link status
      const { error: linkError } = await supabase
        .from('payment_links')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', input.paymentLinkId);

      if (linkError) {
        console.error('Error updating payment link:', linkError);
        return false;
      }

      // Mark invoice as paid
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', input.invoiceId);

      if (invoiceError) {
        console.error('Error updating invoice:', invoiceError);
        return false;
      }

      // Record payment in sync service
      try {
        await invoicePaymentSyncService.recordInvoicePayment(
          input.freelancerId,
          input.invoiceId,
          input.amount,
          'invoice_paid'
        );
      } catch (syncError) {
        console.warn('Warning: Could not record payment in sync:', syncError);
      }

      // Update freelancer balance
      try {
        await this.updateFreelancerBalance(input.freelancerId, input.amount);
      } catch (balanceError) {
        console.warn('Warning: Could not update balance:', balanceError);
      }

      return true;
    } catch (error) {
      console.error('Error processing payment:', error);
      return false;
    }
  }

  /**
   * Cancel a payment link
   */
  static async cancelPaymentLink(paymentLinkId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_links')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentLinkId);

      if (error) {
        console.error('Error cancelling payment link:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in cancelPaymentLink:', error);
      return false;
    }
  }

  /**
   * Update freelancer balance after payment
   */
  private static async updateFreelancerBalance(
    freelancerId: string,
    amount: number
  ): Promise<void> {
    try {
      const response = await fetch(`/api/wallet/update-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: freelancerId,
          type: 'freelance',
          amount: amount,
          action: 'add',
          source: 'freelance_payment',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update balance: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error;
    }
  }

  /**
   * Verify payment from external source
   * Checks if payment link is marked as completed
   */
  static async verifyPayment(paymentLinkId: string): Promise<{
    isPaid: boolean;
    amount?: number;
    paidAt?: Date;
  }> {
    try {
      const link = await this.getPaymentLink(paymentLinkId);
      if (!link) {
        return { isPaid: false };
      }

      return {
        isPaid: link.status === 'completed',
        amount: link.amount,
        paidAt: link.completedAt,
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return { isPaid: false };
    }
  }

  /**
   * Get payment statistics for a freelancer
   */
  static async getPaymentStats(freelancerId: string): Promise<{
    totalPaymentLinksCreated: number;
    totalPaid: number;
    totalPending: number;
    averagePaymentAmount: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('user_id', freelancerId);

      if (error) throw error;

      const freelanceLinks = (data || []).filter(
        (link: any) => link.metadata?.type === 'freelance_invoice'
      );

      const paidLinks = freelanceLinks.filter((link: any) => link.status === 'completed');
      const pendingLinks = freelanceLinks.filter((link: any) => link.status === 'active');

      const totalPaid = paidLinks.reduce((sum: number, link: any) => {
        return sum + parseFloat(link.amount || '0');
      }, 0);

      const totalPending = pendingLinks.reduce((sum: number, link: any) => {
        return sum + parseFloat(link.amount || '0');
      }, 0);

      return {
        totalPaymentLinksCreated: freelanceLinks.length,
        totalPaid,
        totalPending,
        averagePaymentAmount:
          freelanceLinks.length > 0
            ? freelanceLinks.reduce((sum: number, link: any) => sum + parseFloat(link.amount || '0'), 0) /
              freelanceLinks.length
            : 0,
      };
    } catch (error) {
      console.error('Error getting payment stats:', error);
      return {
        totalPaymentLinksCreated: 0,
        totalPaid: 0,
        totalPending: 0,
        averagePaymentAmount: 0,
      };
    }
  }

  /**
   * Helper: Map payment link from database format
   */
  private static mapPaymentLink(data: any): any {
    return {
      id: data.id,
      freelancerId: data.user_id,
      amount: parseFloat(data.amount || '0'),
      description: data.description,
      status: data.status,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : null,
      updatedAt: new Date(data.updated_at),
    };
  }
}

export const freelancePaymentIntegrationService = new FreelancePaymentIntegrationService();
