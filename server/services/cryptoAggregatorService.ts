import { logger } from '../utils/logger.js';
import { getCryptoPrices, getOrderBook } from './cryptoService.js';
import * as bybitService from './bybitService.js';
import * as cryptoapisService from './cryptoapis-service.js';

/**
 * Unified Crypto API Aggregator Service
 * 
 * This service intelligently routes requests to the best provider(s):
 * - Bybit for: prices, orderbooks, trading data, charts, market data
 * - CryptoApis for: blockchain data, addresses, transactions, fees
 * - Both with fallback logic to handle rate limiting
 */

interface AggregatedPriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  highPrice24h: number;
  lowPrice24h: number;
  timestamp: number;
  source: 'bybit' | 'coingecko' | 'cryptoapis';
}

interface TradingData {
  recentTrades: any[];
  orderbook: any;
  klines: any[];
  funding?: any;
}

/**
 * Get aggregated price data from best available source
 * Prefers Bybit for spot market data
 */
export async function getAggregatedPrices(symbols: string[], vsCurrency: string = 'usd'): Promise<Record<string, AggregatedPriceData>> {
  try {
    const result: Record<string, AggregatedPriceData> = {};
    
    // Try Bybit first for all symbols
    const bybitKey = process.env.BYBIT_PUBLIC_API;
    if (bybitKey && bybitKey !== 'your-bybit-public-api-key') {
      logger.info('Fetching prices from Bybit (primary source)');
      
      const symbolToBybitPair: Record<string, string> = {
        bitcoin: 'BTCUSDT',
        ethereum: 'ETHUSDT',
        tether: 'USDTUSDT',
        binancecoin: 'BNBUSDT',
        solana: 'SOLUSDT',
        cardano: 'ADAUSDT',
        chainlink: 'LINKUSDT',
        polygon: 'MATICUSDT',
        avalanche: 'AVAXUSDT',
        polkadot: 'DOTUSDT',
        dogecoin: 'DOGEUSDT',
        ripple: 'XRPUSDT',
        litecoin: 'LTCUSDT',
      };

      for (const symbol of symbols) {
        const lower = symbol.toLowerCase();
        const pair = symbolToBybitPair[lower];
        
        if (pair) {
          try {
            const ticker = await bybitService.getBybitTicker(pair, 'spot');
            if (ticker && ticker.lastPrice > 0) {
              result[lower] = {
                symbol: lower,
                price: ticker.lastPrice,
                change24h: ticker.price24hPcnt,
                volume24h: ticker.volume24h,
                highPrice24h: ticker.highPrice24h,
                lowPrice24h: ticker.lowPrice24h,
                timestamp: ticker.timestamp,
                source: 'bybit'
              };
            }
          } catch (error) {
            logger.debug(`Bybit fetch failed for ${symbol}:`, error instanceof Error ? error.message : String(error));
          }
        }
      }
    }

    // Fill in any missing prices from CoinGecko fallback
    if (Object.keys(result).length < symbols.length) {
      logger.info('Using CoinGecko fallback for missing prices');
      const prices = await getCryptoPrices(symbols, vsCurrency);
      for (const [symbol, priceData] of Object.entries(prices)) {
        if (!result[symbol]) {
          result[symbol] = {
            symbol,
            price: priceData.usd || 0,
            change24h: priceData.usd_24h_change || 0,
            volume24h: priceData.usd_24h_vol || 0,
            highPrice24h: 0,
            lowPrice24h: 0,
            timestamp: Date.now(),
            source: 'coingecko'
          };
        }
      }
    }

    return result;
  } catch (error) {
    logger.error('Aggregated price fetch error:', error);
    return {};
  }
}

/**
 * Get comprehensive trading data for a symbol
 * Combines recent trades, orderbook, and klines
 */
export async function getTradingData(symbol: string, timeframe: string = '1'): Promise<TradingData | null> {
  try {
    const bybitKey = process.env.BYBIT_PUBLIC_API;
    
    if (!bybitKey || bybitKey === 'your-bybit-public-api-key') {
      logger.warn('Bybit not configured, cannot fetch trading data');
      return null;
    }

    logger.info(`Fetching trading data for ${symbol}`);

    const [recentTrades, orderbook, klines, fundingRate] = await Promise.allSettled([
      bybitService.getBybitRecentTrades(symbol, 50, 'spot'),
      bybitService.getBybitOrderBook(symbol, 25, 'spot'),
      bybitService.getBybitKlines(symbol, timeframe, 200, 'spot'),
      bybitService.getBybitFundingRate(symbol, 'linear').catch(() => null)
    ]);

    return {
      recentTrades: recentTrades.status === 'fulfilled' ? recentTrades.value : [],
      orderbook: orderbook.status === 'fulfilled' ? orderbook.value : null,
      klines: klines.status === 'fulfilled' ? klines.value : [],
      funding: fundingRate.status === 'fulfilled' ? fundingRate.value : null
    };
  } catch (error) {
    logger.error('Trading data fetch error:', error);
    return null;
  }
}

/**
 * Get market analysis data for a symbol
 * Includes liquidations, long-short ratio, open interest
 */
export async function getMarketAnalysis(symbol: string): Promise<any> {
  try {
    const bybitKey = process.env.BYBIT_PUBLIC_API;
    
    if (!bybitKey || bybitKey === 'your-bybit-public-api-key') {
      logger.warn('Bybit not configured for market analysis');
      return null;
    }

    logger.info(`Fetching market analysis for ${symbol}`);

    const [liquidations, longShortRatio, openInterest] = await Promise.allSettled([
      bybitService.getBybitLiquidations(symbol, 50, 'linear'),
      bybitService.getBybitLongShortRatio(symbol, '5min', 50, 'linear'),
      bybitService.getBybitOpenInterest(symbol, '5min', 'linear', 50)
    ]);

    return {
      symbol,
      liquidations: liquidations.status === 'fulfilled' ? liquidations.value : [],
      longShortRatio: longShortRatio.status === 'fulfilled' ? longShortRatio.value : [],
      openInterest: openInterest.status === 'fulfilled' ? openInterest.value : [],
      timestamp: Date.now()
    };
  } catch (error) {
    logger.error('Market analysis fetch error:', error);
    return null;
  }
}

/**
 * Get wallet and account information
 * Uses CryptoApis for blockchain data, Bybit for exchange accounts
 */
export async function getWalletInfo(address?: string, coin?: string) {
  try {
    const result: any = {};

    // Get Bybit exchange account info if available
    const bybitKey = process.env.BYBIT_PUBLIC_API;
    if (bybitKey && bybitKey !== 'your-bybit-public-api-key') {
      try {
        logger.info('Fetching Bybit wallet balance');
        const walletBalance = await bybitService.getBybitWalletBalance();
        if (walletBalance) {
          result.exchangeAccount = walletBalance;
        }
      } catch (error) {
        logger.debug('Failed to fetch Bybit wallet balance:', error instanceof Error ? error.message : String(error));
      }
    }

    // Get blockchain address info from CryptoApis if address provided
    if (address && coin) {
      try {
        logger.info(`Fetching blockchain data for ${coin} address`);
        // Note: This would require CryptoApis integration
        // result.blockchainAddress = await cryptoapisService.getAddressData(coin, address);
      } catch (error) {
        logger.debug('Failed to fetch blockchain address data:', error instanceof Error ? error.message : String(error));
      }
    }

    return result;
  } catch (error) {
    logger.error('Wallet info fetch error:', error);
    return null;
  }
}

/**
 * Get deposit and withdrawal information
 * Prioritizes Bybit for real-time data
 */
export async function getDepositWithdrawInfo(coin: string, chain?: string): Promise<any> {
  try {
    const bybitKey = process.env.BYBIT_PUBLIC_API;
    
    if (!bybitKey || bybitKey === 'your-bybit-public-api-key') {
      logger.warn('Bybit not configured for deposit/withdraw info');
      return null;
    }

    logger.info(`Fetching deposit/withdraw info for ${coin}`);

    const [depositAddress, withdrawalFee] = await Promise.allSettled([
      bybitService.getBybitDepositAddress(coin, chain),
      bybitService.getBybitWithdrawalFee(coin, chain)
    ]);

    return {
      coin,
      depositAddress: depositAddress.status === 'fulfilled' ? depositAddress.value : null,
      withdrawalFee: withdrawalFee.status === 'fulfilled' ? withdrawalFee.value : null
    };
  } catch (error) {
    logger.error('Deposit/withdraw info fetch error:', error);
    return null;
  }
}

/**
 * Health check for all crypto providers
 */
export async function checkProviderHealth(): Promise<{ bybit: boolean; cryptoapis: boolean }> {
  try {
    const [bybitHealth, cryptoapisHealth] = await Promise.allSettled([
      bybitService.verifyBybitConnection(),
      Promise.resolve(!!process.env.CRYPTOAPIS_API_KEY)
    ]);

    return {
      bybit: bybitHealth.status === 'fulfilled' ? bybitHealth.value : false,
      cryptoapis: cryptoapisHealth.status === 'fulfilled' ? cryptoapisHealth.value : false
    };
  } catch (error) {
    logger.error('Provider health check error:', error);
    return { bybit: false, cryptoapis: false };
  }
}

/**
 * Get rate limit status for each provider
 * Returns estimated API calls remaining and reset time
 */
export async function getRateLimitStatus(): Promise<{
  bybit: { status: string; estimatedRemaining: number };
  cryptoapis: { status: string; estimatedRemaining: number };
}> {
  return {
    bybit: {
      status: process.env.BYBIT_PUBLIC_API ? 'configured' : 'unconfigured',
      estimatedRemaining: process.env.BYBIT_PUBLIC_API ? 9999 : 0 // Placeholder
    },
    cryptoapis: {
      status: process.env.CRYPTOAPIS_API_KEY ? 'configured' : 'unconfigured',
      estimatedRemaining: process.env.CRYPTOAPIS_API_KEY ? 9999 : 0 // Placeholder
    }
  };
}
