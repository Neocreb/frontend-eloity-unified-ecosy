export interface RegionalPaymentMethod {
  id: string;
  country: string;
  countryCode: string;
  region: string;
  name: string;
  description: string;
  icon: string;
  currency: string;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
  fees: {
    fixed: number;
    percentage: number;
  };
  processingTime: string;
  supportedBanks?: string[];
  supportedProviders?: string[];
}

export const REGIONAL_PAYMENT_METHODS: RegionalPaymentMethod[] = [
  // Uganda Payment Methods
  {
    id: 'mtn-uganda',
    country: 'Uganda',
    countryCode: 'UG',
    region: 'East Africa',
    name: 'MTN Mobile Money',
    description: 'MTN Uganda mobile money service (MOMO)',
    icon: '📱',
    currency: 'UGX',
    minAmount: 1000,
    maxAmount: 10000000,
    isActive: true,
    fees: {
      fixed: 0,
      percentage: 1.5,
    },
    processingTime: 'Instant',
    supportedProviders: ['MTN Uganda'],
  },
  {
    id: 'airtel-uganda',
    country: 'Uganda',
    countryCode: 'UG',
    region: 'East Africa',
    name: 'Airtel Money',
    description: 'Airtel Uganda money transfer service',
    icon: '📲',
    currency: 'UGX',
    minAmount: 1000,
    maxAmount: 10000000,
    isActive: true,
    fees: {
      fixed: 0,
      percentage: 2.0,
    },
    processingTime: 'Instant',
    supportedProviders: ['Airtel Uganda'],
  },
  {
    id: 'equity-bank-uganda',
    country: 'Uganda',
    countryCode: 'UG',
    region: 'East Africa',
    name: 'Equity Bank Transfer',
    description: 'Equity Bank Uganda direct transfer',
    icon: '🏦',
    currency: 'UGX',
    minAmount: 10000,
    maxAmount: 50000000,
    isActive: true,
    fees: {
      fixed: 1000,
      percentage: 0.5,
    },
    processingTime: '1-2 hours',
    supportedBanks: ['Equity Bank Uganda', 'Stanbic Bank Uganda', 'Standard Chartered Uganda'],
  },

  // Tanzania Payment Methods
  {
    id: 'vodacom-tanzania',
    country: 'Tanzania',
    countryCode: 'TZ',
    region: 'East Africa',
    name: 'Vodacom M-Pesa',
    description: 'Vodacom Tanzania M-Pesa mobile money',
    icon: '💳',
    currency: 'TZS',
    minAmount: 500,
    maxAmount: 5000000,
    isActive: true,
    fees: {
      fixed: 0,
      percentage: 1.8,
    },
    processingTime: 'Instant',
    supportedProviders: ['Vodacom Tanzania', 'Safaricom Tanzania'],
  },
  {
    id: 'tigo-tanzania',
    country: 'Tanzania',
    countryCode: 'TZ',
    region: 'East Africa',
    name: 'Tigo Pesa',
    description: 'Tigo Tanzania mobile money service',
    icon: '📞',
    currency: 'TZS',
    minAmount: 500,
    maxAmount: 5000000,
    isActive: true,
    fees: {
      fixed: 0,
      percentage: 2.0,
    },
    processingTime: 'Instant',
    supportedProviders: ['Tigo Tanzania'],
  },
  {
    id: 'crdb-tanzania',
    country: 'Tanzania',
    countryCode: 'TZ',
    region: 'East Africa',
    name: 'CRDB Bank Transfer',
    description: 'CRDB Bank Tanzania bank transfer',
    icon: '🏦',
    currency: 'TZS',
    minAmount: 5000,
    maxAmount: 50000000,
    isActive: true,
    fees: {
      fixed: 2500,
      percentage: 0.5,
    },
    processingTime: '1-2 hours',
    supportedBanks: ['CRDB Bank', 'National Microfinance Bank', 'TIB Bank Tanzania'],
  },

  // Rwanda Payment Methods
  {
    id: 'mtn-rwanda',
    country: 'Rwanda',
    countryCode: 'RW',
    region: 'East Africa',
    name: 'MTN Mobile Money',
    description: 'MTN Rwanda mobile money service',
    icon: '📱',
    currency: 'RWF',
    minAmount: 1000,
    maxAmount: 2000000,
    isActive: true,
    fees: {
      fixed: 0,
      percentage: 1.5,
    },
    processingTime: 'Instant',
    supportedProviders: ['MTN Rwanda'],
  },
  {
    id: 'airtel-rwanda',
    country: 'Rwanda',
    countryCode: 'RW',
    region: 'East Africa',
    name: 'Airtel Money',
    description: 'Airtel Rwanda money transfer service',
    icon: '📲',
    currency: 'RWF',
    minAmount: 1000,
    maxAmount: 2000000,
    isActive: true,
    fees: {
      fixed: 0,
      percentage: 2.0,
    },
    processingTime: 'Instant',
    supportedProviders: ['Airtel Rwanda'],
  },
  {
    id: 'bpr-rwanda',
    country: 'Rwanda',
    countryCode: 'RW',
    region: 'East Africa',
    name: 'BPR Bank Transfer',
    description: 'BPR Rwanda bank transfer service',
    icon: '🏦',
    currency: 'RWF',
    minAmount: 5000,
    maxAmount: 50000000,
    isActive: true,
    fees: {
      fixed: 1000,
      percentage: 0.5,
    },
    processingTime: '1-2 hours',
    supportedBanks: ['BPR Bank', 'Equity Bank Rwanda', 'Kigali City Bank'],
  },

  // Senegal Payment Methods
  {
    id: 'orange-senegal',
    country: 'Senegal',
    countryCode: 'SN',
    region: 'West Africa',
    name: 'Orange Money',
    description: 'Orange Senegal mobile money service',
    icon: '🟠',
    currency: 'XOF',
    minAmount: 100,
    maxAmount: 2000000,
    isActive: true,
    fees: {
      fixed: 0,
      percentage: 2.0,
    },
    processingTime: 'Instant',
    supportedProviders: ['Orange Senegal'],
  },
  {
    id: 'wave-senegal',
    country: 'Senegal',
    countryCode: 'SN',
    region: 'West Africa',
    name: 'Wave Money Transfer',
    description: 'Wave mobile money and transfer service',
    icon: '🌊',
    currency: 'XOF',
    minAmount: 100,
    maxAmount: 5000000,
    isActive: true,
    fees: {
      fixed: 0,
      percentage: 1.5,
    },
    processingTime: 'Instant',
    supportedProviders: ['Wave'],
  },
  {
    id: 'cbao-senegal',
    country: 'Senegal',
    countryCode: 'SN',
    region: 'West Africa',
    name: 'CBAO Bank Transfer',
    description: 'CBAO-Senegal bank transfer service',
    icon: '🏦',
    currency: 'XOF',
    minAmount: 5000,
    maxAmount: 50000000,
    isActive: true,
    fees: {
      fixed: 2500,
      percentage: 0.5,
    },
    processingTime: '1-2 hours',
    supportedBanks: ['CBAO-Senegal', 'BICIS Senegal', 'Banque du Senegal'],
  },
];

export const REGIONAL_COUNTRIES = [
  {
    code: 'UG',
    name: 'Uganda',
    region: 'East Africa',
    currency: 'UGX',
    currencySymbol: 'Sh',
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    region: 'East Africa',
    currency: 'TZS',
    currencySymbol: 'Sh',
  },
  {
    code: 'RW',
    name: 'Rwanda',
    region: 'East Africa',
    currency: 'RWF',
    currencySymbol: 'Fr',
  },
  {
    code: 'SN',
    name: 'Senegal',
    region: 'West Africa',
    currency: 'XOF',
    currencySymbol: 'CFA',
  },
];

export function getPaymentMethodsByCountry(countryCode: string): RegionalPaymentMethod[] {
  return REGIONAL_PAYMENT_METHODS.filter(
    method => method.countryCode === countryCode && method.isActive
  );
}

export function getPaymentMethodsByRegion(region: string): RegionalPaymentMethod[] {
  return REGIONAL_PAYMENT_METHODS.filter(
    method => method.region === region && method.isActive
  );
}

export function getPaymentMethodById(id: string): RegionalPaymentMethod | undefined {
  return REGIONAL_PAYMENT_METHODS.find(method => method.id === id);
}

export function calculateFees(amount: number, methodId: string): {
  subtotal: number;
  fee: number;
  total: number;
} {
  const method = getPaymentMethodById(methodId);
  if (!method) {
    return { subtotal: amount, fee: 0, total: amount };
  }

  const percentageFee = (amount * method.fees.percentage) / 100;
  const totalFee = method.fees.fixed + percentageFee;

  return {
    subtotal: amount,
    fee: totalFee,
    total: amount + totalFee,
  };
}

export function isPaymentMethodAvailable(methodId: string): boolean {
  const method = getPaymentMethodById(methodId);
  return method?.isActive ?? false;
}
