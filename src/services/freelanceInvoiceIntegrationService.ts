// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { invoicePaymentSyncService } from './invoicePaymentSyncService';

/**
 * Freelance Invoice Integration Service
 * Creates and manages freelance invoices in the unified invoice system
 * No separate freelance_invoices table - uses shared invoices table with type: 'freelance'
 */

export interface FreelanceInvoiceInput {
  freelancerId: string;
  clientId: string;
  projectId: string;
  projectTitle: string;
  amount: number;
  description?: string;
  dueDate?: Date;
}

export interface MilestoneInvoiceInput {
  freelancerId: string;
  clientId: string;
  projectId: string;
  milestoneId: string;
  milestoneTitle: string;
  amount: number;
}

export class FreelanceInvoiceIntegrationService {
  /**
   * Create a freelance project invoice in the unified invoice system
   * Tags the invoice as type: 'freelance' for easy filtering
   */
  static async createProjectInvoice(input: FreelanceInvoiceInput): Promise<string | null> {
    try {
      // Get client and freelancer details for the invoice
      const [clientData, freelancerData] = await Promise.all([
        this.getProfileInfo(input.clientId),
        this.getProfileInfo(input.freelancerId),
      ]);

      // Generate invoice number
      const invoiceNumber = this.generateFreelanceInvoiceNumber();

      // Create invoice in unified system with type: 'freelance'
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert([
          {
            invoice_number: invoiceNumber,
            user_id: input.freelancerId, // Freelancer is the invoice owner
            recipient_email: clientData?.email || '',
            recipient_name: clientData?.full_name || input.projectTitle,
            items: [
              {
                description: input.description || `Work on: ${input.projectTitle}`,
                quantity: 1,
                unitPrice: input.amount,
                amount: input.amount,
              },
            ],
            subtotal: input.amount,
            tax: 0,
            total: input.amount,
            status: 'draft',
            notes: `Freelance project: ${input.projectTitle}`,
            due_date: input.dueDate?.toISOString() || this.getDefaultDueDate(),
            // NEW FIELDS for freelance integration
            type: 'freelance', // Tags as freelance invoice
            source_type: 'freelance_project',
            project_id: input.projectId,
            freelancer_id: input.freelancerId,
            client_id: input.clientId,
          },
        ])
        .select()
        .single();

      if (invoiceError) {
        console.error('Error creating freelance invoice:', invoiceError);
        return null;
      }

      // Record transaction in wallet sync service
      try {
        await invoicePaymentSyncService.recordInvoicePayment(
          input.clientId,
          invoiceData.id,
          input.amount,
          'invoice_received'
        );
      } catch (syncError) {
        console.warn('Warning: Could not record in sync service:', syncError);
        // Don't fail the invoice creation if sync fails
      }

      return invoiceData.id;
    } catch (error) {
      console.error('Error in createProjectInvoice:', error);
      return null;
    }
  }

  /**
   * Create a milestone payment invoice
   * Called when freelancer completes a milestone
   */
  static async createMilestoneInvoice(input: MilestoneInvoiceInput): Promise<string | null> {
    try {
      return await this.createProjectInvoice({
        freelancerId: input.freelancerId,
        clientId: input.clientId,
        projectId: input.projectId,
        projectTitle: `Milestone: ${input.milestoneTitle}`,
        amount: input.amount,
        description: `Payment for milestone: ${input.milestoneTitle}`,
      });
    } catch (error) {
      console.error('Error creating milestone invoice:', error);
      return null;
    }
  }

  /**
   * Get all freelance invoices for a freelancer
   */
  static async getFreelancerInvoices(freelancerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('type', 'freelance')
        .eq('freelancer_id', freelancerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching freelancer invoices:', error);
        return [];
      }

      return (data || []).map(invoice => this.mapInvoice(invoice));
    } catch (error) {
      console.error('Error in getFreelancerInvoices:', error);
      return [];
    }
  }

  /**
   * Get all invoices a client needs to pay
   */
  static async getClientInvoices(clientId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('type', 'freelance')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching client invoices:', error);
        return [];
      }

      return (data || []).map(invoice => this.mapInvoice(invoice));
    } catch (error) {
      console.error('Error in getClientInvoices:', error);
      return [];
    }
  }

  /**
   * Get invoices for a specific freelance project
   */
  static async getProjectInvoices(projectId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('type', 'freelance')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project invoices:', error);
        return [];
      }

      return (data || []).map(invoice => this.mapInvoice(invoice));
    } catch (error) {
      console.error('Error in getProjectInvoices:', error);
      return [];
    }
  }

  /**
   * Mark invoice as paid and sync with wallet
   * This updates the freelancer's freelance balance
   */
  static async markInvoiceAsPaid(
    invoiceId: string,
    freelancerId: string,
    amount: number
  ): Promise<boolean> {
    try {
      // Update invoice status
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (updateError) {
        console.error('Error updating invoice status:', updateError);
        return false;
      }

      // Record payment in wallet sync
      try {
        await invoicePaymentSyncService.recordInvoicePayment(
          freelancerId,
          invoiceId,
          amount,
          'invoice_paid'
        );
      } catch (syncError) {
        console.warn('Warning: Could not record payment in sync:', syncError);
      }

      // Update freelancer's balance (this will be handled by wallet integration)
      await this.updateFreelancerBalance(freelancerId, amount);

      return true;
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      return false;
    }
  }

  /**
   * Send invoice to client
   * Updates status from draft to sent
   */
  static async sendInvoice(invoiceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'sent',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (error) {
        console.error('Error sending invoice:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in sendInvoice:', error);
      return false;
    }
  }

  /**
   * Cancel invoice
   */
  static async cancelInvoice(invoiceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (error) {
        console.error('Error cancelling invoice:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in cancelInvoice:', error);
      return false;
    }
  }

  /**
   * Update freelancer's balance in wallet
   * This should trigger wallet service to update freelance balance
   */
  private static async updateFreelancerBalance(
    freelancerId: string,
    amount: number
  ): Promise<void> {
    try {
      // Call wallet API to update freelance balance
      // This endpoint should add amount to freelancer's freelance balance
      const response = await fetch(`/api/wallet/update-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: freelancerId,
          type: 'freelance',
          amount: amount,
          action: 'add',
          source: 'invoice_payment',
        }),
      });

      if (!response.ok) {
        console.warn('Could not update wallet balance');
        // Don't throw - invoice should still be marked as paid
      }
    } catch (error) {
      console.warn('Warning: Could not update wallet balance:', error);
      // Don't throw - invoice should still be marked as paid
    }
  }

  /**
   * Get invoice details
   */
  static async getInvoice(invoiceId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) {
        console.error('Error fetching invoice:', error);
        return null;
      }

      return this.mapInvoice(data);
    } catch (error) {
      console.error('Error in getInvoice:', error);
      return null;
    }
  }

  /**
   * Download/export invoice (returns HTML for PDF generation)
   */
  static async getInvoiceHTML(invoiceId: string): Promise<string | null> {
    try {
      const invoice = await this.getInvoice(invoiceId);
      if (!invoice) return null;

      // Generate HTML invoice
      return this.generateInvoiceHTML(invoice);
    } catch (error) {
      console.error('Error generating invoice HTML:', error);
      return null;
    }
  }

  /**
   * Generate HTML representation of invoice
   */
  private static generateInvoiceHTML(invoice: any): string {
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    const itemsHTML = items
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.amount.toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .invoice { max-width: 800px; margin: 0 auto; }
            .header { margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .title { font-size: 28px; font-weight: bold; }
            .invoice-number { color: #666; font-size: 14px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; font-size: 12px; color: #666; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { text-align: left; padding: 10px; background: #f5f5f5; font-weight: bold; border-bottom: 2px solid #ddd; }
            .total-row { text-align: right; font-weight: bold; font-size: 18px; padding: 20px 0; }
            .status { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .status-draft { background: #fff3cd; color: #856404; }
            .status-sent { background: #d1ecf1; color: #0c5460; }
            .status-paid { background: #d4edda; color: #155724; }
            .status-cancelled { background: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <div class="title">Invoice</div>
              <div class="invoice-number">#${invoice.invoice_number}</div>
              <div style="margin-top: 10px;">
                <span class="status status-${invoice.status}">${invoice.status.toUpperCase()}</span>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
              <div class="section">
                <div class="label">Bill From</div>
                <p style="margin: 5px 0;">Freelancer</p>
              </div>
              <div class="section">
                <div class="label">Bill To</div>
                <p style="margin: 5px 0;">${invoice.recipient_name || 'Client'}</p>
                <p style="margin: 5px 0; font-size: 12px;">${invoice.recipient_email || ''}</p>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px;">
              <div class="section">
                <div class="label">Invoice Date</div>
                <p style="margin: 5px 0;">${new Date(invoice.created_at).toLocaleDateString()}</p>
              </div>
              <div class="section">
                <div class="label">Due Date</div>
                <p style="margin: 5px 0;">${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Not set'}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="width: 80px; text-align: right;">Qty</th>
                  <th style="width: 100px; text-align: right;">Unit Price</th>
                  <th style="width: 100px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <div style="text-align: right;">
              <div class="section">
                <div style="margin-bottom: 10px;">Subtotal: $${invoice.subtotal.toFixed(2)}</div>
                ${invoice.tax ? `<div style="margin-bottom: 10px;">Tax: $${invoice.tax.toFixed(2)}</div>` : ''}
                <div class="total-row">Total: $${invoice.total.toFixed(2)}</div>
              </div>
            </div>

            ${invoice.notes ? `<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;"><strong>Notes:</strong><p>${invoice.notes}</p></div>` : ''}
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Helper: Get user profile info
   */
  private static async getProfileInfo(userId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  /**
   * Helper: Generate freelance invoice number
   */
  private static generateFreelanceInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(5, '0');
    return `FL-${year}${month}-${random}`;
  }

  /**
   * Helper: Get default due date (30 days from now)
   */
  private static getDefaultDueDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString();
  }

  /**
   * Helper: Map invoice from database format
   */
  private static mapInvoice(data: any): any {
    return {
      id: data.id,
      invoiceNumber: data.invoice_number,
      freelancerId: data.freelancer_id,
      clientId: data.client_id,
      projectId: data.project_id,
      recipientName: data.recipient_name,
      recipientEmail: data.recipient_email,
      items: Array.isArray(data.items) ? data.items : [],
      subtotal: parseFloat(data.subtotal || '0'),
      tax: parseFloat(data.tax || '0'),
      total: parseFloat(data.total || '0'),
      status: data.status,
      notes: data.notes,
      dueDate: data.due_date ? new Date(data.due_date) : null,
      paidAt: data.paid_at ? new Date(data.paid_at) : null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

export const freelanceInvoiceIntegrationService = new FreelanceInvoiceIntegrationService();
