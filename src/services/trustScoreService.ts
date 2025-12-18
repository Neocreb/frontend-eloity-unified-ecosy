// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface TrustFactor {
  engagement_quality: number; // 0-100, based on content reception
  activity_consistency: number; // 0-100, based on login streaks
  peer_validation: number; // 0-100, based on verified interactions
  spam_incidents: number; // Negative impact
  profile_completeness: number; // 0-100
  account_age_days: number;
  verified_transactions: number;
}

export interface TrustScoreCalculation {
  factors: TrustFactor;
  baseScore: number;
  decayAmount: number;
  finalScore: number;
  changes: string[];
}

export interface TrustHistoryEntry {
  id: string;
  user_id: string;
  old_score: number;
  new_score: number;
  change_amount: number;
  change_percentage: number;
  change_reason: string;
  factor_type: string;
  metadata: Record<string, any>;
  created_at: string;
}

class TrustScoreService {
  /**
   * Calculate comprehensive trust score
   * Formula: (engagement * 0.4) + (consistency * 0.2) + (validation * 0.2) + (profile * 0.1) - (spam * 0.1)
   */
  async calculateTrustScore(userId: string): Promise<TrustScoreCalculation | null> {
    try {
      const factors = await this.calculateTrustFactors(userId);
      if (!factors) return null;

      // Base calculation
      let baseScore =
        factors.engagement_quality * 0.4 +
        factors.activity_consistency * 0.2 +
        factors.peer_validation * 0.2 +
        factors.profile_completeness * 0.1;

      // Subtract spam incidents
      const spamPenalty = Math.min(factors.spam_incidents * 5, 30); // Max 30 point penalty
      baseScore -= spamPenalty;

      // Account age bonus (new accounts get benefit of doubt)
      let ageBonus = 0;
      if (factors.account_age_days < 7) {
        ageBonus = 10; // New accounts: +10 points
      } else if (factors.account_age_days < 30) {
        ageBonus = 5; // Young accounts: +5 points
      } else if (factors.account_age_days > 365) {
        ageBonus = 3; // Established accounts: +3 points
      }
      baseScore += ageBonus;

      // Clamp score 0-100
      baseScore = Math.max(0, Math.min(100, baseScore));

      // Calculate decay (inactivity)
      const decayAmount = await this.calculateDecay(userId);
      const finalScore = Math.max(0, baseScore - decayAmount);

      const changes: string[] = [];
      if (factors.engagement_quality > 70) changes.push("High engagement");
      if (factors.activity_consistency > 70) changes.push("Consistent activity");
      if (factors.spam_incidents > 0) changes.push(`${factors.spam_incidents} spam incidents`);
      if (ageBonus > 0) changes.push(`New account bonus: +${ageBonus}`);

      return {
        factors,
        baseScore,
        decayAmount,
        finalScore: Math.round(finalScore),
        changes,
      };
    } catch (err) {
      console.error("Exception calculating trust score:", err);
      return null;
    }
  }

  /**
   * Calculate individual trust factors
   */
  async calculateTrustFactors(userId: string): Promise<TrustFactor | null> {
    try {
      // Get user profile for account age and completion
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return null;
      }

      // Account age
      const accountAgeDays = profile
        ? Math.floor(
            (Date.now() - new Date(profile.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
          )
        : 0;

      // Profile completeness
      const profileCompleteness = this.calculateProfileCompleteness(profile);

      // Engagement quality: based on received likes/comments
      const engagementQuality = await this.calculateEngagementQuality(userId);

      // Activity consistency: login streaks, daily activities
      const activityConsistency = await this.calculateActivityConsistency(userId);

      // Peer validation: verified transactions, endorsements
      const peerValidation = await this.calculatePeerValidation(userId);

      // Spam incidents: reports, flags
      const spamIncidents = await this.countSpamIncidents(userId);

      // Verified transactions (crypto, marketplace purchases with completion)
      const verifiedTransactions = await this.countVerifiedTransactions(userId);

      return {
        engagement_quality: Math.min(engagementQuality, 100),
        activity_consistency: Math.min(activityConsistency, 100),
        peer_validation: Math.min(peerValidation, 100),
        spam_incidents: spamIncidents,
        profile_completeness: profileCompleteness,
        account_age_days: accountAgeDays,
        verified_transactions: verifiedTransactions,
      };
    } catch (err) {
      console.error("Exception calculating trust factors:", err);
      return null;
    }
  }

  /**
   * Calculate profile completeness score
   */
  private calculateProfileCompleteness(profile: any): number {
    if (!profile) return 0;

    let completeness = 0;
    const fields = [
      "full_name",
      "avatar_url",
      "bio",
      "location",
      "phone",
      "website",
    ];

    for (const field of fields) {
      if (profile[field]) completeness += (100 / fields.length);
    }

    // Bonus for verification
    if (profile.is_verified) completeness += 10;

    return Math.min(completeness, 100);
  }

  /**
   * Calculate engagement quality based on content performance
   */
  private async calculateEngagementQuality(userId: string): Promise<number> {
    try {
      // Get recent posts and their engagement
      const { data: activities, error } = await supabase
        .from("activity_transactions")
        .select("*")
        .eq("user_id", userId)
        .in("activity_type", [
          "like_received",
          "comment_received",
          "share_received",
        ])
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error) {
        console.error("Error fetching engagement activities:", error);
        return 50; // Default
      }

      const activityCount = activities?.length || 0;

      // Score based on activity count
      // 0-10 activities: 10-40 points
      // 10-50 activities: 40-70 points
      // 50+ activities: 70-100 points
      if (activityCount < 10) return 10 + (activityCount / 10) * 30;
      if (activityCount < 50) return 40 + ((activityCount - 10) / 40) * 30;
      return 70 + Math.min((activityCount - 50) / 100, 1) * 30;
    } catch (err) {
      console.error("Exception calculating engagement quality:", err);
      return 50;
    }
  }

  /**
   * Calculate activity consistency based on login streaks
   */
  private async calculateActivityConsistency(userId: string): Promise<number> {
    try {
      // Get user's daily stats
      const { data: dailyStats, error } = await supabase
        .from("user_daily_stats")
        .select("*")
        .eq("user_id", userId)
        .order("stats_date", { ascending: false })
        .limit(90);

      if (error) {
        console.error("Error fetching daily stats:", error);
        return 30; // Default for new users
      }

      if (!dailyStats || dailyStats.length === 0) {
        return 0; // No activity
      }

      // Calculate streak
      let currentStreak = 0;
      const today = new Date().toDateString();

      for (let i = 0; i < dailyStats.length; i++) {
        const statDate = new Date(dailyStats[i].stats_date);
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);

        if (statDate.toDateString() === expectedDate.toDateString()) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Score based on streak
      // 0 days: 0 points
      // 1-3 days: 10-30 points
      // 3-7 days: 30-50 points
      // 7-30 days: 50-80 points
      // 30+ days: 80-100 points
      if (currentStreak === 0) return 0;
      if (currentStreak <= 3) return 10 + (currentStreak / 3) * 20;
      if (currentStreak <= 7) return 30 + ((currentStreak - 3) / 4) * 20;
      if (currentStreak <= 30) return 50 + ((currentStreak - 7) / 23) * 30;
      return Math.min(80 + ((currentStreak - 30) / 100), 100);
    } catch (err) {
      console.error("Exception calculating activity consistency:", err);
      return 30;
    }
  }

  /**
   * Calculate peer validation score
   */
  private async calculatePeerValidation(userId: string): Promise<number> {
    try {
      // Count verified transactions (orders, freelance completions)
      const { data: referrals, error } = await supabase
        .from("referral_tracking")
        .select("*")
        .eq("referrer_id", userId)
        .eq("status", "verified");

      if (error) {
        console.error("Error fetching referral validation:", error);
        return 30; // Default
      }

      const verifiedReferrals = referrals?.length || 0;

      // Score based on verified referrals/transactions
      // 0: 10 points (default for account)
      // 1-3: 30-50 points
      // 3-10: 50-80 points
      // 10+: 80-100 points
      if (verifiedReferrals === 0) return 30;
      if (verifiedReferrals <= 3) return 30 + (verifiedReferrals / 3) * 20;
      if (verifiedReferrals <= 10) return 50 + ((verifiedReferrals - 3) / 7) * 30;
      return Math.min(80 + ((verifiedReferrals - 10) / 50), 100);
    } catch (err) {
      console.error("Exception calculating peer validation:", err);
      return 30;
    }
  }

  /**
   * Count spam incidents from spam_detection table
   */
  private async countSpamIncidents(userId: string): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from("spam_detection")
        .select("id")
        .eq("user_id", userId)
        .eq("severity", "high")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .is("resolved_at", null);

      if (error) {
        console.error("Error counting spam incidents:", error);
        return 0;
      }

      return data?.length || 0;
    } catch (err) {
      console.error("Exception counting spam incidents:", err);
      return 0;
    }
  }

  /**
   * Count verified transactions (purchases, freelance completions)
   */
  private async countVerifiedTransactions(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("activity_transactions")
        .select("id")
        .eq("user_id", userId)
        .in("status", ["completed"])
        .in("activity_type", [
          "product_purchase",
          "job_completed",
          "referral_first_purchase",
        ]);

      if (error) {
        console.error("Error counting verified transactions:", err);
        return 0;
      }

      return data?.length || 0;
    } catch (err) {
      console.error("Exception counting verified transactions:", err);
      return 0;
    }
  }

  /**
   * Calculate trust score decay for inactivity
   */
  private async calculateDecay(userId: string): Promise<number> {
    try {
      // Get last activity
      const { data: lastActivity, error } = await supabase
        .from("activity_transactions")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching last activity:", error);
        return 0;
      }

      if (!lastActivity) {
        return 0; // New user, no decay
      }

      const lastActivityDate = new Date(lastActivity.created_at);
      const daysSinceActivity = Math.floor(
        (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Decay formula:
      // 0-7 days: no decay
      // 7-14 days: 1 point per day
      // 14-30 days: 1.5 points per day
      // 30+ days: 2 points per day (max 30 points)
      if (daysSinceActivity <= 7) return 0;
      if (daysSinceActivity <= 14) return (daysSinceActivity - 7) * 1;
      if (daysSinceActivity <= 30) return 7 + (daysSinceActivity - 14) * 1.5;
      return Math.min(7 + 16 * 1.5 + (daysSinceActivity - 30) * 2, 30);
    } catch (err) {
      console.error("Exception calculating decay:", err);
      return 0;
    }
  }

  /**
   * Update user's trust score and log the change
   */
  async updateTrustScore(
    userId: string,
    reason: string,
    options?: {
      factorType?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<number | null> {
    try {
      // Calculate new score
      const calculation = await this.calculateTrustScore(userId);
      if (!calculation) return null;

      const newScore = calculation.finalScore;

      // Get old score
      const { data: summary, error: summaryError } = await supabase
        .from("user_rewards_summary")
        .select("trust_score")
        .eq("user_id", userId)
        .single();

      if (summaryError && summaryError.code !== "PGRST116") {
        console.error("Error fetching current trust score:", summaryError);
        return null;
      }

      const oldScore = summary?.trust_score || 50;
      const changeAmount = newScore - oldScore;
      const changePercentage = (changeAmount / oldScore) * 100;

      // Log the change
      const { error: logError } = await supabase
        .from("trust_history")
        .insert([
          {
            user_id: userId,
            old_score: oldScore,
            new_score: newScore,
            change_amount: changeAmount,
            change_percentage: changePercentage,
            change_reason: reason,
            factor_type: options?.factorType || "manual",
            metadata: options?.metadata || {},
          },
        ]);

      if (logError) {
        console.error("Error logging trust score change:", logError);
        return null;
      }

      // Update summary
      const { error: updateError } = await supabase
        .from("user_rewards_summary")
        .upsert(
          {
            user_id: userId,
            trust_score: newScore,
          },
          { onConflict: "user_id" }
        );

      if (updateError) {
        console.error("Error updating trust score in summary:", updateError);
        return null;
      }

      return newScore;
    } catch (err) {
      console.error("Exception updating trust score:", err);
      return null;
    }
  }

  /**
   * Get trust score history for user
   */
  async getTrustHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TrustHistoryEntry[]> {
    try {
      const { data, error } = await supabase
        .from("trust_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching trust history:", error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error("Exception fetching trust history:", err);
      return [];
    }
  }

  /**
   * Subscribe to trust score changes
   */
  subscribeTrustScoreChanges(
    userId: string,
    callback: (entry: TrustHistoryEntry) => void
  ) {
    return supabase
      .channel(`trust_score_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trust_history",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as TrustHistoryEntry);
        }
      )
      .subscribe();
  }
}

export const trustScoreService = new TrustScoreService();
