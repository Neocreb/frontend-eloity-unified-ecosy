import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { userRewardsSummaryService, UserRewardsSummary } from "@/services/userRewardsSummaryService";

interface UseRewardsSummaryReturn {
  summary: UserRewardsSummary | null;
  isLoading: boolean;
  error: Error | null;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  updateTrustScore: () => Promise<void>;
  withdraw: (amount: number, method: string) => Promise<boolean>;
  clearCache: () => void;
  lastUpdated: Date | null;
  cacheAge: number;
}

const CACHE_DURATION_MS = 30000; // 30 seconds
const REFRESH_DEBOUNCE_MS = 1000;

export const useRewardsSummary = (): UseRewardsSummaryReturn => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<UserRewardsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);
  const cacheRef = useRef<{ data: UserRewardsSummary | null; timestamp: number }>({
    data: null,
    timestamp: 0,
  });

  // Fetch summary with cache management
  const fetchSummary = useCallback(
    async (skipCache = false) => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      // Check cache validity
      const now = Date.now();
      const cacheAge = now - cacheRef.current.timestamp;
      const cacheValid = !skipCache && cacheRef.current.data && cacheAge < CACHE_DURATION_MS;

      if (cacheValid && cacheRef.current.data) {
        setSummary(cacheRef.current.data);
        setLastUpdated(new Date(cacheRef.current.timestamp));
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Initialize summary if needed
        await userRewardsSummaryService.initializeSummary(user.id);

        // Fetch summary
        const data = await userRewardsSummaryService.getSummary(user.id);

        if (data) {
          setSummary(data);
          cacheRef.current = { data, timestamp: now };
        } else {
          // Set default for new users
          const defaultSummary: UserRewardsSummary = {
            user_id: user.id,
            total_earned: 0,
            available_balance: 0,
            total_withdrawn: 0,
            current_streak: 0,
            longest_streak: 0,
            trust_score: 50,
            level: 1,
            next_level_threshold: 100,
            currency_code: "USD",
            total_activities: 0,
            activities_this_month: 0,
            last_activity_at: null,
            updated_at: new Date().toISOString(),
          };
          setSummary(defaultSummary);
          cacheRef.current = { data: defaultSummary, timestamp: now };
        }

        setLastUpdated(new Date(now));
      } catch (err) {
        console.error("Error fetching summary:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch rewards summary"));
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id]
  );

  // Initial fetch and real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    // Fetch initial data
    fetchSummary();

    // Subscribe to real-time updates
    subscriptionRef.current = userRewardsSummaryService.subscribeToSummary(
      user.id,
      (updatedSummary) => {
        setSummary(updatedSummary);
        cacheRef.current = { data: updatedSummary, timestamp: Date.now() };
        setLastUpdated(new Date());
      },
      (err) => {
        console.error("Subscription error:", err);
        setError(err instanceof Error ? err : new Error("Real-time subscription error"));
      }
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [user?.id, fetchSummary]);

  // Refresh summary with debounce
  const refresh = useCallback(async () => {
    if (!user?.id) return;

    // Clear previous timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Set new timeout for debounced refresh
    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        setError(null);
        setIsRefreshing(true);
        await userRewardsSummaryService.updateSummaryOnActivity(user.id);
        await fetchSummary(true); // Skip cache on manual refresh
      } catch (err) {
        console.error("Error refreshing summary:", err);
        setError(err instanceof Error ? err : new Error("Failed to refresh summary"));
      } finally {
        setIsRefreshing(false);
      }
    }, REFRESH_DEBOUNCE_MS);
  }, [user?.id, fetchSummary]);

  // Update trust score
  const updateTrustScore = useCallback(async () => {
    if (!user?.id || !summary) return;

    try {
      setError(null);
      const success = await userRewardsSummaryService.updateTrustScore(user.id);

      if (success) {
        // Clear cache to fetch fresh data
        cacheRef.current = { data: null, timestamp: 0 };
        await fetchSummary(true);
      }
    } catch (err) {
      console.error("Error updating trust score:", err);
      setError(err instanceof Error ? err : new Error("Failed to update trust score"));
    }
  }, [user?.id, summary, fetchSummary]);

  // Withdraw funds
  const withdraw = useCallback(
    async (amount: number, method: string): Promise<boolean> => {
      if (!user?.id || !summary) {
        setError(new Error("User or summary not available"));
        return false;
      }

      try {
        setError(null);

        if (summary.available_balance < amount) {
          setError(new Error("Insufficient balance"));
          return false;
        }

        const success = await userRewardsSummaryService.withdrawFunds(
          user.id,
          amount,
          method
        );

        if (success) {
          // Update local state optimistically
          setSummary((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              available_balance: prev.available_balance - amount,
              total_withdrawn: prev.total_withdrawn + amount,
            };
          });

          // Clear cache and fetch fresh data
          cacheRef.current = { data: null, timestamp: 0 };
          await fetchSummary(true);
        }

        return success;
      } catch (err) {
        console.error("Error processing withdrawal:", err);
        setError(err instanceof Error ? err : new Error("Failed to process withdrawal"));
        return false;
      }
    },
    [user?.id, summary, fetchSummary]
  );

  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current = { data: null, timestamp: 0 };
  }, []);

  // Calculate cache age
  const cacheAge = lastUpdated ? Date.now() - lastUpdated.getTime() : -1;

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  return {
    summary,
    isLoading,
    isRefreshing,
    error,
    refresh,
    updateTrustScore,
    withdraw,
    clearCache,
    lastUpdated,
    cacheAge,
  };
};
