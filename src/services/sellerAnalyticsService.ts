import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/utils/utils";

export interface KPIMetrics {
  totalRevenue: number;
  totalOrders: number;
  conversionRate: number;
  averageOrderValue: number;
  activeListings: number;
  topProductId: string | null;
  topProductName: string | null;
  topProductSales: number;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  productImage: string;
  views: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  rating: number;
  reviewCount: number;
  stockQuantity: number;
}

export interface SalesTrend {
  date: string;
  revenue: number;
  orders: number;
  conversion: number;
}

export interface InventoryAlert {
  productId: string;
  productName: string;
  currentStock: number;
  reorderLevel: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  lastRestocked?: string;
}

export interface PerformanceBadge {
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  badgeColor: string;
  unlockedAt?: string;
  isUnlocked: boolean;
  progressPercent: number;
  nextMilestone: string;
}

export interface SellerMetrics {
  averageRating: number;
  totalReviews: number;
  positiveReviewPercent: number;
  responseTime: number;
  returnRate: number;
  refundRate: number;
  shippingSpeed: number;
  sellerTier: "bronze" | "silver" | "gold" | "platinum";
  tierLevel: number;
}

export interface DashboardSummary {
  kpis: KPIMetrics;
  metrics: SellerMetrics;
  badges: PerformanceBadge[];
  recentOrders: any[];
  topProducts: ProductPerformance[];
  salesTrend: SalesTrend[];
  inventoryAlerts: InventoryAlert[];
}

export class SellerAnalyticsService {
  // Get KPI metrics for dashboard
  static async getKPIMetrics(sellerId: string, days: number = 30): Promise<KPIMetrics> {
    try {
      if (!sellerId) {
        return {
          totalRevenue: 0,
          totalOrders: 0,
          conversionRate: 0,
          averageOrderValue: 0,
          activeListings: 0,
          topProductId: null,
          topProductName: null,
          topProductSales: 0,
        };
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get total revenue and orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, total_amount, created_at")
        .eq("seller_id", sellerId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
      }

      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get product views and conversions for conversion rate
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, image_url, views, sales_count")
        .eq("seller_id", sellerId);

      if (productsError) {
        console.error("Error fetching products:", productsError);
      }

      const activeListings = products?.length || 0;
      const totalViews = products?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;
      const totalSales = products?.reduce((sum, p) => sum + (p.sales_count || 0), 0) || 0;
      const conversionRate = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;

      // Get top product
      let topProductId = null;
      let topProductName = null;
      let topProductSales = 0;

      if (products && products.length > 0) {
        const topProduct = products.reduce((prev, current) =>
          (prev.sales_count || 0) > (current.sales_count || 0) ? prev : current
        );
        topProductId = topProduct.id;
        topProductName = topProduct.name;
        topProductSales = topProduct.sales_count || 0;
      }

      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        activeListings,
        topProductId,
        topProductName,
        topProductSales,
      };
    } catch (error) {
      console.error("Error in getKPIMetrics:", error);
      return {
        totalRevenue: 0,
        totalOrders: 0,
        conversionRate: 0,
        averageOrderValue: 0,
        activeListings: 0,
        topProductId: null,
        topProductName: null,
        topProductSales: 0,
      };
    }
  }

  // Get product performance metrics
  static async getProductPerformance(
    sellerId: string,
    limit: number = 10
  ): Promise<ProductPerformance[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          image_url,
          views,
          sales_count,
          rating,
          review_count,
          stock_quantity
        `
        )
        .eq("seller_id", sellerId)
        .order("sales_count", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching product performance:", error);
        return [];
      }

      return (
        data?.map((product) => ({
          productId: product.id,
          productName: product.name,
          productImage: product.image_url || "",
          views: product.views || 0,
          conversions: product.sales_count || 0,
          conversionRate:
            (product.views || 0) > 0
              ? Math.round(((product.sales_count || 0) / (product.views || 0)) * 10000) / 100
              : 0,
          revenue: (product.sales_count || 0) * 50, // Mock: 50 per sale
          rating: product.rating || 0,
          reviewCount: product.review_count || 0,
          stockQuantity: product.stock_quantity || 0,
        })) || []
      );
    } catch (error) {
      console.error("Error in getProductPerformance:", error);
      return [];
    }
  }

  // Get sales trends over time
  static async getSalesTrends(sellerId: string, days: number = 30): Promise<SalesTrend[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: orders, error } = await supabase
        .from("orders")
        .select("created_at, total_amount")
        .eq("seller_id", sellerId)
        .gte("created_at", startDate.toISOString());

      if (error) {
        console.error("Error fetching sales trends:", error);
        return [];
      }

      // Group by date
      const trendMap: Record<
        string,
        { revenue: number; orders: number; views: number }
      > = {};

      orders?.forEach((order) => {
        const date = new Date(order.created_at).toISOString().split("T")[0];
        if (!trendMap[date]) {
          trendMap[date] = { revenue: 0, orders: 0, views: 100 }; // Mock views
        }
        trendMap[date].revenue += order.total_amount || 0;
        trendMap[date].orders += 1;
      });

      return Object.entries(trendMap)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, data]) => ({
          date,
          revenue: Math.round(data.revenue * 100) / 100,
          orders: data.orders,
          conversion: Math.round((data.orders / data.views) * 10000) / 100,
        }));
    } catch (error) {
      console.error("Error in getSalesTrends:", error);
      return [];
    }
  }

  // Get inventory alerts
  static async getInventoryAlerts(sellerId: string, reorderLevel: number = 10): Promise<InventoryAlert[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock_quantity, updated_at")
        .eq("seller_id", sellerId)
        .lte("stock_quantity", reorderLevel);

      if (error) {
        console.error("Error fetching inventory alerts:", error);
        return [];
      }

      return (
        data?.map((product) => ({
          productId: product.id,
          productName: product.name,
          currentStock: product.stock_quantity || 0,
          reorderLevel,
          status:
            product.stock_quantity === 0
              ? "out_of_stock"
              : product.stock_quantity <= reorderLevel
                ? "low_stock"
                : "in_stock",
          lastRestocked: product.updated_at,
        })) || []
      );
    } catch (error) {
      console.error("Error in getInventoryAlerts:", error);
      return [];
    }
  }

  // Get seller metrics (rating, reviews, etc.)
  static async getSellerMetrics(sellerId: string): Promise<SellerMetrics> {
    try {
      // Get reviews and ratings
      const { data: reviews, error: reviewsError } = await supabase
        .from("product_reviews")
        .select("rating, is_helpful")
        .eq("seller_id", sellerId);

      if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
      }

      const averageRating =
        reviews && reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
          : 0;
      const totalReviews = reviews?.length || 0;
      const positiveReviews = reviews?.filter((r) => (r.rating || 0) >= 4).length || 0;
      const positiveReviewPercent =
        totalReviews > 0 ? Math.round((positiveReviews / totalReviews) * 100) : 0;

      // Calculate tier based on sales
      const kpis = await this.getKPIMetrics(sellerId, 90);
      let sellerTier: "bronze" | "silver" | "gold" | "platinum" = "bronze";
      let tierLevel = 1;

      if (kpis.totalRevenue >= 50000) {
        sellerTier = "platinum";
        tierLevel = 4;
      } else if (kpis.totalRevenue >= 20000) {
        sellerTier = "gold";
        tierLevel = 3;
      } else if (kpis.totalRevenue >= 5000) {
        sellerTier = "silver";
        tierLevel = 2;
      }

      return {
        averageRating: Math.round(averageRating * 100) / 100,
        totalReviews,
        positiveReviewPercent,
        responseTime: 4, // Mock: hours
        returnRate: Math.round(Math.random() * 5 * 100) / 100, // Mock
        refundRate: Math.round(Math.random() * 3 * 100) / 100, // Mock
        shippingSpeed: 2, // Mock: days
        sellerTier,
        tierLevel,
      };
    } catch (error) {
      console.error("Error in getSellerMetrics:", error);
      return {
        averageRating: 0,
        totalReviews: 0,
        positiveReviewPercent: 0,
        responseTime: 0,
        returnRate: 0,
        refundRate: 0,
        shippingSpeed: 0,
        sellerTier: "bronze",
        tierLevel: 1,
      };
    }
  }

  // Get performance badges
  static async getPerformanceBadges(sellerId: string): Promise<PerformanceBadge[]> {
    try {
      const metrics = await this.getSellerMetrics(sellerId);
      const kpis = await this.getKPIMetrics(sellerId, 90);

      const badges: PerformanceBadge[] = [
        {
          badgeId: "top_rated",
          badgeName: "Top Rated",
          badgeIcon: "⭐",
          badgeColor: "bg-yellow-100",
          isUnlocked: metrics.averageRating >= 4.5,
          progressPercent:
            metrics.averageRating > 0 ? Math.round((metrics.averageRating / 5) * 100) : 0,
          nextMilestone: "4.5+ rating",
          unlockedAt: metrics.averageRating >= 4.5 ? new Date().toISOString() : undefined,
        },
        {
          badgeId: "fast_shipper",
          badgeName: "Fast Shipper",
          badgeIcon: "🚀",
          badgeColor: "bg-blue-100",
          isUnlocked: metrics.shippingSpeed <= 2,
          progressPercent: Math.round((1 - Math.min(metrics.shippingSpeed / 5, 1)) * 100),
          nextMilestone: "2 day average",
          unlockedAt: metrics.shippingSpeed <= 2 ? new Date().toISOString() : undefined,
        },
        {
          badgeId: "excellent_service",
          badgeName: "Excellent Service",
          badgeIcon: "✨",
          badgeColor: "bg-purple-100",
          isUnlocked: metrics.positiveReviewPercent >= 90,
          progressPercent: metrics.positiveReviewPercent,
          nextMilestone: "90% positive reviews",
          unlockedAt: metrics.positiveReviewPercent >= 90 ? new Date().toISOString() : undefined,
        },
        {
          badgeId: "trusted_seller",
          badgeName: "Trusted Seller",
          badgeIcon: "🛡️",
          badgeColor: "bg-green-100",
          isUnlocked: kpis.totalOrders >= 100 && metrics.returnRate < 2,
          progressPercent: Math.min((kpis.totalOrders / 100) * 100, 100),
          nextMilestone: "100+ orders & <2% returns",
          unlockedAt: kpis.totalOrders >= 100 ? new Date().toISOString() : undefined,
        },
        {
          badgeId: "power_seller",
          badgeName: "Power Seller",
          badgeIcon: "⚡",
          badgeColor: "bg-red-100",
          isUnlocked: kpis.totalRevenue >= 20000,
          progressPercent: Math.min((kpis.totalRevenue / 20000) * 100, 100),
          nextMilestone: "$20,000 revenue",
          unlockedAt: kpis.totalRevenue >= 20000 ? new Date().toISOString() : undefined,
        },
      ];

      return badges;
    } catch (error) {
      console.error("Error in getPerformanceBadges:", error);
      return [];
    }
  }

  // Get complete dashboard summary
  static async getDashboardSummary(sellerId: string): Promise<DashboardSummary> {
    try {
      const [kpis, metrics, badges, topProducts, salesTrend, inventoryAlerts] = await Promise.all(
        [
          this.getKPIMetrics(sellerId),
          this.getSellerMetrics(sellerId),
          this.getPerformanceBadges(sellerId),
          this.getProductPerformance(sellerId, 5),
          this.getSalesTrends(sellerId, 30),
          this.getInventoryAlerts(sellerId),
        ]
      );

      // Get recent orders
      const { data: recentOrders } = await supabase
        .from("orders")
        .select("id, total_amount, status, created_at, customer_name")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false })
        .limit(5);

      return {
        kpis,
        metrics,
        badges,
        recentOrders: recentOrders || [],
        topProducts,
        salesTrend,
        inventoryAlerts,
      };
    } catch (error) {
      console.error("Error in getDashboardSummary:", error);
      return {
        kpis: {
          totalRevenue: 0,
          totalOrders: 0,
          conversionRate: 0,
          averageOrderValue: 0,
          activeListings: 0,
          topProductId: null,
          topProductName: null,
          topProductSales: 0,
        },
        metrics: {
          averageRating: 0,
          totalReviews: 0,
          positiveReviewPercent: 0,
          responseTime: 0,
          returnRate: 0,
          refundRate: 0,
          shippingSpeed: 0,
          sellerTier: "bronze",
          tierLevel: 1,
        },
        badges: [],
        recentOrders: [],
        topProducts: [],
        salesTrend: [],
        inventoryAlerts: [],
      };
    }
  }
}

export const sellerAnalyticsService = new SellerAnalyticsService();
