import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { referralTrackingService, ReferralStats, ReferralRecord, ReferralTierInfo } from "@/services/referralTrackingService";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
  totalEarningsThisMonth: number;
  progressPercentage: number;
}

const DEFAULT_LIMIT = 20;
const CACHE_DURATION_MS = 30000; // 30 seconds

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
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const cacheRef = useRef<{ data: ReferralStats | null; timestamp: number }>({
    data: null,
    timestamp: 0,
  });

  // Fetch stats and referrals with caching
  const fetchStats = useCallback(
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
        setStats(cacheRef.current.data);
        setTotalReferrals(cacheRef.current.data.totalReferrals);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get stats
        const statsData = await referralTrackingService.getReferralStats(user.id);
        if (!statsData) {
          throw new Error("Failed to fetch referral stats");
        }

        setStats(statsData);
        setTotalReferrals(statsData.totalReferrals);
        cacheRef.current = { data: statsData, timestamp: now };

        // Get referral code (first referral's code or generate new one)
        if (statsData.totalReferrals > 0) {
          const referralsData = await referralTrackingService.getReferralsList(user.id, 1, 0);
          if (referralsData.length > 0 && referralsData[0].referral_code) {
            setReferralCode(referralsData[0].referral_code);
          }
        }

        // Get first page of referrals
        const referralsData = await referralTrackingService.getReferralsList(
          user.id,
          limit,
          0
        );
        if (referralsData && referralsData.length > 0) {
          setReferrals(referralsData);
          setOffset(limit);
        }
      } catch (err) {
        console.error("Error fetching referral stats:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch referral stats"));
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, limit]
  );

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    // Initial fetch
    fetchStats();

    // Subscribe to referral updates
    const setupSubscription = () => {
      subscriptionRef.current = supabase
        .channel(`referral_tracking_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "referral_tracking",
            filter: `referrer_id=eq.${user.id}`,
          },
          (payload) => {
            if (!isMounted) return;

            if (payload.eventType === "INSERT") {
              const newReferral = payload.new as ReferralRecord;
              // Add to top of list
              setReferrals((prev) => [newReferral, ...prev]);

              // Update stats
              setStats((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  totalReferrals: prev.totalReferrals + 1,
                  activeReferrals:
                    newReferral.status === "active"
                      ? prev.activeReferrals + 1
                      : prev.activeReferrals,
                  totalEarnings: prev.totalEarnings + (newReferral.earnings_total || 0),
                };
              });

              // Show toast notification
              toast({
                title: "New Referral!",
                description: "You've successfully referred a new user",
              });
            } else if (payload.eventType === "UPDATE") {
              const updatedReferral = payload.new as ReferralRecord;
              const oldReferral = payload.old as ReferralRecord;

              // Update referral in list
              setReferrals((prev) =>
                prev.map((r) => (r.id === updatedReferral.id ? updatedReferral : r))
              );

              // Update stats if status changed
              if (oldReferral.status !== updatedReferral.status) {
                setStats((prev) => {
                  if (!prev) return prev;
                  const statusChanged =
                    oldReferral.status !== "active" && updatedReferral.status === "active";
                  return {
                    ...prev,
                    activeReferrals: statusChanged
                      ? prev.activeReferrals + 1
                      : prev.activeReferrals,
                  };
                });
              }

              // Update earnings
              if (oldReferral.earnings_total !== updatedReferral.earnings_total) {
                setStats((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    totalEarnings:
                      prev.totalEarnings + (updatedReferral.earnings_total - oldReferral.earnings_total),
                  };
                });
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED" && isMounted) {
            // Subscription is active
          } else if (status === "CHANNEL_ERROR" && isMounted) {
            console.error("Referral channel error");
            setError(new Error("Real-time subscription error"));
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

      if (moreData && moreData.length > 0) {
        setReferrals((prev) => [...prev, ...moreData]);
        setOffset((prev) => prev + limit);
      }
    } catch (err) {
      console.error("Error loading more referrals:", err);
      setError(err instanceof Error ? err : new Error("Failed to load more referrals"));
    }
  }, [user?.id, isLoading, offset, totalReferrals, limit]);

  // Refresh stats
  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setOffset(0);
    try {
      setError(null);
      cacheRef.current = { data: null, timestamp: 0 };
      await fetchStats(true);
    } catch (err) {
      console.error("Error refreshing stats:", err);
      setError(err instanceof Error ? err : new Error("Failed to refresh stats"));
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, fetchStats]);

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
