import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface TrustScoreHistory {
  id: string;
  user_id: string;
  old_score: number;
  new_score: number;
  change_reason: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface TrustScoreData {
  currentScore: number;
  maxScore: number;
  percentile: number;
  trustLevel: "low" | "medium" | "high" | "excellent";
  history: TrustScoreHistory[];
  recentChange: number;
  trend: "improving" | "stable" | "declining";
  lastUpdated: string;
  daysToNextLevel?: number;
}

interface UseTrustScoreReturn {
  trustScore: TrustScoreData | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  updateScore: (change: number, reason: string, metadata?: Record<string, any>) => Promise<boolean>;
  getHistory: (limit?: number) => Promise<TrustScoreHistory[]>;
  getTrustLevel: (score: number) => "low" | "medium" | "high" | "excellent";
  canPerformAction: (requiredScore: number) => boolean;
  getScoreBreakdown: () => Record<string, number>;
}

const TRUST_SCORE_MAX = 100;
const CACHE_DURATION_MS = 60000; // 1 minute

// Trust score levels and their descriptions
const TRUST_LEVELS = {
  low: { name: "Low", color: "#EF4444", minScore: 0, maxScore: 49 },
  medium: { name: "Medium", color: "#F59E0B", minScore: 50, maxScore: 69 },
  high: { name: "High", color: "#3B82F6", minScore: 70, maxScore: 84 },
  excellent: { name: "Excellent", color: "#10B981", minScore: 85, maxScore: 100 },
};

export const useTrustScore = (): UseTrustScoreReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trustScore, setTrustScore] = useState<TrustScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const cacheRef = useRef<{ data: TrustScoreData | null; timestamp: number }>({
    data: null,
    timestamp: 0,
  });

  // Determine trust level based on score
  const getTrustLevel = useCallback((score: number): "low" | "medium" | "high" | "excellent" => {
    if (score >= 85) return "excellent";
    if (score >= 70) return "high";
    if (score >= 50) return "medium";
    return "low";
  }, []);

  // Fetch trust score data with improved caching
  const fetchTrustScore = useCallback(
    async (skipCache = false) => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      // Check cache
      const now = Date.now();
      const cacheAge = now - cacheRef.current.timestamp;
      const cacheValid = !skipCache && cacheRef.current.data && cacheAge < CACHE_DURATION_MS;

      if (cacheValid && cacheRef.current.data) {
        setTrustScore(cacheRef.current.data);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get user rewards summary for current score
        const { data: summaryData, error: summaryError } = await supabase
          .from("user_rewards_summary")
          .select("trust_score")
          .eq("user_id", user.id)
          .single();

        if (summaryError && summaryError.code !== "PGRST116") {
          throw summaryError;
        }

        const currentScore = summaryData?.trust_score || 50;

        // Get trust history
        const { data: historyData, error: historyError } = await supabase
          .from("trust_history")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100);

        if (historyError && historyError.code !== "PGRST116") {
          console.error("Error fetching history:", historyError);
        }

        const history = (historyData || []) as TrustScoreHistory[];

        // Calculate metrics
        const percentile = Math.round((currentScore / TRUST_SCORE_MAX) * 100);
        const recentChange = history.length > 0 ? history[0].new_score - history[0].old_score : 0;

        // Determine trend
        let trend: "improving" | "stable" | "declining" = "stable";
        if (history.length > 5) {
          const avgChange =
            history
              .slice(0, 5)
              .reduce((sum, h) => sum + (h.new_score - h.old_score), 0) / 5;
          if (avgChange > 1) trend = "improving";
          if (avgChange < -1) trend = "declining";
        }

        // Estimate days to next level (if applicable)
        const currentLevel = getTrustLevel(currentScore);
        const levelThresholds = {
          low: 50,
          medium: 70,
          high: 85,
          excellent: 100,
        };
        const thresholds = Object.values(levelThresholds);
        const nextThreshold = thresholds.find((t) => t > currentScore);
        const pointsNeeded = nextThreshold ? nextThreshold - currentScore : 0;
        const avgPointsPerDay = history.length > 10 ? pointsNeeded / 7 : 1; // Estimate based on 7 days
        const daysToNextLevel = avgPointsPerDay > 0 ? Math.ceil(pointsNeeded / avgPointsPerDay) : undefined;

        const data: TrustScoreData = {
          currentScore,
          maxScore: TRUST_SCORE_MAX,
          percentile,
          trustLevel: getTrustLevel(currentScore),
          history,
          recentChange,
          trend,
          lastUpdated: new Date().toISOString(),
          daysToNextLevel,
        };

        setTrustScore(data);
        cacheRef.current = { data, timestamp: now };
      } catch (err) {
        console.error("Error fetching trust score:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch trust score"));
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, getTrustLevel]
  );

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    // Initial fetch
    fetchTrustScore();

    // Subscribe to trust score changes
    const setupSubscription = () => {
      subscriptionRef.current = supabase
        .channel(`trust_score_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "user_rewards_summary",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!isMounted) return;

            const oldScore = payload.old?.trust_score || 0;
            const newScore = payload.new?.trust_score || 0;

            if (oldScore !== newScore) {
              // Clear cache and refetch
              cacheRef.current = { data: null, timestamp: 0 };
              fetchTrustScore(true);

              // Show notification
              const change = newScore - oldScore;
              const direction = change > 0 ? "increased" : "decreased";
              toast({
                title: `Trust Score ${direction === "increased" ? "📈" : "📉"} ${direction === "increased" ? "Increased" : "Decreased"}`,
                description: `Your trust score changed by ${Math.abs(change)} point${Math.abs(change) !== 1 ? "s" : ""}`,
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED" && isMounted) {
            // Subscription is active
          } else if (status === "CHANNEL_ERROR" && isMounted) {
            console.error("Trust score channel error");
          }
        });
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user?.id, fetchTrustScore, toast]);

  // Refresh trust score
  const refresh = useCallback(async () => {
    cacheRef.current = { data: null, timestamp: 0 };
    await fetchTrustScore(true);
  }, [fetchTrustScore]);

  // Update trust score
  const updateScore = useCallback(
    async (change: number, reason: string, metadata?: Record<string, any>): Promise<boolean> => {
      if (!user?.id || !trustScore) {
        setError(new Error("User or trust score not available"));
        return false;
      }

      setIsUpdating(true);
      try {
        setError(null);

        // Calculate new score
        const newScore = Math.max(0, Math.min(TRUST_SCORE_MAX, trustScore.currentScore + change));

        // Record in trust history
        const { error: historyError } = await supabase
          .from("trust_history")
          .insert([
            {
              user_id: user.id,
              old_score: trustScore.currentScore,
              new_score: newScore,
              change_reason: reason,
              metadata: metadata || {},
            },
          ]);

        if (historyError) {
          throw historyError;
        }

        // Update rewards summary
        const { error: updateError } = await supabase
          .from("user_rewards_summary")
          .update({ trust_score: newScore })
          .eq("user_id", user.id);

        if (updateError) {
          throw updateError;
        }

        // Clear cache
        cacheRef.current = { data: null, timestamp: 0 };

        // Fetch fresh data
        await fetchTrustScore(true);

        toast({
          title: "Trust Score Updated",
          description: `${reason}. Change: ${change > 0 ? "+" : ""}${change}`,
        });

        return true;
      } catch (err) {
        console.error("Error updating trust score:", err);
        const errorMsg = err instanceof Error ? err.message : "Failed to update trust score";
        setError(new Error(errorMsg));
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [user?.id, trustScore, fetchTrustScore, toast]
  );

  // Get full history
  const getHistory = useCallback(async (): Promise<TrustScoreHistory[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from("trust_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return (data || []) as TrustScoreHistory[];
    } catch (err) {
      console.error("Error fetching history:", err);
      return [];
    }
  }, [user?.id]);

  // Check if user can perform action
  const canPerformAction = useCallback(
    (requiredScore: number): boolean => {
      return trustScore ? trustScore.currentScore >= requiredScore : false;
    },
    [trustScore]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  return {
    trustScore,
    isLoading,
    isUpdating,
    error,
    refresh,
    updateScore,
    getHistory,
    getTrustLevel,
    canPerformAction,
  };
};
