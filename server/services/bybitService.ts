import axios from 'axios';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

const BYBIT_BASE_URL = 'https://api.bybit.com/v5';
const BYBIT_PUBLIC_API = process.env.BYBIT_PUBLIC_API || '';
const BYBIT_SECRET_API = process.env.BYBIT_SECRET_API || '';

// Helper function to generate HMAC-SHA256 signature for Bybit API
function signBybit(secret: string, timestamp: string, method: string, path: string, body: string = ''): string {
  const payload = `${timestamp}${method.toUpperCase()}${path}${body}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// Helper function to make authenticated Bybit API calls
async function callBybitAPI(method: string, path: string, query: string = '', body: any = null) {
  try {
    if (!BYBIT_PUBLIC_API || !BYBIT_SECRET_API || BYBIT_PUBLIC_API === 'your-bybit-public-api-key') {
      logger.warn('Bybit API keys not properly configured');
      return null;
    }

    const timestamp = Date.now().toString();
    const bodyString = body ? JSON.stringify(body) : '';
    const signature = signBybit(BYBIT_SECRET_API, timestamp, method, path, bodyString);

    const fullUrl = `${BYBIT_BASE_URL}${path}${query ? `?${query}` : ''}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-BAPI-API-KEY': BYBIT_PUBLIC_API,
      'X-BAPI-SIGN': signature,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': '5000'
    };

    const response = await axios({
      url: fullUrl,
      method,
      headers,
      data: bodyString || undefined,
      timeout: 10000,
      validateStatus: () => true
    });

    if (response.status !== 200) {
      logger.warn(`Bybit API returned status ${response.status}`, { path });
      return null;
    }

    if (response.data?.retCode !== 0) {
      logger.warn(`Bybit API error: ${response.data?.retMsg}`, { path });
      return null;
    }

    return response.data?.result || null;
  } catch (error) {
    logger.error('Bybit API call failed:', {
      path,
      message: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

// Helper function to make unauthenticated Bybit API calls
async function callBybitPublicAPI(path: string, query: string = '') {
  try {
    const fullUrl = `${BYBIT_BASE_URL}${path}${query ? `?${query}` : ''}`;

    const response = await axios.get(fullUrl, {
      timeout: 10000,
      validateStatus: () => true
    });

    if (response.status !== 200) {
      logger.warn(`Bybit public API returned status ${response.status}`, { path });
      return null;
    }

    if (response.data?.retCode !== 0) {
      logger.warn(`Bybit public API error: ${response.data?.retMsg}`, { path });
      return null;
    }

    return response.data?.result || null;
  } catch (error) {
    logger.error('Bybit public API call failed:', {
      path,
      message: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Get server time from Bybit
 */
export async function getBybitServerTime(): Promise<number | null> {
  try {
    const result = await callBybitPublicAPI('/server/time');
    if (result && typeof result.timeSecond === 'string') {
      return parseInt(result.timeSecond) * 1000;
    }
    return null;
  } catch (error) {
    logger.error('Failed to get Bybit server time:', error);
    return null;
  }
}

/**
 * Get ticker data for a specific symbol
 * Supports both SPOT and FUTURES trading
 */
export async function getBybitTicker(symbol: string, category: 'spot' | 'linear' | 'inverse' = 'spot') {
  try {
    const query = `category=${category}&symbol=${symbol}`;
    const result = await callBybitPublicAPI('/market/tickers', query);

    if (!result || !result.list || result.list.length === 0) {
      logger.debug(`No ticker data found for ${symbol}`);
      return null;
    }

    const ticker = result.list[0];

    return {
      symbol: ticker.symbol,
      lastPrice: parseFloat(ticker.lastPrice),
      bidPrice: parseFloat(ticker.bid1Price),
      askPrice: parseFloat(ticker.ask1Price),
      highPrice24h: parseFloat(ticker.highPrice24h),
      lowPrice24h: parseFloat(ticker.lowPrice24h),
      volume24h: parseFloat(ticker.volume24h),
      turnover24h: parseFloat(ticker.turnover24h),
      price24hPcnt: parseFloat(ticker.price24hPcnt) * 100, // Convert to percentage
      prevPrice24h: parseFloat(ticker.prevPrice24h),
      markPrice: parseFloat(ticker.markPrice),
      indexPrice: parseFloat(ticker.indexPrice),
      openInterest: ticker.openInterest,
      timestamp: Date.now()
    };
  } catch (error) {
    logger.error('Failed to get Bybit ticker:', { symbol, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Get order book (market depth) for a symbol
 */
export async function getBybitOrderBook(symbol: string, limit: number = 25, category: 'spot' | 'linear' | 'inverse' = 'spot') {
  try {
    const query = `category=${category}&symbol=${symbol}&limit=${limit}`;
    const result = await callBybitPublicAPI('/market/orderbook', query);

    if (!result) {
      logger.debug(`No orderbook data found for ${symbol}`);
      return null;
    }

    // Parse bids and asks
    const bids = (result.b || []).map((bid: string[]) => ({
      price: parseFloat(bid[0]),
      quantity: parseFloat(bid[1]),
      total: parseFloat(bid[0]) * parseFloat(bid[1])
    }));

    const asks = (result.a || []).map((ask: string[]) => ({
      price: parseFloat(ask[0]),
      quantity: parseFloat(ask[1]),
      total: parseFloat(ask[0]) * parseFloat(ask[1])
    }));

    return {
      symbol,
      bids: bids.sort((a, b) => b.price - a.price),
      asks: asks.sort((a, a2) => a.price - a2.price),
      timestamp: Date.now()
    };
  } catch (error) {
    logger.error('Failed to get Bybit orderbook:', { symbol, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Get klines (candlestick) data
 */
export async function getBybitKlines(
  symbol: string,
  interval: string = '1',
  limit: number = 200,
  category: 'spot' | 'linear' | 'inverse' = 'spot'
) {
  try {
    const query = `category=${category}&symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const result = await callBybitPublicAPI('/market/kline', query);

    if (!result || !result.list) {
      logger.debug(`No kline data found for ${symbol}`);
      return null;
    }

    // Bybit returns klines in reverse chronological order
    return result.list.map((kline: string[]) => ({
      timestamp: parseInt(kline[0]),
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
      turnover: parseFloat(kline[6])
    })).reverse();
  } catch (error) {
    logger.error('Failed to get Bybit klines:', { symbol, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Get supported instruments/symbols
 */
export async function getBybitInstruments(category: 'spot' | 'linear' | 'inverse' = 'spot') {
  try {
    const query = `category=${category}&limit=1000`;
    const result = await callBybitPublicAPI('/market/instruments-info', query);

    if (!result || !result.list) {
      logger.debug(`No instruments found for category ${category}`);
      return [];
    }

    return result.list.map((instrument: any) => ({
      symbol: instrument.symbol,
      baseCoin: instrument.baseCoin,
      quoteCoin: instrument.quoteCoin,
      status: instrument.status,
      minOrderQty: instrument.lotSizeFilter?.minOrderQty,
      maxOrderQty: instrument.lotSizeFilter?.maxOrderQty,
      minOrderAmt: instrument.priceFilter?.minPrice ? parseFloat(instrument.priceFilter.minPrice) : null,
      maxOrderAmt: instrument.priceFilter?.maxPrice ? parseFloat(instrument.priceFilter.maxPrice) : null
    }));
  } catch (error) {
    logger.error('Failed to get Bybit instruments:', { category, error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

/**
 * Get wallet balance (requires authentication)
 */
export async function getBybitWalletBalance(accountType: 'SPOT' | 'UNIFIED' = 'UNIFIED') {
  try {
    const query = `accountType=${accountType}`;
    const result = await callBybitAPI('GET', '/account/wallet-balance', query);

    if (!result || !result.list) {
      logger.warn('No wallet balance data found');
      return null;
    }

    const accounts = result.list.map((account: any) => ({
      accountType: account.accountType,
      totalEquity: parseFloat(account.totalEquity),
      totalWalletBalance: parseFloat(account.totalWalletBalance),
      totalMarginBalance: parseFloat(account.totalMarginBalance),
      totalAvailableBalance: parseFloat(account.totalAvailableBalance),
      coins: (account.coin || []).map((coin: any) => ({
        coin: coin.coin,
        walletBalance: parseFloat(coin.walletBalance),
        transferBalance: parseFloat(coin.transferBalance),
        bonus: parseFloat(coin.bonus),
        availableToWithdraw: parseFloat(coin.walletBalance) - parseFloat(coin.transferBalance)
      }))
    }));

    return accounts;
  } catch (error) {
    logger.error('Failed to get Bybit wallet balance:', error);
    return null;
  }
}

/**
 * Get deposit address for a coin (requires authentication)
 */
export async function getBybitDepositAddress(coin: string, chain?: string) {
  try {
    let query = `coin=${coin}`;
    if (chain) {
      query += `&chain=${chain}`;
    }

    const result = await callBybitAPI('GET', '/asset/deposit/query-address', query);

    if (!result || !Array.isArray(result) || result.length === 0) {
      logger.warn(`No deposit address found for ${coin}`);
      return null;
    }

    const address = result[0];

    return {
      coin: address.coin,
      chains: result.map((a: any) => ({
        chain: a.chain,
        address: a.address,
        tag: a.tag,
        chainDeposit: a.chainDeposit
      }))
    };
  } catch (error) {
    logger.error('Failed to get Bybit deposit address:', { coin, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Get withdrawal fees for a coin
 */
export async function getBybitWithdrawalFee(coin: string, chain?: string) {
  try {
    let query = `coin=${coin}`;
    if (chain) {
      query += `&chain=${chain}`;
    }

    const result = await callBybitAPI('GET', '/asset/withdraw/query-fee', query);

    if (!result) {
      logger.warn(`No withdrawal fee data found for ${coin}`);
      return null;
    }

    return {
      coin: result.coin,
      withdrawFee: result.withdrawFee,
      chains: (result.chains || []).map((chain: any) => ({
        chain: chain.chainName,
        withdrawFee: parseFloat(chain.withdrawFee),
        minWithdrawalAmount: parseFloat(chain.minWithdrawalAmount),
        maxWithdrawalAmount: parseFloat(chain.maxWithdrawalAmount),
        chainDeposit: chain.chainDeposit
      }))
    };
  } catch (error) {
    logger.error('Failed to get Bybit withdrawal fee:', { coin, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Get trading fees for a specific symbol
 */
export async function getBybitTradingFees(symbol: string, category: 'spot' | 'linear' | 'inverse' = 'spot') {
  try {
    const query = `category=${category}&symbol=${symbol}`;
    const result = await callBybitAPI('GET', '/account/trading-fee', query);

    if (!result || !result.list || result.list.length === 0) {
      logger.warn(`No trading fee data found for ${symbol}`);
      return null;
    }

    const fees = result.list[0];

    return {
      symbol: fees.symbol,
      category: fees.category,
      takerFeeRate: parseFloat(fees.takerFeeRate),
      makerFeeRate: parseFloat(fees.makerFeeRate)
    };
  } catch (error) {
    logger.error('Failed to get Bybit trading fees:', { symbol, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Get spot leverage tokens list
 */
export async function getBybitLeverageTokens() {
  try {
    const result = await callBybitPublicAPI('/spot-lever-token/tokens');

    if (!result || !result.list) {
      logger.debug('No leverage tokens found');
      return [];
    }

    return result.list.map((token: any) => ({
      ltName: token.ltName,
      ltCoin: token.ltCoin,
      ltMultiplier: token.ltMultiplier,
      baseCoin: token.baseCoin,
      maxLeverage: token.maxLeverage,
      status: token.status,
      price: parseFloat(token.ltPrice)
    }));
  } catch (error) {
    logger.error('Failed to get Bybit leverage tokens:', error);
    return [];
  }
}

/**
 * Get recent trades for a symbol
 */
export async function getBybitRecentTrades(symbol: string, limit: number = 100, category: 'spot' | 'linear' | 'inverse' = 'spot') {
  try {
    const query = `category=${category}&symbol=${symbol}&limit=${limit}`;
    const result = await callBybitPublicAPI('/market/recent-trade', query);

    if (!result || !result.list) {
      logger.debug(`No recent trades found for ${symbol}`);
      return [];
    }

    return result.list.map((trade: any) => ({
      tradeId: trade.execId,
      symbol: trade.symbol,
      price: parseFloat(trade.price),
      quantity: parseFloat(trade.size),
      timestamp: parseInt(trade.time),
      side: trade.side,
      blockTrade: trade.blockTrade === '1'
    }));
  } catch (error) {
    logger.error('Failed to get Bybit recent trades:', { symbol, error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

/**
 * Get settlement history for a symbol (futures only)
 */
export async function getBybitSettlementHistory(symbol: string, limit: number = 100, category: 'linear' | 'inverse' = 'linear') {
  try {
    const query = `category=${category}&symbol=${symbol}&limit=${limit}`;
    const result = await callBybitPublicAPI('/market/settlement-history', query);

    if (!result || !result.list) {
      logger.debug(`No settlement history found for ${symbol}`);
      return [];
    }

    return result.list.map((settlement: any) => ({
      symbol: settlement.symbol,
      settlementTime: parseInt(settlement.settlementTime),
      settlementPrice: parseFloat(settlement.settlementPrice),
      funding: parseFloat(settlement.funding),
      fundingRate: parseFloat(settlement.fundingRate)
    }));
  } catch (error) {
    logger.error('Failed to get Bybit settlement history:', { symbol, error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

/**
 * Get funding rate history for a symbol (futures only)
 */
export async function getBybitFundingRateHistory(symbol: string, limit: number = 100, category: 'linear' | 'inverse' = 'linear') {
  try {
    const query = `category=${category}&symbol=${symbol}&limit=${limit}`;
    const result = await callBybitPublicAPI('/market/funding/history', query);

    if (!result || !result.list) {
      logger.debug(`No funding rate history found for ${symbol}`);
      return [];
    }

    return result.list.map((rate: any) => ({
      symbol: rate.symbol,
      fundingRate: parseFloat(rate.fundingRate),
      fundingTime: parseInt(rate.fundingTimestamp),
      nextFundingTime: rate.nextFundingTime ? parseInt(rate.nextFundingTime) : null
    }));
  } catch (error) {
    logger.error('Failed to get Bybit funding rate history:', { symbol, error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

/**
 * Get current funding rate for symbols
 */
export async function getBybitFundingRate(symbol: string, category: 'linear' | 'inverse' = 'linear') {
  try {
    const query = `category=${category}&symbol=${symbol}`;
    const result = await callBybitPublicAPI('/market/funding/rate', query);

    if (!result || !result.list || result.list.length === 0) {
      logger.debug(`No funding rate found for ${symbol}`);
      return null;
    }

    const rate = result.list[0];
    return {
      symbol: rate.symbol,
      fundingRate: parseFloat(rate.fundingRate),
      fundingTime: parseInt(rate.fundingTimestamp),
      nextFundingTime: rate.nextFundingTime ? parseInt(rate.nextFundingTime) : null
    };
  } catch (error) {
    logger.error('Failed to get Bybit funding rate:', { symbol, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Get historical trades (requires authentication for private trades)
 */
export async function getBybitTradeHistory(symbol: string, limit: number = 50, category: 'spot' | 'linear' | 'inverse' = 'spot') {
  try {
    const query = `category=${category}&symbol=${symbol}&limit=${limit}`;
    const result = await callBybitPublicAPI('/market/public-recent-trading', query);

    if (!result || !result.list) {
      logger.debug(`No trade history found for ${symbol}`);
      return [];
    }

    return result.list.map((trade: any) => ({
      tradeId: trade.execId,
      symbol: trade.symbol,
      price: parseFloat(trade.price),
      quantity: parseFloat(trade.size),
      timestamp: parseInt(trade.time),
      side: trade.side
    }));
  } catch (error) {
    logger.error('Failed to get Bybit trade history:', { symbol, error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

/**
 * Get open interest for a symbol
 */
export async function getBybitOpenInterest(symbol: string, period: string = '5min', category: 'linear' | 'inverse' = 'linear', limit: number = 100) {
  try {
    const query = `category=${category}&symbol=${symbol}&period=${period}&limit=${limit}`;
    const result = await callBybitPublicAPI('/market/open-interest', query);

    if (!result || !result.list) {
      logger.debug(`No open interest data found for ${symbol}`);
      return [];
    }

    return result.list.map((oi: any) => ({
      symbol: oi.symbol,
      openInterest: parseFloat(oi.openInterest),
      timestamp: parseInt(oi.timestamp)
    }));
  } catch (error) {
    logger.error('Failed to get Bybit open interest:', { symbol, error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

/**
 * Get liquidation data for a symbol
 */
export async function getBybitLiquidations(symbol: string, limit: number = 100, category: 'linear' | 'inverse' = 'linear') {
  try {
    const query = `category=${category}&symbol=${symbol}&limit=${limit}`;
    const result = await callBybitPublicAPI('/market/liquidation', query);

    if (!result || !result.list) {
      logger.debug(`No liquidation data found for ${symbol}`);
      return [];
    }

    return result.list.map((liquidation: any) => ({
      symbol: liquidation.symbol,
      price: parseFloat(liquidation.price),
      side: liquidation.side,
      size: parseFloat(liquidation.size),
      timestamp: parseInt(liquidation.time)
    }));
  } catch (error) {
    logger.error('Failed to get Bybit liquidations:', { symbol, error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

/**
 * Get long-short ratio for a symbol
 */
export async function getBybitLongShortRatio(symbol: string, period: string = '5min', limit: number = 100, category: 'linear' | 'inverse' = 'linear') {
  try {
    const query = `category=${category}&symbol=${symbol}&period=${period}&limit=${limit}`;
    const result = await callBybitPublicAPI('/market/long-short', query);

    if (!result || !result.list) {
      logger.debug(`No long-short ratio found for ${symbol}`);
      return [];
    }

    return result.list.map((ratio: any) => ({
      symbol: ratio.symbol,
      longRatio: parseFloat(ratio.longAccounts),
      shortRatio: parseFloat(ratio.shortAccounts),
      timestamp: parseInt(ratio.timestamp)
    }));
  } catch (error) {
    logger.error('Failed to get Bybit long-short ratio:', { symbol, error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

/**
 * Verify Bybit API connectivity
 */
export async function verifyBybitConnection(): Promise<boolean> {
  try {
    const serverTime = await getBybitServerTime();
    if (serverTime && serverTime > 0) {
      logger.info('Bybit API connection verified');
      return true;
    }
    logger.warn('Bybit API connection verification failed');
    return false;
  } catch (error) {
    logger.error('Bybit API connection verification error:', error);
    return false;
  }
}
