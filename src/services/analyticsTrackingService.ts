/**
 * Analytics Tracking Service
 * Tracks user interactions and engagement metrics
 */

export interface AnalyticsEvent {
  eventName: string;
  eventCategory: string;
  eventLabel?: string;
  eventValue?: number;
  timestamp: number;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface PageView {
  path: string;
  title: string;
  referrer: string;
  timestamp: number;
  duration?: number;
}

interface AnalyticsConfig {
  trackingId?: string;
  enabled?: boolean;
  debugMode?: boolean;
  batchSize?: number;
  flushInterval?: number;
}

class AnalyticsTrackingService {
  private sessionId: string;
  private events: AnalyticsEvent[] = [];
  private pageViews: PageView[] = [];
  private currentPage: PageView | null = null;
  private config: AnalyticsConfig;
  private batchTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config: AnalyticsConfig = {}) {
    this.sessionId = this.generateSessionId();
    this.config = {
      enabled: true,
      debugMode: false,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      ...config,
    };
  }

  /**
   * Initialize analytics
   */
  init(userId?: string): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Track page view on init
    this.trackPageView(window.location.pathname, document.title);

    // Set up batch flush interval
    this.startBatchTimer();

    // Track unload event
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    if (this.config.debugMode) {
      console.log(`Analytics initialized with session ID: ${this.sessionId}`);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title: string, referrer: string = document.referrer): void {
    if (!this.config.enabled) return;

    if (this.currentPage) {
      this.currentPage.duration = Date.now() - this.currentPage.timestamp;
      this.pageViews.push(this.currentPage);
    }

    this.currentPage = {
      path,
      title,
      referrer,
      timestamp: Date.now(),
    };

    if (this.config.debugMode) {
      console.log('Page View:', this.currentPage);
    }
  }

  /**
   * Track custom event
   */
  trackEvent(
    eventName: string,
    eventCategory: string,
    options?: {
      label?: string;
      value?: number;
      metadata?: Record<string, any>;
      userId?: string;
    }
  ): void {
    if (!this.config.enabled) return;

    const event: AnalyticsEvent = {
      eventName,
      eventCategory,
      eventLabel: options?.label,
      eventValue: options?.value,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: options?.userId,
      metadata: options?.metadata,
    };

    this.events.push(event);

    if (this.config.debugMode) {
      console.log('Analytics Event:', event);
    }

    // Flush if batch size reached
    if (this.events.length >= (this.config.batchSize || 10)) {
      this.flush();
    }
  }

  /**
   * Track video play
   */
  trackVideoPlay(videoId: string, videoTitle: string, userId?: string): void {
    this.trackEvent('video_play', 'video_engagement', {
      label: videoTitle,
      metadata: { videoId },
      userId,
    });
  }

  /**
   * Track video pause
   */
  trackVideoPause(videoId: string, currentTime: number, userId?: string): void {
    this.trackEvent('video_pause', 'video_engagement', {
      label: videoId,
      value: Math.floor(currentTime),
      userId,
    });
  }

  /**
   * Track video completion
   */
  trackVideoCompletion(videoId: string, duration: number, userId?: string): void {
    this.trackEvent('video_completed', 'video_engagement', {
      label: videoId,
      value: Math.floor(duration),
      metadata: { completionRate: 100 },
      userId,
    });
  }

  /**
   * Track video seek
   */
  trackVideoSeek(videoId: string, fromTime: number, toTime: number, userId?: string): void {
    this.trackEvent('video_seek', 'video_engagement', {
      label: videoId,
      value: Math.floor(toTime - fromTime),
      metadata: { fromTime, toTime },
      userId,
    });
  }

  /**
   * Track like/unlike
   */
  trackLike(contentId: string, contentType: string, isLike: boolean, userId?: string): void {
    this.trackEvent(
      isLike ? 'content_liked' : 'content_unliked',
      'content_interaction',
      {
        label: contentId,
        metadata: { contentType },
        userId,
      }
    );
  }

  /**
   * Track share
   */
  trackShare(contentId: string, contentType: string, platform?: string, userId?: string): void {
    this.trackEvent('content_shared', 'content_interaction', {
      label: contentId,
      metadata: { contentType, platform: platform || 'unknown' },
      userId,
    });
  }

  /**
   * Track follow
   */
  trackFollow(userId: string, targetUserId: string, isFollow: boolean): void {
    this.trackEvent(
      isFollow ? 'user_followed' : 'user_unfollowed',
      'user_interaction',
      {
        label: targetUserId,
        metadata: { targetUserId },
        userId,
      }
    );
  }

  /**
   * Track comment
   */
  trackComment(contentId: string, contentType: string, userId?: string): void {
    this.trackEvent('comment_added', 'content_interaction', {
      label: contentId,
      metadata: { contentType },
      userId,
    });
  }

  /**
   * Track search
   */
  trackSearch(query: string, resultsCount: number, userId?: string): void {
    this.trackEvent('search_performed', 'search', {
      label: query,
      value: resultsCount,
      userId,
    });
  }

  /**
   * Track click
   */
  trackClick(elementName: string, elementType: string, metadata?: Record<string, any>, userId?: string): void {
    this.trackEvent('element_clicked', 'user_interaction', {
      label: elementName,
      metadata: { elementType, ...metadata },
      userId,
    });
  }

  /**
   * Track scroll depth
   */
  trackScrollDepth(depth: number, userId?: string): void {
    this.trackEvent('scroll_depth', 'page_engagement', {
      value: Math.floor(depth),
      userId,
    });
  }

  /**
   * Track time on page
   */
  trackTimeOnPage(seconds: number, userId?: string): void {
    this.trackEvent('time_on_page', 'page_engagement', {
      value: Math.floor(seconds),
      userId,
    });
  }

  /**
   * Track error
   */
  trackError(errorName: string, errorMessage: string, userId?: string): void {
    this.trackEvent('error_occurred', 'error', {
      label: errorName,
      metadata: { message: errorMessage },
      userId,
    });
  }

  /**
   * Start batch timer
   */
  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      if (this.events.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * Flush analytics data
   */
  async flush(): Promise<void> {
    if (!this.config.enabled || (this.events.length === 0 && this.pageViews.length === 0)) {
      return;
    }

    const payload = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      events: this.events,
      pageViews: this.pageViews,
      currentPage: this.currentPage,
    };

    if (this.config.debugMode) {
      console.log('Flushing analytics data:', payload);
    }

    try {
      // Send to analytics endpoint
      // This would typically be sent to your analytics service
      await this.sendAnalytics(payload);
      
      // Clear events after successful send
      this.events = [];
      this.pageViews = [];
    } catch (error) {
      console.error('Error flushing analytics:', error);
      // Events will be retried on next flush
    }
  }

  /**
   * Send analytics to server
   */
  private async sendAnalytics(payload: any): Promise<void> {
    // This can be replaced with actual analytics service integration
    // e.g., Google Analytics, Mixpanel, Amplitude, etc.
    if (typeof window !== 'undefined' && (window as any).gtag) {
      // Google Analytics integration
      (window as any).gtag('event', 'custom_analytics', {
        event_data: JSON.stringify(payload),
      });
    }

    // Or send to custom endpoint
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Silently fail if endpoint doesn't exist
    }
  }

  /**
   * Disable analytics
   */
  disable(): void {
    this.config.enabled = false;
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
  }

  /**
   * Enable analytics
   */
  enable(): void {
    this.config.enabled = true;
    if (!this.batchTimer) {
      this.startBatchTimer();
    }
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get events
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Reset analytics
   */
  reset(): void {
    this.sessionId = this.generateSessionId();
    this.events = [];
    this.pageViews = [];
    this.currentPage = null;
  }
}

// Export singleton instance
export const analyticsTrackingService = new AnalyticsTrackingService({
  debugMode: process.env.NODE_ENV === 'development',
});

export default analyticsTrackingService;
