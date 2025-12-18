import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRewards } from "@/hooks/use-rewards";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Eye,
  EyeOff,
  ArrowUp,
  Gift,
  UserPlus,
  Star,
  Sparkles,
  Award,
  Zap,
  TrendingUp,
  MoreHorizontal,
  BarChart3,
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
      <div className="relative w-screen -ml-[50vw] left-1/2 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pt-8 pb-20 sm:pb-24 md:pb-32">
        <AnimatedGradientWave />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Welcome Greeting */}
          <div className="text-white text-xs md:text-sm font-medium mb-6">
            Welcome back, {firstName}! 👋
          </div>

          {/* Main Balance Display */}
          <div className="mb-8">
            <div className="text-white/80 text-xs md:text-sm font-medium mb-2">
              Total Assets (ELOITs)
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
        </div>

        {/* Quick Action Buttons - Floating Section */}
        <div className="relative z-20 max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 mt-8 md:mt-12 -mb-4 md:-mb-6">
          <div className="flex gap-1.5 sm:gap-2 md:gap-3 justify-center">
            <button
              onClick={() => navigate("/app/rewards/withdraw")}
              className="flex-1 bg-white text-slate-900 rounded-xl md:rounded-2xl py-2.5 sm:py-3 px-1.5 sm:px-3 md:px-4 font-semibold text-2xs sm:text-xs md:text-sm flex flex-col items-center gap-0.5 md:gap-1 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <ArrowUp className="h-4 sm:h-5 w-4 sm:w-5" />
              <span className="hidden sm:inline">Withdraw</span>
            </button>
            <button
              onClick={() => navigate("/app/rewards/send-gifts")}
              className="flex-1 bg-white text-slate-900 rounded-xl md:rounded-2xl py-2.5 sm:py-3 px-1.5 sm:px-3 md:px-4 font-semibold text-2xs sm:text-xs md:text-sm flex flex-col items-center gap-0.5 md:gap-1 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <Gift className="h-4 sm:h-5 w-4 sm:w-5" />
              <span className="hidden sm:inline">Send Gifts</span>
            </button>
            <button
              onClick={() => navigate("/app/rewards/analytics")}
              className="flex-1 bg-white text-slate-900 rounded-xl md:rounded-2xl py-2.5 sm:py-3 px-1.5 sm:px-3 md:px-4 font-semibold text-2xs sm:text-xs md:text-sm flex flex-col items-center gap-0.5 md:gap-1 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <BarChart3 className="h-4 sm:h-5 w-4 sm:w-5" />
              <span className="hidden sm:inline">Analytics</span>
            </button>
            <button
              onClick={() => navigate("/app/rewards/more")}
              className="flex-1 bg-white text-slate-900 rounded-xl md:rounded-2xl py-2.5 sm:py-3 px-1.5 sm:px-3 md:px-4 font-semibold text-2xs sm:text-xs md:text-sm flex flex-col items-center gap-0.5 md:gap-1 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <MoreHorizontal className="h-4 sm:h-5 w-4 sm:w-5" />
              <span className="hidden sm:inline">More</span>
            </button>
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
          {/* Quick Access Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Quick Access</h2>
              <button
                onClick={() => navigate("/app/rewards/more")}
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-2 md:gap-3">
              {/* Quick Access Items */}
              {[
                { icon: "👥", label: "Invite Friends", path: "/app/rewards/more", badge: "Hot" },
                { icon: "📊", label: "Analytics", path: "/app/rewards/analytics", badge: null },
                { icon: "🏆", label: "Leaderboard", path: "/app/rewards/more", badge: null },
                { icon: "⚡", label: "Challenges", path: "/app/rewards?tab=challenges", badge: "100%" },
                { icon: "⭐", label: "Referrals", path: "/app/rewards?tab=referrals", badge: null },
                { icon: "🎮", label: "Battles", path: "/app/rewards?tab=battles", badge: null },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center justify-center gap-2 p-3 md:p-4 bg-slate-900 text-white rounded-lg md:rounded-xl hover:bg-slate-800 transition-all active:scale-95 relative"
                >
                  {item.badge && (
                    <span className="absolute -top-2 -right-2 bg-yellow-400 text-slate-900 text-2xs px-1.5 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                  <span className="text-2xl md:text-3xl">{item.icon}</span>
                  <span className="text-2xs md:text-xs font-medium text-center leading-tight">
                    {item.label}
                  </span>
                </button>
              ))}
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

          {/* Helpful Resources Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Getting Started Guide */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Getting Started</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Learn how to maximize your earnings by exploring all features.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    View Guide
                  </Button>
                </div>
              </div>
            </div>

            {/* Performance Tips */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Performance Tips</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Discover strategies to increase your earnings and level up.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </div>

            {/* Support Center */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Gift className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Rewards Program</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Unlock exclusive benefits and rewards as you progress.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-300 text-purple-700 hover:bg-purple-100"
                  >
                    Explore
                  </Button>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Need Help?</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Our support team is here to assist you with any questions.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">
              Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              <div className="border-b border-gray-200 pb-3">
                <p className="font-medium text-gray-900 text-sm mb-1">
                  When will I receive my withdrawal?
                </p>
                <p className="text-sm text-gray-600">
                  Withdrawals typically process within 3-5 business days depending on your payment method.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-3">
                <p className="font-medium text-gray-900 text-sm mb-1">
                  How are earnings calculated?
                </p>
                <p className="text-sm text-gray-600">
                  Earnings come from various sources including content views, tips, referrals, challenges, and more.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm mb-1">
                  What does the trust score mean?
                </p>
                <p className="text-sm text-gray-600">
                  Your trust score reflects your activity, reliability, and engagement on the platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorEconomy;
