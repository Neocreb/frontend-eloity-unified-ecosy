import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface LevelThreshold {
  level: number;
  threshold: number;
  title: string;
  benefits: string[];
  color: string;
  icon?: string;
  multiplier?: number;
}

export interface LevelProgressionData {
  currentLevel: number;
  currentThreshold: number;
  currentEarnings: number;
  nextLevel: number;
  nextThreshold: number;
  earnedTowardsNext: number;
  pointsToNextLevel: number;
  progressPercentage: number;
  totalLevels: number;
  isMaxLevel: boolean;
  levelTitle: string;
  benefits: string[];
  color: string;
  estimatedDaysToNextLevel: number;
  recentLevelUpDate?: string;
}

interface UseLevelProgressionReturn {
  levelData: LevelProgressionData | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getLevelInfo: (level: number) => LevelThreshold | null;
  getAllLevels: () => LevelThreshold[];
  getProgressTowardLevel: (level: number) => number;
  isLevelUnlocked: (level: number) => boolean;
  estimateTimeToLevel: (targetLevel: number) => number | null;
  hasBenefit: (benefit: string) => boolean;
}

// Level definitions with thresholds and benefits
const REWARD_LEVELS: LevelThreshold[] = [
  {
    level: 1,
    threshold: 0,
    title: "Starter",
    benefits: ["Basic rewards", "Community access", "Profile creation"],
    color: "#6B7280",
    icon: "🌟",
    multiplier: 1.0,
  },
  {
    level: 2,
    threshold: 100,
    title: "Bronze",
    benefits: ["Verified badge", "1.1x multiplier", "Early access to features"],
    color: "#92400E",
    icon: "🥉",
    multiplier: 1.1,
  },
  {
    level: 3,
    threshold: 500,
    title: "Silver",
    benefits: ["1.2x multiplier", "Featured content", "Priority support"],
    color: "#C0C7D0",
    icon: "🥈",
    multiplier: 1.2,
  },
  {
    level: 4,
    threshold: 1500,
    title: "Gold",
    benefits: ["1.3x multiplier", "Premium support", "Exclusive badges"],
    color: "#D97706",
    icon: "🥇",
    multiplier: 1.3,
  },
  {
    level: 5,
    threshold: 3000,
    title: "Platinum",
    benefits: ["1.5x multiplier", "VIP access", "Custom profile theme"],
    color: "#3B82F6",
    icon: "💎",
    multiplier: 1.5,
  },
  {
    level: 6,
    threshold: 6000,
    title: "Diamond",
    benefits: ["2.0x multiplier", "Exclusive events", "Lifetime premium"],
    color: "#8B5CF6",
    icon: "✨",
    multiplier: 2.0,
  },
];

const CACHE_DURATION_MS = 30000; // 30 seconds

export const useLevelProgression = (): UseLevelProgressionReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [levelData, setLevelData] = useState<LevelProgressionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const cacheRef = useRef<{ data: LevelProgressionData | null; timestamp: number }>({
    data: null,
    timestamp: 0,
  });
  const lastLevelRef = useRef<number>(1);

  // Get level info by level number
  const getLevelInfo = useCallback((level: number): LevelThreshold | null => {
    return REWARD_LEVELS.find((l) => l.level === level) || null;
  }, []);

  // Get all levels
  const getAllLevels = useCallback((): LevelThreshold[] => {
    return REWARD_LEVELS;
  }, []);

  // Calculate level based on earnings
  const calculateLevel = useCallback((earnings: number): number => {
    let currentLevel = 1;
    for (let i = REWARD_LEVELS.length - 1; i >= 0; i--) {
      if (earnings >= REWARD_LEVELS[i].threshold) {
        currentLevel = REWARD_LEVELS[i].level;
        break;
      }
    }
    return currentLevel;
  }, []);

  // Fetch level progression data
  const fetchLevelData = useCallback(
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
        setLevelData(cacheRef.current.data);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get user rewards summary
        const { data: summaryData, error: summaryError } = await supabase
          .from("user_rewards_summary")
          .select("level, total_earned, next_level_threshold")
          .eq("user_id", user.id)
          .single();

        if (summaryError && summaryError.code !== "PGRST116") {
          throw summaryError;
        }

        const currentEarnings = summaryData?.total_earned || 0;
        const currentLevel = summaryData?.level || calculateLevel(currentEarnings);
        const nextLevelNumber = Math.min(currentLevel + 1, REWARD_LEVELS.length);

        // Get level thresholds
        const currentLevelInfo = getLevelInfo(currentLevel);
        const nextLevelInfo = getLevelInfo(nextLevelNumber);

        if (!currentLevelInfo) {
          throw new Error("Invalid level configuration");
        }

        const currentThreshold = currentLevelInfo.threshold;
        const nextThreshold = nextLevelInfo?.threshold || currentLevelInfo.threshold * 2;
        const earnedTowardsNext = currentEarnings - currentThreshold;
        const pointsNeeded = nextThreshold - currentThreshold;
        const pointsToNextLevel = Math.max(0, nextThreshold - currentEarnings);
        const progressPercentage = Math.min(
          100,
          Math.round((earnedTowardsNext / pointsNeeded) * 100)
        );

        // Estimate days to next level
        const { data: activitiesData, error: activitiesError } = await supabase
          .from("activity_transactions")
          .select("amount_currency, created_at")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order("created_at", { ascending: false });

        let estimatedDaysToNextLevel = 999;
        if (activitiesError && activitiesError.code !== "PGRST116") {
          console.error("Error fetching activities:", activitiesError);
        } else if (activitiesData && activitiesData.length > 0) {
          const sevenDayEarnings = activitiesData.reduce(
            (sum, a) => sum + (a.amount_currency || 0),
            0
          );
          const dailyAverage = sevenDayEarnings / 7;
          estimatedDaysToNextLevel =
            dailyAverage > 0 ? Math.ceil(pointsToNextLevel / dailyAverage) : 999;
        }

        const data: LevelProgressionData = {
          currentLevel,
          currentThreshold,
          currentEarnings,
          nextLevel: nextLevelNumber,
          nextThreshold,
          earnedTowardsNext,
          pointsToNextLevel,
          progressPercentage,
          totalLevels: REWARD_LEVELS.length,
          isMaxLevel: currentLevel === REWARD_LEVELS.length,
          levelTitle: currentLevelInfo.title,
          benefits: currentLevelInfo.benefits,
          color: currentLevelInfo.color,
          estimatedDaysToNextLevel,
        };

        setLevelData(data);
        cacheRef.current = { data, timestamp: now };

        // Check if level changed
        if (currentLevel > lastLevelRef.current) {
          toast({
            title: "🎉 Level Up!",
            description: `You've reached level ${currentLevel} - ${currentLevelInfo.title}!`,
          });
          lastLevelRef.current = currentLevel;
        }
      } catch (err) {
        console.error("Error fetching level data:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch level progression"));
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, calculateLevel, getLevelInfo, toast]
  );

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    // Initial fetch
    fetchLevelData();

    // Subscribe to rewards summary changes
    const setupSubscription = () => {
      subscriptionRef.current = supabase
        .channel(`level_progression_${user.id}`)
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

            const oldLevel = payload.old?.level || 1;
            const newLevel = payload.new?.level || 1;

            // If level changed, refetch and show notification
            if (oldLevel !== newLevel) {
              cacheRef.current = { data: null, timestamp: 0 };
              fetchLevelData(true);
            } else if (
              payload.old?.total_earned !== payload.new?.total_earned ||
              payload.old?.next_level_threshold !== payload.new?.next_level_threshold
            ) {
              // If earnings or threshold changed, update cache
              cacheRef.current = { data: null, timestamp: 0 };
              fetchLevelData(true);
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED" && isMounted) {
            // Subscription is active
          } else if (status === "CHANNEL_ERROR" && isMounted) {
            console.error("Level progression channel error");
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
  }, [user?.id, fetchLevelData]);

  // Refresh data
  const refresh = useCallback(async () => {
    cacheRef.current = { data: null, timestamp: 0 };
    await fetchLevelData(true);
  }, [fetchLevelData]);

  // Get progress towards a specific level (0-100%)
  const getProgressTowardLevel = useCallback(
    (targetLevel: number): number => {
      if (!levelData) return 0;

      const targetLevelInfo = getLevelInfo(targetLevel);
      if (!targetLevelInfo) return 0;

      if (levelData.currentLevel > targetLevel) {
        return 100; // Already passed this level
      }

      if (levelData.currentLevel === targetLevel) {
        return levelData.progressPercentage;
      }

      // For future levels, estimate based on current progression
      return 0;
    },
    [levelData, getLevelInfo]
  );

  // Check if a level is unlocked
  const isLevelUnlocked = useCallback(
    (level: number): boolean => {
      return levelData ? levelData.currentLevel >= level : false;
    },
    [levelData]
  );

  // Estimate time to reach a specific level
  const estimateTimeToLevel = useCallback(
    (targetLevel: number): number | null => {
      if (!levelData) return null;

      const targetLevelInfo = getLevelInfo(targetLevel);
      if (!targetLevelInfo) return null;

      if (levelData.currentLevel >= targetLevel) {
        return 0; // Already at or past this level
      }

      const pointsNeeded = targetLevelInfo.threshold - levelData.currentEarnings;
      if (pointsNeeded <= 0) return 0;

      // Use current estimated days to next level as a basis
      const daysPerLevel = Math.max(
        1,
        levelData.estimatedDaysToNextLevel / (levelData.nextLevel - levelData.currentLevel)
      );
      const levelsToGo = targetLevel - levelData.currentLevel;

      return Math.ceil(daysPerLevel * levelsToGo);
    },
    [levelData, getLevelInfo]
  );

  // Check if user has a specific benefit
  const hasBenefit = useCallback(
    (benefit: string): boolean => {
      return levelData?.benefits ? levelData.benefits.includes(benefit) : false;
    },
    [levelData]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  return {
    levelData,
    isLoading,
    isUpdating,
    error,
    refresh,
    getLevelInfo,
    getAllLevels,
    getProgressTowardLevel,
    isLevelUnlocked,
    estimateTimeToLevel,
    hasBenefit,
  };
};
