import { logger } from '../utils/logger.js';

/**
 * In-memory cache for Bybit market data
 * Reduces API calls by caching frequently accessed data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class BybitCacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 60 * 1000; // 60 seconds default
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // Cleanup every 5 minutes

  constructor() {
    // Start cleanup timer
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
    logger.info('BybitCacheService initialized with 5-minute cleanup interval');
  }

  /**
   * Generate cache key from parameters
   */
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `bybit:${prefix}:${sortedParams}`;
  }

  /**
   * Get value from cache if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache with optional custom TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    if (this.cache.size % 100 === 0) {
      logger.debug(`Cache size: ${this.cache.size} entries`);
    }
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`Cleared cache (removed ${size} entries)`);
  }

  /**
   * Get or fetch ticker data
   */
  async getOrFetchTicker<T>(
    symbol: string,
    fetcher: (symbol: string) => Promise<T | null>,
    ttl: number = 30 * 1000 // 30 seconds for ticker
  ): Promise<T | null> {
    const key = this.generateKey('ticker', { symbol });
    
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      logger.debug(`Cache hit for ticker: ${symbol}`);
      return cached;
    }

    // Fetch from API
    logger.debug(`Cache miss for ticker: ${symbol}, fetching from API`);
    const data = await fetcher(symbol);
    
    if (data) {
      this.set(key, data, ttl);
    }

    return data;
  }

  /**
   * Get or fetch orderbook data
   */
  async getOrFetchOrderbook<T>(
    symbol: string,
    limit: number,
    fetcher: (symbol: string, limit: number) => Promise<T | null>,
    ttl: number = 20 * 1000 // 20 seconds for orderbook
  ): Promise<T | null> {
    const key = this.generateKey('orderbook', { symbol, limit });
    
    const cached = this.get<T>(key);
    if (cached !== null) {
      logger.debug(`Cache hit for orderbook: ${symbol}`);
      return cached;
    }

    logger.debug(`Cache miss for orderbook: ${symbol}, fetching from API`);
    const data = await fetcher(symbol, limit);
    
    if (data) {
      this.set(key, data, ttl);
    }

    return data;
  }

  /**
   * Get or fetch klines data
   */
  async getOrFetchKlines<T>(
    symbol: string,
    interval: string,
    limit: number,
    fetcher: (symbol: string, interval: string, limit: number) => Promise<T | null>,
    ttl: number = 5 * 60 * 1000 // 5 minutes for klines
  ): Promise<T | null> {
    const key = this.generateKey('klines', { symbol, interval, limit });
    
    const cached = this.get<T>(key);
    if (cached !== null) {
      logger.debug(`Cache hit for klines: ${symbol}-${interval}`);
      return cached;
    }

    logger.debug(`Cache miss for klines: ${symbol}-${interval}, fetching from API`);
    const data = await fetcher(symbol, interval, limit);
    
    if (data) {
      this.set(key, data, ttl);
    }

    return data;
  }

  /**
   * Get or fetch multiple prices at once
   */
  async getOrFetchMultipleTickers<T>(
    symbols: string[],
    fetcher: (symbols: string[]) => Promise<T[]>,
    ttl: number = 30 * 1000 // 30 seconds
  ): Promise<T[]> {
    const results: T[] = [];
    const symbolsToFetch: string[] = [];
    const fetchIndices: number[] = [];

    // Check cache for each symbol
    for (let i = 0; i < symbols.length; i++) {
      const key = this.generateKey('ticker', { symbol: symbols[i] });
      const cached = this.get<T>(key);
      
      if (cached !== null) {
        results[i] = cached;
        logger.debug(`Cache hit for ticker: ${symbols[i]}`);
      } else {
        symbolsToFetch.push(symbols[i]);
        fetchIndices.push(i);
      }
    }

    // Fetch missing symbols
    if (symbolsToFetch.length > 0) {
      logger.debug(`Cache misses for ${symbolsToFetch.length} tickers, fetching from API`);
      const fetchedData = await fetcher(symbolsToFetch);
      
      fetchedData.forEach((data, idx) => {
        const symbolIdx = fetchIndices[idx];
        results[symbolIdx] = data;
        const key = this.generateKey('ticker', { symbol: symbolsToFetch[idx] });
        this.set(key, data, ttl);
      });
    }

    return results;
  }

  /**
   * Get or fetch recent trades
   */
  async getOrFetchRecentTrades<T>(
    symbol: string,
    limit: number,
    fetcher: (symbol: string, limit: number) => Promise<T[]>,
    ttl: number = 10 * 1000 // 10 seconds for recent trades
  ): Promise<T[]> {
    const key = this.generateKey('recent-trades', { symbol, limit });
    
    const cached = this.get<T[]>(key);
    if (cached !== null) {
      logger.debug(`Cache hit for recent trades: ${symbol}`);
      return cached;
    }

    logger.debug(`Cache miss for recent trades: ${symbol}, fetching from API`);
    const data = await fetcher(symbol, limit);
    
    if (data && data.length > 0) {
      this.set(key, data, ttl);
    }

    return data;
  }

  /**
   * Get or fetch market analysis (liquidations, long-short ratio, open interest)
   */
  async getOrFetchMarketAnalysis<T>(
    symbol: string,
    analysisType: 'liquidations' | 'long-short' | 'open-interest',
    fetcher: (symbol: string) => Promise<T[]>,
    ttl: number = 2 * 60 * 1000 // 2 minutes for market analysis
  ): Promise<T[]> {
    const key = this.generateKey(`market-${analysisType}`, { symbol });
    
    const cached = this.get<T[]>(key);
    if (cached !== null) {
      logger.debug(`Cache hit for ${analysisType}: ${symbol}`);
      return cached;
    }

    logger.debug(`Cache miss for ${analysisType}: ${symbol}, fetching from API`);
    const data = await fetcher(symbol);
    
    if (data && data.length > 0) {
      this.set(key, data, ttl);
    }

    return data;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    memorySizeKB: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const entries: Array<{ key: string; age: number; ttl: number }> = [];
    let totalSize = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = Date.now() - entry.timestamp;
      entries.push({ key, age, ttl: entry.ttl });
      
      // Rough estimate of size
      totalSize += JSON.stringify(entry.data).length;
    }

    return {
      totalEntries: this.cache.size,
      memorySizeKB: Math.round(totalSize / 1024),
      entries: entries.sort((a, b) => b.age - a.age).slice(0, 10) // Top 10 oldest
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    let removedCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug(`Cache cleanup: removed ${removedCount} expired entries`);
    }
  }
}

// Export singleton instance
export const bybitCache = new BybitCacheService();

export default bybitCache;
