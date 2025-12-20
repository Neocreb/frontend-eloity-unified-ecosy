import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Star,
  Zap,
  TrendingUp,
  Heart,
  Shield,
  Award,
  Crown,
} from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  unlockedAt?: string;
  progress?: number;
}

interface SellerAchievementsProps {
  achievements?: Achievement[];
  totalReviews?: number;
  averageRating?: number;
  salesCount?: number;
  yearsActive?: number;
}

const SellerAchievements: React.FC<SellerAchievementsProps> = ({
  achievements,
  totalReviews = 256,
  averageRating = 4.5,
  salesCount = 1200,
  yearsActive = 3,
}) => {
  const defaultAchievements: Achievement[] = [
    {
      id: "top-rated",
      name: "Top Rated Seller",
      description: "Maintained 4.5+ rating for 6 months",
      icon: <Trophy className="h-6 w-6" />,
      color: "text-yellow-600",
      unlockedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "fast-shipper",
      name: "Fast Shipper",
      description: "Ships 95%+ of orders on time",
      icon: <Zap className="h-6 w-6" />,
      color: "text-blue-600",
      unlockedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "excellent-service",
      name: "Excellent Service",
      description: "Outstanding customer service rating",
      icon: <Star className="h-6 w-6" />,
      color: "text-purple-600",
      unlockedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "trusted-seller",
      name: "Trusted Seller",
      description: "3+ years of reliable service",
      icon: <Shield className="h-6 w-6" />,
      color: "text-green-600",
      unlockedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "super-seller",
      name: "Super Seller",
      description: "1000+ successful sales",
      icon: <Crown className="h-6 w-6" />,
      color: "text-red-600",
      unlockedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "growth-champion",
      name: "Growth Champion",
      description: "50%+ growth in sales YoY",
      icon: <TrendingUp className="h-6 w-6" />,
      color: "text-cyan-600",
      unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "customer-favorite",
      name: "Customer Favorite",
      description: "Loved by customers - 1000+ favorites",
      icon: <Heart className="h-6 w-6" />,
      color: "text-pink-600",
      progress: 85,
    },
    {
      id: "quality-champion",
      name: "Quality Champion",
      description: "0.5% return rate or lower",
      icon: <Award className="h-6 w-6" />,
      color: "text-orange-600",
      unlockedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const achievementsToShow = achievements || defaultAchievements;

  const getTimeSinceUnlock = (dateString: string) => {
    const now = new Date();
    const unlock = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - unlock.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Achievements & Badges</h2>
        <p className="text-gray-600 text-sm">
          This seller has earned recognition for their excellent service and customer
          satisfaction.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Average Rating</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {averageRating}★
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalReviews} reviews
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-400 fill-yellow-400 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(salesCount / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {salesCount} orders
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Active Since</p>
                <p className="text-2xl font-bold text-green-600">
                  {yearsActive}y
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {yearsActive} years active
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-400 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Badges Earned</p>
                <p className="text-2xl font-bold text-purple-600">
                  {achievementsToShow.filter((a) => a.unlockedAt).length}/
                  {achievementsToShow.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(
                    (achievementsToShow.filter((a) => a.unlockedAt).length /
                      achievementsToShow.length) *
                      100
                  )}
                  % unlocked
                </p>
              </div>
              <Trophy className="h-8 w-8 text-purple-400 opacity-30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievementsToShow.map((achievement) => (
          <Card
            key={achievement.id}
            className={`relative overflow-hidden transition-all ${
              achievement.unlockedAt
                ? "hover:shadow-lg"
                : "opacity-60 grayscale"
            }`}
          >
            {!achievement.unlockedAt && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-transparent z-10" />
            )}
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div
                className={`p-3 rounded-lg mb-3 ${
                  achievement.unlockedAt
                    ? "bg-gray-100"
                    : "bg-gray-200"
                }`}
              >
                <div className={achievement.color}>
                  {achievement.icon}
                </div>
              </div>

              <h3 className="font-semibold text-sm mb-1">
                {achievement.name}
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                {achievement.description}
              </p>

              {achievement.unlockedAt ? (
                <Badge variant="secondary" className="text-xs">
                  Unlocked {getTimeSinceUnlock(achievement.unlockedAt)}
                </Badge>
              ) : achievement.progress !== undefined ? (
                <div className="w-full">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Progress</span>
                    <span className="text-xs font-semibold">
                      {achievement.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${achievement.progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <Badge variant="outline" className="text-xs">
                  Locked
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coming Soon */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-lg">Next Milestone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            This seller is {85}% of the way to unlocking the "Customer Favorite"
            badge. Help them reach 1000 favorites!
          </p>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full"
              style={{ width: "85%" }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerAchievements;
