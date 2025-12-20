import React, { useState, useEffect } from "react";
import { TrendingUp, AlertCircle, BarChart3, PieChart, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart as PieChartComponent,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  returnsManagementService,
  ReturnAnalytics as ReturnAnalyticsData,
} from "@/services/returnsManagementService";
import { useToast } from "@/components/ui/use-toast";

interface ReturnAnalyticsProps {
  sellerId: string;
  days?: number;
}

const REASON_COLORS: Record<string, string> = {
  defective: "#ef4444",
  not_as_described: "#f97316",
  wrong_item: "#eab308",
  damage_shipping: "#3b82f6",
  changed_mind: "#8b5cf6",
  other: "#6b7280",
};

const REASON_LABELS: Record<string, string> = {
  defective: "Defective",
  not_as_described: "Not as Described",
  wrong_item: "Wrong Item",
  damage_shipping: "Damage in Shipping",
  changed_mind: "Changed Mind",
  other: "Other",
};

export const ReturnAnalytics: React.FC<ReturnAnalyticsProps> = ({
  sellerId,
  days = 90,
}) => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<ReturnAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [sellerId, days]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await returnsManagementService.getReturnAnalytics(sellerId, days);
      setAnalytics(data);
    } catch (error) {
      console.error("Error loading return analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Failed to load return analytics data
        </AlertDescription>
      </Alert>
    );
  }

  // Prepare data for charts
  const reasonData = Object.entries(analytics.returnReasons).map(([reason, count]) => ({
    name: REASON_LABELS[reason] || reason,
    value: count,
    fill: REASON_COLORS[reason],
  }));

  const trendData = analytics.returnsByMonth.map((item) => ({
    month: new Date(item.month + "-01").toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
    returns: item.count,
    value: item.value,
  }));

  const topProductsData = analytics.topReturnedProducts.slice(0, 5).map((product) => ({
    name: product.productName.substring(0, 20) + (product.productName.length > 20 ? "..." : ""),
    returns: product.returnCount,
  }));

  const getReturnRateColor = (rate: number) => {
    if (rate < 2) return "text-green-600";
    if (rate < 5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Total Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.totalReturns}</p>
            <p className="text-xs text-gray-600 mt-1">
              Value: ${analytics.totalReturnValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              Return Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${getReturnRateColor(analytics.returnRate)}`}>
              {analytics.returnRate.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-600 mt-1">Of total orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Avg Refund
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${analytics.averageRefundAmount.toFixed(2)}</p>
            <p className="text-xs text-gray-600 mt-1">Per return</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-purple-600" />
              Customer Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.customerReturnPatterns.returningCustomers}</p>
            <p className="text-xs text-gray-600 mt-1">
              {analytics.customerReturnPatterns.repeatReturnCustomers} repeat returners
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pending Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{analytics.pendingReturns}</p>
            <p className="text-xs text-gray-600 mt-1">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Approved Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{analytics.approvedReturns}</p>
            <p className="text-xs text-gray-600 mt-1">Ready for refund</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Rejected Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{analytics.rejectedReturns}</p>
            <p className="text-xs text-gray-600 mt-1">Not approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Return Reasons Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Return Reasons Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reasonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChartComponent>
                  <Pie
                    data={reasonData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reasonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChartComponent>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No return data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Top Return Reasons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.reasonTrends.length > 0 ? (
                analytics.reasonTrends.map((reason, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              REASON_COLORS[reason.reason] || "#6b7280",
                          }}
                        />
                        <span className="text-sm font-medium">
                          {REASON_LABELS[reason.reason]}
                        </span>
                      </div>
                      <Badge variant="secondary">{reason.count}</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${
                            (reason.count /
                              Math.max(
                                ...analytics.reasonTrends.map((r) => r.count)
                              )) *
                            100
                          }%`,
                          backgroundColor:
                            REASON_COLORS[reason.reason] || "#6b7280",
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No return data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Return Trends (Last {days} Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="returns"
                  stroke="#ef4444"
                  name="Return Count"
                  dot={{ fill: "#ef4444" }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  name="Return Value ($)"
                  dot={{ fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No monthly trend data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Returned Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Top Returned Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topProductsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="returns" fill="#f97316" name="Return Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No product return data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights & Recommendations */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Analytics Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-3">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Key Findings:</h4>
            <ul className="list-disc list-inside space-y-1">
              {analytics.totalReturns === 0 && (
                <li>No returns yet - monitor this closely as your store grows</li>
              )}
              {analytics.returnRate > 5 && (
                <li>
                  High return rate ({analytics.returnRate.toFixed(2)}%) - Review product
                  descriptions and quality
                </li>
              )}
              {analytics.customerReturnPatterns.repeatReturnCustomers > 0 && (
                <li>
                  You have {analytics.customerReturnPatterns.repeatReturnCustomers} repeat returners
                  - Consider reaching out to resolve issues
                </li>
              )}
              {analytics.reasonTrends.length > 0 && (
                <li>
                  Top return reason: {REASON_LABELS[analytics.reasonTrends[0].reason]} ({analytics.reasonTrends[0].count}x)
                </li>
              )}
              {analytics.topReturnedProducts.length > 0 && (
                <li>
                  Most returned product: {analytics.topReturnedProducts[0].productName} ({analytics.topReturnedProducts[0].returnCount}x)
                </li>
              )}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Recommendations:</h4>
            <ul className="list-disc list-inside space-y-1">
              {analytics.reasonTrends[0]?.reason === "not_as_described" && (
                <li>Improve product descriptions and use more detailed images</li>
              )}
              {analytics.reasonTrends[0]?.reason === "damage_shipping" && (
                <li>Review packaging materials and shipping partners</li>
              )}
              {analytics.reasonTrends[0]?.reason === "defective" && (
                <li>Review product quality and consider stricter QA checks</li>
              )}
              <li>Proactively communicate with customers about product specifications</li>
              <li>Process refunds promptly to maintain positive customer relationships</li>
              <li>Monitor return trends monthly to identify patterns</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReturnAnalytics;
