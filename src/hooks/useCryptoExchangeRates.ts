import { useState, useEffect, useCallback } from 'react';

export interface ExchangeRateData {
  baseAsset: string;
  quoteAsset: string;
  rate: number;
  timestamp: string;
}

export interface UseCryptoExchangeRatesReturn {
  rates: Record<string, number>;
  loading: boolean;
  error: string | null;
  getRate: (baseAsset: string, quoteAsset: string) => number | null;
  refetch: () => Promise<void>;
}

export function useCryptoExchangeRates(
  baseAssets: string[] = ['BTC', 'ETH'],
  quoteAsset: string = 'USD'
): UseCryptoExchangeRatesReturn {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Map symbols to CoinGecko IDs
      const symbolToCoinGeckoId: Record<string, string> = {
        BTC: 'bitcoin',
        ETH: 'ethereum',
        USDT: 'tether',
        USDC: 'usd-coin',
        SOL: 'solana',
        ADA: 'cardano',
        XRP: 'ripple',
        DOGE: 'dogecoin',
        MATIC: 'matic-network',
        LINK: 'chainlink',
      };

      const ids = baseAssets
        .map(symbol => symbolToCoinGeckoId[symbol.toUpperCase()])
        .filter(Boolean);

      if (ids.length === 0) {
        throw new Error('No valid assets to fetch rates for');
      }

      const vsCurrency = quoteAsset.toLowerCase();
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=${vsCurrency}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch rates: ${response.status}`);
      }

      const data = await response.json();
      const ratesMap: Record<string, number> = {};

      baseAssets.forEach((symbol) => {
        const id = symbolToCoinGeckoId[symbol.toUpperCase()];
        if (id && data[id] && data[id][vsCurrency]) {
          ratesMap[`${symbol}_${quoteAsset}`] = data[id][vsCurrency];
        }
      });

      if (Object.keys(ratesMap).length === 0) {
        throw new Error('No rates returned from API');
      }

      setRates(ratesMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching exchange rates:', errorMessage);
      setError(errorMessage);
      setRates({});
    } finally {
      setLoading(false);
    }
  }, [baseAssets, quoteAsset]);

  useEffect(() => {
    fetchRates();

    // Refresh every 60 seconds
    const interval = setInterval(fetchRates, 60000);

    return () => clearInterval(interval);
  }, [fetchRates]);

  const getRate = useCallback(
    (baseAsset: string, quote: string = quoteAsset): number | null => {
      const key = `${baseAsset}_${quote}`;
      return rates[key] || null;
    },
    [rates, quoteAsset]
  );

  return {
    rates,
    loading,
    error,
    getRate,
    refetch: fetchRates,
  };
}
