import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { referralTrackingService, ReferralStats, ReferralRecord, ReferralTierInfo } from "@/services/referralTrackingService";
import { useToast } from "@/hooks/use-toast";

interface UseReferralStatsReturn {
  stats: ReferralStats | null;
  referrals: ReferralRecord[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  tierInfo: ReferralTierInfo | null;
  nextTierInfo: ReferralTierInfo | null;
  referralCode: string | null;
  referralLink: string | null;
  copyReferralCode: () => void;
  generateNewCode: () => Promise<void>;
  progressToNextTier: number;
}

const DEFAULT_LIMIT = 20;

export const useReferralStats = (): UseReferralStatsReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [limit] = useState(DEFAULT_LIMIT);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Fetch stats and referrals
  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get stats
      const statsData = await referralTrackingService.getReferralStats(user.id);
      setStats(statsData);
      setTotalReferrals(statsData.totalReferrals);

      // Get referral code (first referral's code or generate new one)
      if (statsData.totalReferrals > 0) {
        const referralsData = await referralTrackingService.getReferralsList(user.id, 1, 0);
        if (referralsData.length > 0 && referralsData[0].referral_code) {
          setReferralCode(referralsData[0].referral_code);
        }
      }

      // Get first page of referrals
      const referralsData = await referralTrackingService.getReferralsList(user.id, limit, 0);
      setReferrals(referralsData);
      setOffset(limit);
    } catch (err) {
      console.error("Error fetching referral stats:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch referral stats"));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, limit]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    // Initial fetch
    fetchStats();

    // Subscribe to new referrals
    subscriptionRef.current = referralTrackingService.subscribeToReferrals(
      user.id,
      (newReferral) => {
        // Add to top of list
        setReferrals((prev) => [newReferral, ...prev]);

        // Update stats
        setStats((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            totalReferrals: prev.totalReferrals + 1,
            activeReferrals:
              newReferral.status === "active" ? prev.activeReferrals + 1 : prev.activeReferrals,
            totalEarnings: prev.totalEarnings + (newReferral.earnings_total || 0),
          };
        });

        // Show toast notification
        toast({
          title: "New Referral!",
          description: `You referred ${newReferral.referred_user_id}`,
        });
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
  }, [user?.id, fetchStats, toast]);

  // Load more referrals
  const loadMore = useCallback(async () => {
    if (!user?.id || isLoading || offset >= totalReferrals) return;

    try {
      const moreData = await referralTrackingService.getReferralsList(
        user.id,
        limit,
        offset
      );

      setReferrals((prev) => [...prev, ...moreData]);
      setOffset((prev) => prev + limit);
    } catch (err) {
      console.error("Error loading more referrals:", err);
      setError(err instanceof Error ? err : new Error("Failed to load more referrals"));
    }
  }, [user?.id, isLoading, offset, totalReferrals, limit]);

  // Refresh stats
  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchStats();
  }, [fetchStats]);

  // Get tier info
  const tierInfo = stats ? referralTrackingService.getTierInfo(stats.tier) : null;

  return {
    stats,
    referrals,
    isLoading,
    error,
    refresh,
    loadMore,
    hasMore: offset < totalReferrals,
    tierInfo,
  };
};
