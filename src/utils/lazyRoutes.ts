import { lazy, ComponentType } from 'react';

/**
 * Lazy Route Loader
 * 
 * Provides utilities for loading route components asynchronously.
 * Each imported component will be code-split into a separate bundle chunk.
 * 
 * Usage:
 * const route = {
 *   path: '/marketplace',
 *   Component: lazyRoute(() => import('@/pages/marketplace/EnhancedMarketplaceHomepage'))
 * }
 */

interface LazyRouteOptions {
  preload?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Create a lazy-loaded route component with optional preloading
 */
export const lazyRoute = (
  importFn: () => Promise<{ default: ComponentType<any> }>,
  options: LazyRouteOptions = {}
): ComponentType => {
  const Component = lazy(importFn);

  // Preload component if requested
  if (options.preload) {
    const preloadComponent = () => {
      importFn().catch((error) => {
        console.error('Failed to preload component:', error);
      });
    };

    // Use requestIdleCallback if available, otherwise use setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadComponent);
    } else {
      setTimeout(preloadComponent, 1000);
    }
  }

  return Component;
};

/**
 * Marketplace route definitions with code splitting
 * Each marketplace page is loaded in a separate chunk
 */
export const MARKETPLACE_ROUTES = {
  // Main pages
  homepage: () =>
    import('@/pages/marketplace/EnhancedMarketplaceHomepage').then(m => ({ default: m.default })),
  
  listing: () =>
    import('@/pages/marketplace/EnhancedMarketplaceHomepage').then(m => ({ default: m.default })),
  
  productDetail: () =>
    import('@/pages/marketplace/ProductDetail').then(m => ({ default: m.default })),
  
  cart: () =>
    import('@/pages/marketplace/MarketplaceCart').then(m => ({ default: m.default })),
  
  checkout: () =>
    import('@/pages/marketplace/MarketplaceCheckout').then(m => ({ default: m.default })),
  
  orders: () =>
    import('@/pages/marketplace/MarketplaceOrders').then(m => ({ default: m.default })),
  
  orderTracking: () =>
    import('@/pages/marketplace/OrderTracking').then(m => ({ default: m.default })),
  
  wishlist: () =>
    import('@/pages/marketplace/EnhancedWishlist').then(m => ({ default: m.default })),
  
  seller: () =>
    import('@/pages/marketplace/MarketplaceSeller').then(m => ({ default: m.default })),
  
  advancedSearch: () =>
    import('@/pages/marketplace/AdvancedSearchResults').then(m => ({ default: m.default })),
  
  // Seller tools
  sellerDashboard: () =>
    import('@/pages/marketplace/EnhancedSellerDashboard').then(m => ({ default: m.default })),
  
  sellerProducts: () =>
    import('@/pages/marketplace/SellerProductList').then(m => ({ default: m.default })),
  
  sellerOrders: () =>
    import('@/pages/marketplace/SellerOrderManagement').then(m => ({ default: m.default })),
  
  sellerAnalytics: () =>
    import('@/pages/marketplace/SellerAnalyticsDashboard').then(m => ({ default: m.default })),
  
  // Admin pages
  adminMarketplaceAnalytics: () =>
    import('@/pages/admin/MarketplaceAnalytics').then(m => ({ default: m.default })),
  
  adminFlashSales: () =>
    import('@/pages/admin/FlashSalesManagement').then(m => ({ default: m.default })),
  
  adminPromotions: () =>
    import('@/pages/admin/PromotionalCodesManagement').then(m => ({ default: m.default })),
} as const;

/**
 * Utility to generate lazy route configuration
 */
export const createLazyRoute = (
  path: string,
  routeFn: () => Promise<{ default: ComponentType<any> }>,
  options?: LazyRouteOptions
) => ({
  path,
  Component: lazyRoute(routeFn, options),
});

/**
 * Preload critical marketplace routes on app initialization
 * Call this in your main App component for better performance
 */
export const preloadCriticalMarketplaceRoutes = () => {
  const criticalRoutes = [
    'homepage',
    'listing',
    'productDetail',
    'seller',
  ] as const;

  criticalRoutes.forEach((route) => {
    const routeFn = MARKETPLACE_ROUTES[route];
    lazyRoute(routeFn, { preload: true });
  });
};
