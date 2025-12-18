// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface RewardRule {
  id: string;
  action_type: string;
  display_name: string;
  description: string | null;
  base_eloits: number;
  base_wallet_bonus: number;
  currency: string;
  daily_limit: number | null;
  weekly_limit: number | null;
  monthly_limit: number | null;
  minimum_trust_score: number;
  minimum_value: number | null;
  decay_enabled: boolean;
  decay_start: number;
  decay_rate: number;
  min_multiplier: number;
  requires_moderation: boolean;
  quality_threshold: number;
  conditions: Record<string, any> | null;
  is_active: boolean;
  active_from: string | null;
  active_to: string | null;
  created_by: string | null;
  last_modified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RewardCalculation {
  baseAmount: number;
  multiplier: number;
  finalAmount: number;
  bonusReason?: string;
  metadata: Record<string, any>;
}

class RewardRulesService {
  private cache: Map<string, { data: RewardRule; timestamp: number }> = new Map();
  private cacheTimeMs = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all active reward rules
   */
  async getActiveRules(): Promise<RewardRule[]> {
    try {
      const { data, error } = await supabase
        .from("reward_rules")
        .select("*")
        .eq("is_active", true)
        .order("display_name");

      if (error) {
        console.error("Error fetching active reward rules:", error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error("Exception fetching active reward rules:", err);
      return [];
    }
  }

  /**
   * Get rule by action type with caching
   */
  async getRuleByType(actionType: string): Promise<RewardRule | null> {
    try {
      // Check cache first
      const cached = this.cache.get(actionType);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeMs) {
        return cached.data;
      }

      const { data, error } = await supabase
        .from("reward_rules")
        .select("*")
        .eq("action_type", actionType)
        .eq("is_active", true)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No matching rule
          return null;
        }
        console.error("Error fetching reward rule:", error);
        return null;
      }

      // Cache the result
      if (data) {
        this.cache.set(actionType, { data, timestamp: Date.now() });
      }

      return data;
    } catch (err) {
      console.error("Exception fetching reward rule:", err);
      return null;
    }
  }

  /**
   * Get rules applicable to user's tier
   */
  async getApplicableRules(userTrustScore: number): Promise<RewardRule[]> {
    try {
      const { data, error } = await supabase
        .from("reward_rules")
        .select("*")
        .eq("is_active", true)
        .lte("minimum_trust_score", userTrustScore)
        .order("display_name");

      if (error) {
        console.error("Error fetching applicable rules:", error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error("Exception fetching applicable rules:", err);
      return [];
    }
  }

  /**
   * Calculate reward amount with all multipliers and decay
   */
  async calculateReward(
    actionType: string,
    userTrustScore: number,
    options?: {
      baseValue?: number; // For percentage-based rewards
      activityCount?: number; // For decay calculation
      qualityScore?: number; // For quality-based bonus
      tierMultiplier?: number; // For tier-based multiplier
    }
  ): Promise<RewardCalculation | null> {
    try {
      const rule = await this.getRuleByType(actionType);
      if (!rule) {
        console.warn(`No active rule found for action type: ${actionType}`);
        return null;
      }

      // Check trust score requirement
      if (userTrustScore < rule.minimum_trust_score) {
        return {
          baseAmount: 0,
          multiplier: 0,
          finalAmount: 0,
          bonusReason: "Insufficient trust score",
          metadata: { reason: "trust_score_too_low" },
        };
      }

      // Base amount calculation
      let baseAmount = rule.base_eloits;
      const metadata: Record<string, any> = {
        rule_id: rule.id,
        base_amount: baseAmount,
      };

      // Percentage-based rewards (e.g., 1% of purchase)
      if (options?.baseValue && options.baseValue > (rule.minimum_value || 0)) {
        const percentageReward = (options.baseValue * 0.01); // 1% default
        baseAmount = rule.base_eloits + percentageReward;
        metadata.percentage_calculated = percentageReward;
      }

      // Calculate multipliers
      let multiplier = 1.0;

      // Quality multiplier
      if (options?.qualityScore && rule.quality_threshold > 0) {
        if (options.qualityScore >= rule.quality_threshold) {
          multiplier *= 1.1 + (options.qualityScore / 100) * 0.1; // 1.1x to 1.2x
          metadata.quality_bonus = multiplier;
        }
      }

      // Tier multiplier
      if (options?.tierMultiplier) {
        multiplier *= options.tierMultiplier;
        metadata.tier_multiplier = options.tierMultiplier;
      }

      // Decay calculation for repetitive actions
      if (rule.decay_enabled && options?.activityCount) {
        if (options.activityCount >= rule.decay_start) {
          const decayFactor = Math.pow(
            1 - rule.decay_rate,
            options.activityCount - rule.decay_start
          );
          const finalMultiplier = Math.max(
            rule.min_multiplier,
            decayFactor
          );
          multiplier *= finalMultiplier;
          metadata.decay_applied = finalMultiplier;
        }
      }

      // Trust score bonus (small bonus for higher trust)
      const trustBonus = 1 + (userTrustScore / 100) * 0.1; // 1.0x to 1.1x
      multiplier *= trustBonus;
      metadata.trust_multiplier = trustBonus;

      const finalAmount = Math.round(baseAmount * multiplier * 100) / 100;

      return {
        baseAmount,
        multiplier,
        finalAmount,
        bonusReason: Object.keys(metadata)
          .filter((k) => k !== "rule_id" && k !== "base_amount")
          .join(", "),
        metadata,
      };
    } catch (err) {
      console.error("Exception calculating reward:", err);
      return null;
    }
  }

  /**
   * Check if user hit daily/weekly/monthly limit
   */
  async checkActivityLimit(
    userId: string,
    actionType: string,
    timeframe: "daily" | "weekly" | "monthly" = "daily"
  ): Promise<boolean> {
    try {
      const rule = await this.getRuleByType(actionType);
      if (!rule) return true; // No rule = allow

      const limitField =
        timeframe === "daily"
          ? rule.daily_limit
          : timeframe === "weekly"
            ? rule.weekly_limit
            : rule.monthly_limit;

      if (!limitField) return true; // No limit = allow

      // Get count based on timeframe
      let startDate = new Date();
      if (timeframe === "daily") {
        startDate.setHours(0, 0, 0, 0);
      } else if (timeframe === "weekly") {
        const day = startDate.getDay();
        startDate.setDate(startDate.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      }

      const { data: activities, error } = await supabase
        .from("activity_transactions")
        .select("id")
        .eq("user_id", userId)
        .eq("activity_type", actionType)
        .gte("created_at", startDate.toISOString());

      if (error) {
        console.error("Error checking activity limit:", error);
        return false;
      }

      return (activities?.length || 0) < limitField;
    } catch (err) {
      console.error("Exception checking activity limit:", err);
      return false;
    }
  }

  /**
   * Subscribe to rule updates (for admins)
   */
  subscribeToRuleChanges(
    callback: (rule: RewardRule) => void
  ): RealtimeChannel {
    return supabase
      .channel("reward_rules_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reward_rules",
        },
        (payload) => {
          // Invalidate cache
          this.cache.clear();
          if (payload.new) {
            callback(payload.new as RewardRule);
          }
        }
      )
      .subscribe();
  }

  /**
   * Clear cache when rules update
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Create new reward rule (admin only)
   */
  async createRule(rule: Omit<RewardRule, "id" | "created_at" | "updated_at">) {
    try {
      const { data, error } = await supabase
        .from("reward_rules")
        .insert([rule])
        .select()
        .single();

      if (error) {
        console.error("Error creating reward rule:", error);
        return null;
      }

      // Invalidate cache
      this.cache.clear();
      return data;
    } catch (err) {
      console.error("Exception creating reward rule:", err);
      return null;
    }
  }

  /**
   * Update existing rule (admin only)
   */
  async updateRule(ruleId: string, updates: Partial<RewardRule>) {
    try {
      const { data, error } = await supabase
        .from("reward_rules")
        .update(updates)
        .eq("id", ruleId)
        .select()
        .single();

      if (error) {
        console.error("Error updating reward rule:", error);
        return null;
      }

      // Invalidate cache
      this.cache.clear();
      return data;
    } catch (err) {
      console.error("Exception updating reward rule:", err);
      return null;
    }
  }

  /**
   * Deactivate rule (soft delete)
   */
  async deactivateRule(ruleId: string) {
    return this.updateRule(ruleId, { is_active: false });
  }

  /**
   * Get rules by category pattern
   */
  async getRulesByCategory(pattern: string): Promise<RewardRule[]> {
    try {
      const allRules = await this.getActiveRules();
      return allRules.filter((rule) =>
        rule.action_type.toLowerCase().includes(pattern.toLowerCase())
      );
    } catch (err) {
      console.error("Exception getting rules by category:", err);
      return [];
    }
  }

  /**
   * Calculate total limit for a user and action type
   */
  async getRemainingLimit(
    userId: string,
    actionType: string,
    timeframe: "daily" | "weekly" | "monthly" = "daily"
  ): Promise<number> {
    try {
      const rule = await this.getRuleByType(actionType);
      if (!rule) return -1; // No limit

      const limitField =
        timeframe === "daily"
          ? rule.daily_limit
          : timeframe === "weekly"
            ? rule.weekly_limit
            : rule.monthly_limit;

      if (!limitField) return -1; // No limit

      let startDate = new Date();
      if (timeframe === "daily") {
        startDate.setHours(0, 0, 0, 0);
      } else if (timeframe === "weekly") {
        const day = startDate.getDay();
        startDate.setDate(startDate.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      }

      const { data, error } = await supabase
        .from("activity_transactions")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .eq("activity_type", actionType)
        .gte("created_at", startDate.toISOString());

      if (error) {
        console.error("Error getting remaining limit:", error);
        return limitField;
      }

      const count = data?.length || 0;
      return Math.max(0, limitField - count);
    } catch (err) {
      console.error("Exception getting remaining limit:", err);
      return 0;
    }
  }
}

export const rewardRulesService = new RewardRulesService();
