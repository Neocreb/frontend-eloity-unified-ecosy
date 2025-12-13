import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface RewardClaim {
  id: string;
  user_id: string;
  course_id: string;
  reward_type: 'enrollment' | 'completion' | 'certificate';
  amount: number;
  claimed_at: string;
}

export interface ArticleRewardClaim {
  id: string;
  user_id: string;
  article_id: string;
  reward_type: 'reading' | 'quiz_completion' | 'perfect_score';
  amount: number;
  claimed_at: string;
}

/**
 * Course Reward Service
 * Handles all course-related rewards and claims
 */
export class CourseRewardService {
  /**
   * Claim enrollment reward for a course
   */
  static async claimEnrollmentReward(userId: string, courseId: string, amount: number) {
    try {
      // Check if already claimed
      const hasClaimed = await this.hasClaimedReward(userId, courseId, 'enrollment');
      if (hasClaimed) {
        return { success: false, message: 'Already claimed' };
      }

      // Create reward claim
      const { data, error } = await supabase
        .from('course_reward_claims')
        .insert({
          user_id: userId,
          course_id: courseId,
          reward_type: 'enrollment',
          amount: amount,
        })
        .select()
        .single();

      if (error) throw error;

      // Update user balance (integrate with activity reward service)
      await this.addUserReward(userId, amount, 'course_enrollment', courseId);

      return { success: true, data };
    } catch (error) {
      console.error('Error claiming enrollment reward:', error);
      throw error;
    }
  }

  /**
   * Claim completion reward for a course
   */
  static async claimCompletionReward(userId: string, courseId: string, amount: number) {
    try {
      const hasClaimed = await this.hasClaimedReward(userId, courseId, 'completion');
      if (hasClaimed) {
        return { success: false, message: 'Already claimed' };
      }

      const { data, error } = await supabase
        .from('course_reward_claims')
        .insert({
          user_id: userId,
          course_id: courseId,
          reward_type: 'completion',
          amount: amount,
        })
        .select()
        .single();

      if (error) throw error;

      // Update user balance
      await this.addUserReward(userId, amount, 'course_completion', courseId);

      return { success: true, data };
    } catch (error) {
      console.error('Error claiming completion reward:', error);
      throw error;
    }
  }

  /**
   * Claim certificate reward for a course
   */
  static async claimCertificateReward(userId: string, courseId: string, amount: number) {
    try {
      const hasClaimed = await this.hasClaimedReward(userId, courseId, 'certificate');
      if (hasClaimed) {
        return { success: false, message: 'Already claimed' };
      }

      const { data, error } = await supabase
        .from('course_reward_claims')
        .insert({
          user_id: userId,
          course_id: courseId,
          reward_type: 'certificate',
          amount: amount,
        })
        .select()
        .single();

      if (error) throw error;

      // Update user balance
      await this.addUserReward(userId, amount, 'course_certificate', courseId);

      return { success: true, data };
    } catch (error) {
      console.error('Error claiming certificate reward:', error);
      throw error;
    }
  }

  /**
   * Check if reward has been claimed
   */
  static async hasClaimedReward(
    userId: string,
    courseId: string,
    rewardType: 'enrollment' | 'completion' | 'certificate'
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('course_reward_claims')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('reward_type', rewardType)
        .single();

      if (error && error.code === 'PGRST116') return false;
      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking reward claim:', error);
      return false;
    }
  }

  /**
   * Get all rewards claimed by user
   */
  static async getUserRewards(userId: string) {
    try {
      const { data, error } = await supabase
        .from('course_reward_claims')
        .select('*')
        .eq('user_id', userId)
        .order('claimed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user rewards:', error);
      return [];
    }
  }

  /**
   * Get total reward amount for user
   */
  static async getUserTotalRewards(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('course_reward_claims')
        .select('amount')
        .eq('user_id', userId);

      if (error) throw error;
      return (data || []).reduce((sum, claim) => sum + claim.amount, 0);
    } catch (error) {
      console.error('Error calculating total rewards:', error);
      return 0;
    }
  }

  /**
   * Integration with ActivityRewardService
   * Adds points to user's activity reward balance
   */
  static async addUserReward(
    userId: string,
    amount: number,
    activityType: string,
    sourceId: string
  ) {
    try {
      // This integrates with the existing ActivityRewardService
      // If you have an API endpoint for adding rewards, call it here
      // Otherwise, store rewards in user_rewards table

      const { error } = await supabase
        .from('user_rewards')
        .insert({
          user_id: userId,
          type: activityType,
          amount: amount,
          status: 'completed',
          metadata: { sourceId },
        });

      if (error && error.code !== '23505') throw error; // 23505 = unique constraint
    } catch (error) {
      console.error('Error adding user reward:', error);
      // Don't throw - reward claiming should succeed even if balance update fails
    }
  }
}

/**
 * Article Reward Service
 * Handles all article-related rewards and claims
 */
export class ArticleRewardService {
  /**
   * Claim reading reward for an article
   */
  static async claimReadingReward(userId: string, articleId: string, amount: number) {
    try {
      const hasClaimed = await this.hasClaimedReward(userId, articleId, 'reading');
      if (hasClaimed) {
        return { success: false, message: 'Already claimed' };
      }

      const { data, error } = await supabase
        .from('article_reward_claims')
        .insert({
          user_id: userId,
          article_id: articleId,
          reward_type: 'reading',
          amount: amount,
        })
        .select()
        .single();

      if (error) throw error;

      // Update user balance
      await this.addUserReward(userId, amount, 'article_reading', articleId);

      return { success: true, data };
    } catch (error) {
      console.error('Error claiming reading reward:', error);
      throw error;
    }
  }

  /**
   * Claim quiz completion reward for an article
   */
  static async claimQuizReward(userId: string, articleId: string, amount: number) {
    try {
      const hasClaimed = await this.hasClaimedReward(userId, articleId, 'quiz_completion');
      if (hasClaimed) {
        return { success: false, message: 'Already claimed' };
      }

      const { data, error } = await supabase
        .from('article_reward_claims')
        .insert({
          user_id: userId,
          article_id: articleId,
          reward_type: 'quiz_completion',
          amount: amount,
        })
        .select()
        .single();

      if (error) throw error;

      // Update user balance
      await this.addUserReward(userId, amount, 'article_quiz_completion', articleId);

      return { success: true, data };
    } catch (error) {
      console.error('Error claiming quiz reward:', error);
      throw error;
    }
  }

  /**
   * Claim perfect score reward for an article
   */
  static async claimPerfectScoreReward(userId: string, articleId: string, amount: number) {
    try {
      const hasClaimed = await this.hasClaimedReward(userId, articleId, 'perfect_score');
      if (hasClaimed) {
        return { success: false, message: 'Already claimed' };
      }

      const { data, error } = await supabase
        .from('article_reward_claims')
        .insert({
          user_id: userId,
          article_id: articleId,
          reward_type: 'perfect_score',
          amount: amount,
        })
        .select()
        .single();

      if (error) throw error;

      // Update user balance
      await this.addUserReward(userId, amount, 'article_perfect_score', articleId);

      return { success: true, data };
    } catch (error) {
      console.error('Error claiming perfect score reward:', error);
      throw error;
    }
  }

  /**
   * Check if reward has been claimed
   */
  static async hasClaimedReward(
    userId: string,
    articleId: string,
    rewardType: 'reading' | 'quiz_completion' | 'perfect_score'
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('article_reward_claims')
        .select('id')
        .eq('user_id', userId)
        .eq('article_id', articleId)
        .eq('reward_type', rewardType)
        .single();

      if (error && error.code === 'PGRST116') return false;
      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking reward claim:', error);
      return false;
    }
  }

  /**
   * Get all rewards claimed by user
   */
  static async getUserRewards(userId: string) {
    try {
      const { data, error } = await supabase
        .from('article_reward_claims')
        .select('*')
        .eq('user_id', userId)
        .order('claimed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user rewards:', error);
      return [];
    }
  }

  /**
   * Get total reward amount for user
   */
  static async getUserTotalRewards(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('article_reward_claims')
        .select('amount')
        .eq('user_id', userId);

      if (error) throw error;
      return (data || []).reduce((sum, claim) => sum + claim.amount, 0);
    } catch (error) {
      console.error('Error calculating total rewards:', error);
      return 0;
    }
  }

  /**
   * Integration with ActivityRewardService
   * Adds points to user's activity reward balance
   */
  static async addUserReward(
    userId: string,
    amount: number,
    activityType: string,
    sourceId: string
  ) {
    try {
      const { error } = await supabase
        .from('user_rewards')
        .insert({
          user_id: userId,
          type: activityType,
          amount: amount,
          status: 'completed',
          metadata: { sourceId },
        });

      if (error && error.code !== '23505') throw error;
    } catch (error) {
      console.error('Error adding user reward:', error);
    }
  }
}

export default CourseRewardService;
