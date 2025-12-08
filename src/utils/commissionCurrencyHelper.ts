import { getCurrencyByCode } from '@/contexts/CurrencyContext';

/**
 * Helper for proper currency handling in commission calculations
 * Ensures amounts are calculated in operator's native currency
 * while displaying conversions in user's currency
 */

export interface CommissionCurrencyContext {
  userCurrencyCode: string;
  operatorCurrencyCode: string;
  userAmount: number;
  exchangeRate: number | null;
}

export interface CommissionAmountsForApi {
  amountForCalculation: number; // Amount to send to commission API (in operator currency)
  operatorCurrencyCode: string;
  userCurrencyCode: string;
}

export interface CommissionResult {
  originalAmountUserCurrency: number;
  originalAmountOperatorCurrency: number;
  commissionValueOperatorCurrency: number;
  finalAmountOperatorCurrency: number;
  finalAmountUserCurrency: number;
  commissionType: string;
  commissionRate: number;
}

/**
 * Convert user's amount to operator currency for commission calculation
 * @param context - Currency conversion context
 * @returns Amount to send to commission API and metadata
 */
export function prepareAmountForCommissionCalculation(
  context: CommissionCurrencyContext
): CommissionAmountsForApi {
  const {
    userCurrencyCode,
    operatorCurrencyCode,
    userAmount,
    exchangeRate
  } = context;

  // If currencies are the same, use amount as-is
  if (userCurrencyCode === operatorCurrencyCode) {
    return {
      amountForCalculation: userAmount,
      operatorCurrencyCode,
      userCurrencyCode
    };
  }

  // If no exchange rate available, use user amount directly
  // (fallback, should not happen in normal operation)
  if (!exchangeRate || exchangeRate <= 0) {
    console.warn(
      `No exchange rate available for ${userCurrencyCode} to ${operatorCurrencyCode}. Using user amount directly.`
    );
    return {
      amountForCalculation: userAmount,
      operatorCurrencyCode,
      userCurrencyCode
    };
  }

  // Convert user amount to operator currency
  // exchange rate is: 1 userCurrency = X operatorCurrency
  const amountInOperatorCurrency = userAmount * exchangeRate;

  return {
    amountForCalculation: parseFloat(amountInOperatorCurrency.toFixed(2)),
    operatorCurrencyCode,
    userCurrencyCode
  };
}

/**
 * Convert commission result from operator currency back to user currency
 * @param apiResult - Commission calculation result from backend
 * @param context - Currency conversion context
 * @returns Final amounts in both currencies
 */
export function processCommissionResult(
  apiResult: {
    original_amount: number;
    commission_value: number;
    commission_type: string;
    commission_rate: number;
    final_amount: number;
    reloadly_amount: number;
  },
  context: CommissionCurrencyContext
): CommissionResult {
  const {
    userCurrencyCode,
    operatorCurrencyCode,
    userAmount,
    exchangeRate
  } = context;

  // If currencies are the same, return as-is
  if (userCurrencyCode === operatorCurrencyCode) {
    return {
      originalAmountUserCurrency: userAmount,
      originalAmountOperatorCurrency: apiResult.original_amount,
      commissionValueOperatorCurrency: apiResult.commission_value,
      finalAmountOperatorCurrency: apiResult.final_amount,
      finalAmountUserCurrency: apiResult.final_amount,
      commissionType: apiResult.commission_type,
      commissionRate: apiResult.commission_rate
    };
  }

  // If no exchange rate, convert back using reciprocal
  const reverseExchangeRate = exchangeRate && exchangeRate > 0 ? 1 / exchangeRate : 1;

  const finalAmountUserCurrency = apiResult.final_amount * reverseExchangeRate;
  const commissionUserCurrency = apiResult.commission_value * reverseExchangeRate;

  return {
    originalAmountUserCurrency: userAmount,
    originalAmountOperatorCurrency: apiResult.original_amount,
    commissionValueOperatorCurrency: apiResult.commission_value,
    commissionValueUserCurrency: parseFloat(commissionUserCurrency.toFixed(2)),
    finalAmountOperatorCurrency: apiResult.final_amount,
    finalAmountUserCurrency: parseFloat(finalAmountUserCurrency.toFixed(2)),
    commissionType: apiResult.commission_type,
    commissionRate: apiResult.commission_rate
  };
}

/**
 * Get reverse exchange rate (from operator currency to user currency)
 */
export function getReverseExchangeRate(
  forwardRate: number | null
): number | null {
  if (!forwardRate || forwardRate <= 0) {
    return null;
  }
  return 1 / forwardRate;
}

/**
 * Format commission breakdown for display
 */
export function formatCommissionBreakdown(
  result: CommissionResult,
  formatCurrency: (amount: number, code?: string) => string
): {
  originalAmount: string;
  commissionAmount: string;
  finalAmount: string;
  breakdown: Array<{ label: string; value: string }>;
} {
  return {
    originalAmount: formatCurrency(result.originalAmountUserCurrency),
    commissionAmount: formatCurrency(result.commissionValueUserCurrency || result.commissionValueOperatorCurrency),
    finalAmount: formatCurrency(result.finalAmountUserCurrency),
    breakdown: [
      {
        label: 'Original Amount',
        value: formatCurrency(result.originalAmountUserCurrency)
      },
      {
        label: `Commission (${result.commissionType === 'percentage' ? result.commissionRate + '%' : 'Fixed'})`,
        value: formatCurrency(result.commissionValueUserCurrency || result.commissionValueOperatorCurrency)
      },
      {
        label: 'Total to Pay',
        value: formatCurrency(result.finalAmountUserCurrency)
      }
    ]
  };
}
