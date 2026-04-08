import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Eye,
  ShoppingCart,
  RefreshCw,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { InventoryAlerts } from "@/components/marketplace/seller/InventoryAlerts";
import { PerformanceMetrics } from "@/components/marketplace/seller/PerformanceMetrics";
import { sellerAnalyticsService } from "@/services/sellerAnalyticsService";

export const SellerAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"7" | "30" | "90">("30");

  useEffect(() => {
    if (!user?.id) {
      navigate("/auth");
      return;
    }
    loadDashboard();
  }, [user, selectedPeriod]);

  const loadDashboard = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await sellerAnalyticsService.getDashboardSummary(user.id);
      setDashboardData(data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: "csv" | "pdf") => {
    if (!dashboardData) return;

    if (format === "csv") {
      exportAsCSV();
    } else {
      exportAsPDF();
    }
  };

  const exportAsCSV = () => {
    const { kpis, topProducts, salesTrend, recentOrders } = dashboardData;
    const timestamp = new Date().toISOString().split('T')[0];

    let csvContent = "Seller Analytics Export\n";
    csvContent += `Exported: ${new Date().toLocaleString()}\n`;
    csvContent += `Period: Last ${selectedPeriod} days\n\n`;

    csvContent += "KEY PERFORMANCE INDICATORS\n";
    csvContent += "Metric,Value\n";
    csvContent += `Total Revenue,$${kpis.totalRevenue.toLocaleString()}\n`;
    csvContent += `Total Orders,${kpis.totalOrders}\n`;
    csvContent += `Average Order Value,$${kpis.averageOrderValue.toFixed(2)}\n`;
    csvContent += `Conversion Rate,${kpis.conversionRate.toFixed(2)}%\n`;
    csvContent += `Active Listings,${kpis.activeListings}\n\n`;

    csvContent += "TOP PERFORMING PRODUCTS\n";
    csvContent += "Product,Views,Sales,Revenue,Rating,Conversion Rate\n";
    topProducts?.forEach((product: any) => {
      csvContent += `${product.productName},${product.views},${product.conversions},$${product.revenue.toFixed(2)},${product.rating.toFixed(1)},${product.conversionRate.toFixed(2)}%\n`;
    });

    csvContent += "\nSALES TREND\n";
    csvContent += "Date,Revenue,Orders\n";
    salesTrend?.forEach((data: any) => {
      csvContent += `${data.date},${data.revenue},${data.orders}\n`;
    });

    csvContent += "\nRECENT ORDERS\n";
    csvContent += "Order ID,Customer,Amount,Status,Date\n";
    recentOrders?.forEach((order: any) => {
      const date = order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A';
      csvContent += `${order.id},${order.customer_name || 'Customer'},$${order.total_amount.toFixed(2)},${order.status},${date}\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
    element.setAttribute('download', `seller-analytics-${timestamp}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const exportAsPDF = () => {
    const { kpis, topProducts } = dashboardData;
    const timestamp = new Date().toISOString().split('T')[0];

    let pdfContent = `Seller Analytics Report - ${new Date().toLocaleDateString()}\n\n`;
    pdfContent += `Period: Last ${selectedPeriod} days\n\n`;
    pdfContent += `Total Revenue: $${kpis.totalRevenue.toLocaleString()}\n`;
    pdfContent += `Total Orders: ${kpis.totalOrders}\n`;
    pdfContent += `Average Order Value: $${kpis.averageOrderValue.toFixed(2)}\n`;
    pdfContent += `Conversion Rate: ${kpis.conversionRate.toFixed(2)}%\n`;
    pdfContent += `Active Listings: ${kpis.activeListings}\n\n`;
    pdfContent += `Top Products:\n`;
    topProducts?.slice(0, 5).forEach((product: any, index: number) => {
      pdfContent += `${index + 1}. ${product.productName} - $${product.revenue.toFixed(2)} (${product.conversions} sales)\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(pdfContent)}`);
    element.setAttribute('download', `seller-analytics-${timestamp}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isLoading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const { kpis, metrics, topProducts, salesTrend, recentOrders, inventoryAlerts } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Seller Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your performance and sales metrics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={loadDashboard}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExport("csv")}>
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === "7" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod("7")}
          >
            Last 7 Days
          </Button>
          <Button
            variant={selectedPeriod === "30" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod("30")}
          >
            Last 30 Days
          </Button>
          <Button
            variant={selectedPeriod === "90" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod("90")}
          >
            Last 90 Days
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Total Revenue</span>
                <DollarSign className="w-4 h-4 text-green-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">${kpis.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-600">Last {selectedPeriod} days</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Orders */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Total Orders</span>
                <ShoppingCart className="w-4 h-4 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{kpis.totalOrders}</p>
                <p className="text-xs text-gray-600">
                  Avg: ${kpis.averageOrderValue.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Conversion Rate</span>
                <TrendingUp className="w-4 h-4 text-orange-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{kpis.conversionRate.toFixed(2)}%</p>
                <p className="text-xs text-gray-600">Views to sales</p>
              </div>
            </CardContent>
          </Card>

          {/* Active Listings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Active Listings</span>
                <Package className="w-4 h-4 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{kpis.activeListings}</p>
                <p className="text-xs text-gray-600">Products for sale</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Sales Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {salesTrend && salesTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue ($)" />
                      <Line type="monotone" dataKey="orders" stroke="#3b82f6" name="Orders" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No sales data available for the selected period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Products</CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts && topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {topProducts.map((product) => (
                      <div key={product.productId} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                        <img
                          src={product.productImage}
                          alt={product.productName}
                          className="w-16 h-16 rounded object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{product.productName}</h4>
                          <div className="flex gap-4 text-sm text-gray-600 mt-1">
                            <span>{product.conversions} sales</span>
                            <span>{product.conversionRate.toFixed(2)}% conversion</span>
                            <span>⭐ {product.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${product.revenue.toFixed(2)}</p>
                          <p className="text-xs text-gray-600">{product.views} views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No product data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {recentOrders && recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{order.customer_name || "Customer"}</p>
                          <p className="text-xs text-gray-600">{order.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${order.total_amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-600 capitalize">{order.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recent orders
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <PerformanceMetrics sellerId={user?.id || ""} />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <InventoryAlerts sellerId={user?.id || ""} onRefresh={loadDashboard} />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold">{kpis.totalOrders}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold">${kpis.averageOrderValue.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">${kpis.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SellerAnalyticsDashboard;
