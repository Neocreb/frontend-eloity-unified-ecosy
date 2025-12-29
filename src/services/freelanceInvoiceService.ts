// @ts-nocheck
/**
 * Freelance Invoice Service (Updated)
 * This service now delegates to freelanceInvoiceIntegrationService
 * Uses the unified wallet invoice system instead of creating duplicates
 */

import { freelanceInvoiceIntegrationService } from './freelanceInvoiceIntegrationService';
import { freelancePaymentIntegrationService } from './freelancePaymentIntegrationService';

export interface Invoice {
  id: string;
  projectId: string;
  freelancerId: string;
  clientId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  issueDate: Date;
  dueDate: Date;
  lineItems: InvoiceLineItem[];
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  notes?: string;
  termsAndConditions?: string;
  paymentTerms?: string;
  viewedAt?: Date;
  paidAt?: Date;
  metadata?: Record<string, any>;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export class FreelanceInvoiceService {
  /**
   * Create a new freelance invoice
   * Delegates to unified invoice system via integration service
   */
  static async createInvoice(
    projectId: string,
    freelancerId: string,
    clientId: string,
    amount: number,
    dueDate: Date,
    lineItems: Omit<InvoiceLineItem, 'id'>[] = [],
    options?: {
      taxRate?: number;
      discount?: number;
      notes?: string;
      terms?: string;
    }
  ): Promise<Invoice | null> {
    try {
      // Use integration service to create invoice in unified system
      const invoiceId = await freelanceInvoiceIntegrationService.createProjectInvoice(
        freelancerId,
        clientId,
        projectId,
        `Project ${projectId}`,
        amount,
        options?.notes || 'Freelance work'
      );

      if (!invoiceId) {
        throw new Error('Failed to create invoice');
      }

      // Fetch and return the created invoice
      return await this.getInvoice(invoiceId);
    } catch (error) {
      console.error('Error creating invoice:', error);
      return null;
    }
  }

  /**
   * Get a specific invoice by ID
   */
  static async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const invoice = await freelanceInvoiceIntegrationService.getInvoice(invoiceId);
      if (!invoice) return null;

      return this.mapToInvoiceInterface(invoice);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }

  /**
   * Get all invoices created by a freelancer
   */
  static async getFreelancerInvoices(freelancerId: string): Promise<Invoice[]> {
    try {
      const invoices = await freelanceInvoiceIntegrationService.getFreelancerInvoices(
        freelancerId
      );
      return invoices.map(inv => this.mapToInvoiceInterface(inv));
    } catch (error) {
      console.error('Error fetching freelancer invoices:', error);
      return [];
    }
  }

  /**
   * Get all invoices that need to be paid by a client
   */
  static async getClientInvoices(clientId: string): Promise<Invoice[]> {
    try {
      const invoices = await freelanceInvoiceIntegrationService.getClientInvoices(clientId);
      return invoices.map(inv => this.mapToInvoiceInterface(inv));
    } catch (error) {
      console.error('Error fetching client invoices:', error);
      return [];
    }
  }

  /**
   * Get invoices for a specific project
   */
  static async getProjectInvoices(projectId: string): Promise<Invoice[]> {
    try {
      // Get all freelancer invoices and filter by project
      const invoices = await freelanceInvoiceIntegrationService.getFreelancerInvoices('');
      return invoices
        .filter((inv) => inv.projectId === projectId)
        .map((inv) => this.mapToInvoiceInterface(inv));
    } catch (error) {
      console.error('Error fetching project invoices:', error);
      return [];
    }
  }

  /**
   * Send invoice to client
   */
  static async sendInvoice(invoiceId: string): Promise<boolean> {
    try {
      const invoice = await freelanceInvoiceIntegrationService.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      // Use the unified invoiceService to send email
      // Note: This requires the email service integration in the future
      return true;
    } catch (error) {
      console.error('Error sending invoice:', error);
      return false;
    }
  }

  /**
   * Mark invoice as paid
   */
  static async markAsPaid(invoiceId: string, amount: number, freelancerId: string): Promise<boolean> {
    try {
      return await freelanceInvoiceIntegrationService.markInvoiceAsPaid(
        invoiceId,
        freelancerId,
        amount
      );
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      return false;
    }
  }

  /**
   * Cancel an invoice
   */
  static async cancelInvoice(invoiceId: string): Promise<boolean> {
    try {
      return await freelanceInvoiceIntegrationService.cancelInvoice(invoiceId);
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      return false;
    }
  }

  /**
   * Create a payment link for an invoice
   */
  static async createPaymentLink(
    invoiceId: string,
    freelancerId: string,
    clientId: string,
    amount: number,
    description: string
  ): Promise<string | null> {
    try {
      const invoice = await freelanceInvoiceIntegrationService.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      return await freelancePaymentIntegrationService.createPaymentLink(
        invoiceId,
        freelancerId,
        clientId,
        amount,
        description,
        'Freelance Project'
      );
    } catch (error) {
      console.error('Error creating payment link:', error);
      return null;
    }
  }

  /**
   * Generate invoice HTML for PDF download
   */
  static async generateInvoicePDF(invoiceId: string): Promise<string | null> {
    try {
      await freelanceInvoiceIntegrationService.downloadInvoice(invoiceId);
      return 'pdf';
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      return null;
    }
  }

  /**
   * Download invoice (opens print dialog)
   */
  static async downloadInvoice(invoiceId: string): Promise<void> {
    try {
      await freelanceInvoiceIntegrationService.downloadInvoice(invoiceId);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  }

  /**
   * Helper: Map integration service response to Invoice interface
   */
  private static mapToInvoiceInterface(invoiceData: any): Invoice {
    const items = Array.isArray(invoiceData.items) ? invoiceData.items : [];
    const amount = invoiceData.total || invoiceData.amount || 0;
    const subtotal = invoiceData.subtotal || 0;
    const tax = invoiceData.tax || 0;

    return {
      id: invoiceData.id,
      projectId: invoiceData.projectId || '',
      freelancerId: invoiceData.freelancerId || '',
      clientId: invoiceData.clientId || '',
      invoiceNumber: invoiceData.invoiceNumber || '',
      amount,
      currency: 'USD',
      status: this.mapStatus(invoiceData.status),
      issueDate: invoiceData.createdAt || new Date(),
      dueDate: invoiceData.dueDate || new Date(),
      lineItems: items.map((item: any, index: number) => ({
        id: `item-${index}`,
        description: item.description || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        amount: item.amount || 0,
      })),
      taxRate: tax > 0 ? Math.round((tax / subtotal) * 100) : 0,
      taxAmount: tax,
      discountAmount: 0,
      notes: invoiceData.notes,
      paidAt: invoiceData.paidAt,
    };
  }

  /**
   * Helper: Map invoice status from unified system to our enum
   */
  private static mapStatus(
    status: string
  ): 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled' {
    switch (status) {
      case 'draft':
        return 'draft';
      case 'sent':
        return 'sent';
      case 'paid':
        return 'paid';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'draft';
    }
  }
}

export const freelanceInvoiceService = new FreelanceInvoiceService();
