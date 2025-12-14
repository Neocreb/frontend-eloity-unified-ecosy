import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import bybitCache from '../services/bybitCacheService.js';
import {
  getBybitServerTime,
  getBybitTicker,
  getBybitOrderBook,
  getBybitKlines,
  getBybitInstruments,
  getBybitWalletBalance,
  getBybitDepositAddress,
  getBybitWithdrawalFee,
  getBybitTradingFees,
  getBybitLeverageTokens,
  getBybitRecentTrades,
  getBybitTradeHistory,
  getBybitSettlementHistory,
  getBybitFundingRate,
  getBybitFundingRateHistory,
  getBybitOpenInterest,
  getBybitLiquidations,
  getBybitLongShortRatio,
  verifyBybitConnection
} from '../services/bybitService.js';

const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const isConnected = await verifyBybitConnection();
    if (isConnected) {
      res.json({ status: 'ok', message: 'Bybit API connection verified' });
    } else {
      res.status(503).json({ status: 'error', message: 'Bybit API connection failed' });
    }
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({ status: 'error', message: 'Health check failed' });
  }
});

/**
 * Get server time
 */
router.get('/server/time', async (req, res) => {
  try {
    const timestamp = await getBybitServerTime();
    if (timestamp) {
      res.json({ timestamp, success: true });
    } else {
      res.status(503).json({ success: false, error: 'Failed to get server time' });
    }
  } catch (error) {
    logger.error('Error getting server time:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Get ticker data for a symbol (with caching)
 * Query params: symbol (required), category (optional: spot|linear|inverse, default: spot)
 */
router.get('/market/ticker', async (req, res) => {
  try {
    const { symbol, category = 'spot' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const upperSymbol = symbol.toUpperCase();

    // Use cache for ticker data
    const ticker = await bybitCache.getOrFetchTicker(
      upperSymbol,
      (sym) => getBybitTicker(sym, category as 'spot' | 'linear' | 'inverse'),
      30 * 1000 // 30 second TTL
    );

    if (!ticker) {
      return res.status(404).json({ error: `No ticker data found for ${symbol}` });
    }

    res.json(ticker);
  } catch (error) {
    logger.error('Error getting ticker:', error);
    res.status(500).json({ error: 'Failed to get ticker data' });
  }
});

/**
 * Get order book (market depth) with caching
 * Query params: symbol (required), limit (optional, default: 25), category (optional)
 */
router.get('/market/orderbook', async (req, res) => {
  try {
    const { symbol, limit = '25', category = 'spot' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const upperSymbol = symbol.toUpperCase();
    const limitNum = parseInt(limit as string, 10);

    // Use cache for orderbook data
    const orderbook = await bybitCache.getOrFetchOrderbook(
      upperSymbol,
      limitNum,
      (sym, lim) => getBybitOrderBook(sym, lim, category as 'spot' | 'linear' | 'inverse'),
      20 * 1000 // 20 second TTL
    );

    if (!orderbook) {
      return res.status(404).json({ error: `No orderbook data found for ${symbol}` });
    }

    res.json(orderbook);
  } catch (error) {
    logger.error('Error getting orderbook:', error);
    res.status(500).json({ error: 'Failed to get orderbook' });
  }
});

/**
 * Get kline (candlestick) data
 * Query params: symbol (required), interval (optional, default: 1), limit (optional, default: 200), category (optional)
 */
router.get('/market/klines', async (req, res) => {
  try {
    const { symbol, interval = '1', limit = '200', category = 'spot' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const klines = await getBybitKlines(
      symbol.toUpperCase(),
      interval as string,
      parseInt(limit as string, 10),
      category as 'spot' | 'linear' | 'inverse'
    );

    if (!klines) {
      return res.status(404).json({ error: `No kline data found for ${symbol}` });
    }

    res.json(klines);
  } catch (error) {
    logger.error('Error getting klines:', error);
    res.status(500).json({ error: 'Failed to get kline data' });
  }
});

/**
 * Get supported instruments
 * Query params: category (optional: spot|linear|inverse, default: spot)
 */
router.get('/market/instruments', async (req, res) => {
  try {
    const { category = 'spot' } = req.query;

    const instruments = await getBybitInstruments(category as 'spot' | 'linear' | 'inverse');

    res.json({
      category,
      count: instruments.length,
      instruments
    });
  } catch (error) {
    logger.error('Error getting instruments:', error);
    res.status(500).json({ error: 'Failed to get instruments' });
  }
});

/**
 * Get wallet balance (requires authentication)
 */
router.get('/account/wallet-balance', authenticateToken, async (req, res) => {
  try {
    const { accountType = 'UNIFIED' } = req.query;

    const balance = await getBybitWalletBalance(accountType as 'SPOT' | 'UNIFIED');

    if (!balance) {
      return res.status(503).json({ error: 'Failed to fetch wallet balance from Bybit' });
    }

    res.json(balance);
  } catch (error) {
    logger.error('Error getting wallet balance:', error);
    res.status(500).json({ error: 'Failed to get wallet balance' });
  }
});

/**
 * Get deposit address (requires authentication)
 * Query params: coin (required), chain (optional)
 */
router.get('/asset/deposit-address', authenticateToken, async (req, res) => {
  try {
    const { coin, chain } = req.query;

    if (!coin || typeof coin !== 'string') {
      return res.status(400).json({ error: 'Coin is required' });
    }

    const address = await getBybitDepositAddress(coin.toUpperCase(), chain ? String(chain) : undefined);

    if (!address) {
      return res.status(404).json({ error: `No deposit address found for ${coin}` });
    }

    res.json(address);
  } catch (error) {
    logger.error('Error getting deposit address:', error);
    res.status(500).json({ error: 'Failed to get deposit address' });
  }
});

/**
 * Get withdrawal fee (requires authentication)
 * Query params: coin (required), chain (optional)
 */
router.get('/asset/withdrawal-fee', authenticateToken, async (req, res) => {
  try {
    const { coin, chain } = req.query;

    if (!coin || typeof coin !== 'string') {
      return res.status(400).json({ error: 'Coin is required' });
    }

    const fee = await getBybitWithdrawalFee(coin.toUpperCase(), chain ? String(chain) : undefined);

    if (!fee) {
      return res.status(404).json({ error: `No withdrawal fee data found for ${coin}` });
    }

    res.json(fee);
  } catch (error) {
    logger.error('Error getting withdrawal fee:', error);
    res.status(500).json({ error: 'Failed to get withdrawal fee' });
  }
});

/**
 * Get trading fees for a symbol (requires authentication)
 * Query params: symbol (required), category (optional)
 */
router.get('/account/trading-fees', authenticateToken, async (req, res) => {
  try {
    const { symbol, category = 'spot' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const fees = await getBybitTradingFees(symbol.toUpperCase(), category as 'spot' | 'linear' | 'inverse');

    if (!fees) {
      return res.status(404).json({ error: `No trading fee data found for ${symbol}` });
    }

    res.json(fees);
  } catch (error) {
    logger.error('Error getting trading fees:', error);
    res.status(500).json({ error: 'Failed to get trading fees' });
  }
});

/**
 * Get leverage tokens list
 */
router.get('/spot-lever-token/list', async (req, res) => {
  try {
    const tokens = await getBybitLeverageTokens();

    res.json({
      count: tokens.length,
      tokens
    });
  } catch (error) {
    logger.error('Error getting leverage tokens:', error);
    res.status(500).json({ error: 'Failed to get leverage tokens' });
  }
});

/**
 * Get recent trades for a symbol
 * Query params: symbol (required), limit (optional, default: 100), category (optional)
 */
router.get('/market/recent-trades', async (req, res) => {
  try {
    const { symbol, limit = '100', category = 'spot' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const trades = await getBybitRecentTrades(
      symbol.toUpperCase(),
      parseInt(limit as string, 10),
      category as 'spot' | 'linear' | 'inverse'
    );

    res.json({ symbol: symbol.toUpperCase(), count: trades.length, trades });
  } catch (error) {
    logger.error('Error getting recent trades:', error);
    res.status(500).json({ error: 'Failed to get recent trades' });
  }
});

/**
 * Get trade history for a symbol
 * Query params: symbol (required), limit (optional, default: 50), category (optional)
 */
router.get('/market/trade-history', async (req, res) => {
  try {
    const { symbol, limit = '50', category = 'spot' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const trades = await getBybitTradeHistory(
      symbol.toUpperCase(),
      parseInt(limit as string, 10),
      category as 'spot' | 'linear' | 'inverse'
    );

    res.json({ symbol: symbol.toUpperCase(), count: trades.length, trades });
  } catch (error) {
    logger.error('Error getting trade history:', error);
    res.status(500).json({ error: 'Failed to get trade history' });
  }
});

/**
 * Get settlement history for a futures symbol
 * Query params: symbol (required), limit (optional, default: 100), category (optional)
 */
router.get('/market/settlement-history', async (req, res) => {
  try {
    const { symbol, limit = '100', category = 'linear' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const settlements = await getBybitSettlementHistory(
      symbol.toUpperCase(),
      parseInt(limit as string, 10),
      category as 'linear' | 'inverse'
    );

    res.json({ symbol: symbol.toUpperCase(), count: settlements.length, settlements });
  } catch (error) {
    logger.error('Error getting settlement history:', error);
    res.status(500).json({ error: 'Failed to get settlement history' });
  }
});

/**
 * Get current funding rate for a futures symbol
 * Query params: symbol (required), category (optional)
 */
router.get('/market/funding-rate', async (req, res) => {
  try {
    const { symbol, category = 'linear' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const fundingRate = await getBybitFundingRate(
      symbol.toUpperCase(),
      category as 'linear' | 'inverse'
    );

    if (!fundingRate) {
      return res.status(404).json({ error: `No funding rate found for ${symbol}` });
    }

    res.json(fundingRate);
  } catch (error) {
    logger.error('Error getting funding rate:', error);
    res.status(500).json({ error: 'Failed to get funding rate' });
  }
});

/**
 * Get funding rate history for a futures symbol
 * Query params: symbol (required), limit (optional, default: 100), category (optional)
 */
router.get('/market/funding-rate-history', async (req, res) => {
  try {
    const { symbol, limit = '100', category = 'linear' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const history = await getBybitFundingRateHistory(
      symbol.toUpperCase(),
      parseInt(limit as string, 10),
      category as 'linear' | 'inverse'
    );

    res.json({ symbol: symbol.toUpperCase(), count: history.length, history });
  } catch (error) {
    logger.error('Error getting funding rate history:', error);
    res.status(500).json({ error: 'Failed to get funding rate history' });
  }
});

/**
 * Get open interest data for a symbol
 * Query params: symbol (required), period (optional), limit (optional), category (optional)
 */
router.get('/market/open-interest', async (req, res) => {
  try {
    const { symbol, period = '5min', limit = '100', category = 'linear' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const openInterest = await getBybitOpenInterest(
      symbol.toUpperCase(),
      period as string,
      category as 'linear' | 'inverse',
      parseInt(limit as string, 10)
    );

    res.json({ symbol: symbol.toUpperCase(), count: openInterest.length, openInterest });
  } catch (error) {
    logger.error('Error getting open interest:', error);
    res.status(500).json({ error: 'Failed to get open interest' });
  }
});

/**
 * Get liquidation data for a symbol
 * Query params: symbol (required), limit (optional, default: 100), category (optional)
 */
router.get('/market/liquidations', async (req, res) => {
  try {
    const { symbol, limit = '100', category = 'linear' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const liquidations = await getBybitLiquidations(
      symbol.toUpperCase(),
      parseInt(limit as string, 10),
      category as 'linear' | 'inverse'
    );

    res.json({ symbol: symbol.toUpperCase(), count: liquidations.length, liquidations });
  } catch (error) {
    logger.error('Error getting liquidations:', error);
    res.status(500).json({ error: 'Failed to get liquidations' });
  }
});

/**
 * Get long-short ratio for a symbol
 * Query params: symbol (required), period (optional), limit (optional), category (optional)
 */
router.get('/market/long-short-ratio', async (req, res) => {
  try {
    const { symbol, period = '5min', limit = '100', category = 'linear' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const ratios = await getBybitLongShortRatio(
      symbol.toUpperCase(),
      period as string,
      parseInt(limit as string, 10),
      category as 'linear' | 'inverse'
    );

    res.json({ symbol: symbol.toUpperCase(), count: ratios.length, ratios });
  } catch (error) {
    logger.error('Error getting long-short ratio:', error);
    res.status(500).json({ error: 'Failed to get long-short ratio' });
  }
});

export default router;
