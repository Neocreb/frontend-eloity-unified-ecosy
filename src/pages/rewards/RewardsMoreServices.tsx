import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ArrowUp,
  Gift,
  TrendingUp,
  Users,
  Zap,
  Target,
  Trophy,
  Handshake,
  History,
  BarChart3,
  MoreHorizontal,
  Crown,
  Flame,
} from "lucide-react";

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: string;
  badge?: string;
  color: string;
  gradient: string;
}

export default function RewardsMoreServices() {
  const navigate = useNavigate();

  const features: FeatureItem[] = [
    {
      id: "withdraw",
      title: "Withdraw Earnings",
      description: "Cash out your earnings to your bank account or wallet",
      icon: ArrowUp,
      action: "/app/rewards/withdraw",
      badge: null,
      color: "text-green-600",
      gradient: "from-green-50 to-emerald-50",
    },
    {
      id: "send-gifts",
      title: "Send Gifts",
      description: "Gift virtual items and rewards to your supporters",
      icon: Gift,
      action: "/app/rewards/send-gifts",
      badge: null,
      color: "text-pink-600",
      gradient: "from-pink-50 to-rose-50",
    },
    {
      id: "analytics",
      title: "Analytics",
      description: "View detailed earnings breakdown and performance metrics",
      icon: BarChart3,
      action: "/app/rewards/analytics",
      badge: null,
      color: "text-blue-600",
      gradient: "from-blue-50 to-cyan-50",
    },
    {
      id: "partnerships",
      title: "Partnerships",
      description: "Collaborate with brands and explore partnership opportunities",
      icon: Handshake,
      action: "/app/rewards/partnerships",
      badge: null,
      color: "text-purple-600",
      gradient: "from-purple-50 to-indigo-50",
    },
    {
      id: "boost-manager",
      title: "Boost Manager",
      description: "Purchase content boosts and manage active promotions",
      icon: Flame,
      action: "/app/rewards/boost-manager",
      badge: "Popular",
      color: "text-orange-600",
      gradient: "from-orange-50 to-amber-50",
    },
    {
      id: "leaderboard",
      title: "Leaderboard",
      description: "See top creators and compete for exclusive rewards",
      icon: Crown,
      action: "/app/rewards/leaderboard",
      badge: "NEW",
      color: "text-amber-600",
      gradient: "from-amber-50 to-yellow-50",
    },
    {
      id: "history",
      title: "History",
      description: "View your complete earnings and transaction history",
      icon: History,
      action: "/app/rewards/history",
      badge: null,
      color: "text-slate-600",
      gradient: "from-slate-50 to-gray-50",
    },
    {
      id: "referrals",
      title: "Referrals",
      description: "Invite friends and earn commission from their activity",
      icon: Users,
      action: "/app/rewards?tab=referrals",
      badge: null,
      color: "text-cyan-600",
      gradient: "from-cyan-50 to-sky-50",
    },
  ];

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
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Rewards Features</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
          {/* Featured Section */}
          <div className="mb-6 space-y-3">
            <h2 className="text-lg font-bold text-gray-900">Featured</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.slice(0, 2).map((feature) => {
                const Icon = feature.icon;
                return (
                  <button
                    key={feature.id}
                    onClick={() => navigate(feature.action)}
                    className={`bg-gradient-to-br ${feature.gradient} border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all active:scale-95 text-left`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg bg-white`}>
                        <Icon className={`h-6 w-6 ${feature.color}`} />
                      </div>
                      {feature.badge && (
                        <Badge className="bg-orange-500 text-white hover:bg-orange-600">
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-tight">
                      {feature.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* All Features Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">All Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.slice(2).map((feature) => {
                const Icon = feature.icon;
                return (
                  <button
                    key={feature.id}
                    onClick={() => navigate(feature.action)}
                    className={`bg-gradient-to-br ${feature.gradient} border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all active:scale-95 text-left relative`}
                  >
                    {feature.badge && (
                      <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-2xs px-2 py-1 rounded-full font-bold">
                        {feature.badge}
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-white flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${feature.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-xs text-gray-600 leading-tight">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="text-2xl flex-shrink-0">💡</div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">
                  Need Help?
                </h3>
                <p className="text-xs text-gray-700 mb-3">
                  Check out our rewards guide to learn how to maximize your earnings.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 h-8"
                >
                  View Guide
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
