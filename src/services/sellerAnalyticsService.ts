import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/marketplace";

export interface SalesAnalytics {
  totalOrders: number;
  totalRevenue: number;
  totalItemsSold: number;
  avgOrderValue: number;
  conversionRate: number;
  uniqueCustomers: number;
  date: string;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  productImage: string;
  totalSold: number;
  totalRevenue: number;
  conversionRate: number;
  avgRating: number;
  viewsCount: number;
  addToCartCount: number;
  wishlistCount: number;
  lastSoldAt?: string;
}

export interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  alertType: "low_stock" | "out_of_stock" | "overstock";
  currentStock: number;
  thresholdValue: number;
  isActive: boolean;
  lastNotifiedAt?: string;
}

export interface SellerPerformanceMetrics {
  avgResponseTimeHours: number;
  avgFulfillmentTimeHours: number;
  orderAcceptanceRate: number;
  onTimeDeliveryRate: number;
  customerSatisfactionRate: number;
  refundRate: number;
  returnRate: number;
  metricDate: string;
}

export interface SellerBadge {
  id: string;
  badgeType: string;
  badgeName: string;
  description?: string;
  iconUrl?: string;
  earnedAt: string;
}

export interface MonthlyTrend {
  month: string;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  totalItemsSold: number;
}

export class SellerAnalyticsService {
  /**
   * Get today's sales analytics
   */
  static async getTodaysSalesAnalytics(
    sellerId: string
  ): Promise<SalesAnalytics | null> {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("seller_sales_analytics")
        .select("*")
        .eq("seller_id", sellerId)
        .eq("date", today)
        .single();

      if (error) {
        console.error("Error fetching today's sales analytics:", error);
        // Return default values if no data yet
        return {
          totalOrders: 0,
          totalRevenue: 0,
          totalItemsSold: 0,
          avgOrderValue: 0,
          conversionRate: 0,
          uniqueCustomers: 0,
          date: today,
        };
      }

      if (!data) {
        return {
          totalOrders: 0,
          totalRevenue: 0,
          totalItemsSold: 0,
          avgOrderValue: 0,
          conversionRate: 0,
          uniqueCustomers: 0,
          date: today,
        };
      }

      return {
        totalOrders: data.total_orders || 0,
        totalRevenue: data.total_revenue || 0,
        totalItemsSold: data.total_items_sold || 0,
        avgOrderValue: data.avg_order_value || 0,
        conversionRate: data.conversion_rate || 0,
        uniqueCustomers: data.unique_customers || 0,
        date: data.date,
      };
    } catch (error) {
      console.error("Error in getTodaysSalesAnalytics:", error);
      return null;
    }
  }

  /**
   * Get sales analytics for a date range
   */
  static async getSalesAnalyticsByDateRange(
    sellerId: string,
    startDate: string,
    endDate: string
  ): Promise<SalesAnalytics[]> {
    try {
      const { data, error } = await supabase
        .from("seller_sales_analytics")
        .select("*")
        .eq("seller_id", sellerId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching sales analytics by date range:", error);
        return [];
      }

      if (!data) return [];

      return data.map((item: any) => ({
        totalOrders: item.total_orders || 0,
        totalRevenue: item.total_revenue || 0,
        totalItemsSold: item.total_items_sold || 0,
        avgOrderValue: item.avg_order_value || 0,
        conversionRate: item.conversion_rate || 0,
        uniqueCustomers: item.unique_customers || 0,
        date: item.date,
      }));
    } catch (error) {
      console.error("Error in getSalesAnalyticsByDateRange:", error);
      return [];
    }
  }

  /**
   * Get top performing products
   */
  static async getTopPerformingProducts(
    sellerId: string,
    limit: number = 10
  ): Promise<ProductPerformance[]> {
    try {
      const { data, error } = await supabase
        .from("product_performance")
        .select(`
          id,
          product_id,
          total_sold,
          total_revenue,
          conversion_rate,
          avg_rating,
          views_count,
          add_to_cart_count,
          wishlist_count,
          last_sold_at,
          products(id, name, image_url)
        `)
        .eq("seller_id", sellerId)
        .order("total_revenue", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching top performing products:", error);
        return [];
      }

      if (!data) return [];

      return data.map((item: any) => ({
        productId: item.product_id,
        productName: item.products?.name || "Unknown Product",
        productImage: item.products?.image_url || "",
        totalSold: item.total_sold || 0,
        totalRevenue: item.total_revenue || 0,
        conversionRate: item.conversion_rate || 0,
        avgRating: item.avg_rating || 0,
        viewsCount: item.views_count || 0,
        addToCartCount: item.add_to_cart_count || 0,
        wishlistCount: item.wishlist_count || 0,
        lastSoldAt: item.last_sold_at,
      }));
    } catch (error) {
      console.error("Error in getTopPerformingProducts:", error);
      return [];
    }
  }

  /**
   * Get low stock alerts
   */
  static async getInventoryAlerts(
    sellerId: string,
    onlyActive: boolean = true
  ): Promise<InventoryAlert[]> {
    try {
      let query = supabase
        .from("inventory_alerts")
        .select(`
          id,
          product_id,
          alert_type,
          current_stock,
          threshold_value,
          is_active,
          last_notified_at,
          products(name, image_url)
        `)
        .eq("seller_id", sellerId);

      if (onlyActive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        console.error("Error fetching inventory alerts:", error);
        return [];
      }

      if (!data) return [];

      return data.map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.products?.name || "Unknown Product",
        alertType: item.alert_type,
        currentStock: item.current_stock,
        thresholdValue: item.threshold_value,
        isActive: item.is_active,
        lastNotifiedAt: item.last_notified_at,
      }));
    } catch (error) {
      console.error("Error in getInventoryAlerts:", error);
      return [];
    }
  }

  /**
   * Create or update inventory alert
   */
  static async setInventoryAlert(
    sellerId: string,
    productId: string,
    alertType: "low_stock" | "out_of_stock" | "overstock",
    currentStock: number,
    thresholdValue: number
  ): Promise<InventoryAlert | null> {
    try {
      const { data, error } = await supabase
        .from("inventory_alerts")
        .upsert(
          {
            seller_id: sellerId,
            product_id: productId,
            alert_type: alertType,
            current_stock: currentStock,
            threshold_value: thresholdValue,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "seller_id,product_id,alert_type",
          }
        )
        .select()
        .single();

      if (error) {
        console.error("Error setting inventory alert:", error);
        return null;
      }

      return {
        id: data.id,
        productId: data.product_id,
        productName: "", // Would need to fetch separately
        alertType: data.alert_type,
        currentStock: data.current_stock,
        thresholdValue: data.threshold_value,
        isActive: data.is_active,
        lastNotifiedAt: data.last_notified_at,
      };
    } catch (error) {
      console.error("Error in setInventoryAlert:", error);
      return null;
    }
  }

  /**
   * Dismiss inventory alert
   */
  static async dismissInventoryAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("inventory_alerts")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", alertId);

      if (error) {
        console.error("Error dismissing inventory alert:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in dismissInventoryAlert:", error);
      return false;
    }
  }

  /**
   * Get seller performance metrics for today
   */
  static async getTodaysPerformanceMetrics(
    sellerId: string
  ): Promise<SellerPerformanceMetrics | null> {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("seller_performance_metrics")
        .select("*")
        .eq("seller_id", sellerId)
        .eq("metric_date", today)
        .single();

      if (error) {
        console.error("Error fetching today's performance metrics:", error);
        // Return default values if no data yet
        return {
          avgResponseTimeHours: 0,
          avgFulfillmentTimeHours: 0,
          orderAcceptanceRate: 100,
          onTimeDeliveryRate: 100,
          customerSatisfactionRate: 5,
          refundRate: 0,
          returnRate: 0,
          metricDate: today,
        };
      }

      if (!data) {
        return {
          avgResponseTimeHours: 0,
          avgFulfillmentTimeHours: 0,
          orderAcceptanceRate: 100,
          onTimeDeliveryRate: 100,
          customerSatisfactionRate: 5,
          refundRate: 0,
          returnRate: 0,
          metricDate: today,
        };
      }

      return {
        avgResponseTimeHours: data.avg_response_time_hours || 0,
        avgFulfillmentTimeHours: data.avg_fulfillment_time_hours || 0,
        orderAcceptanceRate: data.order_acceptance_rate || 100,
        onTimeDeliveryRate: data.on_time_delivery_rate || 100,
        customerSatisfactionRate: data.customer_satisfaction_rate || 5,
        refundRate: data.refund_rate || 0,
        returnRate: data.return_rate || 0,
        metricDate: data.metric_date,
      };
    } catch (error) {
      console.error("Error in getTodaysPerformanceMetrics:", error);
      return null;
    }
  }

  /**
   * Get seller badges
   */
  static async getSellerBadges(sellerId: string): Promise<SellerBadge[]> {
    try {
      const { data, error } = await supabase
        .from("seller_badges")
        .select("*")
        .eq("seller_id", sellerId)
        .order("earned_at", { ascending: false });

      if (error) {
        console.error("Error fetching seller badges:", error);
        return [];
      }

      if (!data) return [];

      return data.map((badge: any) => ({
        id: badge.id,
        badgeType: badge.badge_type,
        badgeName: badge.badge_name,
        description: badge.description,
        iconUrl: badge.icon_url,
        earnedAt: badge.earned_at,
      }));
    } catch (error) {
      console.error("Error in getSellerBadges:", error);
      return [];
    }
  }

  /**
   * Award badge to seller
   */
  static async awardBadge(
    sellerId: string,
    badgeType: string,
    badgeName: string,
    description?: string,
    iconUrl?: string
  ): Promise<SellerBadge | null> {
    try {
      const { data, error } = await supabase
        .from("seller_badges")
        .insert([
          {
            seller_id: sellerId,
            badge_type: badgeType,
            badge_name: badgeName,
            description: description || null,
            icon_url: iconUrl || null,
            earned_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        // If unique constraint, badge already exists
        if (error.code === "23505") {
          console.info("Badge already awarded to seller");
          return null;
        }
        console.error("Error awarding badge:", error);
        return null;
      }

      return {
        id: data.id,
        badgeType: data.badge_type,
        badgeName: data.badge_name,
        description: data.description,
        iconUrl: data.icon_url,
        earnedAt: data.earned_at,
      };
    } catch (error) {
      console.error("Error in awardBadge:", error);
      return null;
    }
  }

  /**
   * Get monthly sales trends
   */
  static async getMonthlySalesTrends(
    sellerId: string,
    months: number = 12
  ): Promise<MonthlyTrend[]> {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months + 1);
      startDate.setDate(1);

      const { data, error } = await supabase
        .from("monthly_sales_trend")
        .select("*")
        .eq("seller_id", sellerId)
        .gte("month", startDate.toISOString().split("T")[0])
        .lte("month", endDate.toISOString().split("T")[0])
        .order("month", { ascending: true });

      if (error) {
        console.error("Error fetching monthly sales trends:", error);
        return [];
      }

      if (!data) return [];

      return data.map((item: any) => ({
        month: new Date(item.month).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        }),
        totalOrders: item.total_orders || 0,
        totalRevenue: item.total_revenue || 0,
        avgOrderValue: item.avg_order_value || 0,
        totalItemsSold: item.total_items_sold || 0,
      }));
    } catch (error) {
      console.error("Error in getMonthlySalesTrends:", error);
      return [];
    }
  }

  /**
   * Get seller dashboard summary
   */
  static async getSellerDashboardSummary(sellerId: string): Promise<{
    todaysSales: SalesAnalytics | null;
    performance: SellerPerformanceMetrics | null;
    topProducts: ProductPerformance[];
    alerts: InventoryAlert[];
    badges: SellerBadge[];
  }> {
    try {
      const [sales, performance, topProducts, alerts, badges] =
        await Promise.all([
          this.getTodaysSalesAnalytics(sellerId),
          this.getTodaysPerformanceMetrics(sellerId),
          this.getTopPerformingProducts(sellerId, 5),
          this.getInventoryAlerts(sellerId, true),
          this.getSellerBadges(sellerId),
        ]);

      return {
        todaysSales: sales,
        performance,
        topProducts,
        alerts,
        badges,
      };
    } catch (error) {
      console.error("Error in getSellerDashboardSummary:", error);
      return {
        todaysSales: null,
        performance: null,
        topProducts: [],
        alerts: [],
        badges: [],
      };
    }
  }

  /**
   * Calculate seller tier based on metrics
   */
  static calculateSellerTier(
    totalSales: number,
    customerSatisfaction: number,
    deliveryRate: number
  ): {
    tier: "bronze" | "silver" | "gold" | "platinum";
    displayName: string;
    color: string;
  } {
    if (
      totalSales >= 50000 &&
      customerSatisfaction >= 4.8 &&
      deliveryRate >= 99
    ) {
      return {
        tier: "platinum",
        displayName: "Platinum Seller",
        color: "text-blue-600",
      };
    }

    if (
      totalSales >= 20000 &&
      customerSatisfaction >= 4.6 &&
      deliveryRate >= 98
    ) {
      return {
        tier: "gold",
        displayName: "Gold Seller",
        color: "text-yellow-600",
      };
    }

    if (
      totalSales >= 5000 &&
      customerSatisfaction >= 4.4 &&
      deliveryRate >= 95
    ) {
      return {
        tier: "silver",
        displayName: "Silver Seller",
        color: "text-gray-500",
      };
    }

    return {
      tier: "bronze",
      displayName: "Bronze Seller",
      color: "text-orange-600",
    };
  }
}

export const sellerAnalyticsService = new SellerAnalyticsService();
