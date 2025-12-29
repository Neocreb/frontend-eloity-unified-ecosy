// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { walletService } from './walletService';

/**
 * Freelance Withdrawal Integration Service
 * Manages freelancer earnings withdrawals
 * Uses the existing unified withdrawals system, not creating duplicates
 */

export interface WithdrawalRequest {
  freelancerId: string;
  amount: number;
  withdrawalMethod: 'bank_transfer' | 'paypal' | 'crypto' | 'mobile_money';
  withdrawalDetails: WithdrawalDetails;
}

export interface WithdrawalDetails {
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  paypalEmail?: string;
  cryptoAddress?: string;
  cryptoNetwork?: string;
  mobileMoneyNumber?: string;
  mobileMoneyProvider?: string;
  mobileMoneyCountry?: string;
}

export interface WithdrawalResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  method: string;
}

export class FreelanceWithdrawalIntegrationService {
  /**
   * Request a withdrawal from freelance earnings
   * Creates withdrawal in unified system with freelance_earnings type
   */
  static async requestWithdrawal(input: WithdrawalRequest): Promise<string | null> {
    try {
      // Verify freelancer has sufficient balance
      const eligibility = await this.checkWithdrawalEligibility(input.freelancerId);
      if (!eligibility.isEligible) {
        console.error('Not eligible for withdrawal:', eligibility.reason);
        return null;
      }

      if (input.amount < eligibility.minimumWithdrawal) {
        console.error(`Minimum withdrawal is ${eligibility.minimumWithdrawal}`);
        return null;
      }

      if (input.amount > eligibility.balance) {
        console.error('Insufficient balance for requested withdrawal');
        return null;
      }

      // Validate withdrawal details based on method
      const validationError = this.validateWithdrawalDetails(
        input.withdrawalMethod,
        input.withdrawalDetails
      );
      if (validationError) {
        console.error('Invalid withdrawal details:', validationError);
        return null;
      }

      // Create withdrawal request in unified system
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert([
          {
            user_id: input.freelancerId,
            amount: input.amount,
            withdrawal_method: input.withdrawalMethod,
            withdrawal_details: input.withdrawalDetails,
            status: 'pending',
            withdrawal_type: 'freelance_earnings', // New field to identify freelance withdrawals
            metadata: {
              source: 'freelance_platform',
              created_at: new Date().toISOString(),
              requested_by: input.freelancerId,
            },
          },
        ])
        .select()
        .single();

      if (withdrawalError) {
        console.error('Error creating withdrawal request:', withdrawalError);
        return null;
      }

      // Record withdrawal transaction in wallet history
      try {
        await supabase.from('wallet_transactions').insert([
          {
            user_id: input.freelancerId,
            transaction_type: 'withdrawal_request',
            amount: input.amount.toString(),
            balance_type: 'freelance',
            withdrawal_id: withdrawalData.id,
            status: 'pending',
            description: `Withdrawal request: ${input.amount} via ${input.withdrawalMethod}`,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (txError) {
        console.warn('Warning: Could not record transaction:', txError);
      }

      return withdrawalData.id;
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      return null;
    }
  }

  /**
   * Check if freelancer is eligible to withdraw
   */
  static async checkWithdrawalEligibility(freelancerId: string): Promise<{
    isEligible: boolean;
    balance: number;
    minimumWithdrawal: number;
    maximumWithdrawal: number;
    reason?: string;
  }> {
    try {
      // Get current freelance balance
      const walletBalance = await walletService.getWalletBalance();
      const balance = walletBalance.freelance || 0;

      const minimumWithdrawal = 10; // $10 minimum
      const maximumWithdrawal = 50000; // $50,000 maximum per withdrawal

      // Check eligibility criteria
      if (balance < minimumWithdrawal) {
        return {
          isEligible: false,
          balance,
          minimumWithdrawal,
          maximumWithdrawal,
          reason: `Minimum withdrawal is $${minimumWithdrawal}`,
        };
      }

      // Check if freelancer has completed profile
      const profileComplete = await this.isProfileComplete(freelancerId);
      if (!profileComplete) {
        return {
          isEligible: false,
          balance,
          minimumWithdrawal,
          maximumWithdrawal,
          reason: 'Please complete your profile to enable withdrawals',
        };
      }

      // Check for active disputes
      const hasDisputes = await this.hasActiveDisputes(freelancerId);
      if (hasDisputes) {
        return {
          isEligible: false,
          balance,
          minimumWithdrawal,
          maximumWithdrawal,
          reason: 'Cannot withdraw with active disputes',
        };
      }

      return {
        isEligible: true,
        balance,
        minimumWithdrawal,
        maximumWithdrawal,
      };
    } catch (error) {
      console.error('Error checking withdrawal eligibility:', error);
      return {
        isEligible: false,
        balance: 0,
        minimumWithdrawal: 10,
        maximumWithdrawal: 50000,
        reason: 'Error checking eligibility',
      };
    }
  }

  /**
   * Get withdrawal request details
   */
  static async getWithdrawal(withdrawalId: string): Promise<WithdrawalResponse | null> {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (error) {
        console.error('Error fetching withdrawal:', error);
        return null;
      }

      return this.mapWithdrawal(data);
    } catch (error) {
      console.error('Error in getWithdrawal:', error);
      return null;
    }
  }

  /**
   * Get all withdrawal requests for a freelancer
   */
  static async getFreelancerWithdrawals(
    freelancerId: string,
    status?: string
  ): Promise<WithdrawalResponse[]> {
    try {
      let query = supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', freelancerId)
        .eq('withdrawal_type', 'freelance_earnings'); // Only freelance earnings

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching withdrawals:', error);
        return [];
      }

      return (data || []).map(withdrawal => this.mapWithdrawal(withdrawal));
    } catch (error) {
      console.error('Error in getFreelancerWithdrawals:', error);
      return [];
    }
  }

  /**
   * Cancel a pending withdrawal
   */
  static async cancelWithdrawal(withdrawalId: string): Promise<boolean> {
    try {
      // Get withdrawal details first
      const withdrawal = await this.getWithdrawal(withdrawalId);
      if (!withdrawal || withdrawal.status !== 'pending') {
        console.error('Can only cancel pending withdrawals');
        return false;
      }

      // Update withdrawal status
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      if (updateError) {
        console.error('Error cancelling withdrawal:', updateError);
        return false;
      }

      // Record cancellation in transaction history
      try {
        await supabase.from('wallet_transactions').insert([
          {
            user_id: (await supabase.auth.getUser()).data.user?.id,
            transaction_type: 'withdrawal_cancelled',
            amount: withdrawal.amount.toString(),
            balance_type: 'freelance',
            withdrawal_id: withdrawalId,
            status: 'completed',
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (txError) {
        console.warn('Warning: Could not record cancellation:', txError);
      }

      return true;
    } catch (error) {
      console.error('Error cancelling withdrawal:', error);
      return false;
    }
  }

  /**
   * Get withdrawal statistics for a freelancer
   */
  static async getWithdrawalStats(freelancerId: string): Promise<{
    totalWithdrawn: number;
    totalPending: number;
    totalFailed: number;
    lastWithdrawalDate?: Date;
  }> {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', freelancerId)
        .eq('withdrawal_type', 'freelance_earnings');

      if (error) throw error;

      const withdrawals = data || [];
      const completedWithdrawals = withdrawals.filter(w => w.status === 'completed');
      const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
      const failedWithdrawals = withdrawals.filter(w => w.status === 'failed');

      const totalWithdrawn = completedWithdrawals.reduce(
        (sum, w) => sum + parseFloat(w.amount || '0'),
        0
      );
      const totalPending = pendingWithdrawals.reduce(
        (sum, w) => sum + parseFloat(w.amount || '0'),
        0
      );
      const totalFailed = failedWithdrawals.reduce((sum, w) => sum + parseFloat(w.amount || '0'), 0);

      const lastWithdrawal = completedWithdrawals.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0];

      return {
        totalWithdrawn,
        totalPending,
        totalFailed,
        lastWithdrawalDate: lastWithdrawal ? new Date(lastWithdrawal.updated_at) : undefined,
      };
    } catch (error) {
      console.error('Error getting withdrawal stats:', error);
      return {
        totalWithdrawn: 0,
        totalPending: 0,
        totalFailed: 0,
      };
    }
  }

  /**
   * Helper: Validate withdrawal details based on method
   */
  private static validateWithdrawalDetails(
    method: string,
    details: WithdrawalDetails
  ): string | null {
    switch (method) {
      case 'bank_transfer':
        if (!details.accountNumber) return 'Account number required';
        if (!details.bankName) return 'Bank name required';
        return null;

      case 'paypal':
        if (!details.paypalEmail) return 'PayPal email required';
        return null;

      case 'crypto':
        if (!details.cryptoAddress) return 'Crypto address required';
        if (!details.cryptoNetwork) return 'Crypto network required';
        return null;

      case 'mobile_money':
        if (!details.mobileMoneyNumber) return 'Mobile money number required';
        if (!details.mobileMoneyProvider) return 'Mobile money provider required';
        return null;

      default:
        return 'Invalid withdrawal method';
    }
  }

  /**
   * Helper: Check if profile is complete
   */
  private static async isProfileComplete(freelancerId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('user_id', freelancerId)
        .single();

      if (error) return false;

      // Check if essential fields are filled
      return !!(data.professional_title && data.overview && data.skills?.length > 0);
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      return false;
    }
  }

  /**
   * Helper: Check if freelancer has active disputes
   */
  private static async hasActiveDisputes(freelancerId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('freelance_disputes')
        .select('id')
        .or(
          `filed_by_id.eq.${freelancerId},filed_against_id.eq.${freelancerId},arbiter_id.eq.${freelancerId}`
        )
        .in('status', ['open', 'in_review', 'mediation']);

      if (error) return false;

      return (data || []).length > 0;
    } catch (error) {
      console.error('Error checking disputes:', error);
      return false;
    }
  }

  /**
   * Helper: Map withdrawal from database format
   */
  private static mapWithdrawal(data: any): WithdrawalResponse {
    return {
      id: data.id,
      status: data.status,
      amount: parseFloat(data.amount || '0'),
      method: data.withdrawal_method,
    };
  }
}

export const freelanceWithdrawalIntegrationService = new FreelanceWithdrawalIntegrationService();
