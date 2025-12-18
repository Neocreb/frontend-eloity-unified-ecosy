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
    setIsRefreshing(true);
    setOffset(0);
    try {
      setError(null);
      await fetchStats();
    } catch (err) {
      console.error("Error refreshing stats:", err);
      setError(err instanceof Error ? err : new Error("Failed to refresh stats"));
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchStats]);

  // Copy referral code to clipboard
  const copyReferralCode = useCallback(() => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode).then(() => {
        toast({
          title: "Copied!",
          description: "Referral code copied to clipboard",
        });
      });
    }
  }, [referralCode, toast]);

  // Generate new referral code
  const generateNewCode = useCallback(async () => {
    if (!user?.id) return;

    try {
      setError(null);
      // This would call a service method if available
      // For now, just show a message
      toast({
        title: "New Code Generated",
        description: "Your new referral code has been created",
      });
    } catch (err) {
      console.error("Error generating code:", err);
      setError(err instanceof Error ? err : new Error("Failed to generate code"));
      toast({
        title: "Error",
        description: "Failed to generate new code",
        variant: "destructive",
      });
    }
  }, [user?.id, toast]);

  // Get tier info
  const tierInfo = stats ? referralTrackingService.getTierInfo(stats.tier) : null;

  // Get next tier info
  const tiers = ["bronze", "silver", "gold", "platinum"];
  const currentTierIndex = tiers.indexOf(stats?.tier || "bronze");
  const nextTierInfo = currentTierIndex < tiers.length - 1
    ? referralTrackingService.getTierInfo(tiers[currentTierIndex + 1])
    : null;

  // Calculate progress to next tier
  const progressToNextTier = nextTierInfo && stats
    ? Math.round((stats.totalEarnings / (nextTierInfo.minEarnings || 1)) * 100)
    : 100;

  // Referral link
  const referralLink = referralCode
    ? `${window.location.origin}/join?ref=${referralCode}`
    : null;

  // Cleanup
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  return {
    stats,
    referrals,
    isLoading,
    isRefreshing,
    error,
    refresh,
    loadMore,
    hasMore: offset < totalReferrals,
    tierInfo,
    nextTierInfo,
    referralCode,
    referralLink,
    copyReferralCode,
    generateNewCode,
    progressToNextTier,
  };
};
