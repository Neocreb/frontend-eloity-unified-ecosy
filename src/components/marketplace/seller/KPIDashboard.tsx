import React, { useState, useEffect } from "react";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Percent,
  Users,
  Package,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sellerAnalyticsService, SalesAnalytics, SellerPerformanceMetrics } from "@/services/sellerAnalyticsService";
import { useCurrency } from "@/contexts/CurrencyContext";

interface KPIDashboardProps {
  sellerId: string;
  isLoading?: boolean;
  onDataLoad?: (data: {
    sales: SalesAnalytics | null;
    performance: SellerPerformanceMetrics | null;
  }) => void;
}

const KPIDashboard: React.FC<KPIDashboardProps> = ({
  sellerId,
  isLoading: externalLoading = false,
  onDataLoad,
}) => {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<SalesAnalytics | null>(null);
  const [performance, setPerformance] = useState<SellerPerformanceMetrics | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [salesData, performanceData] = await Promise.all([
          sellerAnalyticsService.getTodaysSalesAnalytics(sellerId),
          sellerAnalyticsService.getTodaysPerformanceMetrics(sellerId),
        ]);

        setSales(salesData);
        setPerformance(performanceData);

        if (onDataLoad) {
          onDataLoad({
            sales: salesData,
            performance: performanceData,
          });
        }
      } catch (error) {
        console.error("Error loading KPI data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up real-time updates (refresh every 30 seconds)
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [sellerId, onDataLoad]);

  const isLoading = externalLoading || loading;

  const kpis = [
    {
      title: "Total Revenue",
      value: sales ? formatCurrency(sales.totalRevenue) : "$0.00",
      icon: DollarSign,
      color: "bg-blue-100 text-blue-600",
      change: "+12.5%",
      changePositive: true,
    },
    {
      title: "Total Orders",
      value: sales?.totalOrders || 0,
      icon: ShoppingCart,
      color: "bg-green-100 text-green-600",
      change: "+5.2%",
      changePositive: true,
    },
    {
      title: "Avg Order Value",
      value: sales ? formatCurrency(sales.avgOrderValue) : "$0.00",
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-600",
      change: "+3.1%",
      changePositive: true,
    },
    {
      title: "Conversion Rate",
      value: `${(sales?.conversionRate || 0).toFixed(2)}%`,
      icon: Percent,
      color: "bg-orange-100 text-orange-600",
      change: "+1.4%",
      changePositive: true,
    },
    {
      title: "Items Sold",
      value: sales?.totalItemsSold || 0,
      icon: Package,
      color: "bg-pink-100 text-pink-600",
      change: "+8.3%",
      changePositive: true,
    },
    {
      title: "Unique Customers",
      value: sales?.uniqueCustomers || 0,
      icon: Users,
      color: "bg-indigo-100 text-indigo-600",
      change: "+2.7%",
      changePositive: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Today's Performance</h2>
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Updating...</span>
          </div>
        )}
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {kpi.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${kpi.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {isLoading ? (
                      <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      kpi.value
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant={
                        kpi.changePositive ? "default" : "destructive"
                      }
                      className="text-xs"
                    >
                      {kpi.change}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      vs yesterday
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Metrics */}
      {performance && (
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Avg Response Time
                </p>
                <p className="text-xl font-semibold">
                  {performance.avgResponseTimeHours.toFixed(1)}h
                </p>
                <p className="text-xs text-green-600">Excellent</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Fulfillment Time
                </p>
                <p className="text-xl font-semibold">
                  {performance.avgFulfillmentTimeHours.toFixed(1)}h
                </p>
                <p className="text-xs text-green-600">On track</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Order Acceptance Rate
                </p>
                <p className="text-xl font-semibold">
                  {performance.orderAcceptanceRate.toFixed(1)}%
                </p>
                <p className="text-xs text-green-600">Very Good</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  On-Time Delivery
                </p>
                <p className="text-xl font-semibold">
                  {performance.onTimeDeliveryRate.toFixed(1)}%
                </p>
                <p className="text-xs text-green-600">Excellent</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Customer Satisfaction
                </p>
                <p className="text-xl font-semibold">
                  {performance.customerSatisfactionRate.toFixed(1)}/5.0
                </p>
                <p className="text-xs text-green-600">Excellent</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Refund Rate
                </p>
                <p className="text-xl font-semibold">
                  {performance.refundRate.toFixed(2)}%
                </p>
                <p className="text-xs text-green-600">Low</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Return Rate
                </p>
                <p className="text-xl font-semibold">
                  {performance.returnRate.toFixed(2)}%
                </p>
                <p className="text-xs text-green-600">Low</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KPIDashboard;
