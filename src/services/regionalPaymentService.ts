import { supabase } from "@/integrations/supabase/client";
import {
  REGIONAL_PAYMENT_METHODS,
  calculateFees,
  getPaymentMethodById,
} from "@/config/regionalPaymentMethods";

export interface RegionalPaymentTransaction {
  id: string;
  userId: string;
  methodId: string;
  amount: number;
  fee: number;
  total: number;
  status: 'pending' | 'completed' | 'failed';
  recipientPhone?: string;
  recipientName?: string;
  reference?: string;
  createdAt: string;
  updatedAt: string;
}

class RegionalPaymentService {
  /**
   * Initiate a regional payment
   */
  async initiatePayment(
    userId: string,
    methodId: string,
    amount: number,
    recipientPhone: string,
    recipientName?: string
  ): Promise<RegionalPaymentTransaction> {
    try {
      const method = getPaymentMethodById(methodId);
      if (!method) {
        throw new Error('Payment method not found');
      }

      if (amount < method.minAmount || amount > method.maxAmount) {
        throw new Error(
          `Amount must be between ${method.minAmount} and ${method.maxAmount}`
        );
      }

      const feeData = calculateFees(amount, methodId);
      const reference = this.generateReference();

      const { data, error } = await supabase
        .from('regional_payments')
        .insert([
          {
            user_id: userId,
            method_id: methodId,
            amount,
            fee: feeData.fee,
            total: feeData.total,
            status: 'pending',
            recipient_phone: recipientPhone,
            recipient_name: recipientName,
            reference,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error initiating regional payment:', error);
      throw new Error('Failed to initiate payment');
    }
  }

  /**
   * Get payment transaction
   */
  async getPaymentTransaction(transactionId: string): Promise<RegionalPaymentTransaction | null> {
    try {
      const { data, error } = await supabase
        .from('regional_payments')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error fetching payment transaction:', error);
      return null;
    }
  }

  /**
   * Get user's payment history
   */
  async getUserPaymentHistory(userId: string, limit = 50): Promise<RegionalPaymentTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('regional_payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(payment => this.mapFromDatabase(payment));
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }

  /**
   * Get payments by status
   */
  async getPaymentsByStatus(
    userId: string,
    status: string
  ): Promise<RegionalPaymentTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('regional_payments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(payment => this.mapFromDatabase(payment));
    } catch (error) {
      console.error('Error fetching payments by status:', error);
      return [];
    }
  }

  /**
   * Confirm payment completion
   */
  async confirmPayment(transactionId: string): Promise<RegionalPaymentTransaction> {
    try {
      const { data, error } = await supabase
        .from('regional_payments')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw new Error('Failed to confirm payment');
    }
  }

  /**
   * Mark payment as failed
   */
  async failPayment(transactionId: string, reason?: string): Promise<RegionalPaymentTransaction> {
    try {
      const { data, error } = await supabase
        .from('regional_payments')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error marking payment as failed:', error);
      throw new Error('Failed to update payment status');
    }
  }

  /**
   * Get available payment methods for a country
   */
  getAvailableMethodsForCountry(countryCode: string) {
    return REGIONAL_PAYMENT_METHODS.filter(
      m => m.countryCode === countryCode && m.isActive
    );
  }

  /**
   * Validate payment details
   */
  validatePaymentDetails(
    methodId: string,
    amount: number,
    recipientPhone: string
  ): { isValid: boolean; error?: string } {
    const method = getPaymentMethodById(methodId);

    if (!method) {
      return { isValid: false, error: 'Invalid payment method' };
    }

    if (!method.isActive) {
      return { isValid: false, error: 'Payment method is currently unavailable' };
    }

    if (amount < method.minAmount) {
      return {
        isValid: false,
        error: `Minimum amount is ${method.currency} ${method.minAmount}`,
      };
    }

    if (amount > method.maxAmount) {
      return {
        isValid: false,
        error: `Maximum amount is ${method.currency} ${method.maxAmount}`,
      };
    }

    if (!recipientPhone || recipientPhone.length < 9) {
      return { isValid: false, error: 'Invalid phone number' };
    }

    return { isValid: true };
  }

  /**
   * Generate unique payment reference
   */
  private generateReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY-${timestamp}-${random}`;
  }

  /**
   * Map database response to RegionalPaymentTransaction
   */
  private mapFromDatabase(data: any): RegionalPaymentTransaction {
    return {
      id: data.id,
      userId: data.user_id,
      methodId: data.method_id,
      amount: data.amount,
      fee: data.fee,
      total: data.total,
      status: data.status,
      recipientPhone: data.recipient_phone,
      recipientName: data.recipient_name,
      reference: data.reference,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const regionalPaymentService = new RegionalPaymentService();
