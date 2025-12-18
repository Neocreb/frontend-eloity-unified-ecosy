// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface ReferralRecord {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  referral_code: string;
  status: "pending" | "verified" | "active" | "inactive";
  referral_date: string;
  verification_date: string | null;
  first_purchase_date: string | null;
  earnings_total: number;
  earnings_this_month: number;
  earnings_last_month: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  commission_percentage: number;
  auto_share_total: number;
  auto_share_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  verifiedReferrals: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  avgCommissionPercentage: number;
  topTier: string;
  referralTier: "bronze" | "silver" | "gold" | "platinum";
  autoShareTotal: number;
}

export interface ReferralTierInfo {
  name: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  commissionPercentage: number;
  minEarnings: number;
  benefits: string[];
  color?: string;
}

const TIER_COMMISSIONS = {
  bronze: 0.05, // 5%
  silver: 0.075, // 7.5%
  gold: 0.1, // 10%
  platinum: 0.15, // 15%
} as const;

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 5000, // 5000 ELO earnings from referrals
  gold: 25000, // 25000 ELO earnings
  platinum: 100000, // 100000 ELO earnings
} as const;

class ReferralTrackingService {
  /**
   * Create a new referral record
   */
  async trackReferral(
    referrerId: string,
    referredUserId: string
  ): Promise<ReferralRecord | null> {
    try {
      // Generate unique referral code
      const referralCode = this.generateReferralCode(referrerId);

      const { data, error } = await supabase
        .from("referral_tracking")
        .insert([
          {
            referrer_id: referrerId,
            referred_user_id: referredUserId,
            referral_code: referralCode,
            status: "pending",
            tier: "bronze",
            commission_percentage: TIER_COMMISSIONS.bronze,
            auto_share_percentage: 0.5,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error tracking referral:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Exception tracking referral:", err);
      return null;
    }
  }

  /**
   * Activate a pending referral (when referred user completes profile/purchase)
   */
  async activateReferral(referralId: string): Promise<ReferralRecord | null> {
    try {
      // Update referral status
      const { data, error } = await supabase
        .from("referral_tracking")
        .update({
          status: "verified",
          verification_date: new Date().toISOString(),
        })
        .eq("id", referralId)
        .select()
        .single();

      if (error) {
        console.error("Error activating referral:", error);
        return null;
      }

      if (data) {
        // Award referral signup bonus (500 ELO)
        await this.recordReferralEarning(
          data.referrer_id,
          500,
          "Referral signup bonus",
          data.id
        );
      }

      return data;
    } catch (err) {
      console.error("Exception activating referral:", err);
      return null;
    }
  }

  /**
   * Record earnings from a referred user's activity
   */
  async recordReferralEarning(
    referrerId: string,
    amount: number,
    reason: string,
    referralId?: string
  ): Promise<boolean> {
    try {
      // Get referral to determine commission percentage
      let commissionPercentage = TIER_COMMISSIONS.bronze;

      if (referralId) {
        const { data: referral } = await supabase
          .from("referral_tracking")
          .select("commission_percentage, tier")
          .eq("id", referralId)
          .single();

        if (referral) {
          commissionPercentage = referral.commission_percentage;
        }
      } else {
        // Get referrer's tier
        const stats = await this.getReferralStats(referrerId);
        if (stats) {
          commissionPercentage = TIER_COMMISSIONS[stats.referralTier];
        }
      }

      const commissionAmount = amount * commissionPercentage;

      // Log as activity transaction
      const { error: activityError } = await supabase
        .from("activity_transactions")
        .insert([
          {
            user_id: referrerId,
            activity_type: "referral_activity",
            category: "Referrals",
            amount_eloits: commissionAmount,
            description: `${reason} (${(commissionPercentage * 100).toFixed(1)}% commission)`,
            source_id: referralId,
            source_type: "referral",
            metadata: {
              reason,
              commission_percentage: commissionPercentage,
              base_amount: amount,
            },
            status: "completed",
          },
        ]);

      if (activityError) {
        console.error("Error logging referral earning:", activityError);
        return false;
      }

      // Update referral earnings
      if (referralId) {
        await this.updateReferralEarnings(referralId, commissionAmount);
      }

      // Update user summary
      await this.updateUserSummaryFromReferrals(referrerId);

      return true;
    } catch (err) {
      console.error("Exception recording referral earning:", err);
      return false;
    }
  }

  /**
   * Get comprehensive referral statistics
   */
  async getReferralStats(userId: string): Promise<ReferralStats | null> {
    try {
      const { data: referrals, error } = await supabase
        .from("referral_tracking")
        .select("*")
        .eq("referrer_id", userId);

      if (error) {
        console.error("Error fetching referral stats:", error);
        return null;
      }

      if (!referrals) {
        return {
          totalReferrals: 0,
          activeReferrals: 0,
          verifiedReferrals: 0,
          totalEarnings: 0,
          thisMonthEarnings: 0,
          avgCommissionPercentage: 5,
          topTier: "bronze",
          referralTier: "bronze",
          autoShareTotal: 0,
        };
      }

      // Calculate stats
      const totalReferrals = referrals.length;
      const activeReferrals = referrals.filter(
        (r) => r.status !== "inactive"
      ).length;
      const verifiedReferrals = referrals.filter(
        (r) => r.status === "verified"
      ).length;
      const totalEarnings = referrals.reduce((sum, r) => sum + r.earnings_total, 0);
      const thisMonthEarnings = referrals.reduce((sum, r) => sum + r.earnings_this_month, 0);
      const avgCommissionPercentage =
        referrals.length > 0
          ? referrals.reduce((sum, r) => sum + r.commission_percentage, 0) /
            referrals.length
          : 0.05;
      const autoShareTotal = referrals.reduce((sum, r) => sum + r.auto_share_total, 0);

      // Determine user's tier based on total earnings
      let referralTier: "bronze" | "silver" | "gold" | "platinum" = "bronze";
      if (totalEarnings >= TIER_THRESHOLDS.platinum) {
        referralTier = "platinum";
      } else if (totalEarnings >= TIER_THRESHOLDS.gold) {
        referralTier = "gold";
      } else if (totalEarnings >= TIER_THRESHOLDS.silver) {
        referralTier = "silver";
      }

      // Find top tier among active referrals
      const topTier =
        referrals
          .filter((r) => r.status !== "inactive")
          .map((r) => r.tier)
          .sort((a, b) => {
            const tierRank = { bronze: 0, silver: 1, gold: 2, platinum: 3 };
            return tierRank[b] - tierRank[a];
          })[0] || "bronze";

      return {
        totalReferrals,
        activeReferrals,
        verifiedReferrals,
        totalEarnings,
        thisMonthEarnings,
        avgCommissionPercentage: avgCommissionPercentage * 100,
        topTier,
        referralTier,
        autoShareTotal,
      };
    } catch (err) {
      console.error("Exception getting referral stats:", err);
      return null;
    }
  }

  /**
   * Get paginated list of referrals with details
   */
  async getReferralsList(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    filter?: { status?: string; tier?: string }
  ): Promise<ReferralRecord[]> {
    try {
      let query = supabase
        .from("referral_tracking")
        .select("*")
        .eq("referrer_id", userId);

      if (filter?.status) {
        query = query.eq("status", filter.status);
      }
      if (filter?.tier) {
        query = query.eq("tier", filter.tier);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching referrals list:", error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error("Exception fetching referrals list:", err);
      return [];
    }
  }

  /**
   * Verify referral code
   */
  async verifyReferralCode(code: string): Promise<ReferralRecord | null> {
    try {
      const { data, error } = await supabase
        .from("referral_tracking")
        .select("*")
        .eq("referral_code", code)
        .eq("status", "verified")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.warn(`Invalid referral code: ${code}`);
          return null;
        }
        console.error("Error verifying referral code:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Exception verifying referral code:", err);
      return null;
    }
  }

  /**
   * Generate unique referral code
   */
  private generateReferralCode(referrerId: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const shortId = referrerId.substring(0, 4).toUpperCase();
    return `${shortId}${timestamp}${random}`;
  }

  /**
   * Process auto-sharing (0.5% automatic sharing from referred user earnings)
   */
  async processAutoSharing(referredUserId: string, earnings: number): Promise<boolean> {
    try {
      // Find referrals where this user is the referred_user_id
      const { data: referralRecords, error: queryError } = await supabase
        .from("referral_tracking")
        .select("*")
        .eq("referred_user_id", referredUserId)
        .eq("status", "verified");

      if (queryError) {
        console.error("Error fetching referral records for auto-share:", queryError);
        return false;
      }

      if (!referralRecords || referralRecords.length === 0) {
        return true; // No referrer, nothing to share
      }

      // Process auto-share for each referrer
      for (const record of referralRecords) {
        const autoShareAmount = earnings * record.auto_share_percentage * 0.01; // 0.5% default

        // Record the auto-share earning
        await this.recordReferralEarning(
          record.referrer_id,
          autoShareAmount,
          `Auto-share from referred user activity (${record.auto_share_percentage}%)`,
          record.id
        );

        // Update auto_share_total in referral record
        const { error: updateError } = await supabase
          .from("referral_tracking")
          .update({
            auto_share_total: record.auto_share_total + autoShareAmount,
          })
          .eq("id", record.id);

        if (updateError) {
          console.error("Error updating auto-share total:", updateError);
        }
      }

      return true;
    } catch (err) {
      console.error("Exception processing auto-sharing:", err);
      return false;
    }
  }

  /**
   * Update referral earning amount
   */
  private async updateReferralEarnings(referralId: string, amount: number): Promise<boolean> {
    try {
      // Get current earnings
      const { data: referral, error: fetchError } = await supabase
        .from("referral_tracking")
        .select("earnings_total, earnings_this_month")
        .eq("id", referralId)
        .single();

      if (fetchError) {
        console.error("Error fetching referral for update:", fetchError);
        return false;
      }

      // Update earnings
      const { error: updateError } = await supabase
        .from("referral_tracking")
        .update({
          earnings_total: (referral?.earnings_total || 0) + amount,
          earnings_this_month: (referral?.earnings_this_month || 0) + amount,
        })
        .eq("id", referralId);

      if (updateError) {
        console.error("Error updating referral earnings:", updateError);
        return false;
      }

      // Check if tier upgrade is needed
      const newTotal = (referral?.earnings_total || 0) + amount;
      const newTier = this.calculateTierFromEarnings(newTotal);

      if (newTier !== referral?.tier) {
        const { error: tierError } = await supabase
          .from("referral_tracking")
          .update({
            tier: newTier,
            commission_percentage: TIER_COMMISSIONS[newTier],
          })
          .eq("id", referralId);

        if (tierError) {
          console.error("Error upgrading referral tier:", tierError);
        }
      }

      return true;
    } catch (err) {
      console.error("Exception updating referral earnings:", err);
      return false;
    }
  }

  /**
   * Calculate tier based on earnings
   */
  private calculateTierFromEarnings(earnings: number): "bronze" | "silver" | "gold" | "platinum" {
    if (earnings >= TIER_THRESHOLDS.platinum) return "platinum";
    if (earnings >= TIER_THRESHOLDS.gold) return "gold";
    if (earnings >= TIER_THRESHOLDS.silver) return "silver";
    return "bronze";
  }

  /**
   * Update user's referral summary
   */
  private async updateUserSummaryFromReferrals(userId: string): Promise<boolean> {
    try {
      const stats = await this.getReferralStats(userId);
      if (!stats) return false;

      const { error } = await supabase
        .from("user_rewards_summary")
        .update({
          total_earned: stats.totalEarnings,
          available_balance: stats.totalEarnings,
        })
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating user summary from referrals:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Exception updating user summary:", err);
      return false;
    }
  }

  /**
   * Subscribe to referral changes
   */
  subscribeToReferralChanges(
    userId: string,
    callback: (referral: ReferralRecord) => void
  ): RealtimeChannel {
    return supabase
      .channel(`referrals_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "referral_tracking",
          filter: `referrer_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as ReferralRecord);
          }
        }
      )
      .subscribe();
  }

  /**
   * Get referral tier information
   */
  getTierInfo(tier: "bronze" | "silver" | "gold" | "platinum"): ReferralTierInfo {
    const tierNames = {
      bronze: "Bronze",
      silver: "Silver",
      gold: "Gold",
      platinum: "Platinum",
    };

    const tierColors = {
      bronze: "#92400E",
      silver: "#C0C7D0",
      gold: "#D97706",
      platinum: "#3B82F6",
    };

    return {
      name: tierNames[tier],
      tier,
      commissionPercentage: TIER_COMMISSIONS[tier] * 100,
      minEarnings: TIER_THRESHOLDS[tier],
      benefits: this.getTierBenefits(tier),
      color: tierColors[tier],
    };
  }

  /**
   * Get tier benefits
   */
  private getTierBenefits(tier: string): string[] {
    const benefits = {
      bronze: [
        "5% commission on referral earnings",
        "Basic referral dashboard",
        "Email support",
      ],
      silver: [
        "7.5% commission on referral earnings",
        "Advanced referral analytics",
        "Priority email support",
        "Auto-share enabled",
      ],
      gold: [
        "10% commission on referral earnings",
        "Custom referral materials",
        "Phone support",
        "Monthly bonus pool access",
      ],
      platinum: [
        "15% commission on referral earnings",
        "Dedicated account manager",
        "24/7 support",
        "Exclusive events and networking",
        "Premium marketing tools",
      ],
    };

    return benefits[tier] || [];
  }
}

export const referralTrackingService = new ReferralTrackingService();
