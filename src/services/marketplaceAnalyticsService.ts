import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsEvent {
  id: string;
  eventType: 'page_view' | 'product_view' | 'add_to_cart' | 'remove_from_cart' | 
             'checkout_start' | 'checkout_complete' | 'purchase' | 'return' | 
             'search' | 'filter_applied' | 'product_click' | 'category_view';
  userId?: string;
  sessionId: string;
  productId?: string;
  categoryId?: string;
  orderId?: string;
  searchQuery?: string;
  filters?: Record<string, any>;
  properties?: Record<string, any>;
  createdAt: string;
}

export interface ConversionFunnelStep {
  stage: 'landing' | 'browse' | 'product_view' | 'cart_add' | 'cart_view' | 
         'checkout_start' | 'checkout_review' | 'payment' | 'order_complete';
  users: number;
  sessions: number;
  completedCount: number;
  completionRate: number;
  exitReason?: string;
}

export interface ProductAnalytics {
  productId: string;
  productName: string;
  views: number;
  addToCart: number;
  purchases: number;
  viewToCartRate: number;
  conversionRate: number;
}

export interface FlashSalePerformance {
  saleId: string;
  title: string;
  date: string;
  uniqueVisitors: number;
  productClicks: number;
  usersAddedToCart: number;
  purchases: number;
  totalOrders: number;
}

export interface CouponPerformance {
  couponId: string;
  code: string;
  title: string;
  uniqueUsers: number;
  totalUses: number;
  totalDiscountAmount: number;
  usagePercentage: number;
  currentUsage: number;
  active: boolean;
}

export interface MarketplaceKPIs {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  cartAbandonmentRate: number;
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  repeatPurchaseRate: number;
  averageRating: number;
  totalReviews: number;
  customerSatisfactionScore: number;
}

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  totalSales: number;
  totalRevenue: number;
  averagePrice: number;
  totalReviews: number;
  averageRating: number;
  productCount: number;
  viewCount: number;
}

export interface TrafficAnalytics {
  date: string;
  uniqueVisitors: number;
  pageViews: number;
  bounceRate: number;
  averageSessionDuration: number;
  deviceType: Record<string, number>;
  trafficSource: Record<string, number>;
}

export class MarketplaceAnalyticsService {
  /**
   * Track an analytics event
   */
  static async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'createdAt'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert([{
          event_type: event.eventType,
          user_id: event.userId,
          session_id: event.sessionId,
          product_id: event.productId,
          category_id: event.categoryId,
          order_id: event.orderId,
          search_query: event.searchQuery,
          filters: event.filters,
          properties: event.properties,
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error tracking event:', error);
      return false;
    }
  }

  /**
   * Track conversion funnel step
   */
  static async trackFunnelStep(
    userId: string,
    sessionId: string,
    stage: ConversionFunnelStep['stage'],
    productId?: string,
    categoryId?: string,
    completed: boolean = true,
    exitReason?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversion_funnel')
        .insert([{
          user_id: userId,
          session_id: sessionId,
          funnel_stage: stage,
          product_id: productId,
          category_id: categoryId,
          completed,
          exit_reason: exitReason,
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error tracking funnel step:', error);
      return false;
    }
  }

  /**
   * Get conversion funnel analysis
   */
  static async getConversionFunnel(): Promise<ConversionFunnelStep[]> {
    try {
      const { data, error } = await supabase
        .from('conversion_funnel_summary')
        .select('*');

      if (error) throw error;

      return (data || []).map(row => ({
        stage: row.funnel_stage,
        users: row.users,
        sessions: row.sessions,
        completedCount: row.completed_count,
        completionRate: row.completion_rate,
      }));
    } catch (error) {
      console.error('Error fetching conversion funnel:', error);
      return [];
    }
  }

  /**
   * Get product analytics
   */
  static async getProductAnalytics(productId?: string): Promise<ProductAnalytics[]> {
    try {
      let query = supabase.from('product_analytics_summary').select('*');

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(row => ({
        productId: row.product_id,
        productName: row.name || 'Unknown',
        views: row.views,
        addToCart: row.add_to_cart,
        purchases: row.purchases,
        viewToCartRate: row.view_to_cart_rate,
        conversionRate: row.conversion_rate,
      }));
    } catch (error) {
      console.error('Error fetching product analytics:', error);
      return [];
    }
  }

  /**
   * Get flash sale performance
   */
  static async getFlashSalePerformance(saleId?: string): Promise<FlashSalePerformance[]> {
    try {
      let query = supabase.from('flash_sales_performance_daily').select('*');

      if (saleId) {
        query = query.eq('id', saleId);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;

      return (data || []).map(row => ({
        saleId: row.id,
        title: row.title,
        date: row.date,
        uniqueVisitors: row.unique_visitors,
        productClicks: row.product_clicks,
        usersAddedToCart: row.users_added_to_cart,
        purchases: row.purchases,
        totalOrders: row.total_orders,
      }));
    } catch (error) {
      console.error('Error fetching flash sale performance:', error);
      return [];
    }
  }

  /**
   * Get coupon performance
   */
  static async getCouponPerformance(couponId?: string): Promise<CouponPerformance[]> {
    try {
      let query = supabase.from('coupon_performance_summary').select('*');

      if (couponId) {
        query = query.eq('id', couponId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(row => ({
        couponId: row.id,
        code: row.code,
        title: row.title,
        uniqueUsers: row.unique_users,
        totalUses: row.total_uses,
        totalDiscountAmount: row.total_discount_amount,
        usagePercentage: row.usage_percentage || 0,
        currentUsage: row.current_usage,
        active: row.active,
      }));
    } catch (error) {
      console.error('Error fetching coupon performance:', error);
      return [];
    }
  }

  /**
   * Get marketplace KPIs
   */
  static async getMarketplaceKPIs(timeRange: 'today' | 'week' | 'month' | 'year' = 'month'): Promise<MarketplaceKPIs> {
    try {
      const startDate = this.getStartDate(timeRange);

      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, user_id, created_at')
        .gte('created_at', startDate.toISOString());

      if (ordersError) throw ordersError;

      // Fetch events
      const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('event_type, user_id')
        .gte('created_at', startDate.toISOString());

      if (eventsError) throw eventsError;

      // Fetch reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating, product_id')
        .gte('created_at', startDate.toISOString());

      if (reviewsError) throw reviewsError;

      // Calculate KPIs
      const orderList = orders || [];
      const eventList = events || [];
      const reviewList = reviews || [];

      const totalRevenue = orderList.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const totalOrders = orderList.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const uniqueUsers = new Set(orderList.map(o => o.user_id)).size;
      const pageViews = eventList.filter(e => e.event_type === 'page_view').length;
      const purchases = eventList.filter(e => e.event_type === 'purchase').length;
      const conversionRate = pageViews > 0 ? (purchases / pageViews) * 100 : 0;
      const cartAdds = eventList.filter(e => e.event_type === 'add_to_cart').length;
      const cartAbandonmentRate = cartAdds > 0 ? ((cartAdds - purchases) / cartAdds) * 100 : 0;
      const averageRating = reviewList.length > 0
        ? reviewList.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewList.length
        : 0;

      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        cartAbandonmentRate: Math.round(cartAbandonmentRate * 100) / 100,
        totalUsers: uniqueUsers,
        activeUsers: new Set(eventList.map(e => e.user_id)).size,
        newUsers: 0, // Would require signup tracking
        repeatPurchaseRate: 0, // Would require historical data
        averageRating: Math.round(averageRating * 100) / 100,
        totalReviews: reviewList.length,
        customerSatisfactionScore: Math.round(averageRating * 20), // Convert 1-5 to 0-100
      };
    } catch (error) {
      console.error('Error fetching marketplace KPIs:', error);
      return {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        conversionRate: 0,
        cartAbandonmentRate: 0,
        totalUsers: 0,
        activeUsers: 0,
        newUsers: 0,
        repeatPurchaseRate: 0,
        averageRating: 0,
        totalReviews: 0,
        customerSatisfactionScore: 0,
      };
    }
  }

  /**
   * Get category performance
   */
  static async getCategoryPerformance(): Promise<CategoryPerformance[]> {
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('id, name');

      if (error) throw error;

      const results: CategoryPerformance[] = [];

      for (const category of categories || []) {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, price, rating')
          .eq('category_id', category.id);

        if (productsError) continue;

        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .in('product_id', (products || []).map(p => p.id));

        if (reviewsError) continue;

        const { data: orderItems, error: ordersError } = await supabase
          .from('order_items')
          .select('quantity, price')
          .in('product_id', (products || []).map(p => p.id));

        if (ordersError) continue;

        const productList = products || [];
        const reviewList = reviews || [];
        const orderList = orderItems || [];

        const totalSales = orderList.reduce((sum, o) => sum + (o.quantity || 0), 0);
        const totalRevenue = orderList.reduce((sum, o) => sum + ((o.price || 0) * (o.quantity || 0)), 0);
        const averagePrice = productList.length > 0
          ? productList.reduce((sum, p) => sum + (p.price || 0), 0) / productList.length
          : 0;
        const averageRating = reviewList.length > 0
          ? reviewList.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewList.length
          : 0;

        results.push({
          categoryId: category.id,
          categoryName: category.name,
          totalSales,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          averagePrice: Math.round(averagePrice * 100) / 100,
          totalReviews: reviewList.length,
          averageRating: Math.round(averageRating * 100) / 100,
          productCount: productList.length,
          viewCount: 0, // Would require view tracking
        });
      }

      return results;
    } catch (error) {
      console.error('Error fetching category performance:', error);
      return [];
    }
  }

  /**
   * Get top products
   */
  static async getTopProducts(limit = 10): Promise<ProductAnalytics[]> {
    try {
      const { data, error } = await supabase
        .from('product_analytics_summary')
        .select('*')
        .order('purchases', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(row => ({
        productId: row.product_id,
        productName: row.name || 'Unknown',
        views: row.views,
        addToCart: row.add_to_cart,
        purchases: row.purchases,
        viewToCartRate: row.view_to_cart_rate,
        conversionRate: row.conversion_rate,
      }));
    } catch (error) {
      console.error('Error fetching top products:', error);
      return [];
    }
  }

  /**
   * Get search analytics
   */
  static async getSearchAnalytics(limit = 20): Promise<Array<{ query: string; count: number; conversionRate: number }>> {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('search_query')
        .eq('event_type', 'search')
        .not('search_query', 'is', null);

      if (error) throw error;

      const searchCounts: Record<string, number> = {};
      (data || []).forEach(row => {
        if (row.search_query) {
          searchCounts[row.search_query] = (searchCounts[row.search_query] || 0) + 1;
        }
      });

      return Object.entries(searchCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([query, count]) => ({
          query,
          count,
          conversionRate: 0, // Would require deeper analysis
        }));
    } catch (error) {
      console.error('Error fetching search analytics:', error);
      return [];
    }
  }

  /**
   * Get traffic trends
   */
  static async getTrafficTrends(days = 30): Promise<TrafficAnalytics[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('analytics_events')
        .select('created_at, user_id, event_type')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const dailyData: Record<string, { visitors: Set<string>; views: number; bounces: number }> = {};

      (data || []).forEach(event => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { visitors: new Set(), views: 0, bounces: 0 };
        }
        dailyData[date].visitors.add(event.user_id || '');
        dailyData[date].views += 1;
      });

      return Object.entries(dailyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({
          date,
          uniqueVisitors: data.visitors.size,
          pageViews: data.views,
          bounceRate: 0, // Would require session tracking
          averageSessionDuration: 0, // Would require session tracking
          deviceType: {},
          trafficSource: {},
        }));
    } catch (error) {
      console.error('Error fetching traffic trends:', error);
      return [];
    }
  }

  /**
   * Private helper method
   */
  private static getStartDate(timeRange: string): Date {
    const date = new Date();
    switch (timeRange) {
      case 'today':
        date.setHours(0, 0, 0, 0);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setDate(date.getDate() - 30);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
      default:
        date.setDate(date.getDate() - 30);
    }
    return date;
  }
}
