import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRewardsHistory, useLeaderboard } from "@/hooks/useRewardsHistory";
import {
  ChevronLeft,
  History,
  Trophy,
  Crown,
  TrendingUp,
  AlertCircle,
  Calendar,
  User,
  Award,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

export default function RewardsMore() {
  const navigate = useNavigate();
  const [historyTab, setHistoryTab] = useState<"all" | "earned" | "redeemed">("all");
  const [leaderboardType, setLeaderboardType] = useState<"earnings" | "contributions" | "referrals">("earnings");

  const { transactions, monthlyEarnings, isLoading: historyLoading, error: historyError } = useRewardsHistory();
  const { leaderboard, userRank, isLoading: leaderboardLoading, error: leaderboardError } = useLeaderboard(leaderboardType);

  const filteredTransactions = transactions.filter((t) => {
    if (historyTab === "earned") return t.transaction_type === "reward" || t.transaction_type === "bonus";
    if (historyTab === "redeemed") return t.transaction_type === "redemption" || t.transaction_type === "withdrawal";
    return true;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "reward":
        return "✨";
      case "bonus":
        return "🎁";
      case "referral":
        return "👥";
      case "challenge":
        return "🏆";
      case "boost":
        return "🚀";
      case "redemption":
        return "🔄";
      case "withdrawal":
        return "💸";
      default:
        return "📝";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "failed":
        return "text-red-600 bg-red-50";
      case "refunded":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getTotalEarnings = () => {
    return transactions
      .filter((t) => t.status === "completed" && (t.transaction_type === "reward" || t.transaction_type === "bonus" || t.transaction_type === "referral"))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalRedeemed = () => {
    return transactions
      .filter((t) => t.status === "completed" && (t.transaction_type === "redemption" || t.transaction_type === "withdrawal"))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <>
      <Helmet>
        <title>Rewards - History & Leaderboard | Eloity</title>
        <meta name="description" content="View your rewards history and compete on the leaderboard" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
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
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">Rewards</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
            <Tabs defaultValue="history" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  <span>History</span>
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="gap-2">
                  <Crown className="h-4 w-4" />
                  <span>Leaderboard</span>
                </TabsTrigger>
              </TabsList>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                {historyError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-900">
                      {historyError.message}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-950 dark:to-emerald-950 dark:border-green-800">
                    <CardContent className="pt-6">
                      {historyLoading ? (
                        <Skeleton className="h-12 w-32" />
                      ) : (
                        <>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                            Total Earned
                          </p>
                          <p className="text-3xl font-bold text-green-600">
                            {formatCurrency(getTotalEarnings(), "USD")}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            {transactions.filter((t) => t.transaction_type === "reward" || t.transaction_type === "bonus" || t.transaction_type === "referral").length} transactions
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 dark:from-purple-950 dark:to-pink-950 dark:border-purple-800">
                    <CardContent className="pt-6">
                      {historyLoading ? (
                        <Skeleton className="h-12 w-32" />
                      ) : (
                        <>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                            Total Redeemed
                          </p>
                          <p className="text-3xl font-bold text-purple-600">
                            {formatCurrency(getTotalRedeemed(), "USD")}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            {transactions.filter((t) => t.transaction_type === "redemption" || t.transaction_type === "withdrawal").length} transactions
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
                  {[
                    { value: "all" as const, label: "All Transactions" },
                    { value: "earned" as const, label: "Earned" },
                    { value: "redeemed" as const, label: "Redeemed" },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setHistoryTab(tab.value)}
                      className={`pb-2 px-2 text-sm font-medium transition-colors ${
                        historyTab === tab.value
                          ? "text-purple-600 border-b-2 border-purple-600 dark:text-purple-400 dark:border-purple-400"
                          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Monthly Earnings Chart */}
                {monthlyEarnings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Monthly Earnings Trend
                      </CardTitle>
                      <CardDescription>Last 12 months overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {monthlyEarnings.map((month) => (
                          <div key={month.month} className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {month.month}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {month.transaction_count} transactions
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <p className="text-lg font-bold text-green-600">
                                {formatCurrency(month.total_amount, "USD")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Transaction List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Details</CardTitle>
                    <CardDescription>
                      {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {historyLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : filteredTransactions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400">
                          No transactions found
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredTransactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <span className="text-2xl flex-shrink-0">
                                {getTransactionIcon(transaction.transaction_type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white capitalize">
                                  {transaction.transaction_type.replace(/_/g, " ")}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(transaction.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="text-right">
                                <p className="font-bold text-gray-900 dark:text-white">
                                  {transaction.transaction_type === "redemption" || transaction.transaction_type === "withdrawal"
                                    ? "−"
                                    : "+"}{" "}
                                  {formatCurrency(transaction.amount, transaction.currency)}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className={`text-xs capitalize ${getStatusColor(transaction.status)}`}
                                >
                                  {transaction.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Leaderboard Tab */}
              <TabsContent value="leaderboard" className="space-y-6">
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
                        {leaderboard.map((entry, index) => {
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
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
