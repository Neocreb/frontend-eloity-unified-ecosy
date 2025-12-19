import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Crown,
  ArrowUp,
} from "lucide-react";

interface ReferralTier {
  name: string;
  color: string;
  baseReward: number;
  revenueShare: number;
  requirements: string;
  totalReferrals: number;
}

export default function ReferralProgramSection() {
  const referralTiers: ReferralTier[] = [
    {
      name: "Bronze",
      color: "bg-amber-100 text-amber-900",
      baseReward: 10,
      revenueShare: 0.05,
      requirements: "0-5 referrals",
      totalReferrals: 0,
    },
    {
      name: "Silver",
      color: "bg-gray-200 text-gray-900",
      baseReward: 25,
      revenueShare: 0.075,
      requirements: "5-25 referrals",
      totalReferrals: 8,
    },
    {
      name: "Gold",
      color: "bg-yellow-100 text-yellow-900",
      baseReward: 50,
      revenueShare: 0.1,
      requirements: "25-100 referrals",
      totalReferrals: 0,
    },
    {
      name: "Platinum",
      color: "bg-blue-100 text-blue-900",
      baseReward: 100,
      revenueShare: 0.15,
      requirements: "100+ referrals",
      totalReferrals: 0,
    },
  ];

  const stats = {
    currentTier: "Silver",
    totalReferrals: 8,
    activeReferrals: 6,
    totalEarnings: 450,
    monthlyEarnings: 120,
    conversionRate: 75,
    tierProgress: 40,
    referralsToNextTier: 17,
  };

  return (
    <div className="space-y-6">
      {/* Current Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.currentTier}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tier Badge</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEarnings} ELO</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Lifetime</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Progression</CardTitle>
          <CardDescription>
            You're on the way to {stats.referralsToNextTier > 0 ? "Gold" : "Platinum"}!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Silver → Gold</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {stats.totalReferrals}/25
              </span>
            </div>
            <Progress value={stats.tierProgress} className="h-2" />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {stats.referralsToNextTier} more referrals needed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tier Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Benefits</CardTitle>
          <CardDescription>
            Unlock higher rewards as you level up
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {referralTiers.map((tier) => (
              <div
                key={tier.name}
                className={`p-4 border rounded-lg transition-all ${
                  tier.name === stats.currentTier
                    ? `${tier.color} border-2 border-current`
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {tier.name}
                      </p>
                      {tier.name === stats.currentTier && (
                        <Badge className="bg-blue-600 text-white text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {tier.requirements}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-sm">
                      {tier.baseReward} ELO per referral
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {(tier.revenueShare * 100).toFixed(1)}% revenue share
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Earnings */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
          <CardDescription>Track your referral earnings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                This Month
              </p>
              <p className="text-2xl font-bold text-green-600">
                {stats.monthlyEarnings} ELO
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Active Referrals
              </p>
              <p className="text-2xl font-bold text-blue-600">{stats.activeReferrals}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Earn More */}
      <Card>
        <CardHeader>
          <CardTitle>Maximize Your Earnings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
              💡
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Share More Frequently
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The more friends you refer, the higher your tier and rewards
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
              📈
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Improve Conversion Rate
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Share with people interested in Eloity's features
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
              🎯
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Unlock Revenue Share
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Higher tiers include a percentage of referrals' activity
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
        <ArrowUp className="w-4 h-4 mr-2" />
        View My Referral Links
      </Button>
    </div>
  );
}
