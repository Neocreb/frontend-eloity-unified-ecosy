// @ts-nocheck
/**
 * Freelance Rewards Integration Service
 * Tracks freelance activities and awards rewards/points:
 * - Profile creation and completion
 * - Job posting and search
 * - Proposal submission and acceptance
 * - Project completion and success
 * - Review submission and rating
 * - Milestone achievements
 * - Earnings milestones
 */

import { supabase } from "@/integrations/supabase/client";
import { apiCall } from "@/lib/api";

interface RewardActivity {
  userId: string;
  activityType:
    | "freelancer_profile_created"
    | "job_posted"
    | "proposal_submitted"
    | "proposal_accepted"
    | "project_started"
    | "milestone_completed"
    | "project_completed"
    | "review_submitted"
    | "first_earning"
    | "earnings_milestone"
    | "referral_freelancer"
    | "top_rated_achievement";
  points: number;
  description: string;
  metadata?: Record<string, any>;
}

export class FreelanceRewardsIntegrationService {
  /**
   * Award points when freelancer profile is created
   */
  static async rewardProfileCreation(freelancerId: string): Promise<void> {
    try {
      await this.recordRewardActivity({
        userId: freelancerId,
        activityType: "freelancer_profile_created",
        points: 100,
        description: "Created freelancer profile",
        metadata: { type: "profile_setup" },
      });
    } catch (error) {
      console.error("Error rewarding profile creation:", error);
    }
  }

  /**
   * Award points when profile is completed (skills, experience, etc.)
   */
  static async rewardProfileCompletion(freelancerId: string): Promise<void> {
    try {
      // Check if profile is truly complete
      const { data: profile } = await supabase
        .from("freelancer_profiles")
        .select("*")
        .eq("id", freelancerId)
        .single();

      if (profile?.is_verified && profile?.title && profile?.bio && profile?.skills?.length > 0) {
        await this.recordRewardActivity({
          userId: freelancerId,
          activityType: "freelancer_profile_created", // Using same type for milestone tracking
          points: 150,
          description: "Completed freelancer profile with all details",
          metadata: {
            type: "profile_completion",
            verified: true,
          },
        });
      }
    } catch (error) {
      console.error("Error rewarding profile completion:", error);
    }
  }

  /**
   * Award points when proposal is submitted
   */
  static async rewardProposalSubmission(
    freelancerId: string,
    jobId: string,
    proposalId: string
  ): Promise<void> {
    try {
      await this.recordRewardActivity({
        userId: freelancerId,
        activityType: "proposal_submitted",
        points: 25,
        description: "Submitted proposal for job",
        metadata: {
          jobId,
          proposalId,
        },
      });
    } catch (error) {
      console.error("Error rewarding proposal submission:", error);
    }
  }

  /**
   * Award points when proposal is accepted by client
   */
  static async rewardProposalAccepted(
    freelancerId: string,
    projectId: string,
    amount: number
  ): Promise<void> {
    try {
      const points = Math.min(amount / 10, 500); // Cap at 500 points per project

      await this.recordRewardActivity({
        userId: freelancerId,
        activityType: "proposal_accepted",
        points: Math.floor(points),
        description: `Proposal accepted for project (${amount} USD)`,
        metadata: {
          projectId,
          amount,
          pointsCalculation: `${amount}/10`,
        },
      });
    } catch (error) {
      console.error("Error rewarding proposal acceptance:", error);
    }
  }

  /**
   * Award points when project starts
   */
  static async rewardProjectStart(
    freelancerId: string,
    projectId: string,
    amount: number
  ): Promise<void> {
    try {
      await this.recordRewardActivity({
        userId: freelancerId,
        activityType: "project_started",
        points: 50,
        description: "Project started",
        metadata: {
          projectId,
          amount,
        },
      });
    } catch (error) {
      console.error("Error rewarding project start:", error);
    }
  }

  /**
   * Award points when milestone is completed
   */
  static async rewardMilestoneCompletion(
    freelancerId: string,
    projectId: string,
    milestoneNumber: number,
    amount: number
  ): Promise<void> {
    try {
      await this.recordRewardActivity({
        userId: freelancerId,
        activityType: "milestone_completed",
        points: Math.floor(amount / 20),
        description: `Completed milestone ${milestoneNumber}`,
        metadata: {
          projectId,
          milestoneNumber,
          amount,
        },
      });
    } catch (error) {
      console.error("Error rewarding milestone completion:", error);
    }
  }

  /**
   * Award points when project is completed successfully
   */
  static async rewardProjectCompletion(
    freelancerId: string,
    projectId: string,
    totalAmount: number,
    rating?: number
  ): Promise<void> {
    try {
      let points = Math.min(totalAmount / 5, 1000); // Cap at 1000 points

      // Bonus for high rating
      if (rating && rating >= 4.5) {
        points *= 1.5; // 50% bonus
      }

      await this.recordRewardActivity({
        userId: freelancerId,
        activityType: "project_completed",
        points: Math.floor(points),
        description: `Project completed (${totalAmount} USD, ${rating ? rating + " star rating" : "pending rating"})`,
        metadata: {
          projectId,
          totalAmount,
          rating,
          bonusApplied: rating && rating >= 4.5,
        },
      });
    } catch (error) {
      console.error("Error rewarding project completion:", error);
    }
  }

  /**
   * Award points when review is submitted
   */
  static async rewardReviewSubmission(
    freelancerId: string,
    projectId: string,
    rating: number
  ): Promise<void> {
    try {
      const points = Math.floor(rating * 10); // 10-50 points based on rating

      await this.recordRewardActivity({
        userId: freelancerId,
        activityType: "review_submitted",
        points,
        description: `Submitted ${rating}-star review`,
        metadata: {
          projectId,
          rating,
        },
      });
    } catch (error) {
      console.error("Error rewarding review submission:", error);
    }
  }

  /**
   * Award points for reaching earning milestones
   */
  static async rewardEarningsMilestone(
    freelancerId: string,
    totalEarnings: number
  ): Promise<void> {
    try {
      let points = 0;
      let milestone = "";

      if (totalEarnings >= 10000) {
        points = 1000;
        milestone = "$10,000";
      } else if (totalEarnings >= 5000) {
        points = 500;
        milestone = "$5,000";
      } else if (totalEarnings >= 1000) {
        points = 250;
        milestone = "$1,000";
      } else if (totalEarnings >= 100) {
        points = 100;
        milestone = "$100";
      }

      if (points > 0) {
        await this.recordRewardActivity({
          userId: freelancerId,
          activityType: "earnings_milestone",
          points,
          description: `Reached ${milestone} in earnings`,
          metadata: {
            totalEarnings,
            milestone,
          },
        });
      }
    } catch (error) {
      console.error("Error rewarding earnings milestone:", error);
    }
  }

  /**
   * Award points for achieving top-rated status
   */
  static async rewardTopRatedAchievement(
    freelancerId: string,
    rating: number,
    projectCount: number
  ): Promise<void> {
    try {
      // Top rated: 4.8+ stars with 10+ projects
      if (rating >= 4.8 && projectCount >= 10) {
        await this.recordRewardActivity({
          userId: freelancerId,
          activityType: "top_rated_achievement",
          points: 500,
          description: "Achieved top-rated status (4.8+ stars with 10+ projects)",
          metadata: {
            rating,
            projectCount,
          },
        });
      }
    } catch (error) {
      console.error("Error rewarding top-rated achievement:", error);
    }
  }

  /**
   * Award points for referring a freelancer
   */
  static async rewardFreelancerReferral(referrerId: string, referredId: string): Promise<void> {
    try {
      await this.recordRewardActivity({
        userId: referrerId,
        activityType: "referral_freelancer",
        points: 200,
        description: "Referred a new freelancer",
        metadata: {
          referredId,
        },
      });
    } catch (error) {
      console.error("Error rewarding freelancer referral:", error);
    }
  }

  /**
   * Record reward activity and update user points
   */
  private static async recordRewardActivity(activity: RewardActivity): Promise<void> {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Check if reward already exists (prevent duplicates)
      const { data: existingReward } = await supabase
        .from("freelance_activity_logs")
        .select("id")
        .eq("freelancer_id", activity.userId)
        .eq("activity_type", activity.activityType)
        .eq("metadata->sourceId", activity.metadata?.projectId || null)
        .limit(1);

      // Only record if not already recorded
      if (!existingReward || existingReward.length === 0) {
        // Log the activity
        await supabase.from("freelance_activity_logs").insert([
          {
            freelancer_id: activity.userId,
            activity_type: activity.activityType,
            activity_description: activity.description,
            metadata: {
              ...activity.metadata,
              rewardPoints: activity.points,
            },
            created_at: new Date().toISOString(),
          },
        ]);

        // Award points to user rewards table
        const { data: existingRewards } = await supabase
          .from("user_rewards")
          .select("id, amount")
          .eq("user_id", activity.userId)
          .eq("reward_type", "freelance_activity")
          .single();

        if (existingRewards) {
          // Update existing rewards record
          await supabase
            .from("user_rewards")
            .update({
              amount: (existingRewards.amount || 0) + activity.points,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingRewards.id);
        } else {
          // Create new rewards record
          await supabase.from("user_rewards").insert([
            {
              user_id: activity.userId,
              reward_type: "freelance_activity",
              amount: activity.points,
              description: activity.description,
              metadata: activity.metadata,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error recording reward activity:", error);
      // Don't throw - reward failure shouldn't block main operations
    }
  }

  /**
   * Get freelancer's total reward points
   */
  static async getFreelancerRewardPoints(freelancerId: string): Promise<number> {
    try {
      const { data: rewards, error } = await supabase
        .from("user_rewards")
        .select("amount")
        .eq("user_id", freelancerId)
        .eq("reward_type", "freelance_activity");

      if (error) throw error;

      return (rewards || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
    } catch (error) {
      console.error("Error fetching freelancer reward points:", error);
      return 0;
    }
  }

  /**
   * Get reward activity summary for a freelancer
   */
  static async getFreelancerRewardSummary(freelancerId: string): Promise<Record<string, number>> {
    try {
      const { data: activities, error } = await supabase
        .from("freelance_activity_logs")
        .select("activity_type, metadata")
        .eq("freelancer_id", freelancerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const summary: Record<string, number> = {
        total_activities: 0,
        proposals_submitted: 0,
        projects_completed: 0,
        reviews_submitted: 0,
        milestone_completions: 0,
      };

      (activities || []).forEach((activity: any) => {
        summary.total_activities++;
        if (activity.activity_type === "proposal_submitted") {
          summary.proposals_submitted++;
        } else if (activity.activity_type === "project_completed") {
          summary.projects_completed++;
        } else if (activity.activity_type === "review_submitted") {
          summary.reviews_submitted++;
        } else if (activity.activity_type === "milestone_completed") {
          summary.milestone_completions++;
        }
      });

      return summary;
    } catch (error) {
      console.error("Error fetching freelancer reward summary:", error);
      return {};
    }
  }
}
