/**
 * Performance Monitor
 * 
 * Tracks performance metrics for code splitting, lazy loading, and route transitions.
 * Helps identify optimization opportunities.
 */

interface PerformanceMetrics {
  routeName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  chunkSize?: number;
  parseTime?: number;
  executeTime?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private isEnabled: boolean = true;
  private reportInterval: number = 10000; // Report every 10 seconds

  constructor() {
    this.initializeReporting();
  }

  /**
   * Start tracking a route load
   */
  startRoute(routeName: string): void {
    if (!this.isEnabled) return;

    this.metrics.set(routeName, {
      routeName,
      startTime: performance.now(),
    });
  }

  /**
   * End tracking a route load
   */
  endRoute(routeName: string): void {
    if (!this.isEnabled) return;

    const metric = this.metrics.get(routeName);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      
      // Log slow routes
      if (metric.duration > 1000) {
        console.warn(
          `[Performance] Slow route load: ${routeName} (${metric.duration.toFixed(2)}ms)`
        );
      }
    }
  }

  /**
   * Track chunk loading metrics
   */
  trackChunkLoad(chunkName: string, size: number): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetrics = {
      routeName: `chunk:${chunkName}`,
      startTime: performance.now(),
      chunkSize: size,
    };

    this.metrics.set(metric.routeName, metric);
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
  }

  /**
   * Get average route load time
   */
  getAverageLoadTime(routeName?: string): number {
    const relevantMetrics = Array.from(this.metrics.values()).filter(
      (m) => !routeName || m.routeName === routeName
    );

    if (relevantMetrics.length === 0) return 0;

    const totalDuration = relevantMetrics.reduce(
      (sum, m) => sum + (m.duration || 0),
      0
    );

    return totalDuration / relevantMetrics.length;
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Report performance metrics to analytics
   */
  private initializeReporting(): void {
    if (typeof window === 'undefined') return;

    // Report metrics at intervals
    setInterval(() => {
      const metrics = this.getMetrics();
      if (metrics.length === 0) return;

      const slowRoutes = metrics.filter((m) => (m.duration || 0) > 1000);
      if (slowRoutes.length > 0) {
        console.table(slowRoutes);
      }

      // Send to analytics service if available
      if (typeof window.__ANALYTICS__ !== 'undefined') {
        window.__ANALYTICS__.trackEvent('performance_metrics', {
          totalMetrics: metrics.length,
          slowRoutes: slowRoutes.length,
          averageLoadTime: this.getAverageLoadTime(),
        });
      }
    }, this.reportInterval);
  }

  /**
   * Get Core Web Vitals
   */
  getCoreWebVitals(): {
    lcp?: number;
    fid?: number;
    cls?: number;
  } {
    const vitals: any = {};

    // Largest Contentful Paint (LCP)
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.lcp = lastEntry.renderTime || lastEntry.loadTime;
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // PerformanceObserver not supported
    }

    // First Input Delay (FID) - now Interaction to Next Paint (INP)
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        vitals.fid = entries[0]?.processingDuration;
      });
      observer.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // PerformanceObserver not supported
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        vitals.cls = clsValue;
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // PerformanceObserver not supported
    }

    return vitals;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Disable in production for better performance
if (import.meta.env.PROD) {
  performanceMonitor.setEnabled(false);
}

export default performanceMonitor;

// Augment window interface for TypeScript
declare global {
  interface Window {
    __ANALYTICS__?: {
      trackEvent: (eventName: string, data: any) => void;
    };
  }
}
