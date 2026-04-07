/**
 * Cache Strategy Utilities
 * 
 * Provides strategies for caching marketplace data and assets.
 * Implements different caching strategies for different types of requests.
 */

export type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';

interface CacheConfig {
  name: string;
  version: number;
  strategy: CacheStrategy;
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Max number of items to store
}

const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Static assets (CSS, JS, fonts)
  static: {
    name: 'marketplace-static',
    version: 1,
    strategy: 'cache-first',
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxSize: 100,
  },
  
  // Product images
  images: {
    name: 'marketplace-images',
    version: 1,
    strategy: 'cache-first',
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxSize: 200,
  },
  
  // API data (products, categories, etc.)
  api: {
    name: 'marketplace-api',
    version: 1,
    strategy: 'stale-while-revalidate',
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 50,
  },
  
  // User-specific data
  user: {
    name: 'marketplace-user',
    version: 1,
    strategy: 'network-first',
    ttl: 60 * 1000, // 1 minute
    maxSize: 30,
  },
  
  // Search results
  search: {
    name: 'marketplace-search',
    version: 1,
    strategy: 'stale-while-revalidate',
    ttl: 10 * 60 * 1000, // 10 minutes
    maxSize: 20,
  },
};

/**
 * Cache Manager
 * 
 * Handles all caching operations with different strategies
 */
export class CacheManager {
  /**
   * Get cache name with version
   */
  static getCacheName(type: string): string {
    const config = CACHE_CONFIGS[type];
    if (!config) throw new Error(`Unknown cache type: ${type}`);
    return `${config.name}-v${config.version}`;
  }

  /**
   * Cache-first strategy: Check cache first, fallback to network
   */
  static async cacheFirst(
    request: Request,
    cacheType: string = 'api'
  ): Promise<Response> {
    const cacheName = this.getCacheName(cacheType);
    const cached = await caches.match(request);

    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      return new Response('Offline - Resource not cached', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    }
  }

  /**
   * Network-first strategy: Try network, fallback to cache
   */
  static async networkFirst(
    request: Request,
    cacheType: string = 'api'
  ): Promise<Response> {
    const cacheName = this.getCacheName(cacheType);

    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }
      return new Response('Offline - Resource not cached', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    }
  }

  /**
   * Stale-while-revalidate strategy: Return cached, update in background
   */
  static async staleWhileRevalidate(
    request: Request,
    cacheType: string = 'api'
  ): Promise<Response> {
    const cacheName = this.getCacheName(cacheType);
    const cached = await caches.match(request);

    // Revalidate in background
    const fetchPromise = fetch(request).then((response) => {
      if (response.ok) {
        const cache = caches.open(cacheName);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    });

    return cached || fetchPromise;
  }

  /**
   * Clear all caches
   */
  static async clearAllCaches(): Promise<void> {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => caches.delete(cacheName))
    );
  }

  /**
   * Clear specific cache type
   */
  static async clearCache(cacheType: string): Promise<void> {
    const cacheName = this.getCacheName(cacheType);
    await caches.delete(cacheName);
  }

  /**
   * Get cache size (bytes)
   */
  static async getCacheSize(cacheType: string): Promise<number> {
    const cacheName = this.getCacheName(cacheType);
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    let totalSize = 0;
    for (const request of requests) {
      const response = await cache.match(request);
      if (response && response.body) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }

    return totalSize;
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<Record<string, { size: number; count: number }>> {
    const stats: Record<string, { size: number; count: number }> = {};

    for (const type in CACHE_CONFIGS) {
      const cacheName = this.getCacheName(type);
      try {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        let totalSize = 0;

        for (const request of requests) {
          const response = await cache.match(request);
          if (response?.body) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }

        stats[type] = {
          size: totalSize,
          count: requests.length,
        };
      } catch (error) {
        console.error(`Failed to get cache stats for ${type}:`, error);
      }
    }

    return stats;
  }

  /**
   * Prewarm cache with critical assets
   */
  static async prewarmCache(urls: string[], cacheType: string = 'static'): Promise<void> {
    const cacheName = this.getCacheName(cacheType);
    const cache = await caches.open(cacheName);

    const requests = urls.map((url) => new Request(url));
    const responses = await Promise.all(
      requests.map((req) => fetch(req).catch(() => null))
    );

    for (let i = 0; i < requests.length; i++) {
      if (responses[i]?.ok) {
        await cache.put(requests[i], responses[i]!);
      }
    }
  }

  /**
   * Get strategy for URL pattern
   */
  static getStrategyForUrl(url: string): CacheStrategy {
    if (url.includes('/api/')) return 'stale-while-revalidate';
    if (url.includes('/images/')) return 'cache-first';
    if (url.includes('/user/')) return 'network-first';
    if (url.includes('/search/')) return 'stale-while-revalidate';
    return 'cache-first';
  }
}

/**
 * Marketplace-specific cache utilities
 */
export const MarketplaceCache = {
  /**
   * Cache product images
   */
  async cacheProductImage(url: string): Promise<void> {
    const request = new Request(url);
    const cacheName = CacheManager.getCacheName('images');
    const cache = await caches.open(cacheName);

    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response);
      }
    } catch (error) {
      console.error('Failed to cache product image:', error);
    }
  },

  /**
   * Cache product data
   */
  async cacheProductData(productId: string, data: any): Promise<void> {
    const url = `/api/marketplace/products/${productId}`;
    const request = new Request(url);
    const cacheName = CacheManager.getCacheName('api');
    const cache = await caches.open(cacheName);

    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });

    await cache.put(request, response);
  },

  /**
   * Get cached product data
   */
  async getCachedProductData(productId: string): Promise<any | null> {
    const url = `/api/marketplace/products/${productId}`;
    const request = new Request(url);
    const cacheName = CacheManager.getCacheName('api');
    const cache = await caches.open(cacheName);

    const response = await cache.match(request);
    if (response) {
      return await response.json();
    }

    return null;
  },

  /**
   * Clear marketplace caches (images, API, search)
   */
  async clearMarketplaceCaches(): Promise<void> {
    await Promise.all([
      CacheManager.clearCache('images'),
      CacheManager.clearCache('api'),
      CacheManager.clearCache('search'),
    ]);
  },
};

export default CacheManager;
