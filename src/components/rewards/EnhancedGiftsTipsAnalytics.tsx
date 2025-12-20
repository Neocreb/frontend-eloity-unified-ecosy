import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRewardsSummary } from "@/hooks/useRewardsSummary";
import { useGiftTransactionSync } from "@/hooks/useGiftTransactionSync";
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
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { virtualGiftsService } from "@/services/virtualGiftsService";
import { giftTipNotificationService } from "@/services/giftTipNotificationService";
import { formatCurrency } from "@/utils/formatters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

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

  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [trendsData, setTrendsData] = useState<Array<{ date: string; gifts: number; tips: number }>>([]);
  const [recipientData, setRecipientData] = useState<Array<{ name: string; amount: number; count: number }>>([]);
  const [categoryData, setCategoryData] = useState<Array<{ name: string; value: number }>>([]);
  const [anonymousMode, setAnonymousMode] = useState(false);

  // Use the real-time sync hook for gifts and tips
  const {
    giftsSent,
    giftsReceived,
    tipsReceived,
    isLoading,
    error: syncError,
    refresh: refreshSync,
    totalGiftsSent,
    totalGiftsReceived,
    totalTipsSent,
    totalTipsReceived,
  } = useGiftTransactionSync({
    onNewTransaction: (update) => {
      // Handle new transactions in real-time
      toast({
        title: "✨ New Activity",
        description: `${update.type.replace(/_/g, ' ').toUpperCase()}`,
        duration: 3000,
      });
    },
    autoRefresh: true,
    refreshInterval: 5000,
  });

  const loadStats = async () => {
    if (!user?.id) return;
    setError(null);

    try {
      // Use data from the sync hook
      const giftHistory = giftsSent;
      const tipHistory = tipsReceived;

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
        (gift) => new Date(gift.created_at || gift.createdAt) >= startDate
      );
      const filteredTips = tipHistory.filter(
        (tip) => new Date(tip.created_at || tip.createdAt) >= startDate
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

      // Calculate top recipients
      const recipients: Record<string, { name: string; amount: number; count: number }> = {};

      filteredGifts.forEach(g => {
        const id = g.recipientId || "Unknown";
        if (!recipients[id]) recipients[id] = { name: g.recipientName || "Unknown", amount: 0, count: 0 };
        recipients[id].amount += g.totalAmount;
        recipients[id].count += 1;
      });

      filteredTips.forEach(t => {
        const id = t.recipientId || "Unknown";
        if (!recipients[id]) recipients[id] = { name: t.recipientName || "Unknown", amount: 0, count: 0 };
        recipients[id].amount += t.amount;
        recipients[id].count += 1;
      });

      const recipientArray = Object.values(recipients)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      setRecipientData(recipientArray);

      // Calculate category distribution
      const categories: Record<string, number> = {};
      filteredGifts.forEach(g => {
        const cat = g.giftCategory || "Standard";
        categories[cat] = (categories[cat] || 0) + g.totalAmount;
      });
      if (filteredTips.length > 0) {
        categories["Tips"] = filteredTips.reduce((sum, t) => sum + t.amount, 0);
      }

      const categoryArray = Object.entries(categories).map(([name, value]) => ({ name, value }));
      setCategoryData(categoryArray);

      // Convert dailyTrends to array format for chart
      const trendsArray = Object.entries(dailyTrends)
        .map(([date, data]) => ({
          date,
          gifts: data.gifts,
          tips: data.tips,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

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
    }
  };

  useEffect(() => {
    if (!isLoading) {
      loadStats();
    }
  }, [giftsSent, tipsReceived, dateFilter, sortBy]);

  useEffect(() => {
    if (syncError) {
      setError(syncError);
    }
  }, [syncError]);

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gifts Sent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-purple-500 hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-bl-full transform translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform duration-500" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Gifts Sent</p>
                  <p className="text-3xl font-black">{stats.totalGiftsSent}</p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase">
                    to {stats.uniqueGiftRecipients} people
                  </p>
                </div>
                <Gift className="h-8 w-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Gifts Spent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-l-4 border-l-pink-500 hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-pink-100 dark:bg-pink-900/20 rounded-bl-full transform translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform duration-500" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Value</p>
                  <p className="text-3xl font-black text-pink-600">
                    {formatCurrency(stats.totalGiftsCost, currency)}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-tight">Invested in community</p>
                </div>
                <Heart className="h-8 w-8 text-pink-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tips Sent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-l-4 border-l-green-500 hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-bl-full transform translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform duration-500" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Tips Shared</p>
                  <p className="text-3xl font-black text-green-600">
                    {formatCurrency(stats.totalTipsSent, currency)}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-tight">to {stats.uniqueTipRecipients} creators</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Most Sent Gift */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-l-4 border-l-yellow-500 hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-bl-full transform translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform duration-500" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Top Pick</p>
                  <p className="text-3xl font-black">
                    {stats.mostSentGift ? `${stats.mostSentGift.emoji}` : "N/A"}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-tight truncate">
                    {stats.mostSentGift
                      ? `${stats.mostSentGift.count}x ${stats.mostSentGift.name}`
                      : "No gifts yet"}
                  </p>
                </div>
                <Sparkles className="h-8 w-8 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Chart */}
        <Card className="shadow-sm border-0 bg-white dark:bg-gray-900 overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-900/50">
            <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              SUPPORT TRENDS
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="w-full h-64 bg-gradient-to-b from-blue-50/20 to-transparent rounded-lg">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}
                    formatter={(value: number) => formatCurrency(value, currency)}
                  />
                  <Line
                    type="monotone"
                    dataKey="gifts"
                    stroke="#a855f7"
                    strokeWidth={3}
                    dot={{ fill: "#a855f7", r: 4, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Gifts"
                  />
                  <Line
                    type="monotone"
                    dataKey="tips"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", r: 4, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Tips"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Recipients Chart - NEW */}
        <Card className="shadow-sm border-0 bg-white dark:bg-gray-900 overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-900/50">
            <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              TOP RECIPIENTS
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="w-full h-64">
              {recipientData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recipientData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} width={80} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={24}>
                      {recipientData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'][index % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                  <Users className="h-12 w-12 mb-2" />
                  <p className="text-xs font-black">NO RECIPIENT DATA YET</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories & Distribution Section - NEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-sm border-0 bg-white dark:bg-gray-900">
          <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-900/50">
            <CardTitle className="text-sm font-black tracking-widest flex items-center gap-2">
              <Filter className="h-4 w-4" />
              DISTRIBUTION
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-48 w-full">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[10px] font-black text-muted-foreground uppercase">No Data</div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {categoryData.map((item, idx) => (
                <div key={item.name} className="flex justify-between items-center text-[10px] font-bold">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'][idx % 4] }} />
                    <span className="uppercase text-muted-foreground">{item.name}</span>
                  </div>
                  <span>{formatCurrency(item.value, currency)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Thank You Messages Card - Polished */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-0 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 dark:bg-black/10 rounded-full blur-2xl -mr-16 -mt-16" />
          <CardHeader>
            <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
              <Heart className="h-5 w-5 text-pink-600" />
              EXPRESS YOUR GRATITUDE
            </CardTitle>
            <p className="text-[10px] font-bold uppercase text-indigo-700/60 dark:text-indigo-300/60 tracking-widest">Copy a message to send with your support</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Thanks so much for all your amazing content! 🙏",
                "Your creativity keeps me inspired every day! 💫",
                "Supporting great creators like you! Keep it up! 🚀",
                "Your work means the world to us! ❤️",
                "Thank you for sharing your talent with us! 🎉",
                "You're an amazing creator! Keep shining! ⭐",
              ].map((message, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    navigator.clipboard.writeText(message);
                    toast({
                      title: "✓ COPIED!",
                      description: "Message ready to paste",
                    });
                  }}
                  className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-indigo-100 dark:border-indigo-900/50 rounded-xl hover:bg-white dark:hover:bg-gray-900 transition-all text-left text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-300 shadow-sm"
                >
                  {message}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Filter Section */}
      <Card className="border-0 shadow-sm bg-gray-50 dark:bg-gray-900/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40 h-11 font-bold bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bold">All Time</SelectItem>
                  <SelectItem value="7days" className="font-bold">Last 7 Days</SelectItem>
                  <SelectItem value="30days" className="font-bold">Last 30 Days</SelectItem>
                  <SelectItem value="90days" className="font-bold">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 h-11 font-bold bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent" className="font-bold">Most Recent</SelectItem>
                  <SelectItem value="amount" className="font-bold">Highest Amount</SelectItem>
                  <SelectItem value="recipient" className="font-bold">By Recipient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-11 px-6 font-black uppercase tracking-widest bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Anonymous Gifting - Polished */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="border-2 border-dashed border-purple-300 dark:border-purple-800 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/10 dark:to-pink-950/10 overflow-hidden relative">
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4 text-center sm:text-left">
                <div className="p-4 bg-white dark:bg-gray-900 rounded-full shadow-lg border border-purple-100 dark:border-purple-900 shrink-0">
                  <Lock className={`h-6 w-6 ${anonymousMode ? 'text-purple-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight mb-1">ANONYMOUS MODE</h3>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
                    Hide your identity when sending support. Your name will be hidden from the recipient.
                  </p>
                </div>
              </div>
              <Button
                variant={anonymousMode ? "default" : "outline"}
                onClick={() => setAnonymousMode(!anonymousMode)}
                className={`h-12 px-8 font-black uppercase tracking-widest transition-all shadow-xl ${
                  anonymousMode
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-white dark:bg-gray-900"
                }`}
              >
                {anonymousMode ? "✓ ACTIVE" : "ENABLE"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Gifts */}
        <Card className="shadow-sm border-0 bg-white dark:bg-gray-900 overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-900/50">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Gift className="h-4 w-4 text-purple-500" />
              RECENT GIFTS ({stats.recentGifts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <AnimatePresence mode="popLayout">
              {stats.recentGifts.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentGifts.map((gift, idx) => (
                    <motion.div
                      key={gift.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-3xl group-hover:scale-125 transition-transform">{gift.giftEmoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm uppercase tracking-tight truncate">
                            {gift.giftName}
                          </p>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                            {new Date(gift.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <p className="font-black text-lg text-purple-600">
                          {formatCurrency(gift.amount, currency)}
                        </p>
                        {gift.quantity > 1 && (
                          <Badge className="bg-purple-100 text-purple-700 font-black text-[10px] uppercase mt-1">
                            ×{gift.quantity}
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Gift className="h-12 w-12 mx-auto mb-2 opacity-10" />
                  <p className="text-[10px] font-black text-muted-foreground tracking-widest uppercase">No history detected</p>
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Recent Tips */}
        <Card className="shadow-sm border-0 bg-white dark:bg-gray-900 overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-900/50">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              RECENT TIPS ({stats.recentTips.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <AnimatePresence mode="popLayout">
              {stats.recentTips.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentTips.map((tip, idx) => (
                    <motion.div
                      key={tip.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-black text-sm uppercase tracking-tight">💵 TIP TRANSFER</p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                          {new Date(tip.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-black text-lg text-green-600">
                        +{formatCurrency(tip.amount, currency)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-10" />
                  <p className="text-[10px] font-black text-muted-foreground tracking-widest uppercase">No history detected</p>
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      {/* CTA - Final Polish */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
        <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="text-center sm:text-left">
            <h3 className="text-2xl font-black tracking-tight mb-1">BOOST A CREATOR TODAY</h3>
            <p className="text-white/70 font-bold uppercase text-[10px] tracking-widest">
              Join thousands of supporters making an impact in the ecosystem
            </p>
          </div>
          <Button
            onClick={() => navigate("/app/send-gifts")}
            className="h-14 px-10 gap-2 bg-white text-indigo-600 hover:bg-white/90 font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            SUPPORT NOW
            <ArrowRight className="h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EnhancedGiftsTipsAnalytics;
