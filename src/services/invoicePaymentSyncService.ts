import { supabase } from "@/integrations/supabase/client";

export interface InvoicePaymentRecord {
  id: string;
  userId: string;
  invoiceId?: string;
  paymentLinkId?: string;
  transactionType: 'invoice_received' | 'invoice_paid' | 'payment_link_created' | 'payment_link_used';
  amount?: number;
  status: 'active' | 'completed' | 'failed';
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

class InvoicePaymentSyncService {
  /**
   * Record an invoice payment to wallet transactions
   */
  async recordInvoicePayment(
    userId: string,
    invoiceId: string,
    amount: number,
    transactionType: 'invoice_received' | 'invoice_paid' = 'invoice_received'
  ): Promise<InvoicePaymentRecord | null> {
    try {
      const { data, error } = await supabase
        .from('wallet_invoice_payment_records')
        .insert([
          {
            user_id: userId,
            invoice_id: invoiceId,
            transaction_type: transactionType,
            amount,
            status: 'active',
            metadata: {
              recorded_at: new Date().toISOString(),
              invoice_sync: true,
            },
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error recording invoice payment:', error);
      return null;
    }
  }

  /**
   * Record a payment link creation to wallet transactions
   */
  async recordPaymentLinkCreated(
    userId: string,
    paymentLinkId: string,
    amount?: number
  ): Promise<InvoicePaymentRecord | null> {
    try {
      const { data, error } = await supabase
        .from('wallet_invoice_payment_records')
        .insert([
          {
            user_id: userId,
            payment_link_id: paymentLinkId,
            transaction_type: 'payment_link_created',
            amount,
            status: 'active',
            metadata: {
              recorded_at: new Date().toISOString(),
              payment_link_sync: true,
            },
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error recording payment link creation:', error);
      return null;
    }
  }

  /**
   * Record a payment link usage to wallet transactions
   */
  async recordPaymentLinkUsed(
    userId: string,
    paymentLinkId: string,
    amount: number,
    payerEmail?: string,
    payerName?: string
  ): Promise<InvoicePaymentRecord | null> {
    try {
      const { data, error } = await supabase
        .from('wallet_invoice_payment_records')
        .insert([
          {
            user_id: userId,
            payment_link_id: paymentLinkId,
            transaction_type: 'payment_link_used',
            amount,
            status: 'completed',
            metadata: {
              recorded_at: new Date().toISOString(),
              payer_email: payerEmail,
              payer_name: payerName,
              payment_link_sync: true,
            },
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error recording payment link usage:', error);
      return null;
    }
  }

  /**
   * Get all invoice/payment records for a user
   */
  async getUserRecords(userId: string): Promise<InvoicePaymentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('wallet_invoice_payment_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(record => this.mapFromDatabase(record));
    } catch (error) {
      console.error('Error fetching user records:', error);
      return [];
    }
  }

  /**
   * Get records by transaction type
   */
  async getRecordsByType(
    userId: string,
    transactionType: 'invoice_received' | 'invoice_paid' | 'payment_link_created' | 'payment_link_used'
  ): Promise<InvoicePaymentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('wallet_invoice_payment_records')
        .select('*')
        .eq('user_id', userId)
        .eq('transaction_type', transactionType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(record => this.mapFromDatabase(record));
    } catch (error) {
      console.error('Error fetching records by type:', error);
      return [];
    }
  }

  /**
   * Get invoice-related records
   */
  async getInvoiceRecords(userId: string, invoiceId: string): Promise<InvoicePaymentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('wallet_invoice_payment_records')
        .select('*')
        .eq('user_id', userId)
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(record => this.mapFromDatabase(record));
    } catch (error) {
      console.error('Error fetching invoice records:', error);
      return [];
    }
  }

  /**
   * Get payment link records
   */
  async getPaymentLinkRecords(userId: string, paymentLinkId: string): Promise<InvoicePaymentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('wallet_invoice_payment_records')
        .select('*')
        .eq('user_id', userId)
        .eq('payment_link_id', paymentLinkId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(record => this.mapFromDatabase(record));
    } catch (error) {
      console.error('Error fetching payment link records:', error);
      return [];
    }
  }

  /**
   * Get summary of invoice and payment link activity
   */
  async getActivitySummary(userId: string, daysBack: number = 30): Promise<{
    totalInvoicesCreated: number;
    totalInvoicesPaid: number;
    totalPaymentLinksCreated: number;
    totalPaymentLinksUsed: number;
    totalAmountFromInvoices: number;
    totalAmountFromPaymentLinks: number;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('wallet_invoice_payment_records')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', cutoffDate.toISOString());

      if (error) throw error;

      const records = data || [];
      const summary = {
        totalInvoicesCreated: records.filter(r => r.transaction_type === 'invoice_received').length,
        totalInvoicesPaid: records.filter(r => r.transaction_type === 'invoice_paid').length,
        totalPaymentLinksCreated: records.filter(r => r.transaction_type === 'payment_link_created').length,
        totalPaymentLinksUsed: records.filter(r => r.transaction_type === 'payment_link_used').length,
        totalAmountFromInvoices: records
          .filter(r => r.transaction_type.includes('invoice'))
          .reduce((sum, r) => sum + (r.amount || 0), 0),
        totalAmountFromPaymentLinks: records
          .filter(r => r.transaction_type.includes('payment_link'))
          .reduce((sum, r) => sum + (r.amount || 0), 0),
      };

      return summary;
    } catch (error) {
      console.error('Error fetching activity summary:', error);
      return {
        totalInvoicesCreated: 0,
        totalInvoicesPaid: 0,
        totalPaymentLinksCreated: 0,
        totalPaymentLinksUsed: 0,
        totalAmountFromInvoices: 0,
        totalAmountFromPaymentLinks: 0,
      };
    }
  }

  /**
   * Map database response to InvoicePaymentRecord
   */
  private mapFromDatabase(data: any): InvoicePaymentRecord {
    return {
      id: data.id,
      userId: data.user_id,
      invoiceId: data.invoice_id,
      paymentLinkId: data.payment_link_id,
      transactionType: data.transaction_type,
      amount: data.amount,
      status: data.status,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const invoicePaymentSyncService = new InvoicePaymentSyncService();
