import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useRewardsSummary } from "@/hooks/useRewardsSummary";
import {
  Users,
  Copy,
  Share2,
  DollarSign,
  TrendingUp,
  Star,
  ExternalLink,
  Heart,
  Info,
  Gift,
  Zap,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Clock,
  Calendar,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import { useReferralStats } from "@/hooks/useReferralStats";
import { referralTrackingService } from "@/services/referralTrackingService";

const EnhancedSafeReferralComponent = () => {
  const { toast } = useToast();
  const { summary } = useRewardsSummary();
  const { stats, referrals, isLoading, error, refresh, loadMore, hasMore, tierInfo } = useReferralStats();

  const [copiedLink, setCopiedLink] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [referralLink, setReferralLink] = useState("");

  // Referral tier calculations
  const tierCalculations = {
    bronze: { baseReward: 10, revenueShare: 0.05, dailyLimit: 50, monthlyLimit: 500 },
    silver: { baseReward: 25, revenueShare: 0.075, dailyLimit: 100, monthlyLimit: 1500 },
    gold: { baseReward: 50, revenueShare: 0.1, dailyLimit: 200, monthlyLimit: 3000 },
    platinum: { baseReward: 100, revenueShare: 0.15, dailyLimit: 500, monthlyLimit: 10000 },
  };

  // Calculate projections
  const calculateProjections = () => {
    if (!stats || !stats.tier) return null;

    const currentTier = (stats.tier || "bronze").toLowerCase() as keyof typeof tierCalculations;
    const tierCalcs = tierCalculations[currentTier] || tierCalculations.bronze;

    // Calculate potential next tier
    const tierThresholds = { bronze: 5, silver: 25, gold: 100, platinum: 1000 };
    const tierNames = { bronze: "silver", silver: "gold", gold: "platinum", platinum: "platinum" };
    const nextTier = tierNames[currentTier] as keyof typeof tierCalculations;
    const nextTierCalcs = tierCalculations[nextTier];
    const nextTierThreshold = tierThresholds[nextTier];

    // Referrals needed to reach next tier
    const referralsNeeded = Math.max(0, nextTierThreshold - stats.totalReferrals);

    // Daily/monthly earning projections
    const projectedDailyEarnings = tierCalcs.baseReward * Math.min(5, referralsNeeded > 0 ? Math.ceil(referralsNeeded / 5) : stats.activeReferrals);
    const projectedMonthlyEarnings = projectedDailyEarnings * 30;
    const projectedRevenueShare = stats.totalEarnings * tierCalcs.revenueShare;

    return {
      tierCalcs,
      nextTier,
      nextTierCalcs,
      nextTierThreshold,
      referralsNeeded,
      projectedDailyEarnings,
      projectedMonthlyEarnings,
      projectedRevenueShare,
      totalProjectedMonthly: projectedMonthlyEarnings + projectedRevenueShare,
    };
  };

  const projections = calculateProjections();

  // Generate or get referral code
  const generateReferralCode = () => {
    const code = referralTrackingService.generateReferralCode(summary?.user_id || "user");
    setReferralLink(`https://eloity.app/join?ref=${code}`);
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      toast({
        title: "✓ Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const shareReferralLink = (platform: string) => {
    if (!referralLink) {
      toast({
        title: "Generate link first",
        description: "Please generate your referral link first",
        variant: "destructive",
      });
      return;
    }

    const message = "Join Eloity and start earning! Use my referral link:";
    const url = encodeURIComponent(referralLink);
    const text = encodeURIComponent(message);

    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, "_blank");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    toast({
      title: "✓ Refreshed",
      description: "Referral data updated",
    });
    setIsRefreshing(false);
  };

  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <Skeleton className="h-32 w-full rounded-xl" />

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
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
              <p className="font-semibold">{error.message}</p>
              <Button onClick={handleRefresh} className="mt-2" size="sm">
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currency = summary?.currency_code || "USD";

  // Get tier colors
  const tierColors = {
    bronze: "from-orange-500 to-yellow-500",
    silver: "from-gray-400 to-gray-500",
    gold: "from-yellow-400 to-orange-500",
    platinum: "from-blue-500 to-purple-500",
  };

  const tierColor = tierColors[stats?.tier as keyof typeof tierColors] || tierColors.bronze;

  return (
    <div
      className="space-y-8"
      role="main"
      aria-label="Referral Program Dashboard - Manage and track your referrals"
    >
      {/* Header Section - Premium Design */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${tierColor} p-8 text-white shadow-lg`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Gift className="w-6 h-6" />
                <span className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                  Referral Program
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Grow Your Network</h1>
              <p className="text-white/90 text-lg">
                Earn rewards by inviting friends to join Eloity and unlock exclusive benefits
              </p>
            </div>
            {stats && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Zap className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-semibold capitalize">{stats.tier} Tier</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Overview */}
      {stats && (
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          role="region"
          aria-label="Quick Statistics Overview"
        >
          <div
            className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
            role="article"
            aria-label={`Total Referrals: ${stats.totalReferrals}. ${stats.activeReferrals} active with ${stats.conversionRate.toFixed(1)}% conversion rate`}
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="w-5 h-5 opacity-80" aria-hidden="true" />
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">
                Active
              </span>
            </div>
            <p className="text-sm opacity-90 mb-1">Total Referrals</p>
            <p className="text-3xl font-bold" aria-label={`${stats.totalReferrals || 0} total referrals`}>{stats.totalReferrals || 0}</p>
            <p className="text-xs opacity-75 mt-2">
              {stats.activeReferrals || 0} active • {(stats.conversionRate || 0).toFixed(1)}% conversion
            </p>
          </div>

          <div
            className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
            role="article"
            aria-label={`Total Earnings: ${formatCurrency(stats.totalEarnings, currency)}. ${formatCurrency(stats.earningsThisMonth, currency)} this month`}
          >
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-5 h-5 opacity-80" aria-hidden="true" />
              <TrendingUp className="w-4 h-4 opacity-80" aria-hidden="true" />
            </div>
            <p className="text-sm opacity-90 mb-1">Total Earnings</p>
            <p className="text-3xl font-bold" aria-label={`Total earnings: ${formatCurrency(stats.totalEarnings || 0, currency)}`}>
              {formatCurrency(stats.totalEarnings || 0, currency)}
            </p>
            <p className="text-xs opacity-75 mt-2">
              {formatCurrency(stats.earningsThisMonth || 0, currency)} this month
            </p>
          </div>

          <div
            className="rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
            role="article"
            aria-label={`Auto Shared: ${formatCurrency(stats.totalAutoShared, currency)}. 0.5% of your earnings automatically shared`}
          >
            <div className="flex items-center justify-between mb-4">
              <Heart className="w-5 h-5 opacity-80" aria-hidden="true" />
              <CheckCircle2 className="w-4 h-4 opacity-80" aria-hidden="true" />
            </div>
            <p className="text-sm opacity-90 mb-1">Auto Shared</p>
            <p className="text-3xl font-bold" aria-label={`Auto shared: ${formatCurrency(stats.totalAutoShared || 0, currency)}`}>
              {formatCurrency(stats.totalAutoShared || 0, currency)}
            </p>
            <p className="text-xs opacity-75 mt-2">0.5% of earnings shared</p>
          </div>
        </div>
      )}

      {/* Detailed Earning Calculations - NEW */}
      {stats && projections && (
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <DollarSign className="h-6 w-6 text-green-600" />
              Earnings Calculations & Projections
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Detailed breakdown of your referral earnings potential</p>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Current Earnings Breakdown */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">
                Current Month Earnings Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Direct Referral Bonus</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(
                      stats.activeReferrals * projections.tierCalcs.baseReward,
                      currency
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.activeReferrals} active referrals × {formatCurrency(projections.tierCalcs.baseReward, currency)}
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-xl border border-green-200 dark:border-green-800">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Revenue Share</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(
                      (stats?.earningsThisMonth || 0) * (projections?.tierCalcs?.revenueShare || 0.05),
                      currency
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {((projections?.tierCalcs?.revenueShare || 0.05) * 100).toFixed(1)}% of your earnings
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Total This Month</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(stats.earningsThisMonth, currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    All referral sources combined
                  </p>
                </div>
              </div>
            </div>

            {/* Projected Earnings */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">
                Projected Monthly Earnings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border-2 border-cyan-200 dark:border-cyan-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Conservative Estimate</p>
                      <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                        {formatCurrency(projections.projectedMonthlyEarnings, currency)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-cyan-400" />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <p>📊 Based on current {stats.activeReferrals} active referrals</p>
                    <p>💰 {formatCurrency(projections.tierCalcs.baseReward, currency)} per referral/month</p>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">With Revenue Share</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(projections.totalProjectedMonthly, currency)}
                      </p>
                    </div>
                    <Zap className="h-8 w-8 text-green-400" />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <p>🚀 Includes {((projections?.tierCalcs?.revenueShare || 0.05) * 100).toFixed(1)}% revenue share</p>
                    <p>📈 If you maintain current activity level</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Earnings Limits */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">
                {stats?.tier ? (stats.tier.charAt(0).toUpperCase() + stats.tier.slice(1)) : "Tier"} Limits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Daily Limit</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Max per day</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {formatCurrency(projections.tierCalcs.dailyLimit, currency)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min((((stats.earningsThisMonth || 0) / 30 / projections.tierCalcs.dailyLimit) * 100), 100)}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {(((stats.earningsThisMonth || 0) / 30 / projections.tierCalcs.dailyLimit) * 100).toFixed(0)}% of daily limit used
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Monthly Limit</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Max per month</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(projections.tierCalcs.monthlyLimit, currency)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min((((stats.earningsThisMonth || 0) / projections.tierCalcs.monthlyLimit) * 100), 100)}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {(((stats.earningsThisMonth || 0) / projections.tierCalcs.monthlyLimit) * 100).toFixed(0)}% of monthly limit used
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Tier Information */}
            <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-l-4 border-purple-600">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Path to {projections.nextTier.charAt(0).toUpperCase() + projections.nextTier.slice(1)} Tier
                </h3>
                <Badge className="bg-purple-600 text-white capitalize">
                  {projections.referralsNeeded} referrals needed
                </Badge>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      {stats.totalReferrals}/{projections.nextTierThreshold}
                    </span>
                  </div>
                  <Progress
                    value={(stats.totalReferrals / projections.nextTierThreshold) * 100}
                    className="h-3"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reward Increase</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      +{formatCurrency(
                        projections.nextTierCalcs.baseReward - projections.tierCalcs.baseReward,
                        currency
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">per referral</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Revenue Share Boost</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      +{(
                        (projections.nextTierCalcs.revenueShare - projections.tierCalcs.revenueShare) *
                        100
                      ).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">additional share</p>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Estimated new monthly earnings:
                  </p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(
                      (projections.nextTierThreshold * projections.nextTierCalcs.baseReward) +
                        (stats.totalEarnings * projections.nextTierCalcs.revenueShare),
                      currency
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Auto-Share Breakdown */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Gift className="h-5 w-5 text-pink-600" />
                Auto Sharing Program
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">How It Works</p>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex gap-2">
                      <span className="text-pink-600">✓</span>
                      <span>0.5% of your earnings automatically shared</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-pink-600">✓</span>
                      <span>Distributed evenly among active referrals</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-pink-600">✓</span>
                      <span>Keeps referrals motivated and engaged</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-pink-600">✓</span>
                      <span>Optional - can be toggled off</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Your Auto-Share Stats</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 dark:text-gray-300">This Month</span>
                      <span className="font-bold text-pink-600 dark:text-pink-400">
                        {formatCurrency(stats.autoSharedThisMonth || 0, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Avg per Referral</span>
                      <span className="font-bold text-pink-600 dark:text-pink-400">
                        {formatCurrency(
                          (stats.autoSharedThisMonth || 0) / Math.max(1, stats.activeReferrals),
                          currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Est. Monthly</span>
                      <span className="font-bold text-pink-600 dark:text-pink-400">
                        {formatCurrency(
                          (stats.earningsThisMonth || 0) * 0.005,
                          currency
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Automatic Reward Sharing Info */}
      <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 shadow-md">
        <Zap className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-900 dark:text-blue-100">
          <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <strong>🎁 Community Sharing Active</strong>
              <p className="text-sm mt-1">
                0.5% of your creator economy earnings are automatically shared with your referrals — keep them
                motivated!
              </p>
              {stats && (
                <div className="flex items-center gap-2 text-sm bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full mt-2 w-fit">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-900 dark:text-blue-100">
                    {formatCurrency(stats.autoSharedThisMonth || 0, currency)} shared this month
                  </span>
                </div>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Referral Link Section */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white pb-6">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6" />
            <div>
              <CardTitle className="text-white text-2xl">Start Sharing Your Link</CardTitle>
              <p className="text-white/90 text-sm mt-1">One click to share with friends and start earning</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-5">
            {!referralLink ? (
              <Button
                onClick={generateReferralCode}
                className="w-full"
                size="lg"
                aria-label="Generate your unique referral link"
              >
                <Zap className="w-4 h-4 mr-2" aria-hidden="true" />
                Generate Your Referral Link
              </Button>
            ) : (
              <>
                {/* Link Copy Section */}
                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                    htmlFor="referral-link-input"
                  >
                    Your Unique Referral Link
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        id="referral-link-input"
                        value={referralLink}
                        readOnly
                        className="pr-12 bg-white dark:bg-gray-900 text-sm font-mono"
                        aria-label="Your referral link"
                      />
                    </div>
                    <Button
                      onClick={copyReferralLink}
                      className={`transition-all ${
                        copiedLink
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-purple-600 hover:bg-purple-700"
                      }`}
                      size="lg"
                      aria-label={copiedLink ? "Referral link copied to clipboard" : "Copy referral link to clipboard"}
                      aria-live="polite"
                    >
                      {copiedLink ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" aria-hidden="true" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" aria-hidden="true" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Share this link with friends to earn rewards
                  </p>
                </div>

                {/* Social Share Buttons */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Share on Social Media
                  </p>
                  <div
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                    role="group"
                    aria-label="Share referral link on social media platforms"
                  >
                    <Button
                      variant="outline"
                      onClick={() => shareReferralLink("twitter")}
                      className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 transition-colors h-12"
                      size="lg"
                      aria-label="Share referral link on Twitter - opens in new window"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" aria-hidden="true" />
                      Twitter
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => shareReferralLink("facebook")}
                      className="hover:bg-blue-50 hover:border-blue-400 dark:hover:bg-blue-900/20 transition-colors h-12"
                      size="lg"
                      aria-label="Share referral link on Facebook - opens in new window"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" aria-hidden="true" />
                      Facebook
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => shareReferralLink("whatsapp")}
                      className="hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/20 transition-colors h-12"
                      size="lg"
                      aria-label="Share referral link on WhatsApp - opens in new window"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" aria-hidden="true" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Referral List */}
      {referrals.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Your Referrals ({referrals.length})</span>
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                      {referral.referred_user_id.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        Referral #{referrals.indexOf(referral) + 1}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {referral.status === "active" ? "Active since " : "Pending: "}
                        {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-bold text-lg text-green-600 dark:text-green-400">
                        {formatCurrency(referral.earnings_total, currency)}
                      </p>
                      <Badge
                        variant={referral.status === "active" ? "default" : "secondary"}
                        className="text-xs capitalize"
                      >
                        {referral.status === "active" ? "✓ Active" : "⏳ Pending"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}

              {hasMore && (
                <Button
                  onClick={loadMore}
                  variant="outline"
                  className="w-full"
                >
                  Load More Referrals
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral Tiers */}
      <Card className="shadow-xl border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-b">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Star className="w-6 h-6 text-yellow-500" />
            Referral Tiers & Benefits
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Unlock better rewards as you grow</p>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                name: "Bronze",
                min: 0,
                max: 4,
                points: 10,
                share: "5%",
                color: "from-orange-500 to-amber-600",
              },
              {
                name: "Silver",
                min: 5,
                max: 24,
                points: 25,
                share: "7.5%",
                color: "from-gray-400 to-gray-500",
              },
              {
                name: "Gold",
                min: 25,
                max: 99,
                points: 50,
                share: "10%",
                color: "from-yellow-400 to-orange-500",
              },
              {
                name: "Platinum",
                min: 100,
                max: Infinity,
                points: 100,
                share: "15%",
                color: "from-blue-500 to-purple-600",
              },
            ].map((tier) => {
              const isCurrentTier = stats?.tier.toLowerCase() === tier.name.toLowerCase();
              return (
                <div
                  key={tier.name}
                  className={`relative rounded-xl overflow-hidden border-2 p-6 transition-all ${
                    isCurrentTier
                      ? `border-purple-500 bg-gradient-to-br ${tier.color} shadow-lg ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-900`
                      : "border-gray-200 dark:border-gray-700 hover:shadow-lg"
                  }`}
                >
                  {isCurrentTier && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-purple-600 text-white">Current</Badge>
                    </div>
                  )}

                  <div className={`flex items-center gap-3 mb-4 ${isCurrentTier ? "text-white" : ""}`}>
                    <Star className="w-5 h-5" />
                    <h3 className="font-bold text-lg">{tier.name}</h3>
                  </div>

                  <div className={`space-y-2 ${isCurrentTier ? "text-white" : "text-gray-700 dark:text-gray-300"}`}>
                    <p className="text-xs opacity-80">
                      {tier.min} - {tier.max === Infinity ? "∞" : tier.max} referrals
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">
                        ✓ {tier.points} Eloits per referral
                      </p>
                      <p className="text-sm font-semibold">
                        ✓ {tier.share} revenue share
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
          <CardTitle>How Referrals Work</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Three simple steps to start earning</p>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: 1,
                icon: Share2,
                title: "Share Your Link",
                desc: "Share your referral link with friends via email, social media, or messaging",
              },
              {
                step: 2,
                icon: Users,
                title: "Friends Join",
                desc: "When someone signs up using your link, they become your referral",
              },
              {
                step: 3,
                icon: DollarSign,
                title: "Earn Rewards",
                desc: "Earn revenue share and automatic 0.5% community sharing",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <Icon className="w-7 h-7" />
                    </div>
                    <Badge className="mb-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      Step {item.step}
                    </Badge>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  {item.step < 3 && (
                    <div className="hidden md:block absolute top-1/4 -right-6 transform">
                      <ArrowRight className="w-5 h-5 text-purple-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedSafeReferralComponent;
