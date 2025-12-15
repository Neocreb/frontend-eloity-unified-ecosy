// DEPRECATED: CryptoAPIs is rate-limited
// This client now returns safe fallback data instead of making actual API calls
// For real crypto data, use the /api/crypto/prices endpoint with Bybit + CoinGecko

const API_BASE_URL = '/api/cryptoapis';

export interface AddressLatestActivityResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface AddressHistoryResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface BlockDataResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface TransactionDataResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ExchangeRatesResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface FeesResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface AssetsResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class CryptoapisClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private logDeprecationWarning(method: string): void {
    console.warn(
      `[DEPRECATED] CryptoapisClient.${method}() is deprecated. ` +
      `CryptoAPIs is rate-limited. Use the /api/crypto/prices endpoint instead ` +
      `which uses Bybit + CoinGecko.`
    );
  }

  async getAddressLatestActivity(
    blockchain: string,
    network: string,
    address: string
  ): Promise<AddressLatestActivityResponse> {
    this.logDeprecationWarning('getAddressLatestActivity');
    return {
      success: false,
      error: 'CryptoAPIs endpoint disabled due to rate limiting. Use /api/crypto/prices for price data.',
      data: { addresses: [] }
    };
  }

  async getAddressHistory(
    blockchain: string,
    network: string,
    address: string
  ): Promise<AddressHistoryResponse> {
    this.logDeprecationWarning('getAddressHistory');
    return {
      success: false,
      error: 'CryptoAPIs endpoint disabled due to rate limiting. Fetch transaction history from database instead.',
      data: []
    };
  }

  async getBlockData(
    blockchain: string,
    network: string,
    blockId: string | number
  ): Promise<BlockDataResponse> {
    this.logDeprecationWarning('getBlockData');
    return {
      success: false,
      error: 'CryptoAPIs endpoint disabled due to rate limiting.'
    };
  }

  async getTransactionData(
    blockchain: string,
    network: string,
    transactionId: string
  ): Promise<TransactionDataResponse> {
    this.logDeprecationWarning('getTransactionData');
    return {
      success: false,
      error: 'CryptoAPIs endpoint disabled due to rate limiting.'
    };
  }

  async simulateTransaction(
    blockchain: string,
    network: string,
    transactionData: any
  ): Promise<any> {
    this.logDeprecationWarning('simulateTransaction');
    return {
      success: false,
      error: 'CryptoAPIs endpoint disabled due to rate limiting.'
    };
  }

  async broadcastTransaction(
    blockchain: string,
    network: string,
    signedTransaction: string
  ): Promise<any> {
    this.logDeprecationWarning('broadcastTransaction');
    return {
      success: false,
      error: 'CryptoAPIs endpoint disabled due to rate limiting.'
    };
  }

  async estimateTransactionFees(
    blockchain: string,
    network: string
  ): Promise<FeesResponse> {
    this.logDeprecationWarning('estimateTransactionFees');
    return {
      success: true,
      data: {
        low: { gasPrice: '20', gasLimit: '21000' },
        standard: { gasPrice: '30', gasLimit: '21000' },
        high: { gasPrice: '50', gasLimit: '21000' }
      }
    };
  }

  async getExchangeRates(
    baseAssetId: string,
    quoteAssetId: string
  ): Promise<ExchangeRatesResponse> {
    this.logDeprecationWarning('getExchangeRates');
    return {
      success: false,
      error: 'Use useCryptoExchangeRates hook or /api/crypto/prices endpoint instead.'
    };
  }

  async getSupportedAssets(): Promise<AssetsResponse> {
    this.logDeprecationWarning('getSupportedAssets');
    return {
      success: true,
      data: {
        assets: [
          { id: 'bitcoin', symbol: 'BTC' },
          { id: 'ethereum', symbol: 'ETH' },
          { id: 'tether', symbol: 'USDT' },
          { id: 'binancecoin', symbol: 'BNB' },
          { id: 'solana', symbol: 'SOL' },
        ]
      }
    };
  }

  async getTokenMetadata(
    blockchain: string,
    network: string,
    contractAddress: string
  ): Promise<any> {
    this.logDeprecationWarning('getTokenMetadata');
    return {
      success: false,
      error: 'CryptoAPIs endpoint disabled due to rate limiting.'
    };
  }

  async manageHDWallet(
    blockchain: string,
    network: string,
    walletData: any
  ): Promise<any> {
    this.logDeprecationWarning('manageHDWallet');
    return {
      success: false,
      error: 'CryptoAPIs endpoint disabled due to rate limiting.'
    };
  }

  async getWalletAddresses(
    blockchain: string,
    network: string,
    walletId: string,
    count: number = 10
  ): Promise<any> {
    this.logDeprecationWarning('getWalletAddresses');
    return {
      success: false,
      error: 'CryptoAPIs endpoint disabled due to rate limiting.',
      data: []
    };
  }

  async createWebhook(webhookData: any): Promise<any> {
    this.logDeprecationWarning('createWebhook');
    return {
      success: false,
      error: 'CryptoAPIs endpoint disabled due to rate limiting.'
    };
  }
}

export const cryptoapisClient = new CryptoapisClient();

export default cryptoapisClient;
