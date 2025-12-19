import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  TrendingUp,
  Eye,
  Gift,
  Users,
  Zap,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Trophy,
  Flame,
  Target,
  Sparkles,
  Award,
  ChevronRight,
  BarChart3,
  Clock,
  Rocket,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import { useRewardsSummary } from "@/hooks/useRewardsSummary";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useLevelProgression } from "@/hooks/useLevelProgression";
import { activityTransactionService } from "@/services/activityTransactionService";
import { LineChart, Line, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

interface EnhancedEarningsOverviewProps {
  user: any;
  setActiveTab: (tab: string) => void;
}

const EnhancedEarningsOverview = ({ user, setActiveTab }: EnhancedEarningsOverviewProps) => {
  const { toast } = useToast();
  const { summary, isLoading, error, refresh } = useRewardsSummary();
  const { activities } = useActivityFeed(100);
  const { levelData, getAllLevels } = useLevelProgression();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [earningsByCategory, setEarningsByCategory] = useState<Record<string, number>>({});
  const [sparklineData, setSparklineData] = useState<Array<{ day: string; earnings: number }>>([]);
  const [monthComparisonData, setMonthComparisonData] = useState<{ current: number; previous: number; percentChange: number }>({ current: 0, previous: 0, percentChange: 0 });
  const [achievements, setAchievements] = useState<Array<{ id: string; title: string; icon: string; unlockedAt?: string; progress: number }>>([]);

  // Calculate earnings by category, sparkline data, month comparison, and achievements
  useEffect(() => {
    if (activities.length > 0) {
      const breakdown: Record<string, number> = {};
      const dailyEarnings: Record<string, number> = {};
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      let currentMonthEarnings = 0;
      let previousMonthEarnings = 0;

      activities.forEach((activity) => {
        if (!breakdown[activity.category]) {
          breakdown[activity.category] = 0;
        }
        if (activity.amount_currency) {
          breakdown[activity.category] += activity.amount_currency;
        }

        // Calculate daily earnings for sparkline
        const actDate = new Date(activity.created_at);
        const dayKey = actDate.toISOString().split("T")[0];
        if (!dailyEarnings[dayKey]) {
          dailyEarnings[dayKey] = 0;
        }
        dailyEarnings[dayKey] += activity.amount_currency || 0;

        // Track current and previous month earnings
        if (actDate.getMonth() === currentMonth && actDate.getFullYear() === currentYear) {
          currentMonthEarnings += activity.amount_currency || 0;
        } else if (actDate.getMonth() === previousMonth && actDate.getFullYear() === previousYear) {
          previousMonthEarnings += activity.amount_currency || 0;
        }
      });

      setEarningsByCategory(breakdown);

      // Create sparkline data (last 30 days)
      const sparklineArray: Array<{ day: string; earnings: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayKey = date.toISOString().split("T")[0];
        const shortDay = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        sparklineArray.push({
          day: shortDay,
          earnings: dailyEarnings[dayKey] || 0,
        });
      }
      setSparklineData(sparklineArray);

      // Calculate month comparison
      const percentChange = previousMonthEarnings > 0
        ? ((currentMonthEarnings - previousMonthEarnings) / previousMonthEarnings) * 100
        : currentMonthEarnings > 0 ? 100 : 0;

      setMonthComparisonData({
        current: currentMonthEarnings,
        previous: previousMonthEarnings,
        percentChange,
      });

      // Calculate achievements based on summary
      const newAchievements: typeof achievements = [];

      if (summary) {
        if (summary.total_activities >= 10) {
          newAchievements.push({
            id: "first-10",
            title: "Getting Started",
            icon: "🚀",
            progress: Math.min((summary.total_activities / 10) * 100, 100),
          });
        }
        if (summary.total_activities >= 50) {
          newAchievements.push({
            id: "milestone-50",
            title: "Milestone Master",
            icon: "⭐",
            progress: Math.min((summary.total_activities / 50) * 100, 100),
          });
        }
        if (summary.current_streak >= 7) {
          newAchievements.push({
            id: "streak-7",
            title: "On Fire",
            icon: "🔥",
            progress: Math.min((summary.current_streak / 7) * 100, 100),
          });
        }
        if (summary.trust_score >= 75) {
          newAchievements.push({
            id: "trusted",
            title: "Trusted Member",
            icon: "✅",
            progress: summary.trust_score,
          });
        }
        if (summary.level >= 5) {
          newAchievements.push({
            id: "high-level",
            title: "Elite Performer",
            icon: "👑",
            progress: Math.min((summary.level / 6) * 100, 100),
          });
        }
      }

      setAchievements(newAchievements);
    }
  }, [activities, summary]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refresh();
      toast({
        title: "✓ Refreshed",
        description: "Your rewards data has been updated",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to refresh rewards data",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Breakdown skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Failed to load rewards data</div>
        <Button onClick={handleRefresh}>Try Again</Button>
      </div>
    );
  }

  // Get level info
  const levelInfo = {
    1: { title: "Starter", color: "#6B7280" },
    2: { title: "Bronze", color: "#92400E" },
    3: { title: "Silver", color: "#C0C7D0" },
    4: { title: "Gold", color: "#D97706" },
    5: { title: "Platinum", color: "#3B82F6" },
    6: { title: "Diamond", color: "#8B5CF6" },
  };

  const currentLevelInfo = levelInfo[summary.level as keyof typeof levelInfo] || levelInfo[1];

  // Calculate level progress percentage
  const currentLevelThreshold = [0, 100, 500, 1500, 3000, 6000][summary.level] || 0;
  const nextLevelThreshold = summary.next_level_threshold || (summary.level + 1) * 1000;
  const levelProgress =
    summary.total_earned >= nextLevelThreshold
      ? 100
      : ((summary.total_earned - currentLevelThreshold) /
          (nextLevelThreshold - currentLevelThreshold)) *
        100;

  const earningsCards = [
    {
      title: "Total Earned",
      value: summary.total_earned,
      format: "currency" as const,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "+15.8%",
      changeType: "positive" as const,
    },
    {
      title: "Available Balance",
      value: summary.available_balance,
      format: "currency" as const,
      icon: ArrowUpRight,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: `+${summary.activities_this_month} activities`,
      changeType: "positive" as const,
    },
    {
      title: "This Month",
      value: activities
        .filter((a) => {
          const actDate = new Date(a.created_at);
          const now = new Date();
          return (
            actDate.getMonth() === now.getMonth() &&
            actDate.getFullYear() === now.getFullYear()
          );
        })
        .reduce((sum, a) => sum + (a.amount_currency || 0), 0),
      format: "currency" as const,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: `${summary.activities_this_month} activities`,
      changeType: "positive" as const,
    },
    {
      title: "Current Streak",
      value: summary.current_streak,
      format: "number" as const,
      icon: Flame,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      change: `${summary.longest_streak} max`,
      changeType: "positive" as const,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
      role="main"
      aria-label="Earnings Overview Dashboard - Track your rewards and progress"
    >
      {/* Earnings Cards with Sparkline Trend */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        role="region"
        aria-label="Earnings Summary Cards"
      >
        {earningsCards.map((card, idx) => {
          const Icon = card.icon;
          const cardValue = card.format === "currency"
            ? formatCurrency(card.value, summary.currency_code)
            : formatNumber(card.value);
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card
                className="hover:shadow-lg transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-500 overflow-hidden group h-full"
                role="article"
                aria-label={`${card.title}: ${cardValue}. ${card.change}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                      <p
                        className="text-2xl font-bold mt-2"
                        aria-label={`${card.title}: ${cardValue}`}
                      >
                        {cardValue}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        {card.changeType === "positive" ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                        )}
                        <p className={`text-xs font-medium ${
                          card.changeType === "positive" ? "text-green-600" : "text-red-600"
                        }`}>
                          {card.change}
                        </p>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${card.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>

                  {/* Sparkline for total earned card */}
                  {card.title === "Total Earned" && sparklineData.length > 0 && (
                    <div className="mt-4 -mx-2 -mb-2 h-12 bg-gradient-to-t from-green-50 to-transparent dark:from-green-900/20 dark:to-transparent rounded-b-lg">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData}>
                          <defs>
                            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Tooltip
                            contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", border: "none", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                            cursor={{ stroke: "rgba(168, 85, 247, 0.1)" }}
                          />
                          <Area
                            type="monotone"
                            dataKey="earnings"
                            stroke="#16a34a"
                            fillOpacity={1}
                            fill="url(#colorEarnings)"
                            strokeWidth={2}
                            isAnimationActive={true}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Level Upgrade Path - NEW */}
      {levelData && !levelData.isMaxLevel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden relative border-0 shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl" />
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md shrink-0">
                      <Rocket className="h-6 w-6 text-yellow-300" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Your Path to Level {levelData.nextLevel}</h2>
                      <p className="text-white/80">Keep going! You're making great progress towards your next milestone.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-200" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Estimated Time</span>
                      </div>
                      <p className="text-2xl font-black">{levelData.estimatedDaysToNextLevel === 999 ? "---" : `${levelData.estimatedDaysToNextLevel} Days`}</p>
                      <p className="text-[10px] text-white/60 font-medium">To reach level {levelData.nextLevel}</p>
                    </div>

                    <div className="p-4 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <Star className="h-4 w-4 text-yellow-300" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Next Reward</span>
                      </div>
                      <p className="text-lg font-black truncate">
                        {getAllLevels().find(l => l.level === levelData.nextLevel)?.benefits[0] || "New Perks"}
                      </p>
                      <p className="text-[10px] text-white/60 font-medium">Unlocked automatically</p>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col items-center shrink-0">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="white"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={364.4}
                        initial={{ strokeDashoffset: 364.4 }}
                        animate={{ strokeDashoffset: 364.4 - (364.4 * levelData.progressPercentage) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black">{levelData.progressPercentage}%</span>
                      <span className="text-[10px] uppercase font-bold text-white/70">Progress</span>
                    </div>
                  </div>
                  <Button
                    className="mt-6 bg-white text-indigo-600 hover:bg-white/90 font-black px-8 shadow-xl active:scale-95 transition-transform"
                    onClick={() => setActiveTab("earn")}
                  >
                    Earn Points Now
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Month Comparison Card */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-100 dark:border-blue-900 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Month-over-Month Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
              <div className="p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-white/20 dark:border-white/5 shadow-sm">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">This Month</p>
                <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
                  {formatCurrency(monthComparisonData.current, summary.currency_code)}
                </p>
              </div>
              <div className="p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-white/20 dark:border-white/5 shadow-sm">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Previous Month</p>
                <p className="text-3xl font-black text-gray-600 dark:text-gray-400">
                  {formatCurrency(monthComparisonData.previous, summary.currency_code)}
                </p>
              </div>
              <div className="p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-white/20 dark:border-white/5 shadow-sm flex flex-col justify-center items-center md:items-start">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Growth</p>
                <div className="flex items-center gap-2">
                  {monthComparisonData.percentChange > 0 ? (
                    <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                      <ArrowUpRight className="h-5 w-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="bg-red-100 dark:bg-red-900/30 p-1 rounded-full">
                      <ArrowDownRight className="h-5 w-5 text-red-600" />
                    </div>
                  )}
                  <p className={`text-3xl font-black ${
                    monthComparisonData.percentChange > 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {Math.abs(monthComparisonData.percentChange).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievements Section */}
      {achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-0 shadow-sm overflow-hidden group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Your Achievements
                </CardTitle>
                <Badge variant="outline" className="bg-white/50 dark:bg-black/20 text-purple-700 dark:text-purple-300 font-bold border-purple-200">
                  {achievements.filter(a => a.progress >= 100).length} Unlocked
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 group/item ${
                      achievement.progress >= 100
                        ? "border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-900 shadow-md"
                        : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 grayscale opacity-60"
                    } hover:scale-105`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2 transform group-hover/item:scale-125 transition-transform duration-300">{achievement.icon}</div>
                      <p className="font-bold text-xs text-gray-900 dark:text-gray-100 mb-2 truncate">
                        {achievement.title}
                      </p>
                      <Progress value={achievement.progress} className="h-1.5" />
                      <p className="text-[10px] font-bold text-muted-foreground mt-2">
                        {achievement.progress >= 100 ? "UNLOCKED" : `${Math.round(achievement.progress)}%`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Level and Trust Score Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Level Progress */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-100 dark:border-purple-900 h-full shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Level & Progress
                </CardTitle>
                <Badge
                  className="text-white px-3 py-1 text-xs font-black shadow-md uppercase tracking-wider"
                  style={{ backgroundColor: currentLevelInfo.color }}
                >
                  Level {summary.level} - {currentLevelInfo.title}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-black text-gray-700 dark:text-gray-300">Next Milestone</span>
                  <span className="text-sm font-black text-purple-600">
                    {Math.round(levelProgress)}%
                  </span>
                </div>
                <Progress value={levelProgress} className="h-3 rounded-full shadow-inner" />
                <div className="flex justify-between items-center mt-3">
                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">
                    {formatCurrency(summary.total_earned, summary.currency_code)} Earned
                  </p>
                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">
                    Level {summary.level + 1} at {formatCurrency(nextLevelThreshold, summary.currency_code)}
                  </p>
                </div>
              </div>

              {/* Level Benefits */}
              <div className="p-4 bg-white/60 dark:bg-black/30 rounded-xl border border-white/20 dark:border-white/5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-purple-500" />
                  Current Tier Perks
                </p>
                <ul className="grid grid-cols-1 gap-2">
                  <li className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                    {(1 + summary.level * 0.1).toFixed(1)}x earning multiplier
                  </li>
                  <li className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                    {Math.min(50 + summary.level * 10, 100)} point withdrawal limit
                  </li>
                  <li className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                    Priority support & Verification
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trust Score */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-100 dark:border-blue-900 h-full shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Trust Score & Withdrawal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-black text-gray-700 dark:text-gray-300">Trust Score</span>
                  <Badge className="bg-blue-600 text-white font-black">{summary.trust_score}%</Badge>
                </div>
                <Progress value={summary.trust_score} className="h-3 rounded-full bg-blue-100 dark:bg-blue-900 shadow-inner" />
                <p className="text-[10px] font-bold text-muted-foreground mt-3 leading-relaxed uppercase tracking-wide">
                  Maintain high trust to unlock faster payouts.
                </p>
              </div>

              {/* Withdrawal Info */}
              <div className="p-4 bg-white/60 dark:bg-black/30 rounded-xl border border-white/20 dark:border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Available Funds</p>
                    <p className="font-black text-2xl text-green-600 dark:text-green-400">
                      {formatCurrency(summary.available_balance, summary.currency_code)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <Button
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md transition-all active:scale-95"
                  onClick={() => setActiveTab("withdraw")}
                >
                  Withdraw Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Earnings Breakdown by Category */}
      {Object.keys(earningsByCategory).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="shadow-sm border-gray-100 dark:border-gray-800 overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                  Earnings Breakdown
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 font-bold"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Sync
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {Object.entries(earningsByCategory).map(([category, amount], idx) => {
                const percentage =
                  summary.total_earned > 0 ? (amount / summary.total_earned) * 100 : 0;
                const categoryColors: Record<string, string> = {
                  Content: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
                  Engagement: "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]",
                  Challenges: "bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]",
                  Battles: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
                  Gifts: "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]",
                  Referrals: "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]",
                  Marketplace: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
                  Freelance: "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]",
                  Crypto: "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]",
                };

                return (
                  <motion.div
                    key={category}
                    className="space-y-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + idx * 0.05 }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${categoryColors[category]?.split(' ')[0]}`} />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-muted-foreground">{percentage.toFixed(1)}%</span>
                        <span className="font-black text-sm">
                          {formatCurrency(amount, summary.currency_code)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.2, delay: 1 + idx * 0.05, ease: "circOut" }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          categoryColors[category] || "bg-gray-500"
                        }`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Activity Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        <Card className="shadow-sm border-gray-100 dark:border-gray-800 overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-900/50">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Activity Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/30 dark:bg-muted/10 border border-muted-foreground/10 rounded-xl text-center group hover:bg-white dark:hover:bg-gray-900 transition-all duration-300 shadow-sm">
                <p className="text-3xl font-black text-gray-900 dark:text-white group-hover:scale-110 transition-transform">{summary.total_activities}</p>
                <p className="text-[10px] uppercase font-black text-muted-foreground mt-2 tracking-widest">Lifetime Acts</p>
              </div>
              <div className="p-4 bg-muted/30 dark:bg-muted/10 border border-muted-foreground/10 rounded-xl text-center group hover:bg-white dark:hover:bg-gray-900 transition-all duration-300 shadow-sm">
                <p className="text-3xl font-black text-indigo-600 group-hover:scale-110 transition-transform">{summary.activities_this_month}</p>
                <p className="text-[10px] uppercase font-black text-muted-foreground mt-2 tracking-widest">Active Month</p>
              </div>
              <div className="p-4 bg-muted/30 dark:bg-muted/10 border border-muted-foreground/10 rounded-xl text-center group hover:bg-white dark:hover:bg-gray-900 transition-all duration-300 shadow-sm">
                <p className="text-3xl font-black text-green-600 group-hover:scale-110 transition-transform">
                  {formatCurrency(summary.total_withdrawn, summary.currency_code).split('.')[0]}
                </p>
                <p className="text-[10px] uppercase font-black text-muted-foreground mt-2 tracking-widest">Withdrawn</p>
              </div>
              <div className="p-4 bg-muted/30 dark:bg-muted/10 border border-muted-foreground/10 rounded-xl text-center group hover:bg-white dark:hover:bg-gray-900 transition-all duration-300 shadow-sm">
                <p className="text-xl font-black text-orange-600 group-hover:scale-110 transition-transform leading-[2.25rem]">
                  {summary.last_activity_at
                    ? new Date(summary.last_activity_at).toLocaleDateString()
                    : "Never"}
                </p>
                <p className="text-[10px] uppercase font-black text-muted-foreground mt-2 tracking-widest">Last Activity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

// Helper component for icon (since it might not be available)
function BarChart3Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 3v18h18" />
      <path d="M7 9v8" />
      <path d="M12 5v12" />
      <path d="M17 7v10" />
    </svg>
  );
}

export default EnhancedEarningsOverview;
