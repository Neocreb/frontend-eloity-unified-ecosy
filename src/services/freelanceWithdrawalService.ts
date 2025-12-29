// @ts-nocheck
/**
 * Freelance Withdrawal Service (Updated)
 * This service now delegates to freelanceWithdrawalIntegrationService
 * Uses the unified wallet withdrawal system instead of creating duplicates
 */

import { freelanceWithdrawalIntegrationService } from './freelanceWithdrawalIntegrationService';

export interface Withdrawal {
  id: string;
  freelancerId: string;
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'paypal' | 'crypto' | 'mobile_money';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    routingNumber?: string;
    swiftCode?: string;
  };
  paypalEmail?: string;
  cryptoAddress?: string;
  cryptoNetwork?: string;
  mobileNumber?: string;
  mobileProvider?: string;
  fee: number;
  netAmount: number;
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export class FreelanceWithdrawalService {
  /**
   * Request a withdrawal from freelance earnings
   * Uses unified wallet system
   */
  static async requestWithdrawal(
    freelancerId: string,
    amount: number,
    method: Withdrawal['method'],
    bankDetails?: any
  ): Promise<Withdrawal | null> {
    try {
      // Prepare withdrawal details based on method
      const withdrawalDetails = this.prepareWithdrawalDetails(method, bankDetails);

      // Create withdrawal via integration service
      const withdrawalId = await freelanceWithdrawalIntegrationService.requestWithdrawal({
        freelancerId,
        amount,
        withdrawalMethod: method,
        withdrawalDetails,
      });

      if (!withdrawalId) {
        throw new Error('Failed to create withdrawal request');
      }

      // Calculate fee
      const { fee, netAmount } = this.calculateWithdrawalFee(amount, method);

      return {
        id: withdrawalId,
        freelancerId,
        amount,
        currency: 'USD',
        method,
        status: 'pending',
        bankDetails: method === 'bank_transfer' ? bankDetails : undefined,
        paypalEmail: method === 'paypal' ? bankDetails?.paypalEmail : undefined,
        cryptoAddress: method === 'crypto' ? bankDetails?.cryptoAddress : undefined,
        cryptoNetwork: method === 'crypto' ? bankDetails?.cryptoNetwork : undefined,
        mobileNumber: method === 'mobile_money' ? bankDetails?.mobileNumber : undefined,
        mobileProvider: method === 'mobile_money' ? bankDetails?.mobileProvider : undefined,
        fee,
        netAmount,
        requestedAt: new Date(),
        metadata: {
          source: 'freelance_platform',
          created_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      return null;
    }
  }

  /**
   * Check withdrawal eligibility
   */
  static async checkEligibility(freelancerId: string): Promise<{
    eligible: boolean;
    balance: number;
    minimumWithdrawal: number;
    reason?: string;
  }> {
    try {
      const eligibility = await freelanceWithdrawalIntegrationService.checkWithdrawalEligibility(
        freelancerId
      );

      return {
        eligible: eligibility.isEligible,
        balance: eligibility.balance,
        minimumWithdrawal: eligibility.minimumWithdrawal,
        reason: eligibility.reason,
      };
    } catch (error) {
      console.error('Error checking withdrawal eligibility:', error);
      return {
        eligible: false,
        balance: 0,
        minimumWithdrawal: 10,
        reason: 'Error checking eligibility',
      };
    }
  }

  /**
   * Get withdrawal details
   */
  static async getWithdrawal(withdrawalId: string): Promise<Withdrawal | null> {
    try {
      const withdrawal = await freelanceWithdrawalIntegrationService.getWithdrawal(withdrawalId);
      if (!withdrawal) return null;

      return {
        id: withdrawal.id,
        freelancerId: '',
        amount: withdrawal.amount,
        currency: 'USD',
        method: withdrawal.method as any,
        status: withdrawal.status as any,
        fee: 0,
        netAmount: withdrawal.amount,
        requestedAt: new Date(),
      };
    } catch (error) {
      console.error('Error fetching withdrawal:', error);
      return null;
    }
  }

  /**
   * Get all withdrawals for a freelancer
   */
  static async getFreelancerWithdrawals(
    freelancerId: string,
    status?: string
  ): Promise<Withdrawal[]> {
    try {
      const withdrawals = await freelanceWithdrawalIntegrationService.getFreelancerWithdrawals(
        freelancerId,
        status
      );

      return withdrawals.map(w => ({
        id: w.id,
        freelancerId,
        amount: w.amount,
        currency: 'USD',
        method: w.method as any,
        status: w.status as any,
        fee: this.calculateFeeAmount(w.amount),
        netAmount: w.amount - this.calculateFeeAmount(w.amount),
        requestedAt: new Date(),
      }));
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      return [];
    }
  }

  /**
   * Cancel a withdrawal
   */
  static async cancelWithdrawal(withdrawalId: string): Promise<boolean> {
    try {
      return await freelanceWithdrawalIntegrationService.cancelWithdrawal(withdrawalId);
    } catch (error) {
      console.error('Error cancelling withdrawal:', error);
      return false;
    }
  }

  /**
   * Get withdrawal statistics
   */
  static async getWithdrawalStats(freelancerId: string): Promise<{
    totalWithdrawn: number;
    totalPending: number;
    totalFailed: number;
    lastWithdrawal?: Date;
  }> {
    try {
      return await freelanceWithdrawalIntegrationService.getWithdrawalStats(freelancerId);
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
   * Helper: Calculate withdrawal fee
   */
  private static calculateWithdrawalFee(
    amount: number,
    method: string
  ): {
    fee: number;
    netAmount: number;
  } {
    let feePercentage = 0;
    let flatFee = 0;

    switch (method) {
      case 'bank_transfer':
        feePercentage = 1.5; // 1.5%
        flatFee = 1; // $1
        break;
      case 'paypal':
        feePercentage = 2; // 2%
        flatFee = 0.3; // $0.30
        break;
      case 'crypto':
        feePercentage = 1; // 1%
        flatFee = 0; // $0
        break;
      case 'mobile_money':
        feePercentage = 2.5; // 2.5%
        flatFee = 0; // $0
        break;
      default:
        feePercentage = 2;
    }

    const fee = Math.max(amount * (feePercentage / 100) + flatFee, 0.5); // Minimum $0.50
    const netAmount = amount - fee;

    return { fee, netAmount };
  }

  /**
   * Helper: Calculate just fee amount
   */
  private static calculateFeeAmount(amount: number): number {
    const { fee } = this.calculateWithdrawalFee(amount, 'bank_transfer');
    return fee;
  }

  /**
   * Helper: Prepare withdrawal details based on method
   */
  private static prepareWithdrawalDetails(method: string, details: any): any {
    const prepared: any = {};

    switch (method) {
      case 'bank_transfer':
        prepared.bankName = details?.bankName;
        prepared.accountNumber = details?.accountNumber;
        prepared.accountHolderName = details?.accountHolder;
        prepared.routingNumber = details?.routingNumber;
        prepared.swiftCode = details?.swiftCode;
        break;

      case 'paypal':
        prepared.paypalEmail = details?.paypalEmail;
        break;

      case 'crypto':
        prepared.cryptoAddress = details?.cryptoAddress;
        prepared.cryptoNetwork = details?.cryptoNetwork;
        break;

      case 'mobile_money':
        prepared.mobileMoneyNumber = details?.mobileNumber;
        prepared.mobileMoneyProvider = details?.mobileProvider;
        prepared.mobileMoneyCountry = details?.country;
        break;
    }

    return prepared;
  }

  /**
   * Get available balance for withdrawal
   * This should be synced from wallet service
   */
  static async getAvailableBalance(freelancerId: string): Promise<number> {
    try {
      const eligibility = await freelanceWithdrawalIntegrationService.checkWithdrawalEligibility(
        freelancerId
      );
      return eligibility.balance;
    } catch (error) {
      console.error('Error getting available balance:', error);
      return 0;
    }
  }

  /**
   * Calculate earnings
   */
  static async calculateEarnings(
    freelancerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      // This would need to query invoices marked as paid within date range
      const stats = await freelanceWithdrawalIntegrationService.getWithdrawalStats(freelancerId);
      return stats.totalWithdrawn;
    } catch (error) {
      console.error('Error calculating earnings:', error);
      return 0;
    }
  }
}

export const freelanceWithdrawalService = new FreelanceWithdrawalService();
