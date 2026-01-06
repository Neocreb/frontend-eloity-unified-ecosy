import { CacheManager, MarketplaceCache } from '@/utils/cacheStrategy';

// Mock the Caches API
const mockCache = {
  put: jest.fn(),
  match: jest.fn(),
  keys: jest.fn(),
  delete: jest.fn(),
};

global.caches = {
  open: jest.fn().mockResolvedValue(mockCache),
  keys: jest.fn().mockResolvedValue(['marketplace-static-v1.0.0']),
  delete: jest.fn(),
  match: jest.fn(),
} as any;

describe('Cache Strategy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CacheManager', () => {
    test('generates correct cache name', () => {
      const cacheName = CacheManager.getCacheName('images');
      expect(cacheName).toContain('marketplace-images');
    });

    test('throws error for unknown cache type', () => {
      expect(() => {
        CacheManager.getCacheName('unknown');
      }).toThrow('Unknown cache type');
    });

    test('clears all caches', async () => {
      await CacheManager.clearAllCaches();

      expect(global.caches.delete).toHaveBeenCalled();
    });

    test('clears specific cache type', async () => {
      await CacheManager.clearCache('images');

      expect(global.caches.delete).toHaveBeenCalledWith(
        expect.stringContaining('images')
      );
    });

    test('gets cache statistics', async () => {
      mockCache.keys.mockResolvedValue([]);

      const stats = await CacheManager.getCacheStats();

      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });

    test('analyzes slow queries', () => {
      const slowQueries = CacheManager.getSlowQueries(1000);

      expect(Array.isArray(slowQueries)).toBe(true);
    });

    test('determines strategy for URL patterns', () => {
      expect(CacheManager.getStrategyForUrl('/api/marketplace/')).toBe(
        'stale-while-revalidate'
      );
      expect(CacheManager.getStrategyForUrl('/images/product.jpg')).toBe(
        'cache-first'
      );
      expect(CacheManager.getStrategyForUrl('/user/profile')).toBe('network-first');
    });
  });

  describe('MarketplaceCache', () => {
    test('caches product image', async () => {
      const url = 'https://example.com/product.jpg';

      await MarketplaceCache.cacheProductImage(url);

      expect(global.caches.open).toHaveBeenCalled();
    });

    test('caches product data', async () => {
      const productId = '123';
      const data = { id: '123', name: 'Test Product' };

      await MarketplaceCache.cacheProductData(productId, data);

      expect(global.caches.open).toHaveBeenCalled();
    });

    test('clears marketplace caches', async () => {
      await MarketplaceCache.clearMarketplaceCaches();

      expect(global.caches.delete).toHaveBeenCalledTimes(3);
    });
  });

  describe('Cache-first strategy', () => {
    test('returns cached response when available', async () => {
      const cachedResponse = new Response('cached');
      mockCache.match.mockResolvedValue(cachedResponse);

      const request = new Request('https://example.com/api/products');
      const response = await CacheManager.cacheFirst(request);

      expect(response).toBe(cachedResponse);
    });

    test('fetches from network when cache misses', async () => {
      mockCache.match.mockResolvedValue(null);
      const networkResponse = new Response('network');
      global.fetch = jest.fn().mockResolvedValue(networkResponse);

      const request = new Request('https://example.com/api/products');
      const response = await CacheManager.cacheFirst(request);

      expect(global.fetch).toHaveBeenCalled();
      expect(response).toBe(networkResponse);
    });

    test('caches successful network responses', async () => {
      mockCache.match.mockResolvedValue(null);
      const networkResponse = new Response('network', { status: 200 });
      global.fetch = jest.fn().mockResolvedValue(networkResponse);

      const request = new Request('https://example.com/api/products');
      await CacheManager.cacheFirst(request);

      expect(mockCache.put).toHaveBeenCalled();
    });
  });

  describe('Network-first strategy', () => {
    test('returns network response when available', async () => {
      const networkResponse = new Response('network', { status: 200 });
      global.fetch = jest.fn().mockResolvedValue(networkResponse);

      const request = new Request('https://example.com/api/products');
      const response = await CacheManager.networkFirst(request);

      expect(response).toBe(networkResponse);
      expect(global.fetch).toHaveBeenCalled();
    });

    test('falls back to cache when network fails', async () => {
      const cachedResponse = new Response('cached');
      mockCache.match.mockResolvedValue(cachedResponse);
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const request = new Request('https://example.com/api/products');
      const response = await CacheManager.networkFirst(request);

      expect(response).toBe(cachedResponse);
    });

    test('caches successful network responses', async () => {
      const networkResponse = new Response('network', { status: 200 });
      global.fetch = jest.fn().mockResolvedValue(networkResponse);
      mockCache.match.mockResolvedValue(null);

      const request = new Request('https://example.com/api/products');
      await CacheManager.networkFirst(request);

      expect(mockCache.put).toHaveBeenCalled();
    });
  });

  describe('Stale-while-revalidate strategy', () => {
    test('returns cached response immediately', async () => {
      const cachedResponse = new Response('cached');
      mockCache.match.mockResolvedValue(cachedResponse);

      const request = new Request('https://example.com/api/products');
      const response = await CacheManager.staleWhileRevalidate(request);

      expect(response).toBe(cachedResponse);
    });

    test('updates cache in background', async () => {
      const cachedResponse = new Response('cached');
      const networkResponse = new Response('network');
      mockCache.match.mockResolvedValue(cachedResponse);
      global.fetch = jest.fn().mockResolvedValue(networkResponse);

      const request = new Request('https://example.com/api/products');
      await CacheManager.staleWhileRevalidate(request);

      // Should eventually call put to update cache
      expect(global.fetch).toHaveBeenCalled();
    });

    test('falls back to network when cache misses', async () => {
      const networkResponse = new Response('network');
      mockCache.match.mockResolvedValue(null);
      global.fetch = jest.fn().mockResolvedValue(networkResponse);

      const request = new Request('https://example.com/api/products');
      const response = await CacheManager.staleWhileRevalidate(request);

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Cache size management', () => {
    test('calculates cache size', async () => {
      mockCache.keys.mockResolvedValue([
        new Request('https://example.com/1'),
        new Request('https://example.com/2'),
      ]);
      mockCache.match.mockResolvedValue(
        new Response('data', { headers: { 'Content-Length': '100' } })
      );

      const size = await CacheManager.getCacheSize('images');

      expect(size).toBeGreaterThanOrEqual(0);
    });
  });
});
