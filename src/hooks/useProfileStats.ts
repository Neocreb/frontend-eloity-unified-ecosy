import { useState, useEffect } from "react";
import { profileService } from "@/services/profileService";
import { UserProfile } from "@/types/user";

export interface ProfileStatsData {
  followerCount: number;
  followingCount: number;
  profileViews: number;
  marketplaceSales: number;
  cryptoTrades: number;
  likesCount: number;
  sharesCount: number;
  walletBalance: number;
  eloPoints: number;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch comprehensive profile statistics for the stats carousel
 * @param profile - The user profile object
 * @param userId - The user ID to fetch stats for
 * @param enabled - Whether to fetch stats (useful for conditional fetching)
 * @param walletBalance - Optional wallet balance (passed from context)
 * @param eloPoints - Optional ELO points (passed from rewards context)
 */
export const useProfileStats = (
  profile: UserProfile | null | undefined,
  userId: string | null | undefined,
  enabled: boolean = true,
  walletBalance?: number,
  eloPoints?: number
): ProfileStatsData => {
  const [stats, setStats] = useState<ProfileStatsData>({
    followerCount: 0,
    followingCount: 0,
    profileViews: 0,
    marketplaceSales: 0,
    cryptoTrades: 0,
    likesCount: 0,
    sharesCount: 0,
    walletBalance: walletBalance || 0,
    eloPoints: eloPoints || 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!enabled || !userId || !profile) {
      setStats((prev) => ({
        ...prev,
        loading: false,
        walletBalance: walletBalance || 0,
        eloPoints: eloPoints || 0,
      }));
      return;
    }

    let isMounted = true;

    const fetchStats = async () => {
      try {
        setStats((prev) => ({
          ...prev,
          loading: true,
          error: null,
        }));

        // Fetch all stats in parallel
        const [
          followerCount,
          followingCount,
          profileViews,
          marketplaceSales,
          cryptoTrades,
          likesCount,
          sharesCount,
        ] = await Promise.all([
          profileService.getFollowersCount(userId),
          profileService.getFollowingCount(userId),
          profileService.getProfileViewsCount(userId),
          profileService.getMarketplaceSalesCount(userId),
          profileService.getCryptoTradesCount(userId),
          profileService.getLikesCount(userId),
          profileService.getSharesCount(userId),
        ]);

        if (isMounted) {
          setStats({
            followerCount,
            followingCount,
            profileViews,
            marketplaceSales,
            cryptoTrades,
            likesCount,
            sharesCount,
            walletBalance: walletBalance || 0,
            eloPoints: eloPoints || 0,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (isMounted) {
          setStats((prev) => ({
            ...prev,
            loading: false,
            walletBalance: walletBalance || 0,
            eloPoints: eloPoints || 0,
            error: error instanceof Error ? error.message : "Failed to fetch stats",
          }));
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [userId, profile, enabled, walletBalance, eloPoints]);

  return stats;
};

/**
 * Hook to refresh profile stats manually
 * Useful for refetching after actions like following/unfollowing
 */
export const useRefreshProfileStats = () => {
  const refresh = async (userId: string) => {
    try {
      // Fetch all stats in parallel
      const stats = await Promise.all([
        profileService.getFollowersCount(userId),
        profileService.getFollowingCount(userId),
        profileService.getProfileViewsCount(userId),
        profileService.getMarketplaceSalesCount(userId),
        profileService.getCryptoTradesCount(userId),
        profileService.getLikesCount(userId),
        profileService.getSharesCount(userId),
      ]);

      return {
        followerCount: stats[0],
        followingCount: stats[1],
        profileViews: stats[2],
        marketplaceSales: stats[3],
        cryptoTrades: stats[4],
        likesCount: stats[5],
        sharesCount: stats[6],
      };
    } catch (error) {
      console.error("Error refreshing stats:", error);
      throw error;
    }
  };

  return { refresh };
};
