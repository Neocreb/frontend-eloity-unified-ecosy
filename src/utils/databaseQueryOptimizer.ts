/**
 * Database Query Optimizer
 * 
 * Provides utilities for optimizing Supabase queries:
 * - Query result caching
 * - Batch operations
 * - Prefetching
 * - Query analysis
 */

import { supabaseClient } from '@/lib/supabase/client';

interface QueryCache {
  key: string;
  result: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface QueryMetrics {
  queryKey: string;
  executionTime: number;
  rowsReturned: number;
  cacheHit: boolean;
}

class DatabaseQueryOptimizer {
  private cache: Map<string, QueryCache> = new Map();
  private metrics: QueryMetrics[] = [];
  private batchQueue: Map<string, any[]> = new Map();
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // Clean expired cache entries every minute
    setInterval(() => this.cleanExpiredCache(), 60000);
  }

  /**
   * Generate cache key for a query
   */
  private generateCacheKey(table: string, filters?: Record<string, any>): string {
    const filterStr = filters ? JSON.stringify(filters) : 'all';
    return `${table}:${filterStr}`;
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(entry: QueryCache): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isCacheValid(entry)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Execute query with caching
   */
  async query<T>(
    table: string,
    filters?: Record<string, any>,
    options?: {
      ttl?: number;
      select?: string;
      limit?: number;
      offset?: number;
      order?: { column: string; ascending: boolean };
    }
  ): Promise<T[]> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(table, filters);
    const ttl = options?.ttl ?? 5 * 60 * 1000; // 5 minutes default

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      this.recordMetric(cacheKey, performance.now() - startTime, cached.result.length, true);
      return cached.result;
    }

    // Build query
    let query = supabaseClient.from(table).select(options?.select || '*');

    // Apply filters
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      }
    }

    // Apply ordering
    if (options?.order) {
      query = query.order(options.order.column, {
        ascending: options.order.ascending,
      });
    }

    // Apply limit and offset
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    // Execute
    const { data, error } = await query;

    if (error) {
      console.error(`Query failed for ${table}:`, error);
      throw error;
    }

    const result = data || [];

    // Cache result
    this.cache.set(cacheKey, {
      key: cacheKey,
      result,
      timestamp: Date.now(),
      ttl,
    });

    this.recordMetric(cacheKey, performance.now() - startTime, result.length, false);
    return result;
  }

  /**
   * Prefetch data
   */
  async prefetch(
    table: string,
    filters?: Record<string, any>,
    options?: any
  ): Promise<void> {
    try {
      await this.query(table, filters, options);
    } catch (error) {
      console.warn(`Failed to prefetch ${table}:`, error);
    }
  }

  /**
   * Batch multiple operations
   */
  async batch<T>(operations: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(operations.map(op => op()));
  }

  /**
   * Record query metrics
   */
  private recordMetric(
    queryKey: string,
    executionTime: number,
    rowsReturned: number,
    cacheHit: boolean
  ): void {
    this.metrics.push({
      queryKey,
      executionTime,
      rowsReturned,
      cacheHit,
    });

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Get query metrics
   */
  getMetrics(): QueryMetrics[] {
    return this.metrics;
  }

  /**
   * Get average query time
   */
  getAverageQueryTime(table?: string): number {
    const filtered = table
      ? this.metrics.filter(m => m.queryKey.startsWith(table))
      : this.metrics;

    if (filtered.length === 0) return 0;

    const total = filtered.reduce((sum, m) => sum + m.executionTime, 0);
    return total / filtered.length;
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;

    const hits = this.metrics.filter(m => m.cacheHit).length;
    return (hits / this.metrics.length) * 100;
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for specific table
   */
  clearTableCache(table: string): void {
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(`${table}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size in bytes (estimated)
   */
  getCacheSize(): number {
    let size = 0;
    for (const entry of this.cache.values()) {
      size += JSON.stringify(entry.result).length;
    }
    return size;
  }

  /**
   * Analyze slow queries
   */
  getSlowQueries(threshold: number = 1000): QueryMetrics[] {
    return this.metrics.filter(m => m.executionTime > threshold);
  }
}

// Export singleton instance
export const queryOptimizer = new DatabaseQueryOptimizer();

/**
 * Marketplace-specific query optimizations
 */
export const MarketplaceQueries = {
  /**
   * Get products with caching
   */
  async getProducts(filters?: any, pagination?: any) {
    return queryOptimizer.query('products', filters, {
      ttl: 5 * 60 * 1000, // 5 minutes
      limit: pagination?.limit ?? 20,
      offset: pagination?.offset ?? 0,
      order: { column: 'created_at', ascending: false },
    });
  },

  /**
   * Get single product
   */
  async getProduct(productId: string) {
    return queryOptimizer.query('products', { id: productId }, {
      ttl: 30 * 60 * 1000, // 30 minutes
    });
  },

  /**
   * Get product reviews
   */
  async getProductReviews(productId: string, pagination?: any) {
    return queryOptimizer.query('product_reviews', { product_id: productId }, {
      ttl: 10 * 60 * 1000, // 10 minutes
      limit: pagination?.limit ?? 10,
      offset: pagination?.offset ?? 0,
      order: { column: 'created_at', ascending: false },
    });
  },

  /**
   * Get seller info
   */
  async getSeller(sellerId: string) {
    return queryOptimizer.query('store_profiles', { user_id: sellerId }, {
      ttl: 30 * 60 * 1000, // 30 minutes
    });
  },

  /**
   * Get categories
   */
  async getCategories() {
    return queryOptimizer.query('categories', {}, {
      ttl: 60 * 60 * 1000, // 1 hour
      select: 'id, name, slug, icon, parent_id',
    });
  },

  /**
   * Prefetch critical data
   */
  async prefetchCriticalData() {
    await Promise.all([
      MarketplaceQueries.getCategories(),
      queryOptimizer.prefetch('featured_products', {}, {
        ttl: 30 * 60 * 1000,
        limit: 10,
      }),
    ]);
  },
};

export default queryOptimizer;
