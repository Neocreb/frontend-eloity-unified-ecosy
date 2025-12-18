import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRewards } from "@/hooks/use-rewards";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Zap,
  Users,
  ArrowUpDown,
  History,
  Handshake,
  Activity,
  Target,
  Trophy,
  Gift,
  UserPlus,
  ChevronDown,
  Eye,
  EyeOff,
  Plus,
  Send,
  ArrowUp,
  MoreHorizontal,
  Star,
  Sparkles,
  Award,
} from "lucide-react";
import CreatorEconomyHeader from "@/components/rewards/CreatorEconomyHeader";
import EnhancedEarningsOverview from "@/components/rewards/EnhancedEarningsOverview";
import EnhancedRewardsActivitiesTab from "@/components/rewards/EnhancedRewardsActivitiesTab";
import EnhancedRewardsChallengesTab from "@/components/rewards/EnhancedRewardsChallengesTab";
import EnhancedRewardsBattleTab from "@/components/rewards/EnhancedRewardsBattleTab";
import EnhancedGiftsTipsAnalytics from "@/components/rewards/EnhancedGiftsTipsAnalytics";
import EnhancedSafeReferralComponent from "@/components/rewards/EnhancedSafeReferralComponent";
import RevenueHistory from "@/components/rewards/RevenueHistory";
import MonetizedContent from "@/components/rewards/MonetizedContent";
import BoostManager from "@/components/rewards/BoostManager";
import Subscribers from "@/components/rewards/Subscribers";
import WithdrawEarnings from "@/components/rewards/WithdrawEarnings";
import { PartnershipSystem } from "@/components/rewards/PartnershipSystem";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/utils/formatters";

interface CreatorRevenueData {
  totalEarnings: number;
  earningsByType: {
    tips: number;
    subscriptions: number;
    views: number;
    boosts: number;
    services: number;
  };
  eloityPointsEarned: number;
  availableToWithdraw: number;
}

// Animated gradient header component
const AnimatedGradientWave = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        viewBox="0 0 1200 400"
        className="w-full h-full opacity-30"
        style={{ animation: "wave 15s ease-in-out infinite" }}
        preserveAspectRatio="none"
      >
        <path
          d="M 0 200 Q 300 100, 600 200 T 1200 200 L 1200 0 L 0 0 Z"
          fill="white"
          opacity="0.3"
        />
        <path
          d="M 0 220 Q 300 120, 600 220 T 1200 220 L 1200 400 L 0 400 Z"
          fill="white"
          opacity="0.1"
        />
      </svg>
      <style>{`
        @keyframes wave {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(50px);
          }
        }
      `}</style>
    </div>
  );
};

const CreatorEconomy = () => {
  const { user } = useAuth();
  const { data: rewardsData, isLoading, error, refresh } = useRewards();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { formatCurrency: formatCurrencyContext } = useCurrency();

  const [activeTab, setActiveTab] = useState("overview");
  const [showBalance, setShowBalance] = useState(true);

  // Transform rewards data to match the expected format
  const revenueData: CreatorRevenueData | null = rewardsData?.calculatedUserRewards
    ? {
        totalEarnings: rewardsData.calculatedUserRewards.total_earned,
        earningsByType: {
          tips: 0,
          subscriptions: 0,
          views: 0,
          boosts: 0,
          services: 0,
        },
        eloityPointsEarned: rewardsData.calculatedUserRewards.total_earned,
        availableToWithdraw: rewardsData.calculatedUserRewards.available_balance,
      }
    : null;

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading rewards data",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (!user) return null;

  const userName = user?.profile?.full_name || user?.username || "User";
  const firstName = userName.split(" ")[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header Skeleton */}
        <div className="relative w-screen -ml-[50vw] left-1/2 bg-gradient-to-b from-purple-600 to-blue-600 pt-8 pb-32">
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <Skeleton className="h-6 w-48 mb-8" />
            <Skeleton className="h-12 w-64 mb-4" />
            <div className="flex gap-2 mt-8">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-28" />
              ))}
            </div>
          </div>
          <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-12 -mb-6">
            <div className="flex gap-3 justify-center flex-wrap">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="flex-1 min-w-32 h-16" />
              ))}
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="relative w-screen -ml-[50vw] left-1/2 bg-white pt-2 min-h-screen">
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-6 pb-12">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Upper Zone - Full Bleed Gradient Hero Section */}
      <div className="relative w-screen -ml-[50vw] left-1/2 bg-gradient-to-b from-purple-600 via-purple-500 to-blue-600 pt-8 pb-32">
        <AnimatedGradientWave />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Welcome Greeting */}
          <div className="text-white text-sm md:text-base font-medium mb-8 flex items-center justify-between">
            <div>Welcome back, {firstName}! 👋</div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Star className="w-3 h-3 mr-1" />
                Creator Economy
              </Badge>
            </div>
          </div>

          {/* Main Balance Display */}
          <div className="space-y-4 mb-8">
            <div>
              <div className="text-white/80 text-xs md:text-sm font-medium mb-3">
                Total Earnings
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-white text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                    {showBalance
                      ? formatCurrencyContext(
                          revenueData?.totalEarnings || 0
                        )
                      : "••••••••"}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-green-400/20 text-green-100 border-green-400/30 hover:bg-green-400/30">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +15.8% this month
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 h-10 w-10 p-0"
                  onClick={() => setShowBalance((v) => !v)}
                >
                  {showBalance ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Balance Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                <p className="text-white/70 text-xs font-medium mb-1">Available</p>
                <p className="text-white text-lg font-bold">
                  {showBalance
                    ? formatCurrencyContext(
                        revenueData?.availableToWithdraw || 0
                      )
                    : "••••"}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                <p className="text-white/70 text-xs font-medium mb-1">
                  This Month
                </p>
                <p className="text-white text-lg font-bold">$456.78</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 col-span-2 md:col-span-1">
                <p className="text-white/70 text-xs font-medium mb-1">
                  Trust Score
                </p>
                <p className="text-white text-lg font-bold">85%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons - Floating Section */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-12 -mb-6">
          <div className="flex gap-3 justify-center flex-wrap max-w-2xl mx-auto">
            <Button
              onClick={() => setActiveTab("withdraw")}
              className="flex-1 min-w-32 md:min-w-40 bg-white text-purple-600 hover:bg-purple-50 rounded-2xl py-3 px-4 font-semibold text-sm flex flex-col items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <ArrowUp className="h-5 w-5" />
              <span>Withdraw</span>
            </Button>
            <Button
              onClick={() => navigate("/app/send-gifts")}
              className="flex-1 min-w-32 md:min-w-40 bg-white text-purple-600 hover:bg-purple-50 rounded-2xl py-3 px-4 font-semibold text-sm flex flex-col items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <Gift className="h-5 w-5" />
              <span>Send Gifts</span>
            </Button>
            <Button
              onClick={() => setActiveTab("referrals")}
              className="flex-1 min-w-32 md:min-w-40 bg-white text-purple-600 hover:bg-purple-50 rounded-2xl py-3 px-4 font-semibold text-sm flex flex-col items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <UserPlus className="h-5 w-5" />
              <span>Invite</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Lower Zone - White Content Area with Curved Top */}
      <div className="relative w-screen -ml-[50vw] left-1/2 bg-white pt-2 min-h-screen">
        {/* Curved divider */}
        <div
          className="absolute -top-12 left-0 right-0 h-24 bg-white"
          style={{
            borderRadius: "48px 48px 0 0",
            backgroundColor: "white",
          }}
        ></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-6 pb-12">
          {/* Quick Stats Bar - Mobile Optimized */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 md:p-4">
              <p className="text-xs text-gray-600 font-medium">Total Earned</p>
              <p className="text-lg md:text-xl font-bold text-green-700 mt-1">
                {formatCurrencyContext(revenueData?.totalEarnings || 0)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3 md:p-4">
              <p className="text-xs text-gray-600 font-medium">Available</p>
              <p className="text-lg md:text-xl font-bold text-blue-700 mt-1">
                {formatCurrencyContext(revenueData?.availableToWithdraw || 0)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 md:p-4">
              <p className="text-xs text-gray-600 font-medium">Level</p>
              <p className="text-lg md:text-xl font-bold text-purple-700 mt-1">
                <Badge className="bg-purple-600 text-white">Gold</Badge>
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 md:p-4">
              <p className="text-xs text-gray-600 font-medium">Trust Score</p>
              <p className="text-lg md:text-xl font-bold text-amber-700 mt-1">
                85%
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <CreatorEconomyHeader activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Tab Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="overview" className="mt-0">
              <EnhancedEarningsOverview
                user={user}
                setActiveTab={setActiveTab}
              />
            </TabsContent>

            <TabsContent value="content" className="mt-0">
              <MonetizedContent userId={user.id} />
            </TabsContent>

            <TabsContent value="boosts" className="mt-0">
              <BoostManager userId={user.id} />
            </TabsContent>

            <TabsContent value="subscribers" className="mt-0">
              <Subscribers userId={user.id} />
            </TabsContent>

            <TabsContent value="withdraw" className="mt-0">
              <WithdrawEarnings
                availableBalance={revenueData?.availableToWithdraw || 0}
                userId={user.id}
                onWithdraw={refresh}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <RevenueHistory userId={user.id} />
            </TabsContent>

            <TabsContent value="partnerships" className="mt-0">
              <PartnershipSystem />
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <EnhancedRewardsActivitiesTab />
            </TabsContent>

            <TabsContent value="referrals" className="mt-0">
              <EnhancedSafeReferralComponent />
            </TabsContent>

            <TabsContent value="challenges" className="mt-0">
              <EnhancedRewardsChallengesTab />
            </TabsContent>

            <TabsContent value="battles" className="mt-0">
              <EnhancedRewardsBattleTab />
            </TabsContent>

            <TabsContent value="gifts" className="mt-0">
              <EnhancedGiftsTipsAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CreatorEconomy;
