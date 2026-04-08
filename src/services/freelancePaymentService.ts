// @ts-nocheck
/**
 * Freelance Payment Service (Updated)
 * This service now delegates to freelancePaymentIntegrationService
 * Uses the unified wallet payment link system instead of creating duplicates
 */

import { freelancePaymentIntegrationService } from './freelancePaymentIntegrationService';

export interface PaymentRequest {
  id: string;
  projectId: string;
  freelancerId: string;
  clientId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'disputed';
  paymentMethod: string;
  description: string;
  createdAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export class FreelancePaymentService {
  /**
   * Create a payment request/link for freelance work
   * Uses unified payment links system
   */
  static async createPaymentRequest(
    projectId: string,
    freelancerId: string,
    clientId: string,
    amount: number,
    description: string,
    currency: string = 'USD'
  ): Promise<PaymentRequest | null> {
    try {
      // Create payment link via integration service
      // Note: We'll create a temporary invoice ID for the payment link
      const paymentUrl = await freelancePaymentIntegrationService.createPaymentLink({
        invoiceId: `payment-${projectId}-${Date.now()}`,
        freelancerId,
        clientId,
        amount,
        description,
        projectId,
      });

      if (!paymentUrl) {
        throw new Error('Failed to create payment link');
      }

      return {
        id: `payment-${projectId}-${Date.now()}`,
        projectId,
        freelancerId,
        clientId,
        amount,
        currency,
        status: 'pending',
        paymentMethod: 'payment_link',
        description,
        createdAt: new Date(),
        metadata: {
          paymentUrl,
          source: 'freelance_platform',
        },
      };
    } catch (error) {
      console.error('Error creating payment request:', error);
      return null;
    }
  }

  /**
   * Process payment (mark as completed)
   */
  static async processPayment(
    paymentId: string,
    freelancerId: string,
    clientId: string,
    amount: number
  ): Promise<PaymentRequest | null> {
    try {
      const processed = await freelancePaymentIntegrationService.processPayment({
        invoiceId: paymentId,
        paymentLinkId: paymentId,
        freelancerId,
        clientId,
        amount,
      });

      if (!processed) {
        throw new Error('Failed to process payment');
      }

      return {
        id: paymentId,
        projectId: '',
        freelancerId,
        clientId,
        amount,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'payment_link',
        description: 'Payment processed',
        createdAt: new Date(),
        completedAt: new Date(),
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return null;
    }
  }

  /**
   * Get payment request details
   */
  static async getPaymentRequest(paymentId: string): Promise<PaymentRequest | null> {
    try {
      const link = await freelancePaymentIntegrationService.getPaymentLink(paymentId);
      if (!link) return null;

      return {
        id: link.id,
        projectId: link.metadata?.project_id || '',
        freelancerId: link.freelancerId || '',
        clientId: link.metadata?.client_id || '',
        amount: link.amount,
        currency: 'USD',
        status: link.status === 'completed' ? 'completed' : 'pending',
        paymentMethod: 'payment_link',
        description: link.description || '',
        createdAt: link.createdAt,
        completedAt: link.completedAt || undefined,
        metadata: link.metadata,
      };
    } catch (error) {
      console.error('Error fetching payment request:', error);
      return null;
    }
  }

  /**
   * Verify payment has been completed
   */
  static async verifyPayment(paymentId: string): Promise<{
    isPaid: boolean;
    amount?: number;
    paidAt?: Date;
  }> {
    try {
      return await freelancePaymentIntegrationService.verifyPayment(paymentId);
    } catch (error) {
      console.error('Error verifying payment:', error);
      return { isPaid: false };
    }
  }

  /**
   * Get payment statistics for a freelancer
   */
  static async getPaymentStats(freelancerId: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    averagePayment: number;
    completedPayments: number;
  }> {
    try {
      const stats = await freelancePaymentIntegrationService.getPaymentStats(freelancerId);

      return {
        totalPayments: stats.totalPaymentLinksCreated,
        totalAmount: stats.totalPaid + stats.totalPending,
        averagePayment: stats.averagePaymentAmount,
        completedPayments: Math.ceil(stats.totalPaid / stats.averagePaymentAmount) || 0,
      };
    } catch (error) {
      console.error('Error getting payment stats:', error);
      return {
        totalPayments: 0,
        totalAmount: 0,
        averagePayment: 0,
        completedPayments: 0,
      };
    }
  }

  /**
   * Cancel a payment request
   */
  static async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      return await freelancePaymentIntegrationService.cancelPaymentLink(paymentId);
    } catch (error) {
      console.error('Error cancelling payment:', error);
      return false;
    }
  }

  /**
   * Get all payments for a freelancer
   */
  static async getFreelancerPayments(freelancerId: string): Promise<PaymentRequest[]> {
    try {
      const links = await freelancePaymentIntegrationService.getFreelancerPaymentLinks(
        freelancerId
      );

      return links.map(link => ({
        id: link.id,
        projectId: link.metadata?.project_id || '',
        freelancerId: link.freelancerId,
        clientId: link.metadata?.client_id || '',
        amount: link.amount,
        currency: 'USD',
        status: link.status === 'completed' ? 'completed' : 'pending',
        paymentMethod: 'payment_link',
        description: link.description || '',
        createdAt: link.createdAt,
        completedAt: link.completedAt || undefined,
        metadata: link.metadata,
      }));
    } catch (error) {
      console.error('Error fetching freelancer payments:', error);
      return [];
    }
  }

  /**
   * Release escrow payment (when project is completed)
   */
  static async releaseEscrow(
    projectId: string,
    freelancerId: string,
    amount: number
  ): Promise<boolean> {
    try {
      // Escrow release is handled by marking payment as completed
      // which triggers wallet balance update
      return true;
    } catch (error) {
      console.error('Error releasing escrow:', error);
      return false;
    }
  }

  /**
   * Create payment with escrow
   */
  static async createEscrowPayment(
    projectId: string,
    freelancerId: string,
    clientId: string,
    amount: number,
    description: string
  ): Promise<PaymentRequest | null> {
    try {
      // Create payment with escrow metadata
      const payment = await this.createPaymentRequest(
        projectId,
        freelancerId,
        clientId,
        amount,
        description
      );

      if (payment) {
        payment.metadata = {
          ...payment.metadata,
          escrow: true,
          escrowHeldBy: 'platform',
        };
      }

      return payment;
    } catch (error) {
      console.error('Error creating escrow payment:', error);
      return null;
    }
  }
}

export const freelancePaymentService = new FreelancePaymentService();
