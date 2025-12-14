import { useState, useEffect, useCallback, useRef } from 'react';
import bybitClient from '../lib/bybit-client';

interface BybitPriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

interface UseBybitPriceOptions {
  symbol?: string;
  interval?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch and subscribe to real-time Bybit ticker data
 */
export function useBybitPrice(options: UseBybitPriceOptions = {}) {
  const { symbol = 'BTCUSDT', interval = 5000, enabled = true } = options;
  const [price, setPrice] = useState<BybitPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || !symbol) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const subscribe = async () => {
      try {
        unsubscribeRef.current = await bybitClient.subscribeTicker(
          symbol,
          interval,
          (ticker) => {
            setPrice({
              symbol: ticker.symbol,
              price: ticker.lastPrice,
              change24h: ticker.price24hPcnt,
              volume24h: ticker.volume24h,
              high24h: ticker.highPrice24h,
              low24h: ticker.lowPrice24h,
              timestamp: ticker.timestamp
            });
            setLoading(false);
          },
          (err) => {
            setError(err.message);
            setLoading(false);
          }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to subscribe to price');
        setLoading(false);
      }
    };

    subscribe();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [symbol, interval, enabled]);

  return { price, loading, error };
}

interface UseBybitOrderbookOptions {
  symbol?: string;
  limit?: number;
  interval?: number;
  enabled?: boolean;
}

interface OrderbookData {
  bids: Array<{ price: number; quantity: number }>;
  asks: Array<{ price: number; quantity: number }>;
  timestamp: number;
}

/**
 * Hook to fetch Bybit orderbook data
 */
export function useBybitOrderbook(options: UseBybitOrderbookOptions = {}) {
  const { symbol = 'BTCUSDT', limit = 25, interval = 5000, enabled = true } = options;
  const [orderbook, setOrderbook] = useState<OrderbookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrderbook = useCallback(async () => {
    if (!symbol) return;

    try {
      const data = await bybitClient.getOrderBook(symbol, limit, 'spot');
      if (data) {
        setOrderbook({
          bids: data.bids,
          asks: data.asks,
          timestamp: data.timestamp
        });
      }
      setLoading(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orderbook');
      setLoading(false);
    }
  }, [symbol, limit]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    fetchOrderbook();

    timerRef.current = setInterval(fetchOrderbook, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [symbol, limit, interval, enabled, fetchOrderbook]);

  return { orderbook, loading, error, refetch: fetchOrderbook };
}

interface UseBybitKlinesOptions {
  symbol?: string;
  interval?: string;
  limit?: number;
  enabled?: boolean;
}

interface KlineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
}

/**
 * Hook to fetch Bybit kline (candlestick) data
 */
export function useBybitKlines(options: UseBybitKlinesOptions = {}) {
  const { symbol = 'BTCUSDT', interval = '1', limit = 200, enabled = true } = options;
  const [klines, setKlines] = useState<KlineData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !symbol) {
      setLoading(false);
      return;
    }

    const fetchKlines = async () => {
      try {
        const data = await bybitClient.getKlines(symbol, interval, limit, 'spot');
        if (data) {
          setKlines(data);
        }
        setLoading(false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch klines');
        setLoading(false);
      }
    };

    fetchKlines();
  }, [symbol, interval, limit, enabled]);

  return { klines, loading, error };
}

interface UseBybitWalletOptions {
  enabled?: boolean;
}

interface WalletData {
  totalEquity: number;
  totalAvailableBalance: number;
  coins: Array<{
    coin: string;
    walletBalance: number;
    availableToWithdraw: number;
  }>;
}

/**
 * Hook to fetch authenticated Bybit wallet data
 */
export function useBybitWallet(options: UseBybitWalletOptions = {}) {
  const { enabled = true } = options;
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const fetchWallet = async () => {
      try {
        const data = await bybitClient.getWalletBalance('UNIFIED');
        if (data && data.length > 0) {
          const account = data[0];
          setWallet({
            totalEquity: account.totalEquity,
            totalAvailableBalance: account.totalAvailableBalance,
            coins: account.coins
          });
        }
        setLoading(false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch wallet');
        setLoading(false);
      }
    };

    fetchWallet();

    // Refresh wallet data every 30 seconds
    const interval = setInterval(fetchWallet, 30000);

    return () => clearInterval(interval);
  }, [enabled]);

  return { wallet, loading, error };
}

/**
 * Hook to fetch recent trades for a symbol
 */
export function useBybitRecentTrades(options: { symbol?: string; limit?: number; enabled?: boolean } = {}) {
  const { symbol = 'BTCUSDT', limit = 100, enabled = true } = options;
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !symbol) {
      setLoading(false);
      return;
    }

    const fetchTrades = async () => {
      try {
        const data = await bybitClient.getRecentTrades(symbol, limit);
        setTrades(data);
        setLoading(false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recent trades');
        setLoading(false);
      }
    };

    fetchTrades();
  }, [symbol, limit, enabled]);

  return { trades, loading, error };
}

/**
 * Hook to fetch funding rates and market data for futures symbols
 */
export function useBybitMarketAnalysis(options: { symbol?: string; enabled?: boolean } = {}) {
  const { symbol = 'BTCUSDT', enabled = true } = options;
  const [fundingRate, setFundingRate] = useState<any | null>(null);
  const [liquidations, setLiquidations] = useState<any[]>([]);
  const [longShortRatio, setLongShortRatio] = useState<any[]>([]);
  const [openInterest, setOpenInterest] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !symbol) {
      setLoading(false);
      return;
    }

    const fetchAnalysis = async () => {
      try {
        const [funding, liqData, ratioData, oiData] = await Promise.allSettled([
          bybitClient.getFundingRate(symbol),
          bybitClient.getLiquidations(symbol, 50),
          bybitClient.getLongShortRatio(symbol, 50),
          bybitClient.getOpenInterest(symbol, 50)
        ]);

        if (funding.status === 'fulfilled') setFundingRate(funding.value);
        if (liqData.status === 'fulfilled') setLiquidations(liqData.value);
        if (ratioData.status === 'fulfilled') setLongShortRatio(ratioData.value);
        if (oiData.status === 'fulfilled') setOpenInterest(oiData.value);

        setLoading(false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch market analysis');
        setLoading(false);
      }
    };

    fetchAnalysis();

    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalysis, 30000);

    return () => clearInterval(interval);
  }, [symbol, enabled]);

  return { fundingRate, liquidations, longShortRatio, openInterest, loading, error };
}

/**
 * Hook to check Bybit API health
 */
export function useBybitHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await bybitClient.checkHealth();
      setIsHealthy(healthy);
    };

    checkHealth();

    // Check health every 60 seconds
    const interval = setInterval(checkHealth, 60000);

    return () => clearInterval(interval);
  }, []);

  return { isHealthy };
}
