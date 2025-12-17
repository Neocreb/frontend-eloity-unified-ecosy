import { supabase } from "@/integrations/supabase/client";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  recipientEmail?: string;
  recipientName?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface CreateInvoiceInput {
  recipientEmail?: string;
  recipientName?: string;
  items: InvoiceItem[];
  tax?: number;
  notes?: string;
  dueDate?: Date;
}

class InvoiceService {
  /**
   * Create a new invoice
   */
  async createInvoice(userId: string, input: CreateInvoiceInput): Promise<Invoice> {
    try {
      const invoiceNumber = this.generateInvoiceNumber();
      const subtotal = input.items.reduce((sum, item) => sum + item.amount, 0);
      const tax = input.tax || 0;
      const total = subtotal + tax;

      const { data, error } = await supabase
        .from('invoices')
        .insert([
          {
            invoice_number: invoiceNumber,
            user_id: userId,
            recipient_email: input.recipientEmail,
            recipient_name: input.recipientName,
            items: input.items,
            subtotal,
            tax,
            total,
            status: 'draft',
            notes: input.notes,
            due_date: input.dueDate?.toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error('Failed to create invoice');
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }

  /**
   * Get all invoices for a user
   */
  async getUserInvoices(userId: string, status?: string): Promise<Invoice[]> {
    try {
      let query = supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(invoice => this.mapFromDatabase(invoice));
    } catch (error) {
      console.error('Error fetching user invoices:', error);
      return [];
    }
  }

  /**
   * Update invoice
   */
  async updateInvoice(invoiceId: string, updates: Partial<CreateInvoiceInput>): Promise<Invoice> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.recipientEmail) updateData.recipient_email = updates.recipientEmail;
      if (updates.recipientName) updateData.recipient_name = updates.recipientName;
      if (updates.items) {
        const subtotal = updates.items.reduce((sum, item) => sum + item.amount, 0);
        const tax = updates.tax || 0;
        updateData.items = updates.items;
        updateData.subtotal = subtotal;
        updateData.tax = tax;
        updateData.total = subtotal + tax;
      }
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.dueDate) updateData.due_date = updates.dueDate.toISOString();

      const { data, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw new Error('Failed to update invoice');
    }
  }

  /**
   * Send invoice to recipient
   */
  async sendInvoice(invoiceId: string): Promise<boolean> {
    try {
      const invoice = await this.getInvoice(invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      const { error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId,
          recipientEmail: invoice.recipientEmail,
        },
      });

      if (error) throw error;

      // Update invoice status to sent
      await supabase
        .from('invoices')
        .update({
          status: 'sent',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      return true;
    } catch (error) {
      console.error('Error sending invoice:', error);
      return false;
    }
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(invoiceId: string): Promise<Invoice> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      throw new Error('Failed to mark invoice as paid');
    }
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(invoiceId: string): Promise<Invoice> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      throw new Error('Failed to cancel invoice');
    }
  }

  /**
   * Delete invoice (only if draft)
   */
  async deleteInvoice(invoiceId: string): Promise<boolean> {
    try {
      const invoice = await this.getInvoice(invoiceId);
      if (invoice?.status !== 'draft') {
        throw new Error('Only draft invoices can be deleted');
      }

      const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }

  /**
   * Download invoice as PDF
   */
  async downloadInvoicePDF(invoiceId: string): Promise<void> {
    try {
      const invoice = await this.getInvoice(invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      const htmlContent = this.generateInvoiceHTML(invoice);

      if (typeof window !== 'undefined') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 100);
        }
      }
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      throw new Error('Failed to download invoice');
    }
  }

  /**
   * Generate unique invoice number
   */
  private generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INV-${year}${month}-${random}`;
  }

  /**
   * Generate invoice HTML for PDF/printing
   */
  private generateInvoiceHTML(invoice: Invoice): string {
    const itemsHTML = invoice.items
      .map(
        item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.description}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.amount.toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border: 1px solid #ddd;
              border-radius: 4px;
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
              border-bottom: 2px solid #007bff;
              padding-bottom: 20px;
            }
            .invoice-title {
              font-size: 32px;
              font-weight: bold;
              color: #007bff;
            }
            .invoice-number {
              text-align: right;
            }
            .invoice-number p {
              margin: 5px 0;
            }
            .invoice-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 40px;
            }
            .detail-section h4 {
              color: #666;
              font-size: 12px;
              text-transform: uppercase;
              margin-bottom: 10px;
            }
            .detail-section p {
              margin: 5px 0;
            }
            .items-table {
              width: 100%;
              margin: 30px 0;
              border-collapse: collapse;
            }
            .items-table th {
              background-color: #f5f5f5;
              padding: 12px;
              text-align: left;
              border-bottom: 2px solid #ddd;
              font-weight: bold;
            }
            .items-table td {
              padding: 10px;
              border-bottom: 1px solid #ddd;
            }
            .totals {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
            }
            .totals-table {
              width: 300px;
              border-collapse: collapse;
            }
            .totals-table tr {
              border-bottom: 1px solid #ddd;
            }
            .totals-table th {
              text-align: left;
              padding: 8px;
              font-weight: bold;
            }
            .totals-table td {
              padding: 8px;
              text-align: right;
            }
            .total-row {
              background-color: #f5f5f5;
              font-weight: bold;
              font-size: 18px;
              color: #007bff;
            }
            .notes {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
              }
              .invoice-container {
                border: none;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <div>
                <div class="invoice-title">INVOICE</div>
              </div>
              <div class="invoice-number">
                <p><strong>${invoice.invoiceNumber}</strong></p>
                <p>Date: ${new Date(invoice.createdAt).toLocaleDateString()}</p>
                ${
                  invoice.dueDate
                    ? `<p>Due: ${new Date(invoice.dueDate).toLocaleDateString()}</p>`
                    : ''
                }
              </div>
            </div>

            <div class="invoice-details">
              <div class="detail-section">
                <h4>From</h4>
                <p><strong>Your Company</strong></p>
              </div>
              <div class="detail-section">
                <h4>Bill To</h4>
                <p><strong>${invoice.recipientName || 'Recipient'}</strong></p>
                ${invoice.recipientEmail ? `<p>${invoice.recipientEmail}</p>` : ''}
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <div class="totals">
              <table class="totals-table">
                <tr>
                  <th>Subtotal:</th>
                  <td>$${invoice.subtotal.toFixed(2)}</td>
                </tr>
                ${
                  invoice.tax
                    ? `
                  <tr>
                    <th>Tax:</th>
                    <td>$${invoice.tax.toFixed(2)}</td>
                  </tr>
                `
                    : ''
                }
                <tr class="total-row">
                  <th>Total:</th>
                  <td>$${invoice.total.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            ${
              invoice.notes
                ? `
              <div class="notes">
                <h4>Notes</h4>
                <p>${invoice.notes}</p>
              </div>
            `
                : ''
            }
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Map database response to Invoice interface
   */
  private mapFromDatabase(data: any): Invoice {
    return {
      id: data.id,
      invoiceNumber: data.invoice_number,
      userId: data.user_id,
      recipientEmail: data.recipient_email,
      recipientName: data.recipient_name,
      items: data.items || [],
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      status: data.status,
      notes: data.notes,
      dueDate: data.due_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      paidAt: data.paid_at,
    };
  }
}

export const invoiceService = new InvoiceService();
