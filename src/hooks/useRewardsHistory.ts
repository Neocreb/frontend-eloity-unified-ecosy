import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";

export interface RewardTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  source: string;
  amount: number;
  currency: string;
  description: string;
  status: "pending" | "completed" | "failed" | "refunded";
  created_at: string;
}

export interface MonthlyEarnings {
  month: string;
  total_amount: number;
  transaction_count: number;
  sources: string[];
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  leaderboard_type: string;
  rank: number;
  score: number;
  display_name: string;
  avatar_url?: string;
  period: string;
}

interface UseRewardsHistoryReturn {
  transactions: RewardTransaction[];
  monthlyEarnings: MonthlyEarnings[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getTransactionsByType: (type: string) => RewardTransaction[];
  getTotalEarnings: () => number;
}

export function useRewardsHistory(): UseRewardsHistoryReturn {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarnings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch transaction history
      const { data: transactionData, error: transactionError } = await supabase
        .from("user_rewards_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (transactionError) {
        // Log with proper error message
        console.warn("Rewards history table not found or inaccessible, using empty data:", transactionError.message);
        setTransactions([]);
      } else {
        setTransactions((transactionData || []) as RewardTransaction[]);
      }

      // Fetch monthly earnings
      const { data: monthlyData, error: monthlyError } = await supabase.rpc(
        "get_monthly_earnings",
        {
          p_user_id: user.id,
          p_months: 12,
        }
      );

      if (monthlyError) {
        console.warn("Monthly earnings RPC not found or inaccessible, using empty data:", monthlyError.message);
        setMonthlyEarnings([]);
      } else {
        setMonthlyEarnings((monthlyData || []) as MonthlyEarnings[]);
      }

      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch rewards history";
      setError(err instanceof Error ? err : new Error(errorMessage));
      console.error("Error fetching rewards history:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionsByType = (type: string): RewardTransaction[] => {
    return transactions.filter((t) => t.transaction_type === type);
  };

  const getTotalEarnings = (): number => {
    return transactions
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0);
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  return {
    transactions,
    monthlyEarnings,
    isLoading,
    error,
    refresh: fetchData,
    getTransactionsByType,
    getTotalEarnings,
  };
}

// Hook for leaderboard data
export interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  userRank: LeaderboardEntry | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getCurrentUserRank: (type: string) => LeaderboardEntry | null;
}

export function useLeaderboard(type: string = "earnings"): UseLeaderboardReturn {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch leaderboard
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from("platform_leaderboard")
        .select("*")
        .eq("leaderboard_type", type)
        .eq("period", "all_time")
        .order("rank", { ascending: true })
        .limit(100);

      if (leaderboardError) {
        console.warn("Leaderboard table not found or inaccessible:", leaderboardError.message);
        setLeaderboard([]);
        setUserRank(null);
      } else {
        setLeaderboard((leaderboardData || []) as LeaderboardEntry[]);

        // Find user's rank
        if (user?.id) {
          const userEntry = (leaderboardData || []).find((e: any) => e.user_id === user.id);
          setUserRank(userEntry as LeaderboardEntry | null);
        }
      }

      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch leaderboard";
      setError(err instanceof Error ? err : new Error(errorMessage));
      console.error("Error fetching leaderboard:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentUserRank = (rankType: string): LeaderboardEntry | null => {
    if (!user?.id) return null;
    return leaderboard.find((e) => e.user_id === user.id && e.leaderboard_type === rankType) || null;
  };

  useEffect(() => {
    fetchData();
  }, [type, user?.id]);

  return {
    leaderboard,
    userRank,
    isLoading,
    error,
    refresh: fetchData,
    getCurrentUserRank,
  };
}
