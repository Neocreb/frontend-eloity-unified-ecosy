import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, ShoppingCart, DollarSign, Eye, MessageCircle } from 'lucide-react';
import { MarketplaceAnalyticsService, MarketplaceKPIs, ProductAnalytics, ConversionFunnelStep } from '@/services/marketplaceAnalyticsService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  subtitle?: string;
}

function KPICard({ title, value, change, icon, subtitle }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={`text-xs mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}% from last period
          </p>
        )}
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default function MarketplaceAnalytics() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [kpis, setKpis] = useState<MarketplaceKPIs | null>(null);
  const [topProducts, setTopProducts] = useState<ProductAnalytics[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnelStep[]>([]);
  const [trafficTrends, setTrafficTrends] = useState<any[]>([]);
  const [searchAnalytics, setSearchAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [kpis, products, funnel, traffic, search] = await Promise.all([
        MarketplaceAnalyticsService.getMarketplaceKPIs(timeRange),
        MarketplaceAnalyticsService.getTopProducts(10),
        MarketplaceAnalyticsService.getConversionFunnel(),
        MarketplaceAnalyticsService.getTrafficTrends(timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365),
        MarketplaceAnalyticsService.getSearchAnalytics(15),
      ]);

      setKpis(kpis);
      setTopProducts(products);
      setConversionFunnel(funnel);
      setTrafficTrends(traffic);
      setSearchAnalytics(search);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Marketplace Analytics</h1>
          <p className="text-muted-foreground mt-1">Real-time performance metrics and insights</p>
        </div>
        <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <KPICard
          title="Total Revenue"
          value={`$${kpis?.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="w-4 h-4" />}
        />
        <KPICard
          title="Total Orders"
          value={kpis?.totalOrders}
          icon={<ShoppingCart className="w-4 h-4" />}
        />
        <KPICard
          title="Avg Order Value"
          value={`$${kpis?.averageOrderValue.toFixed(2)}`}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <KPICard
          title="Conversion Rate"
          value={`${kpis?.conversionRate.toFixed(2)}%`}
          icon={<Eye className="w-4 h-4" />}
        />
        <KPICard
          title="Active Users"
          value={kpis?.activeUsers}
          icon={<Users className="w-4 h-4" />}
        />
        <KPICard
          title="Customer Rating"
          value={kpis?.averageRating.toFixed(1)}
          subtitle={`${kpis?.totalReviews} reviews`}
          icon={<MessageCircle className="w-4 h-4" />}
        />
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="search">Search Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Traffic Trends</CardTitle>
                <CardDescription>Unique visitors over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trafficTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="uniqueVisitors"
                      stroke="#3B82F6"
                      name="Visitors"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="pageViews"
                      stroke="#10B981"
                      name="Page Views"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Conversion Rate</span>
                    <span className="font-semibold">{kpis?.conversionRate.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (kpis?.conversionRate || 0) * 10)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cart Abandonment Rate</span>
                    <span className="font-semibold">{kpis?.cartAbandonmentRate.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, kpis?.cartAbandonmentRate || 0)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Customer Satisfaction</span>
                    <span className="font-semibold">{kpis?.customerSatisfactionScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${kpis?.customerSatisfactionScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm text-muted-foreground">Revenue Breakdown</p>
                  <div className="flex justify-between text-sm">
                    <span>Total Revenue</span>
                    <span className="font-semibold">${kpis?.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Orders</span>
                    <span className="font-semibold">{kpis?.totalOrders}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Order Value</span>
                    <span className="font-semibold">${kpis?.averageOrderValue.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Top Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>Products by purchase count and conversion rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={topProducts.map(p => ({
                        name: p.productName.substring(0, 20),
                        views: p.views,
                        purchases: p.purchases,
                        conversion: p.conversionRate,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="views" fill="#3B82F6" name="Views" />
                      <Bar dataKey="purchases" fill="#10B981" name="Purchases" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No product data available</p>
                )}

                {/* Products Table */}
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left">Product</th>
                        <th className="px-4 py-2 text-right">Views</th>
                        <th className="px-4 py-2 text-right">Add to Cart</th>
                        <th className="px-4 py-2 text-right">Purchases</th>
                        <th className="px-4 py-2 text-right">Conversion Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((product, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium">{product.productName}</td>
                          <td className="px-4 py-2 text-right">{product.views}</td>
                          <td className="px-4 py-2 text-right">{product.addToCart}</td>
                          <td className="px-4 py-2 text-right">{product.purchases}</td>
                          <td className="px-4 py-2 text-right">
                            <span className="text-green-600 font-semibold">
                              {product.conversionRate.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion Funnel Tab */}
        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>User journey through the checkout process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnel.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={conversionFunnel}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="stage" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="users" fill="#3B82F6" name="Users" />
                        <Bar dataKey="completedCount" fill="#10B981" name="Completed" />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Funnel Details */}
                    <div className="mt-6 space-y-2">
                      {conversionFunnel.map((step, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold capitalize">{step.stage.replace(/_/g, ' ')}</h4>
                            <span className="text-sm text-muted-foreground">
                              {step.users} users
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.max(5, step.completionRate)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{step.completedCount} completed</span>
                            <span>{step.completionRate.toFixed(1)}% completion rate</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No funnel data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Analytics Tab */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Popular Searches</CardTitle>
              <CardDescription>Most common search queries by users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchAnalytics.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={searchAnalytics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="query" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Search Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-2 text-left">Search Query</th>
                            <th className="px-4 py-2 text-right">Count</th>
                            <th className="px-4 py-2 text-right">Conversion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchAnalytics.map((search, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-2">{search.query}</td>
                              <td className="px-4 py-2 text-right">{search.count}</td>
                              <td className="px-4 py-2 text-right text-muted-foreground">
                                {search.conversionRate.toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No search data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
