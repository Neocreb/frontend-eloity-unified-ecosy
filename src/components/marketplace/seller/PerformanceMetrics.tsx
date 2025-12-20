import React, { useState, useEffect } from "react";
import {
  Star,
  TrendingUp,
  Users,
  Truck,
  RotateCw,
  AlertCircle,
  Lock,
  Unlock,
  Award,
  Crown,
  Zap,
  Shield,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { sellerAnalyticsService, PerformanceBadge, SellerMetrics } from "@/services/sellerAnalyticsService";
import { cn } from "@/lib/utils";

interface PerformanceMetricsProps {
  sellerId: string;
  onMetricsLoad?: (metrics: SellerMetrics) => void;
}

const getTierConfig = (tier: string) => {
  const configs: Record<string, { icon: React.ReactNode; color: string; bgColor: string; nextReq: string }> = {
    bronze: {
      icon: <Sparkles className="w-6 h-6" />,
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      nextReq: "$5,000 revenue",
    },
    silver: {
      icon: <Star className="w-6 h-6" />,
      color: "text-gray-400",
      bgColor: "bg-gray-50",
      nextReq: "$20,000 revenue",
    },
    gold: {
      icon: <Crown className="w-6 h-6" />,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      nextReq: "$50,000 revenue",
    },
    platinum: {
      icon: <Zap className="w-6 h-6" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      nextReq: "Highest Tier",
    },
  };
  return configs[tier] || configs.bronze;
};

const getBadgeIcon = (badgeId: string) => {
  const icons: Record<string, React.ReactNode> = {
    top_rated: <Star className="w-5 h-5" />,
    fast_shipper: <Truck className="w-5 h-5" />,
    excellent_service: <Sparkles className="w-5 h-5" />,
    trusted_seller: <Shield className="w-5 h-5" />,
    power_seller: <Zap className="w-5 h-5" />,
  };
  return icons[badgeId] || <Award className="w-5 h-5" />;
};

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ sellerId, onMetricsLoad }) => {
  const [metrics, setMetrics] = useState<SellerMetrics | null>(null);
  const [badges, setBadges] = useState<PerformanceBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [sellerId]);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const [metricsData, badgesData] = await Promise.all([
        sellerAnalyticsService.getSellerMetrics(sellerId),
        sellerAnalyticsService.getPerformanceBadges(sellerId),
      ]);
      setMetrics(metricsData);
      setBadges(badgesData);
      onMetricsLoad?.(metricsData);
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const tierConfig = getTierConfig(metrics.sellerTier);
  const unlockedBadges = badges.filter((b) => b.isUnlocked);
  const lockedBadges = badges.filter((b) => !b.isUnlocked);

  return (
    <div className="space-y-6">
      {/* Seller Tier Section */}
      <Card className={cn(tierConfig.bgColor, "border-2")}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Seller Tier</span>
            <Badge variant="secondary">{metrics.sellerTier.toUpperCase()}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className={cn("p-4 rounded-lg", tierConfig.color)}>
              {tierConfig.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg capitalize">{metrics.sellerTier} Seller</h3>
              <p className="text-sm text-gray-600 mt-1">Next: {tierConfig.nextReq}</p>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Progress to Next Level</span>
                  <span className="font-medium">{Math.round((metrics.tierLevel / 4) * 100)}%</span>
                </div>
                <Progress value={(metrics.tierLevel / 4) * 100} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Rating */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{metrics.averageRating.toFixed(1)}</span>
                <span className="text-gray-600">/5.0</span>
              </div>
              <p className="text-sm text-gray-600">Based on {metrics.totalReviews} reviews</p>
              <Progress value={metrics.averageRating * 20} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Positive Reviews */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Positive Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{metrics.positiveReviewPercent}%</span>
              </div>
              <p className="text-sm text-gray-600">
                {Math.round((metrics.positiveReviewPercent / 100) * metrics.totalReviews)} of{" "}
                {metrics.totalReviews} positive
              </p>
              <Progress value={metrics.positiveReviewPercent} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{metrics.responseTime}</span>
                <span className="text-gray-600">hours</span>
              </div>
              <p className="text-sm text-gray-600">Average message response</p>
              <Progress
                value={Math.max(0, 100 - (metrics.responseTime / 24) * 100)}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Shipping Speed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-500" />
              Shipping Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{metrics.shippingSpeed}</span>
                <span className="text-gray-600">days</span>
              </div>
              <p className="text-sm text-gray-600">Average processing time</p>
              <Progress
                value={Math.max(0, 100 - (metrics.shippingSpeed / 5) * 100)}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Return Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-orange-500" />
              Return Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{metrics.returnRate.toFixed(2)}%</span>
              </div>
              <p className="text-sm text-gray-600">Lower is better</p>
              <Progress value={Math.max(0, 100 - metrics.returnRate * 10)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Refund Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Refund Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{metrics.refundRate.toFixed(2)}%</span>
              </div>
              <p className="text-sm text-gray-600">Lower is better</p>
              <Progress value={Math.max(0, 100 - metrics.refundRate * 10)} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges Section */}
      <Card>
        <CardHeader>
          <CardTitle>Achievement Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Unlocked Badges */}
            {unlockedBadges.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Unlocked Badges</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unlockedBadges.map((badge) => (
                    <div
                      key={badge.badgeId}
                      className={cn(badge.badgeColor, "p-4 rounded-lg border-2 border-current")}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{badge.badgeIcon}</div>
                          <div>
                            <h5 className="font-semibold text-sm">{badge.badgeName}</h5>
                            {badge.unlockedAt && (
                              <p className="text-xs opacity-75">
                                Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <Unlock className="w-4 h-4 opacity-50" />
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked Badges */}
            {lockedBadges.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Locked Badges</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {lockedBadges.map((badge) => (
                    <div key={badge.badgeId} className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl opacity-50">{badge.badgeIcon}</div>
                          <div>
                            <h5 className="font-semibold text-sm text-gray-700">{badge.badgeName}</h5>
                            <p className="text-xs text-gray-600">
                              Progress: {badge.progressPercent}%
                            </p>
                          </div>
                        </div>
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                      <Progress value={badge.progressPercent} className="h-2" />
                      <p className="text-xs text-gray-600 mt-2">{badge.nextMilestone}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {badges.length === 0 && (
              <div className="text-center py-6">
                <Award className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600">No badges yet. Start building your seller reputation!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">How Badges Work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <ul className="space-y-2">
            <li className="flex gap-2">
              <Star className="w-4 h-4 flex-shrink-0 text-yellow-500 mt-0.5" />
              <span>
                <strong>Top Rated:</strong> Maintain a 4.5+ average rating
              </span>
            </li>
            <li className="flex gap-2">
              <Truck className="w-4 h-4 flex-shrink-0 text-blue-500 mt-0.5" />
              <span>
                <strong>Fast Shipper:</strong> Maintain &lt;2 day average shipping
              </span>
            </li>
            <li className="flex gap-2">
              <Sparkles className="w-4 h-4 flex-shrink-0 text-purple-500 mt-0.5" />
              <span>
                <strong>Excellent Service:</strong> Maintain 90% positive reviews
              </span>
            </li>
            <li className="flex gap-2">
              <Shield className="w-4 h-4 flex-shrink-0 text-green-500 mt-0.5" />
              <span>
                <strong>Trusted Seller:</strong> 100+ orders with &lt;2% return rate
              </span>
            </li>
            <li className="flex gap-2">
              <Zap className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
              <span>
                <strong>Power Seller:</strong> $20,000+ in total revenue
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper icon component
const Clock: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default PerformanceMetrics;
