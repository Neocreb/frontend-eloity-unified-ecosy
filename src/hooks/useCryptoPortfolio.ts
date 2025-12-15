import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PortfolioAsset {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  value: number;
  avgBuyPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
  color: string;
  lastUpdated: string;
}

export interface UseCryptoPortfolioReturn {
  assets: PortfolioAsset[];
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ASSET_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  USDT: '#26A69A',
  USDC: '#2775CA',
  SOL: '#14F195',
  ADA: '#0033AD',
  XRP: '#23292F',
  DOGE: '#BA9F33',
  MATIC: '#8247E5',
  LINK: '#375BD2',
};

export function useCryptoPortfolio(
  walletAddress?: string,
  blockchain: string = 'ethereum',
  network: string = 'mainnet'
): UseCryptoPortfolioReturn {
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);
  const [totalPnLPercent, setTotalPnLPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPortfolio = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch wallet balances from database
      const { data: wallets, error: walletError } = await supabase
        .from('wallets')
        .select('balance_crypto, symbol')
        .eq('user_id', user.id);

      if (walletError) {
        throw new Error(walletError.message);
      }

      if (!wallets || wallets.length === 0) {
        setAssets([]);
        setTotalValue(0);
        setTotalPnL(0);
        setTotalPnLPercent(0);
        return;
      }

      // Fetch current prices from backend API (uses Bybit + CoinGecko)
      const symbolList = wallets
        .map(w => w.symbol?.toLowerCase())
        .filter(Boolean)
        .join(',');

      const pricesRes = await fetch(`/api/crypto/prices?symbols=${symbolList}`);
      if (!pricesRes.ok) {
        throw new Error('Failed to fetch current prices');
      }

      const pricesData = await pricesRes.json();
      const prices = pricesData.prices || {};

      // Build portfolio assets
      const portfolioAssets = wallets
        .filter(w => w.symbol && w.balance_crypto > 0)
        .map(wallet => {
          const symbol = wallet.symbol || 'UNKNOWN';
          const amount = parseFloat(wallet.balance_crypto) || 0;
          const priceData = prices[symbol.toLowerCase()];
          const currentPrice = priceData?.usd || 0;
          const value = amount * currentPrice;

          return {
            id: symbol.toLowerCase(),
            symbol,
            name: getAssetName(symbol),
            amount,
            value,
            avgBuyPrice: currentPrice,
            currentPrice,
            pnl: 0,
            pnlPercent: 0,
            allocation: 0,
            color: ASSET_COLORS[symbol] || '#888888',
            lastUpdated: new Date().toISOString(),
          };
        });

      // Calculate totals
      const total = portfolioAssets.reduce((sum, asset) => sum + asset.value, 0);
      const totalPnL = portfolioAssets.reduce((sum, asset) => sum + asset.pnl, 0);

      const finalAssets = portfolioAssets.map(asset => ({
        ...asset,
        allocation: total > 0 ? (asset.value / total) * 100 : 0,
      }));

      setAssets(finalAssets);
      setTotalValue(total);
      setTotalPnL(totalPnL);
      setTotalPnLPercent(total > 0 ? (totalPnL / total) * 100 : 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching portfolio:', errorMessage);
      setError(errorMessage);
      setAssets([]);
      setTotalValue(0);
      setTotalPnL(0);
      setTotalPnLPercent(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPortfolio();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPortfolio, 30000);

    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  return {
    assets,
    totalValue,
    totalPnL,
    totalPnLPercent,
    loading,
    error,
    refetch: fetchPortfolio,
  };
}

function getAssetName(symbol: string): string {
  const assetNames: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    USDT: 'Tether',
    USDC: 'USD Coin',
    SOL: 'Solana',
    ADA: 'Cardano',
    XRP: 'XRP',
    DOGE: 'Dogecoin',
    MATIC: 'Polygon',
    LINK: 'Chainlink',
  };
  return assetNames[symbol] || symbol;
}
