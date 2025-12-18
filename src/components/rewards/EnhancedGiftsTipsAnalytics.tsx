import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRewardsSummary } from "@/hooks/useRewardsSummary";
import {
  Gift,
  DollarSign,
  TrendingUp,
  Heart,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Filter,
  Calendar,
  AlertCircle,
  Lock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { virtualGiftsService } from "@/services/virtualGiftsService";
import { formatCurrency } from "@/utils/formatters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface GiftTipStats {
  totalGiftsSent: number;
  totalGiftsCost: number;
  totalTipsSent: number;
  uniqueGiftRecipients: number;
  uniqueTipRecipients: number;
  mostSentGift: {
    name: string;
    emoji: string;
    count: number;
  } | null;
  recentGifts: Array<{
    id: string;
    giftName: string;
    giftEmoji: string;
    amount: number;
    quantity: number;
    createdAt: string;
    recipientId?: string;
    recipientName?: string;
  }>;
  recentTips: Array<{
    id: string;
    amount: number;
    createdAt: string;
    recipientId?: string;
    recipientName?: string;
  }>;
}

const EnhancedGiftsTipsAnalytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { summary } = useRewardsSummary();

  const [stats, setStats] = useState<GiftTipStats>({
    totalGiftsSent: 0,
    totalGiftsCost: 0,
    totalTipsSent: 0,
    uniqueGiftRecipients: 0,
    uniqueTipRecipients: 0,
    mostSentGift: null,
    recentGifts: [],
    recentTips: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [trendsData, setTrendsData] = useState<Array<{ date: string; gifts: number; tips: number }>>([]);
  const [anonymousMode, setAnonymousMode] = useState(false);

  const loadStats = async () => {
    if (!user?.id) return;
    setError(null);

    try {
      setIsLoading(true);
      const [giftHistory, tipHistory] = await Promise.all([
        virtualGiftsService.getGiftHistory(user.id),
        virtualGiftsService.getTipHistory(user.id),
      ]);

      // Calculate date range based on filter
      const now = new Date();
      let startDate = new Date(0); // All time by default

      if (dateFilter === "7days") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateFilter === "30days") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (dateFilter === "90days") {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }

      // Filter by date range
      const filteredGifts = giftHistory.filter(
        (gift) => new Date(gift.createdAt) >= startDate
      );
      const filteredTips = tipHistory.filter(
        (tip) => new Date(tip.createdAt) >= startDate
      );

      // Calculate gift statistics
      const giftsByName: Record<string, any> = {};
      let totalGiftsCost = 0;
      const giftRecipients = new Set<string>();

      filteredGifts.forEach((gift) => {
        totalGiftsCost += gift.totalAmount;
        giftRecipients.add(gift.recipientId);

        if (!giftsByName[gift.giftId]) {
          giftsByName[gift.giftId] = {
            name: gift.giftName,
            emoji: gift.giftEmoji,
            count: 0,
          };
        }
        giftsByName[gift.giftId].count += gift.quantity || 1;
      });

      // Find most sent gift
      let mostSentGift = null;
      let maxCount = 0;
      for (const [_, gift] of Object.entries(giftsByName)) {
        if (gift.count > maxCount) {
          maxCount = gift.count;
          mostSentGift = gift;
        }
      }

      // Calculate tip statistics
      let totalTipsSent = 0;
      const tipRecipients = new Set<string>();

      filteredTips.forEach((tip) => {
        totalTipsSent += tip.amount;
        tipRecipients.add(tip.recipientId);
      });

      // Sort based on selection
      let sortedGifts = [...filteredGifts];
      let sortedTips = [...filteredTips];

      if (sortBy === "amount") {
        sortedGifts.sort((a, b) => b.totalAmount - a.totalAmount);
        sortedTips.sort((a, b) => b.amount - a.amount);
      } else if (sortBy === "recipient") {
        sortedGifts.sort((a, b) =>
          (a.recipientName || "").localeCompare(b.recipientName || "")
        );
        sortedTips.sort((a, b) =>
          (a.recipientName || "").localeCompare(b.recipientName || "")
        );
      }

      // Calculate daily trends
      const dailyTrends: Record<string, { gifts: number; tips: number }> = {};

      filteredGifts.forEach((gift) => {
        const dateKey = new Date(gift.createdAt).toISOString().split("T")[0];
        if (!dailyTrends[dateKey]) {
          dailyTrends[dateKey] = { gifts: 0, tips: 0 };
        }
        dailyTrends[dateKey].gifts += gift.totalAmount;
      });

      filteredTips.forEach((tip) => {
        const dateKey = new Date(tip.createdAt).toISOString().split("T")[0];
        if (!dailyTrends[dateKey]) {
          dailyTrends[dateKey] = { gifts: 0, tips: 0 };
        }
        dailyTrends[dateKey].tips += tip.amount;
      });

      const trendsArray = Object.entries(dailyTrends)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          gifts: data.gifts,
          tips: data.tips,
        }));

      setTrendsData(trendsArray);

      setStats({
        totalGiftsSent: filteredGifts.length,
        totalGiftsCost: totalGiftsCost,
        totalTipsSent: totalTipsSent,
        uniqueGiftRecipients: giftRecipients.size,
        uniqueTipRecipients: tipRecipients.size,
        mostSentGift,
        recentGifts: sortedGifts.slice(0, 10),
        recentTips: sortedTips.slice(0, 10),
      });
    } catch (err) {
      console.error("Error loading gift/tip stats:", err);
      setError("Failed to load gift and tip statistics. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load gift and tip data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user?.id, dateFilter, sortBy]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
    toast({
      title: "✓ Refreshed",
      description: "Gift and tip statistics updated",
    });
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j}>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
            <AlertCircle className="h-6 w-6" />
            <div>
              <p className="font-semibold">{error}</p>
              <Button onClick={handleRefresh} className="mt-2" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currency = summary?.currency_code || "USD";

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gifts Sent */}
        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Gifts Sent</p>
                <p className="text-2xl font-bold">{stats.totalGiftsSent}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  to {stats.uniqueGiftRecipients} people
                </p>
              </div>
              <Gift className="h-8 w-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Gifts Spent */}
        <Card className="border-l-4 border-l-pink-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Gifts Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalGiftsCost, currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">invested</p>
              </div>
              <Heart className="h-8 w-8 text-pink-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Tips Sent */}
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tips Sent</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalTipsSent, currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  to {stats.uniqueTipRecipients} creators
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Most Sent Gift */}
        <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Most Sent</p>
                <p className="text-2xl font-bold">
                  {stats.mostSentGift ? `${stats.mostSentGift.emoji}` : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.mostSentGift
                    ? `${stats.mostSentGift.count}x ${stats.mostSentGift.name}`
                    : "No gifts yet"}
                </p>
              </div>
              <Sparkles className="h-8 w-8 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex gap-2 flex-1 flex-wrap">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="amount">Highest Amount</SelectItem>
                  <SelectItem value="recipient">By Recipient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trends Chart */}
      {trendsData.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Gift & Tip Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-64 bg-gradient-to-b from-muted/20 to-transparent rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid rgba(0,0,0,0.1)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => formatCurrency(value, currency)}
                  />
                  <Line
                    type="monotone"
                    dataKey="gifts"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={{ fill: "#a855f7", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Gifts"
                  />
                  <Line
                    type="monotone"
                    dataKey="tips"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Tips"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 mt-4 justify-center flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm text-muted-foreground">Gifts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">Tips</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Thank You Message Suggestions */}
      <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-pink-200 dark:border-pink-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-pink-900 dark:text-pink-100">
            <Heart className="h-5 w-5 text-pink-600" />
            Thank You Message Ideas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Thanks so much for all your amazing content! 🙏",
              "Your creativity keeps me inspired every day! 💫",
              "Supporting great creators like you! Keep it up! 🚀",
              "Your work means the world to us! ❤️",
              "Thank you for sharing your talent with us! 🎉",
              "You're an amazing creator! Keep shining! ⭐",
            ].map((message, idx) => (
              <button
                key={idx}
                onClick={() => {
                  navigator.clipboard.writeText(message);
                  toast({
                    title: "Copied!",
                    description: "Message copied to clipboard",
                  });
                }}
                className="p-3 bg-white dark:bg-gray-900 border border-pink-200 dark:border-pink-700 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors text-left text-sm text-gray-700 dark:text-gray-300 hover:text-pink-700 dark:hover:text-pink-300 cursor-pointer"
              >
                {message}
              </button>
            ))}
          </div>
          <p className="text-xs text-pink-700 dark:text-pink-300 mt-4">
            💡 Click any message to copy it and include in your gift message
          </p>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Gifts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-500" />
              Recent Gifts Sent ({stats.recentGifts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentGifts.length > 0 ? (
              <div className="space-y-3">
                {stats.recentGifts.map((gift) => (
                  <div
                    key={gift.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{gift.giftEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {gift.giftName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(gift.createdAt).toLocaleDateString()} at{" "}
                          {new Date(gift.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-semibold text-sm">
                        {formatCurrency(gift.amount, currency)}
                      </p>
                      {gift.quantity > 1 && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          ×{gift.quantity}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Gift className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No gifts sent in this period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Recent Tips Sent ({stats.recentTips.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentTips.length > 0 ? (
              <div className="space-y-3">
                {stats.recentTips.map((tip) => (
                  <div
                    key={tip.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">💵 Tip</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tip.createdAt).toLocaleDateString()} at{" "}
                        {new Date(tip.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <p className="font-semibold text-sm text-green-600 dark:text-green-400">
                      +{formatCurrency(tip.amount, currency)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">
                <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No tips sent in this period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      {stats.totalGiftsSent > 0 || stats.totalTipsSent > 0 ? (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Spent on Gifts & Tips</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(
                    stats.totalGiftsCost + stats.totalTipsSent,
                    currency
                  )}
                </p>
              </div>
              <div className="text-center border-l border-r border-gray-200 dark:border-gray-700">
                <p className="text-sm text-muted-foreground mb-1">Total People Supported</p>
                <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                  {stats.uniqueGiftRecipients + stats.uniqueTipRecipients}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Community Impact</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.totalGiftsSent + Math.ceil(stats.totalTipsSent / 5)}
                </p>
                <p className="text-xs text-muted-foreground">interactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Anonymous Gifting Feature */}
      <Card className="border-dashed border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Lock className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Anonymous Gifting</h3>
                <p className="text-sm text-muted-foreground">
                  Send gifts without revealing your identity. Perfect for supporting creators anonymously!
                </p>
              </div>
            </div>
            <Button
              variant={anonymousMode ? "default" : "outline"}
              onClick={() => setAnonymousMode(!anonymousMode)}
              className={`whitespace-nowrap transition-all ${
                anonymousMode
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : ""
              }`}
            >
              {anonymousMode ? "✓ Enabled" : "Enable"}
            </Button>
          </div>
          {anonymousMode && (
            <div className="mt-4 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-sm text-purple-900 dark:text-purple-200">
              💡 Anonymous mode is active. Your next gift will be sent without revealing your identity.
            </div>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold mb-1">Send More Gifts & Tips</h3>
            <p className="text-sm text-muted-foreground">
              Support your favorite creators and spread joy in the community
              {anonymousMode && " (Anonymous mode enabled)"}
            </p>
          </div>
          <Button
            onClick={() => navigate("/app/send-gifts")}
            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 whitespace-nowrap"
          >
            Send Now
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedGiftsTipsAnalytics;
