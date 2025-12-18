import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Play,
  Clock,
  Trophy,
  Flame,
  Target,
  DollarSign,
  TrendingUp,
  Eye,
  RefreshCw,
  AlertCircle,
  Zap,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import BattleVoting from "@/components/voting/BattleVoting";
import { rewardsNotificationService } from "@/services/rewardsNotificationService";
import { rewardsBattlesService, LiveBattle, BattleVote } from "@/services/rewardsBattlesService";
import { useRewardsSummary } from "@/hooks/useRewardsSummary";

interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  verified: boolean;
  tier: "rising_star" | "pro_creator" | "legend";
  winRate: number;
  totalVotes: number;
  isLeading: boolean;
  currentScore: number;
  followers: string;
}

interface BattleWithVotes {
  battle: LiveBattle;
  userVotes: BattleVote[];
}

const EnhancedRewardsBattleTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { summary, isLoading: summaryLoading } = useRewardsSummary();
  
  const [selectedBattle, setSelectedBattle] = useState<LiveBattle | null>(null);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [battlesWithVotes, setBattlesWithVotes] = useState<BattleWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "live" | "upcoming">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [battleHistory, setBattleHistory] = useState<any[]>([]);
  const [showBattleHistory, setShowBattleHistory] = useState(false);

  // Fetch battles data
  useEffect(() => {
    const fetchBattles = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);
        const data = await rewardsBattlesService.getBattlesWithVotes(user.id);
        setBattlesWithVotes(data);

        // Calculate battle history from completed battles
        const completedBattles: any[] = [];
        let wonCount = 0;
        let lostCount = 0;
        let totalEarned = 0;

        data.forEach((battleWithVotes) => {
          if (
            battleWithVotes.battle.status === "ended" ||
            battleWithVotes.battle.status === "completed"
          ) {
            battleWithVotes.userVotes.forEach((vote) => {
              if (vote.status === "won") {
                wonCount++;
                totalEarned += vote.potential_winning;
              } else if (vote.status === "lost") {
                lostCount++;
              }

              completedBattles.push({
                id: `${battleWithVotes.battle.id}-${vote.id}`,
                battleTitle: battleWithVotes.battle.title,
                amount: vote.amount,
                potentialWinning: vote.potential_winning,
                status: vote.status,
                odds: vote.odds,
                createdAt: vote.created_at,
              });
            });
          }
        });

        setBattleHistory(
          completedBattles.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } catch (err) {
        console.error("Error fetching battles:", err);
        setError("Failed to load battles. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchBattles();

    // Refresh battles every 10 seconds for live updates
    const interval = setInterval(fetchBattles, 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      if (!user?.id) return;
      const data = await rewardsBattlesService.getBattlesWithVotes(user.id);
      setBattlesWithVotes(data);
      toast({
        title: "✓ Refreshed",
        description: "Battle data updated",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to refresh battles",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredBattles = filter === "all"
    ? battlesWithVotes
    : battlesWithVotes.filter((battle) => {
        if (filter === "live") {
          return battle.battle.status === "live" || battle.battle.status === "active";
        }
        if (filter === "upcoming") {
          return battle.battle.status === "pending";
        }
        return true;
      });

  const formatTime = (seconds: number | null) => {
    if (seconds === null || seconds <= 0) return "0s";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
      case "active":
        return "bg-red-500 text-white animate-pulse";
      case "pending":
      case "upcoming":
        return "bg-blue-500 text-white";
      case "ended":
      case "completed":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const handleVoteBattle = (battle: LiveBattle) => {
    // Check if user has sufficient balance
    if (!summary || summary.available_balance <= 0) {
      toast({
        title: "Insufficient Balance",
        description: "You need balance to place a vote. Earn some rewards first!",
        variant: "destructive",
      });
      return;
    }

    setSelectedBattle(battle);
    setShowVotingModal(true);
  };

  const handlePlaceVote = async (voteData: {
    amount: number;
    creatorId: string;
    odds: number;
    potentialWinning: number;
  }) => {
    if (!user?.id || !selectedBattle) return;

    // Validate balance
    if (!summary || summary.available_balance < voteData.amount) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${formatCurrency(voteData.amount, summary?.currency_code)} but only have ${formatCurrency(summary?.available_balance || 0, summary?.currency_code)}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const vote = await rewardsBattlesService.placeBattleVote(
        user.id,
        selectedBattle.id,
        voteData.creatorId,
        voteData.amount,
        voteData.odds,
        voteData.potentialWinning
      );

      if (vote) {
        // Update local state
        setBattlesWithVotes((prev) =>
          prev.map((battleWithVotes) => {
            if (battleWithVotes.battle.id === selectedBattle.id) {
              return {
                ...battleWithVotes,
                userVotes: [...battleWithVotes.userVotes, vote],
              };
            }
            return battleWithVotes;
          })
        );

        setShowVotingModal(false);

        // Trigger notification
        rewardsNotificationService.addRewardsNotification({
          type: "battle",
          title: "🎯 Battle Vote Placed!",
          message: `Voted ${formatCurrency(voteData.amount, summary.currency_code)} - Potential win: ${formatCurrency(voteData.potentialWinning, summary.currency_code)}`,
          amount: voteData.amount,
          priority: "medium",
          actionUrl: "/app/rewards?tab=battles",
          actionLabel: "View Battle",
        });

        toast({
          title: "✓ Vote Placed",
          description: `You've bet ${formatCurrency(voteData.amount, summary.currency_code)} on this battle!`,
        });
      }
    } catch (err) {
      console.error("Error placing vote:", err);
      toast({
        title: "Error",
        description: "Failed to place vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const allVotes = battlesWithVotes.flatMap((b) => b.userVotes);
  const totalEarnings = allVotes
    .filter((vote) => vote.status === "won")
    .reduce((sum, vote) => sum + vote.potential_winning, 0);

  const activeVotes = allVotes.filter((vote) => vote.status === "active").length;
  const wonVotes = allVotes.filter((vote) => vote.status === "won");
  const lostVotes = allVotes.filter((vote) => vote.status === "lost");

  // Get user balance - use real balance from summary or default to 0
  const userBalance = summary?.available_balance || 0;

  // Calculate earnings metrics
  const totalBetAmount = allVotes.reduce((sum, vote) => sum + vote.amount, 0);
  const totalRisk = lostVotes.reduce((sum, vote) => sum + vote.amount, 0);
  const winRate = allVotes.length > 0 ? (wonVotes.length / allVotes.length) * 100 : 0;
  const roi = totalBetAmount > 0 ? ((totalEarnings - totalBetAmount) / totalBetAmount) * 100 : 0;

  // Group earnings by bet ranges
  const earningsByRange = (() => {
    const ranges = {
      "Small (<50)": { count: 0, earnings: 0, wins: 0 },
      "Medium (50-200)": { count: 0, earnings: 0, wins: 0 },
      "Large (200+)": { count: 0, earnings: 0, wins: 0 },
    };

    wonVotes.forEach((vote) => {
      if (vote.amount < 50) {
        ranges["Small (<50)"].count++;
        ranges["Small (<50)"].earnings += vote.potential_winning;
        ranges["Small (<50)"].wins++;
      } else if (vote.amount < 200) {
        ranges["Medium (50-200)"].count++;
        ranges["Medium (50-200)"].earnings += vote.potential_winning;
        ranges["Medium (50-200)"].wins++;
      } else {
        ranges["Large (200+)"].count++;
        ranges["Large (200+)"].earnings += vote.potential_winning;
        ranges["Large (200+)"].wins++;
      }
    });

    return ranges;
  })();

  // Calculate odds performance
  const oddsPerformance = (() => {
    const performance: Record<string, { wins: number; losses: number; earnings: number }> = {
      "High (4x+)": { wins: 0, losses: 0, earnings: 0 },
      "Medium (2-4x)": { wins: 0, losses: 0, earnings: 0 },
      "Low (<2x)": { wins: 0, losses: 0, earnings: 0 },
    };

    allVotes.forEach((vote) => {
      let category: string;
      if (vote.odds >= 4) {
        category = "High (4x+)";
      } else if (vote.odds >= 2) {
        category = "Medium (2-4x)";
      } else {
        category = "Low (<2x)";
      }

      if (vote.status === "won") {
        performance[category].wins++;
        performance[category].earnings += vote.potential_winning;
      } else if (vote.status === "lost") {
        performance[category].losses++;
      }
    });

    return performance;
  })();

  if (loading || summaryLoading) {
    return (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Battles skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="h-64">
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-2 w-full mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-24 flex-1" />
                      <Skeleton className="h-8 w-24 flex-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        <Button onClick={handleRefresh} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
      role="main"
      aria-label="Battle Rewards Tab - View and manage your battle earnings"
    >
      {/* User Balance Alert */}
      {userBalance <= 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">No Balance Available</p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Earn rewards to get balance for battle voting
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Battle Stats */}
      <div
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        role="region"
        aria-label="Battle Statistics Summary"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your Balance</p>
                <p
                  className="text-2xl font-bold mt-1"
                  aria-label={`Your balance: ${formatCurrency(userBalance, summary?.currency_code || "USD")}`}
                >
                  {formatCurrency(userBalance, summary?.currency_code || "USD")}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 opacity-20" aria-hidden="true" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Available to vote</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Live Battles</p>
                <p
                  className="text-2xl font-bold mt-1"
                  aria-label={`${battlesWithVotes.filter(
                    (b) => b.battle.status === "live" || b.battle.status === "active"
                  ).length} live battles currently active`}
                >
                  {battlesWithVotes.filter(
                    (b) => b.battle.status === "live" || b.battle.status === "active"
                  ).length}
                </p>
              </div>
              <Flame className="h-8 w-8 text-red-500 opacity-20" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Votes</p>
                <p
                  className="text-2xl font-bold mt-1"
                  aria-label={`You have ${activeVotes} active votes`}
                >
                  {activeVotes}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-500 opacity-20" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                <p
                  className="text-2xl font-bold mt-1"
                  aria-label={`Total earnings: ${formatCurrency(totalEarnings, summary?.currency_code || "USD")}`}
                >
                  {formatCurrency(totalEarnings, summary?.currency_code || "USD")}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500 opacity-20" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 items-center flex-wrap">
            {[
              { value: "all", label: "All Battles", icon: Trophy },
              { value: "live", label: "Live Now", icon: Flame },
              { value: "upcoming", label: "Upcoming", icon: Clock },
            ].map((option) => (
              <Button
                key={option.value}
                variant={filter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(option.value as any)}
                className="flex items-center gap-2"
              >
                <option.icon className="h-4 w-4" />
                {option.label}
              </Button>
            ))}

            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Battle List */}
      {filteredBattles.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBattles.map(({ battle }) => {
            const isLive = battle.status === "live" || battle.status === "active";

            return (
              <Card key={battle.id} className="relative overflow-hidden">
                {isLive && (
                  <div className="absolute top-0 right-0 w-1 h-full bg-red-500 animate-pulse" />
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{battle.title}</CardTitle>
                    <Badge className={getStatusColor(battle.status)}>
                      {isLive ? (
                        <Flame className="h-3 w-3 mr-1" />
                      ) : null}
                      {battle.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {battle.status === "pending"
                        ? "Starts soon"
                        : isLive
                        ? `${formatTime(battle.duration)} left`
                        : "Ended"}
                    </div>
                    {isLive && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {(battle.total_viewers || 0).toLocaleString()} viewers
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Voting Pool Info */}
                  <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Voting Pool</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(battle.bet_pool || 0, summary?.currency_code || "USD")}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{(battle.total_bets || 0)} voters</span>
                      <span>
                        Potential: +
                        {formatCurrency(
                          (battle.bet_pool || 0) * 0.9,
                          summary?.currency_code || "USD"
                        )}
                      </span>
                    </div>
                    {battle.status !== "ended" && battle.status !== "completed" && (
                      <Progress value={50} className="h-2" />
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {isLive && (
                      <Button size="sm" variant="outline" className="flex-1">
                        <Play className="h-4 w-4 mr-2" />
                        Watch Live
                      </Button>
                    )}
                    {battle.status !== "ended" && battle.status !== "completed" && (
                      <Button
                        size="sm"
                        className={`flex-1 ${
                          userBalance > 0
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                        onClick={() => handleVoteBattle(battle)}
                        disabled={userBalance <= 0}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        {userBalance > 0 ? "Vote & Earn" : "No Balance"}
                      </Button>
                    )}
                    {(battle.status === "ended" || battle.status === "completed") && (
                      <Button size="sm" variant="secondary" className="flex-1" disabled>
                        <Trophy className="h-4 w-4 mr-2" />
                        Battle Ended
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No battles found in this category</p>
          </CardContent>
        </Card>
      )}

      {/* Battle History Section */}
      {battleHistory.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span>Battle History ({battleHistory.length})</span>
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBattleHistory(!showBattleHistory)}
                className="text-xs"
              >
                {showBattleHistory ? "Hide" : "Show"} History
              </Button>
            </div>
          </CardHeader>

          {showBattleHistory && (
            <CardContent className="p-6">
              <div className="space-y-3">
                {battleHistory.slice(0, 10).map((battle) => (
                  <div
                    key={battle.id}
                    className={`p-4 rounded-lg border-l-4 transition-all ${
                      battle.status === "won"
                        ? "border-l-green-500 bg-green-50 dark:bg-green-900/10"
                        : "border-l-red-500 bg-red-50 dark:bg-red-900/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {battle.battleTitle}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(battle.createdAt).toLocaleDateString()} at{" "}
                          {new Date(battle.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={battle.status === "won" ? "default" : "destructive"}
                          className="mb-2"
                        >
                          {battle.status === "won" ? "✓ Won" : "✗ Lost"}
                        </Badge>
                        <div className="text-right">
                          <p className="font-bold">
                            {battle.status === "won"
                              ? "+"
                              : "-"}
                            {formatCurrency(
                              battle.status === "won"
                                ? battle.potentialWinning
                                : battle.amount,
                              summary?.currency_code || "USD"
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Bet: {formatCurrency(battle.amount, summary?.currency_code || "USD")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Odds: {battle.odds.toFixed(2)}x
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {battleHistory.length > 10 && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Showing 10 of {battleHistory.length} battles
                </p>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Battle Earnings Breakdown - NEW SECTION */}
      {allVotes.length > 0 && (
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
              Battle Performance & Earnings Breakdown
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Detailed analysis of your betting performance</p>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-xl">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Win Rate</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{winRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-2">{wonVotes.length} wins / {allVotes.length} total</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-xl">
                <p className="text-xs font-semibold text-muted-foreground mb-1">ROI</p>
                <p className={`text-3xl font-bold ${roi >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-2">Return on investment</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-xl">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Total Wagered</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(totalBetAmount, summary?.currency_code || "USD")}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Across {allVotes.length} bets</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30 rounded-xl">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Avg Odds</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {(allVotes.reduce((sum, v) => sum + v.odds, 0) / allVotes.length).toFixed(2)}x
                </p>
                <p className="text-xs text-muted-foreground mt-2">Average odds selected</p>
              </div>
            </div>

            {/* Earnings by Bet Size */}
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Earnings by Bet Size
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(earningsByRange).map(([range, data]) => (
                  <div key={range} className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-lg transition-all">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{range}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Wins</span>
                        <Badge variant="secondary">{data.wins}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Total Earnings</span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(data.earnings, summary?.currency_code || "USD")}
                        </span>
                      </div>
                      {data.wins > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Avg Win</span>
                          <span className="text-xs font-semibold">
                            {formatCurrency(data.earnings / data.wins, summary?.currency_code || "USD")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Odds Performance */}
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Performance by Odds Level
              </h3>
              <div className="space-y-3">
                {Object.entries(oddsPerformance).map(([oddsRange, data]) => {
                  const totalBets = data.wins + data.losses;
                  const successRate = totalBets > 0 ? (data.wins / totalBets) * 100 : 0;
                  return (
                    <div key={oddsRange} className="p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{oddsRange}</p>
                          <p className="text-xs text-muted-foreground">
                            {data.wins} wins, {data.losses} losses ({totalBets} total)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(data.earnings, summary?.currency_code || "USD")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {successRate.toFixed(1)}% success rate
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Best Performing Battles */}
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Top Winning Bets
              </h3>
              {wonVotes.slice(0, 5).length > 0 ? (
                <div className="space-y-2">
                  {wonVotes
                    .sort((a, b) => b.potential_winning - a.potential_winning)
                    .slice(0, 5)
                    .map((vote, idx) => {
                      const profit = vote.potential_winning - vote.amount;
                      return (
                        <div
                          key={vote.id}
                          className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              #{idx + 1} • {vote.odds.toFixed(2)}x odds
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Bet: {formatCurrency(vote.amount, summary?.currency_code || "USD")} → Won: {formatCurrency(vote.potential_winning, summary?.currency_code || "USD")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600 dark:text-green-400">
                              +{formatCurrency(profit, summary?.currency_code || "USD")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              +{((profit / vote.amount) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-muted-foreground">No winning bets yet</p>
              )}
            </div>

            {/* Risk Analysis */}
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
              <p className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Risk Analysis
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm text-red-800 dark:text-red-200">
                <div>
                  <p className="text-xs text-red-700 dark:text-red-300">Total Lost</p>
                  <p className="font-bold">{formatCurrency(totalRisk, summary?.currency_code || "USD")}</p>
                </div>
                <div>
                  <p className="text-xs text-red-700 dark:text-red-300">Largest Loss</p>
                  <p className="font-bold">
                    {formatCurrency(
                      lostVotes.length > 0 ? Math.max(...lostVotes.map(v => v.amount)) : 0,
                      summary?.currency_code || "USD"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How Battle Voting Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            How Battle Voting Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">1. Choose Creator</h3>
              <p className="text-sm text-muted-foreground">
                Select which creator you think will win based on their stats
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">2. Place Vote</h3>
              <p className="text-sm text-muted-foreground">
                Vote with your balance. Higher odds = higher potential rewards
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold mb-2">3. Earn Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Winners share 90% of pool, 10% goes to platform
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Tips Section - NEW */}
      <Card className="shadow-lg border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Zap className="h-6 w-6 text-amber-600" />
            Battle Betting Strategy Guide
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Pro tips to maximize your battle earnings</p>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {/* Strategy Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Battle Selection Strategy */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">1</div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Battle Selection</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Check Creator Stats</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">Analyze win rate, verification, and follower count</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Read Past Performance</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">Look at recent battle history and trends</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Avoid High Odds Favorites</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">High odds often indicate uncertainty</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Diversify Battles</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">Don't put all bets on the same battle</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Odds Understanding */}
            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold">2</div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Understanding Odds</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Low Odds (1.5-2x)</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">Safer bets with smaller returns but higher win probability</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Medium Odds (2-4x)</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">Balanced risk-reward with moderate probability</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">High Odds (4x+)</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">High risk, high reward - use sparingly for maximizing gains</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Expected Value</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">Only bet if (probability × odds) {">"} cost</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Risk Management */}
            <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 rounded-xl border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-600 text-white rounded-lg flex items-center justify-center font-bold">3</div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Risk Management</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-red-600 dark:text-red-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">The 1-3% Rule</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">Bet 1-3% of your balance per battle</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-600 dark:text-red-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Set Loss Limits</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">Stop betting if you lose more than 10% daily</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-600 dark:text-red-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Never Chase Losses</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">Don't increase bets to recover losses</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-600 dark:text-red-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Secure Your Wins</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">Withdraw earnings periodically</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Timing & Volume */}
            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center font-bold">4</div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Timing & Volume</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Bet Early in Battles</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">Better odds are available before battles start</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Quality Over Quantity</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">Fewer high-confidence bets beat many random ones</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Avoid Peak Hours</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">Odds shift during high-volume periods</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Track Streaks</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">Monitor your win/loss streaks for pattern analysis</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Advanced Strategy Tips */}
          <div className="p-6 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border-2 border-cyan-200 dark:border-cyan-700">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Star className="h-5 w-5 text-yellow-500" />
              Pro Tips for Maximum Earnings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold text-lg leading-none">→</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">Statistical Edge</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">Only bet when you have a clear statistical advantage. Know your confidence level.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold text-lg leading-none">→</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">Emotional Control</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">Don't let wins make you overconfident or losses make you reckless.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold text-lg leading-none">→</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">Track Everything</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">Review your battle history regularly to identify winning patterns and mistakes.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold text-lg leading-none">→</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">Community Insights</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">Learn from other successful bettors in the community forums.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Your Current Performance Summary */}
          {allVotes.length > 0 && (
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-l-4 border-indigo-600">
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">
                📊 Your Performance Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Current Win Rate</p>
                  <p className={`font-bold text-lg ${winRate >= 50 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {winRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">{winRate >= 50 ? "Above average" : "Below average"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Overall ROI</p>
                  <p className={`font-bold text-lg ${roi >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Profit/loss ratio</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Best Strategy</p>
                  <p className="font-bold text-lg">
                    {oddsPerformance["Medium (2-4x)"].earnings > Math.max(
                      oddsPerformance["Low (<2x)"].earnings,
                      oddsPerformance["High (4x+)"].earnings
                    ) ? "Medium Odds" : oddsPerformance["Low (<2x)"].earnings > oddsPerformance["High (4x+)"].earnings ? "Low Odds" : "High Odds"}
                  </p>
                  <p className="text-xs text-muted-foreground">Most profitable</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Next Level</p>
                  <p className="font-bold text-lg">
                    {roi >= 50 ? "Expert" : roi >= 20 ? "Advanced" : roi >= 0 ? "Good" : "Learning"}
                  </p>
                  <p className="text-xs text-muted-foreground">Skill level</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Battle Voting Modal */}
      {showVotingModal && selectedBattle && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg p-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Battle Voting: {selectedBattle.title}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowVotingModal(false)}
                className="text-gray-400 hover:text-foreground"
              >
                ✕
              </Button>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <BattleVoting
                battleId={selectedBattle.id}
                creator1={{
                  id: selectedBattle.creator1_id,
                  username: "creator1",
                  displayName: "Creator 1",
                  avatar: "",
                  tier: "rising_star",
                  verified: false,
                  currentScore: selectedBattle.creator1_score,
                  winRate: 0,
                  totalVotes: 0,
                  isLeading: selectedBattle.creator1_score > selectedBattle.creator2_score,
                  followers: "0",
                }}
                creator2={{
                  id: selectedBattle.creator2_id || "",
                  username: "creator2",
                  displayName: "Creator 2",
                  avatar: "",
                  tier: "rising_star",
                  verified: false,
                  currentScore: selectedBattle.creator2_score,
                  winRate: 0,
                  totalVotes: 0,
                  isLeading: selectedBattle.creator2_score > selectedBattle.creator1_score,
                  followers: "0",
                }}
                isLive={selectedBattle.status === "live" || selectedBattle.status === "active"}
                timeRemaining={selectedBattle.duration || 0}
                userBalance={userBalance}
                onPlaceVote={handlePlaceVote}
                userVotes={
                  battlesWithVotes
                    .find((b) => b.battle.id === selectedBattle.id)
                    ?.userVotes.map((v) => ({
                      id: v.id,
                      amount: v.amount,
                      creatorId: v.creator_id,
                      odds: v.odds,
                      potentialWinning: v.potential_winning,
                      timestamp: new Date(v.created_at),
                      status: v.status as "active" | "won" | "lost" | "refunded",
                    })) || []
                }
                votingPool={{
                  creator1Total: selectedBattle.creator1_score,
                  creator2Total: selectedBattle.creator2_score,
                  totalPool: selectedBattle.bet_pool || 0,
                  totalVoters: selectedBattle.total_bets || 0,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedRewardsBattleTab;
