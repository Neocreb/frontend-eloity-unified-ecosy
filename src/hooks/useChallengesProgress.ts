import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface ChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  target_value: number;
  status: string;
  completion_date: string | null;
  reward_claimed: boolean;
  claim_date: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  target_value: number;
  points_reward: number;
  icon?: string;
  difficulty?: string;
  category?: string;
}

export interface ChallengeWithProgress extends Challenge {
  userProgress?: ChallengeProgress;
  progressPercentage?: number;
  isCompleted?: boolean;
}

interface UseChallengesProgressReturn {
  challenges: ChallengeWithProgress[];
  activeChallenges: ChallengeWithProgress[];
  completedChallenges: ChallengeWithProgress[];
  unclaimedChallenges: ChallengeWithProgress[];
  isLoading: boolean;
  error: Error | null;
  isUpdating: boolean;
  updateProgress: (challengeId: string, newProgress: number) => Promise<boolean>;
  claimReward: (challengeId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  filterByStatus: (status: string) => ChallengeWithProgress[];
  filterByType: (type: string) => ChallengeWithProgress[];
  getTotalRewardsAvailable: () => number;
}

export const useChallengesProgress = (): UseChallengesProgressReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const cacheRef = useRef<{ data: ChallengeWithProgress[] | null; timestamp: number }>({
    data: null,
    timestamp: 0,
  });

  // Default challenges library
  const getMockChallenges = useCallback((): Challenge[] => {
    return [
      {
        id: "daily-post",
        title: "Daily Post",
        description: "Create a post every day to build your streak",
        type: "daily",
        target_value: 1,
        points_reward: 10,
        difficulty: "easy",
        category: "content",
      },
      {
        id: "weekly-engagement",
        title: "Weekly Engagement",
        description: "Get 100+ engagements on your content this week",
        type: "content",
        target_value: 100,
        points_reward: 50,
        difficulty: "medium",
        category: "content",
      },
      {
        id: "referral-friend",
        title: "Invite a Friend",
        description: "Refer a friend who completes signup",
        type: "referral",
        target_value: 1,
        points_reward: 25,
        difficulty: "easy",
        category: "social",
      },
      {
        id: "challenge-champion",
        title: "Challenge Champion",
        description: "Win 5 challenges",
        type: "challenge",
        target_value: 5,
        points_reward: 75,
        difficulty: "hard",
        category: "challenges",
      },
      {
        id: "generous-tipper",
        title: "Generous Tipper",
        description: "Send tips 10 times",
        type: "engagement",
        target_value: 10,
        points_reward: 40,
        difficulty: "medium",
        category: "engagement",
      },
      {
        id: "marketplace-master",
        title: "Marketplace Master",
        description: "Make 3 marketplace sales",
        type: "marketplace",
        target_value: 3,
        points_reward: 60,
        difficulty: "medium",
        category: "marketplace",
      },
    ];
  }, []);

  // Fetch challenges and user progress
  const fetchChallenges = useCallback(
    async (skipCache = false) => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      // Check cache
      const now = Date.now();
      const cacheAge = now - cacheRef.current.timestamp;
      const cacheValid = !skipCache && cacheRef.current.data && cacheAge < 60000; // 1 minute cache

      if (cacheValid && cacheRef.current.data) {
        setChallenges(cacheRef.current.data);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const mockChallenges = getMockChallenges();

        // Fetch user progress for each challenge
        const { data: userProgress, error: progressError } = await supabase
          .from("user_challenges")
          .select("*")
          .eq("user_id", user.id);

        if (progressError && progressError.code !== "PGRST116") {
          console.error("Error fetching user progress:", progressError);
          throw progressError;
        }

        // Combine challenges with user progress and calculate percentages
        const combinedChallenges: ChallengeWithProgress[] = mockChallenges.map((challenge) => {
          const userChallengeProgress = userProgress?.find(
            (p) => p.challenge_id === challenge.id
          );

          const progressPercentage = userChallengeProgress
            ? Math.min(100, (userChallengeProgress.progress / challenge.target_value) * 100)
            : 0;

          return {
            ...challenge,
            userProgress: userChallengeProgress,
            progressPercentage,
            isCompleted: userChallengeProgress?.status === "completed",
          };
        });

        setChallenges(combinedChallenges);
        cacheRef.current = { data: combinedChallenges, timestamp: now };
      } catch (err) {
        console.error("Error fetching challenges:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch challenges"));
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, getMockChallenges]
  );

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    // Fetch initial data
    fetchChallenges();

    // Subscribe to real-time updates
    const setupSubscription = () => {
      subscriptionRef.current = supabase
        .channel(`user_challenges_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_challenges",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!isMounted) return;

            if (payload.eventType === "INSERT") {
              // Add new challenge progress
              const newProgress = payload.new as ChallengeProgress;
              setChallenges((prev) =>
                prev.map((c) =>
                  c.id === newProgress.challenge_id
                    ? {
                        ...c,
                        userProgress: newProgress,
                        progressPercentage: Math.min(
                          100,
                          (newProgress.progress / c.target_value) * 100
                        ),
                        isCompleted: newProgress.status === "completed",
                      }
                    : c
                )
              );
            } else if (payload.eventType === "UPDATE") {
              // Update challenge progress
              const updatedProgress = payload.new as ChallengeProgress;
              const oldProgress = payload.old as ChallengeProgress;

              setChallenges((prev) =>
                prev.map((c) =>
                  c.id === updatedProgress.challenge_id
                    ? {
                        ...c,
                        userProgress: updatedProgress,
                        progressPercentage: Math.min(
                          100,
                          (updatedProgress.progress / c.target_value) * 100
                        ),
                        isCompleted: updatedProgress.status === "completed",
                      }
                    : c
                )
              );

              // Show notification for completion
              if (
                updatedProgress.status === "completed" &&
                oldProgress.status !== "completed"
              ) {
                toast({
                  title: "Challenge Completed!",
                  description: "You've completed a challenge. Claim your reward!",
                });
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED" && isMounted) {
            // Subscription active
          } else if (status === "CHANNEL_ERROR" && isMounted) {
            console.error("Channel error");
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
  }, [user?.id, fetchChallenges, toast]);

  // Update progress
  const updateProgress = useCallback(
    async (challengeId: string, newProgress: number): Promise<boolean> => {
      if (!user?.id) return false;

      setIsUpdating(true);
      try {
        setError(null);

        // Get or create challenge progress record
        const { data: existing, error: fetchError } = await supabase
          .from("user_challenges")
          .select("*")
          .eq("user_id", user.id)
          .eq("challenge_id", challengeId)
          .single();

        let success = false;

        if (existing) {
          // Update existing record
          const { error: updateError } = await supabase
            .from("user_challenges")
            .update({
              progress: newProgress,
              status: newProgress >= existing.target_value ? "completed" : "active",
              completion_date: newProgress >= existing.target_value ? new Date().toISOString() : null,
            })
            .eq("id", existing.id);

          success = !updateError;

          if (updateError) {
            console.error("Error updating progress:", updateError);
            setError(updateError instanceof Error ? updateError : new Error("Failed to update progress"));
          }
        } else {
          // Create new record
          const challenge = challenges.find((c) => c.id === challengeId);
          if (!challenge) {
            setError(new Error("Challenge not found"));
            return false;
          }

          const { error: insertError } = await supabase
            .from("user_challenges")
            .insert([
              {
                user_id: user.id,
                challenge_id: challengeId,
                progress: newProgress,
                target_value: challenge.target_value,
                status: newProgress >= challenge.target_value ? "completed" : "active",
                completion_date: newProgress >= challenge.target_value ? new Date().toISOString() : null,
              },
            ]);

          success = !insertError;

          if (insertError) {
            console.error("Error creating progress:", insertError);
            setError(insertError instanceof Error ? insertError : new Error("Failed to create progress"));
          }
        }

        if (success) {
          // Refresh challenges data
          await fetchChallenges();
          toast({
            title: "Progress Updated",
            description: `Progress for ${challengeId} updated successfully`,
          });
        }

        return success;
      } catch (err) {
        console.error("Exception updating progress:", err);
        const errorMsg = err instanceof Error ? err.message : "Failed to update progress";
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
    [user?.id, challenges, fetchChallenges, toast]
  );

  // Claim reward
  const claimReward = useCallback(
    async (challengeId: string): Promise<boolean> => {
      if (!user?.id) return false;

      setIsUpdating(true);
      try {
        setError(null);

        const { data, error } = await supabase
          .from("user_challenges")
          .update({
            reward_claimed: true,
            claim_date: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("challenge_id", challengeId)
          .select()
          .single();

        if (error) {
          console.error("Error claiming reward:", error);
          setError(error instanceof Error ? error : new Error("Failed to claim reward"));
          toast({
            title: "Error",
            description: "Failed to claim reward",
            variant: "destructive",
          });
          return false;
        }

        if (data) {
          // Update local state
          setChallenges((prev) =>
            prev.map((c) =>
              c.id === challengeId
                ? { ...c, userProgress: { ...c.userProgress, ...data } as ChallengeProgress }
                : c
            )
          );

          toast({
            title: "Reward Claimed!",
            description: "You've claimed your reward",
          });
        }

        return !error;
      } catch (err) {
        console.error("Exception claiming reward:", err);
        const errorMsg = err instanceof Error ? err.message : "Failed to claim reward";
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
    [user?.id, toast]
  );

  // Refresh data
  const refresh = useCallback(async () => {
    await fetchChallenges();
  }, [fetchChallenges]);

  // Filter by status
  const filterByStatus = useCallback((status: string): ChallengeWithProgress[] => {
    return challenges.filter((c) => c.userProgress?.status === status || status === "all");
  }, [challenges]);

  // Get active and completed challenges
  const activeChallenges = filterByStatus("active");
  const completedChallenges = filterByStatus("completed");

  // Cleanup
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  return {
    challenges,
    activeChallenges,
    completedChallenges,
    isLoading,
    isUpdating,
    error,
    updateProgress,
    claimReward,
    refresh,
    filterByStatus,
  };
};
