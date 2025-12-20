import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadarController,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from "chart.js";
import { Line, Bar, Radar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  sellerAnalyticsService,
  MonthlyTrend,
  ProductPerformance,
  SellerPerformanceMetrics,
} from "@/services/sellerAnalyticsService";
import { useCurrency } from "@/contexts/CurrencyContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadarController,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsChartsProps {
  sellerId: string;
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ sellerId }) => {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
  const [performance, setPerformance] = useState<SellerPerformanceMetrics | null>(
    null
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [trends, products, metrics] = await Promise.all([
          sellerAnalyticsService.getMonthlySalesTrends(sellerId, 12),
          sellerAnalyticsService.getTopPerformingProducts(sellerId, 8),
          sellerAnalyticsService.getTodaysPerformanceMetrics(sellerId),
        ]);

        setMonthlyTrends(trends);
        setTopProducts(products);
        setPerformance(metrics);
      } catch (error) {
        console.error("Error loading analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sellerId]);

  // Sales Trend Chart
  const salesTrendData = {
    labels: monthlyTrends.map((t) => t.month),
    datasets: [
      {
        label: "Revenue",
        data: monthlyTrends.map((t) => t.totalRevenue),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        yAxisID: "y",
      },
      {
        label: "Orders",
        data: monthlyTrends.map((t) => t.totalOrders),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        yAxisID: "y1",
      },
    ],
  };

  const salesTrendOptions: ChartOptions<"line"> = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Sales Trends (Last 12 Months)",
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Revenue ($)",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Orders",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // Top Products Chart
  const topProductsData = {
    labels: topProducts.slice(0, 8).map((p) => p.productName.substring(0, 20)),
    datasets: [
      {
        label: "Revenue",
        data: topProducts.slice(0, 8).map((p) => p.totalRevenue),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  };

  const topProductsOptions: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Top 8 Products by Revenue",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Revenue ($)",
        },
      },
    },
  };

  // Performance Metrics Radar Chart
  const performanceData = performance
    ? {
        labels: [
          "Response Time",
          "Fulfillment",
          "Order Acceptance",
          "Delivery Rate",
          "Customer Satisfaction",
        ],
        datasets: [
          {
            label: "Your Performance",
            data: [
              100 - Math.min(performance.avgResponseTimeHours * 10, 100),
              100 - Math.min(performance.avgFulfillmentTimeHours * 5, 100),
              performance.orderAcceptanceRate,
              performance.onTimeDeliveryRate,
              (performance.customerSatisfactionRate / 5) * 100,
            ],
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            borderWidth: 2,
          },
          {
            label: "Industry Average",
            data: [85, 80, 95, 92, 88],
            borderColor: "rgb(156, 163, 175)",
            backgroundColor: "rgba(156, 163, 175, 0.2)",
            borderWidth: 2,
          },
        ],
      }
    : null;

  const performanceOptions: ChartOptions<"radar"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Performance Metrics vs Industry Average",
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sales Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyTrends.length > 0 ? (
            <div style={{ height: "400px", position: "relative" }}>
              <Line
                data={salesTrendData}
                options={salesTrendOptions}
              />
            </div>
          ) : (
            <p className="text-muted-foreground">No data available</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div style={{ height: "400px", position: "relative" }}>
                <Bar
                  data={topProductsData}
                  options={topProductsOptions}
                />
              </div>
            ) : (
              <p className="text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceData ? (
              <div style={{ height: "400px", position: "relative" }}>
                <Radar
                  data={performanceData}
                  options={performanceOptions}
                />
              </div>
            ) : (
              <p className="text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products Detailed View</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Product</th>
                    <th className="text-right py-2 px-2">Sold</th>
                    <th className="text-right py-2 px-2">Revenue</th>
                    <th className="text-right py-2 px-2">Conv. Rate</th>
                    <th className="text-right py-2 px-2">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 font-medium">
                        {product.productName.substring(0, 40)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {product.totalSold}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatCurrency(product.totalRevenue)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {product.conversionRate.toFixed(2)}%
                      </td>
                      <td className="py-2 px-2 text-right">
                        ⭐ {product.avgRating.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No products sold yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsCharts;
