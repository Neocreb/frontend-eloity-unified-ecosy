/**
 * Bybit API Client for Frontend
 * Provides typed methods to call Bybit endpoints from the backend
 */

import axios from 'axios';

const BASE_URL = '/api/bybit';

interface TickerData {
  symbol: string;
  lastPrice: number;
  bidPrice: number;
  askPrice: number;
  highPrice24h: number;
  lowPrice24h: number;
  volume24h: number;
  turnover24h: number;
  price24hPcnt: number;
  prevPrice24h: number;
  markPrice?: number;
  indexPrice?: number;
  timestamp: number;
}

interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
}

interface Kline {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
}

interface Instrument {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
  status: string;
  minOrderQty?: string;
  maxOrderQty?: string;
  minOrderAmt?: number;
  maxOrderAmt?: number;
}

interface WalletBalance {
  accountType: string;
  totalEquity: number;
  totalWalletBalance: number;
  totalMarginBalance: number;
  totalAvailableBalance: number;
  coins: Array<{
    coin: string;
    walletBalance: number;
    transferBalance: number;
    bonus: number;
    availableToWithdraw: number;
  }>;
}

interface DepositAddress {
  coin: string;
  chains: Array<{
    chain: string;
    address: string;
    tag?: string;
    chainDeposit: string;
  }>;
}

interface WithdrawalFee {
  coin: string;
  withdrawFee: string;
  chains: Array<{
    chain: string;
    withdrawFee: number;
    minWithdrawalAmount: number;
    maxWithdrawalAmount: number;
    chainDeposit: string;
  }>;
}

interface TradingFees {
  symbol: string;
  category: string;
  takerFeeRate: number;
  makerFeeRate: number;
}

interface LeverageToken {
  ltName: string;
  ltCoin: string;
  ltMultiplier: string;
  baseCoin: string;
  maxLeverage: string;
  status: string;
  price: number;
}

class BybitClient {
  /**
   * Check Bybit API health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      return response.data?.status === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Get Bybit server time
   */
  async getServerTime(): Promise<number | null> {
    try {
      const response = await axios.get(`${BASE_URL}/server/time`);
      if (response.data?.success) {
        return response.data.timestamp;
      }
      return null;
    } catch (error) {
      console.error('Failed to get server time:', error);
      return null;
    }
  }

  /**
   * Get ticker data for a symbol
   */
  async getTicker(symbol: string, category: 'spot' | 'linear' | 'inverse' = 'spot'): Promise<TickerData | null> {
    try {
      const response = await axios.get(`${BASE_URL}/market/ticker`, {
        params: { symbol, category }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get ticker for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get tickers for multiple symbols
   */
  async getMultipleTickers(symbols: string[], category: 'spot' | 'linear' | 'inverse' = 'spot'): Promise<TickerData[]> {
    try {
      const results = await Promise.allSettled(
        symbols.map(symbol => this.getTicker(symbol, category))
      );
      return results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as PromiseFulfilledResult<TickerData>).value);
    } catch (error) {
      console.error('Failed to get multiple tickers:', error);
      return [];
    }
  }

  /**
   * Get order book for a symbol
   */
  async getOrderBook(
    symbol: string,
    limit: number = 25,
    category: 'spot' | 'linear' | 'inverse' = 'spot'
  ): Promise<OrderBook | null> {
    try {
      const response = await axios.get(`${BASE_URL}/market/orderbook`, {
        params: { symbol, limit, category }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get orderbook for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get kline (candlestick) data
   */
  async getKlines(
    symbol: string,
    interval: string = '1',
    limit: number = 200,
    category: 'spot' | 'linear' | 'inverse' = 'spot'
  ): Promise<Kline[] | null> {
    try {
      const response = await axios.get(`${BASE_URL}/market/klines`, {
        params: { symbol, interval, limit, category }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get klines for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get supported instruments
   */
  async getInstruments(category: 'spot' | 'linear' | 'inverse' = 'spot'): Promise<Instrument[]> {
    try {
      const response = await axios.get(`${BASE_URL}/market/instruments`, {
        params: { category }
      });
      return response.data?.instruments || [];
    } catch (error) {
      console.error('Failed to get instruments:', error);
      return [];
    }
  }

  /**
   * Get wallet balance (requires authentication)
   */
  async getWalletBalance(accountType: 'SPOT' | 'UNIFIED' = 'UNIFIED'): Promise<WalletBalance[] | null> {
    try {
      const response = await axios.get(`${BASE_URL}/account/wallet-balance`, {
        params: { accountType }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return null;
    }
  }

  /**
   * Get deposit address (requires authentication)
   */
  async getDepositAddress(coin: string, chain?: string): Promise<DepositAddress | null> {
    try {
      const response = await axios.get(`${BASE_URL}/asset/deposit-address`, {
        params: { coin, chain }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get deposit address for ${coin}:`, error);
      return null;
    }
  }

  /**
   * Get withdrawal fee (requires authentication)
   */
  async getWithdrawalFee(coin: string, chain?: string): Promise<WithdrawalFee | null> {
    try {
      const response = await axios.get(`${BASE_URL}/asset/withdrawal-fee`, {
        params: { coin, chain }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get withdrawal fee for ${coin}:`, error);
      return null;
    }
  }

  /**
   * Get trading fees (requires authentication)
   */
  async getTradingFees(symbol: string, category: 'spot' | 'linear' | 'inverse' = 'spot'): Promise<TradingFees | null> {
    try {
      const response = await axios.get(`${BASE_URL}/account/trading-fees`, {
        params: { symbol, category }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get trading fees for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get leverage tokens list
   */
  async getLeverageTokens(): Promise<LeverageToken[]> {
    try {
      const response = await axios.get(`${BASE_URL}/spot-lever-token/list`);
      return response.data?.tokens || [];
    } catch (error) {
      console.error('Failed to get leverage tokens:', error);
      return [];
    }
  }

  /**
   * Get comparable prices from Bybit and other sources
   * Useful for price comparison and arbitrage detection
   */
  async comparePrices(symbol: string): Promise<{
    symbol: string;
    bybitPrice: number | null;
    spotPrice: number | null;
    difference: number | null;
    timestamp: number;
  } | null> {
    try {
      const ticker = await this.getTicker(symbol, 'spot');
      if (!ticker) return null;

      return {
        symbol,
        bybitPrice: ticker.lastPrice,
        spotPrice: ticker.lastPrice,
        difference: null,
        timestamp: ticker.timestamp
      };
    } catch (error) {
      console.error(`Failed to compare prices for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Stream-like method to fetch latest ticker updates
   * Simulated polling since WebSocket would need to be server-side
   */
  async subscribeTicker(
    symbol: string,
    interval: number = 5000,
    onUpdate: (ticker: TickerData) => void,
    onError?: (error: Error) => void
  ): Promise<() => void> {
    let isActive = true;

    const poll = async () => {
      while (isActive) {
        try {
          const ticker = await this.getTicker(symbol);
          if (ticker && isActive) {
            onUpdate(ticker);
          }
        } catch (error) {
          if (onError && isActive) {
            onError(error instanceof Error ? error : new Error(String(error)));
          }
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    };

    poll();

    return () => {
      isActive = false;
    };
  }
}

export const bybitClient = new BybitClient();

export default bybitClient;
