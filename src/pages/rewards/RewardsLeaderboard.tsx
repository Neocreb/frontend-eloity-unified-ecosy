import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLeaderboard } from "@/hooks/useRewardsHistory";
import {
  ChevronLeft,
  Crown,
  AlertCircle,
  User,
  Award,
} from "lucide-react";

export default function RewardsLeaderboard() {
  const navigate = useNavigate();
  const [leaderboardType, setLeaderboardType] = useState<"earnings" | "contributions" | "referrals">("earnings");

  const { leaderboard, userRank, isLoading: leaderboardLoading, error: leaderboardError } = useLeaderboard(leaderboardType);

  return (
    <>
      <Helmet>
        <title>Leaderboard | Eloity Rewards</title>
        <meta name="description" content="Compete on the Eloity rewards leaderboard" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/app/rewards")}
              className="h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">Leaderboard</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
            {leaderboardError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900">
                  {leaderboardError.message}
                </AlertDescription>
              </Alert>
            )}

            {/* User's Rank Card */}
            {userRank && (
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 dark:from-blue-950 dark:to-cyan-950 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-600 text-white">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Your Rank
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        #{userRank.rank}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Score
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {userRank.score.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard Type Selection */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
              {[
                { value: "earnings" as const, label: "Earnings" },
                { value: "contributions" as const, label: "Contributions" },
                { value: "referrals" as const, label: "Referrals" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setLeaderboardType(tab.value)}
                  className={`pb-2 px-2 text-sm font-medium transition-colors ${
                    leaderboardType === tab.value
                      ? "text-purple-600 border-b-2 border-purple-600 dark:text-purple-400 dark:border-purple-400"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Leaderboard List */}
            <Card>
              <CardHeader>
                <CardTitle>Top Creators</CardTitle>
                <CardDescription>All-time {leaderboardType} rankings</CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">
                      No leaderboard data available
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry) => {
                      const isUserRank = userRank?.id === entry.id;
                      return (
                        <div
                          key={entry.id}
                          className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                            isUserRank
                              ? "bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-700"
                              : "hover:bg-gray-50 dark:hover:bg-gray-900/50"
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {/* Rank Badge */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white">
                              {entry.rank <= 3 ? (
                                <>
                                  {entry.rank === 1 && (
                                    <div className="bg-yellow-500 w-full h-full flex items-center justify-center rounded-full">
                                      🥇
                                    </div>
                                  )}
                                  {entry.rank === 2 && (
                                    <div className="bg-gray-400 w-full h-full flex items-center justify-center rounded-full">
                                      🥈
                                    </div>
                                  )}
                                  {entry.rank === 3 && (
                                    <div className="bg-orange-400 w-full h-full flex items-center justify-center rounded-full">
                                      🥉
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="bg-gray-300 dark:bg-gray-700 w-full h-full flex items-center justify-center rounded-full text-gray-900 dark:text-white">
                                  {entry.rank}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                {entry.display_name}
                                {isUserRank && (
                                  <Badge className="bg-purple-600 text-white text-xs">
                                    You
                                  </Badge>
                                )}
                              </p>
                              {entry.avatar_url && (
                                <img
                                  src={entry.avatar_url}
                                  alt={entry.display_name}
                                  className="w-8 h-8 rounded-full mt-1"
                                />
                              )}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-lg text-gray-900 dark:text-white">
                              {entry.score.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              points
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  How Leaderboards Work
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                    🏆 Earnings Leaderboard
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ranked by total rewards earned from all sources including referrals, boosts, and partnerships.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                    🤝 Contributions Leaderboard
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ranked by community contributions, challenges completed, and growth activities.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                    👥 Referrals Leaderboard
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ranked by successful referrals and invitations converted to active users.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
