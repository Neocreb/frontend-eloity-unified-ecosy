import { logger } from '../utils/logger.js';
import { db } from '../utils/db.js';
import {
  getBybitTicker,
  getBybitInstruments,
  getBybitOrderBook
} from '../services/bybitService.js';

const BYBIT_PUBLIC_API = process.env.BYBIT_PUBLIC_API || '';
const SYNC_INTERVAL = 3 * 60 * 1000; // 3 minutes default

interface CachedTickerData {
  symbol: string;
  lastPrice: number;
  volume24h: number;
  price24hPcnt: number;
  timestamp: number;
  source: 'bybit';
  expiresAt: Date;
}

// List of major trading pairs to sync
const MAJOR_TRADING_PAIRS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'ADAUSDT',
  'LINKUSDT',
  'MATICUSDT',
  'AVAXUSDT',
  'DOTUSDT',
  'DOGEUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'LTCUSDT',
  'XLMUSDT',
  'ATOMUSDT',
  'NEOUSDT',
  'UNIUSDT'
];

/**
 * Sync ticker data for major trading pairs
 */
export async function syncBybitTickers(pairs: string[] = MAJOR_TRADING_PAIRS) {
  if (!BYBIT_PUBLIC_API || BYBIT_PUBLIC_API === 'your-bybit-public-api-key') {
    logger.warn('Bybit API keys not configured, skipping ticker sync');
    return;
  }

  const tickersToCache: CachedTickerData[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (const symbol of pairs) {
    try {
      logger.debug(`Fetching Bybit ticker for ${symbol}`);
      const ticker = await getBybitTicker(symbol, 'spot');

      if (ticker && ticker.lastPrice > 0) {
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

        // Cache to database (if using Drizzle schema)
        try {
          // Assuming you have a bybit_market_data table
          await db.execute(
            `INSERT INTO bybit_market_data (symbol, last_price, volume_24h, price_24h_change, source, expires_at, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
             ON CONFLICT (symbol) DO UPDATE SET
             last_price = $2, volume_24h = $3, price_24h_change = $4, expires_at = $6, updated_at = NOW()`,
            [symbol, ticker.lastPrice, ticker.volume24h, ticker.price24hPcnt, 'bybit', expiresAt]
          );
        } catch (dbError) {
          logger.debug(`Could not cache ${symbol} to DB (table may not exist):`, dbError instanceof Error ? dbError.message : dbError);
        }

        tickersToCache.push({
          symbol,
          lastPrice: ticker.lastPrice,
          volume24h: ticker.volume24h,
          price24hPcnt: ticker.price24hPcnt,
          timestamp: ticker.timestamp,
          source: 'bybit',
          expiresAt
        });

        successCount++;
      }
    } catch (error) {
      logger.warn(`Failed to sync ticker for ${symbol}:`, error instanceof Error ? error.message : String(error));
      failureCount++;
    }
  }

  logger.info(`Bybit ticker sync completed: ${successCount} successful, ${failureCount} failed`);
  return tickersToCache;
}

/**
 * Sync supported instruments (spot trading pairs)
 */
export async function syncBybitInstruments() {
  if (!BYBIT_PUBLIC_API || BYBIT_PUBLIC_API === 'your-bybit-public-api-key') {
    logger.warn('Bybit API keys not configured, skipping instruments sync');
    return [];
  }

  try {
    logger.info('Syncing Bybit spot trading instruments');
    const instruments = await getBybitInstruments('spot');

    if (instruments && instruments.length > 0) {
      // Try to cache instruments to DB
      try {
        await db.execute(
          `DELETE FROM bybit_instruments WHERE category = 'spot'`
        );

        for (const instrument of instruments) {
          await db.execute(
            `INSERT INTO bybit_instruments (symbol, base_coin, quote_coin, category, status, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [instrument.symbol, instrument.baseCoin, instrument.quoteCoin, 'spot', instrument.status]
          );
        }

        logger.info(`Synced ${instruments.length} Bybit spot instruments`);
      } catch (dbError) {
        logger.debug(`Could not cache instruments to DB (table may not exist):`, dbError instanceof Error ? dbError.message : dbError);
      }
    }

    return instruments;
  } catch (error) {
    logger.error('Failed to sync Bybit instruments:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Sync orderbook data for major pairs
 */
export async function syncBybitOrderbooks(pairs: string[] = MAJOR_TRADING_PAIRS.slice(0, 5)) {
  if (!BYBIT_PUBLIC_API || BYBIT_PUBLIC_API === 'your-bybit-public-api-key') {
    logger.warn('Bybit API keys not configured, skipping orderbook sync');
    return;
  }

  let successCount = 0;
  let failureCount = 0;

  for (const symbol of pairs) {
    try {
      logger.debug(`Fetching Bybit orderbook for ${symbol}`);
      const orderbook = await getBybitOrderBook(symbol, 20, 'spot');

      if (orderbook && (orderbook.bids.length > 0 || orderbook.asks.length > 0)) {
        const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 minute TTL for orderbook

        // Try to cache orderbook
        try {
          const bid = orderbook.bids[0]?.price || 0;
          const ask = orderbook.asks[0]?.price || 0;

          await db.execute(
            `INSERT INTO bybit_orderbooks (symbol, best_bid, best_ask, bids_count, asks_count, expires_at, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (symbol) DO UPDATE SET
             best_bid = $2, best_ask = $3, bids_count = $4, asks_count = $5, expires_at = $6`,
            [symbol, bid, ask, orderbook.bids.length, orderbook.asks.length, expiresAt]
          );
        } catch (dbError) {
          logger.debug(`Could not cache orderbook for ${symbol}:`, dbError instanceof Error ? dbError.message : dbError);
        }

        successCount++;
      }
    } catch (error) {
      logger.warn(`Failed to sync orderbook for ${symbol}:`, error instanceof Error ? error.message : String(error));
      failureCount++;
    }
  }

  logger.info(`Bybit orderbook sync completed: ${successCount} successful, ${failureCount} failed`);
}

/**
 * Cleanup expired cached data
 */
export async function cleanupExpiredBybitCache() {
  try {
    // Clean up expired tickers
    try {
      const result = await db.execute(
        `DELETE FROM bybit_market_data WHERE expires_at < NOW()`
      );
      logger.debug('Cleaned up expired Bybit market data');
    } catch (error) {
      logger.debug('Could not clean up market data (table may not exist)');
    }

    // Clean up expired orderbooks
    try {
      const result = await db.execute(
        `DELETE FROM bybit_orderbooks WHERE expires_at < NOW()`
      );
      logger.debug('Cleaned up expired Bybit orderbook data');
    } catch (error) {
      logger.debug('Could not clean up orderbook data (table may not exist)');
    }
  } catch (error) {
    logger.error('Failed to cleanup expired Bybit cache:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Start the Bybit data sync background job
 */
export default function startBybitDataSync(intervalMs: number = SYNC_INTERVAL) {
  if (!BYBIT_PUBLIC_API || BYBIT_PUBLIC_API === 'your-bybit-public-api-key') {
    logger.warn('BYBIT_PUBLIC_API not configured, Bybit data sync disabled');
    return () => {};
  }

  logger.info('Starting Bybit data sync service...');

  // Run sync immediately on startup
  (async () => {
    try {
      logger.info('Running initial Bybit sync...');
      await syncBybitTickers();
      await syncBybitInstruments();
      await syncBybitOrderbooks();
      await cleanupExpiredBybitCache();
    } catch (error) {
      logger.error('Initial Bybit sync failed:', error instanceof Error ? error.message : String(error));
    }
  })();

  // Schedule recurring sync
  const syncInterval = setInterval(async () => {
    try {
      logger.info('Running scheduled Bybit sync...');
      await syncBybitTickers();

      // Sync instruments every 3rd sync cycle (every 9 minutes)
      const now = Date.now();
      if (now % (intervalMs * 3) < intervalMs) {
        await syncBybitInstruments();
      }

      // Sync orderbooks every cycle
      await syncBybitOrderbooks();

      // Cleanup every other sync
      if (now % (intervalMs * 2) < intervalMs) {
        await cleanupExpiredBybitCache();
      }
    } catch (error) {
      logger.error('Scheduled Bybit sync failed:', error instanceof Error ? error.message : String(error));
    }
  }, intervalMs);

  logger.info(`Bybit data sync started (interval: ${intervalMs}ms)`);

  // Return cleanup function
  return () => clearInterval(syncInterval);
}
