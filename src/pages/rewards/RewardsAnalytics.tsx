import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";

export default function RewardsAnalytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [timeframe, setTimeframe] = useState("month");

  const analyticsData = {
    totalEarned: 3250.75,
    thisMonth: 456.78,
    thisWeek: 123.45,
    topSource: "Content Views",
    topSourceAmount: 1890.50,
    earningBreakdown: [
      { source: "Content Views", amount: 1890.50, percentage: 58 },
      { source: "Tips", amount: 650.25, percentage: 20 },
      { source: "Referrals", amount: 450.00, percentage: 14 },
      { source: "Challenges", amount: 260.00, percentage: 8 },
    ],
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Analytics</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-600 font-medium mb-1">
                  Total Earned
                </p>
                <p className="text-xl md:text-2xl font-bold text-green-600">
                  {formatCurrency(analyticsData.totalEarned)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-600 font-medium mb-1">
                  This Month
                </p>
                <div className="flex items-center gap-1">
                  <p className="text-xl md:text-2xl font-bold text-blue-600">
                    {formatCurrency(analyticsData.thisMonth)}
                  </p>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-600 font-medium mb-1">
                  This Week
                </p>
                <p className="text-xl md:text-2xl font-bold text-purple-600">
                  {formatCurrency(analyticsData.thisWeek)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Earning Source */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Earning Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-gray-900">
                    {analyticsData.topSource}
                  </p>
                  <p className="text-sm text-gray-600">
                    {((analyticsData.topSourceAmount / analyticsData.totalEarned) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(analyticsData.topSourceAmount)}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${(analyticsData.topSourceAmount / analyticsData.totalEarned) * 100}%`,
                  }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Earnings Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Earnings Breakdown</CardTitle>
              <CardDescription>By source</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.earningBreakdown.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {item.source}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {item.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          idx === 0
                            ? "bg-green-500"
                            : idx === 1
                              ? "bg-blue-500"
                              : idx === 2
                                ? "bg-purple-500"
                                : "bg-orange-500"
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">💡 Performance Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-medium text-sm text-gray-900 mb-1">
                  Boost Your Views
                </p>
                <p className="text-xs text-gray-700">
                  Post consistently and engage with your audience to increase content visibility.
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="font-medium text-sm text-gray-900 mb-1">
                  Encourage Tips
                </p>
                <p className="text-xs text-gray-700">
                  Create exclusive content and thank your supporters to increase tip amounts.
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="font-medium text-sm text-gray-900 mb-1">
                  Grow Your Network
                </p>
                <p className="text-xs text-gray-700">
                  Expand your referral network to earn passive income from new users.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
