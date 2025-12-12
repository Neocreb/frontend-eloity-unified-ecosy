/**
 * Persistent Social Actions Service
 * Ensures likes, shares, and follows persist correctly and are counted accurately
 */

import { supabase } from "@/integrations/supabase/client";

export interface SocialAction {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'video' | 'post' | 'user';
  actionType: 'like' | 'share' | 'follow';
  createdAt: string;
}

interface ActionCacheEntry {
  timestamp: number;
  isActive: boolean;
}

class PersistentSocialActionsService {
  private actionCache: Map<string, ActionCacheEntry> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate cache key for social action
   */
  private getCacheKey(userId: string, targetId: string, actionType: string): string {
    return `${actionType}:${userId}:${targetId}`;
  }

  /**
   * Check if action is cached and still valid
   */
  private isCacheValid(cacheKey: string): boolean {
    const entry = this.actionCache.get(cacheKey);
    if (!entry) return false;
    const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.actionCache.delete(cacheKey);
      return false;
    }
    return true;
  }

  /**
   * Like a video/post with proper persistence and counting
   */
  async likeContent(
    contentId: string,
    contentType: 'video' | 'post' = 'video',
    userId?: string
  ): Promise<{ success: boolean; likesCount: number; error?: string }> {
    try {
      const user = userId || (await this.getCurrentUserId());
      if (!user) {
        return { success: false, likesCount: 0, error: 'User not authenticated' };
      }

      const cacheKey = this.getCacheKey(user, contentId, 'like');

      // Check cache first
      if (this.isCacheValid(cacheKey)) {
        const entry = this.actionCache.get(cacheKey);
        if (entry?.isActive) {
          return { success: false, likesCount: 0, error: 'Already liked' };
        }
      }

      // Check database for existing like
      const tableName = contentType === 'video' ? 'video_likes' : 'post_likes';
      const idField = contentType === 'video' ? 'video_id' : 'post_id';

      const { data: existingLike, error: checkError } = await supabase
        .from(tableName)
        .select('id')
        .eq(idField, contentId)
        .eq('user_id', user)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingLike) {
        // Update cache to indicate already liked
        this.actionCache.set(cacheKey, { timestamp: Date.now(), isActive: true });
        
        // Get current count
        const { data: contentTable } = await supabase
          .from(contentType === 'video' ? 'videos' : 'posts')
          .select('likes_count')
          .eq('id', contentId)
          .single();

        return {
          success: false,
          likesCount: contentTable?.likes_count || 0,
          error: 'Already liked',
        };
      }

      // Add the like
      const { error: insertError } = await supabase
        .from(tableName)
        .insert({
          [idField]: contentId,
          user_id: user,
        });

      if (insertError) throw insertError;

      // Update cache
      this.actionCache.set(cacheKey, { timestamp: Date.now(), isActive: true });

      // Get updated count using RPC or direct count query
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .eq(idField, contentId);

      if (countError) throw countError;

      // Update the content's likes_count
      const newCount = count || 0;
      const { error: updateError } = await supabase
        .from(contentType === 'video' ? 'videos' : 'posts')
        .update({ likes_count: newCount })
        .eq('id', contentId);

      if (updateError) console.warn('Error updating likes count:', updateError);

      return { success: true, likesCount: newCount };
    } catch (error) {
      console.error('Error liking content:', error);
      return {
        success: false,
        likesCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Unlike a video/post
   */
  async unlikeContent(
    contentId: string,
    contentType: 'video' | 'post' = 'video',
    userId?: string
  ): Promise<{ success: boolean; likesCount: number; error?: string }> {
    try {
      const user = userId || (await this.getCurrentUserId());
      if (!user) {
        return { success: false, likesCount: 0, error: 'User not authenticated' };
      }

      const cacheKey = this.getCacheKey(user, contentId, 'like');
      const tableName = contentType === 'video' ? 'video_likes' : 'post_likes';
      const idField = contentType === 'video' ? 'video_id' : 'post_id';

      // Remove the like
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, contentId)
        .eq('user_id', user);

      if (deleteError) throw deleteError;

      // Update cache
      this.actionCache.set(cacheKey, { timestamp: Date.now(), isActive: false });

      // Get updated count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .eq(idField, contentId);

      if (countError) throw countError;

      // Update the content's likes_count
      const newCount = count || 0;
      const { error: updateError } = await supabase
        .from(contentType === 'video' ? 'videos' : 'posts')
        .update({ likes_count: newCount })
        .eq('id', contentId);

      if (updateError) console.warn('Error updating likes count:', updateError);

      return { success: true, likesCount: newCount };
    } catch (error) {
      console.error('Error unliking content:', error);
      return {
        success: false,
        likesCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if user likes content
   */
  async isContentLikedByUser(
    contentId: string,
    contentType: 'video' | 'post' = 'video',
    userId?: string
  ): Promise<boolean> {
    try {
      const user = userId || (await this.getCurrentUserId());
      if (!user) return false;

      const cacheKey = this.getCacheKey(user, contentId, 'like');
      if (this.isCacheValid(cacheKey)) {
        const entry = this.actionCache.get(cacheKey);
        return entry?.isActive || false;
      }

      const tableName = contentType === 'video' ? 'video_likes' : 'post_likes';
      const idField = contentType === 'video' ? 'video_id' : 'post_id';

      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .eq(idField, contentId)
        .eq('user_id', user)
        .maybeSingle();

      if (error) {
        console.error('Error checking if content is liked:', error);
        return false;
      }

      const isLiked = !!data;
      this.actionCache.set(cacheKey, { timestamp: Date.now(), isActive: isLiked });
      return isLiked;
    } catch (error) {
      console.error('Error in isContentLikedByUser:', error);
      return false;
    }
  }

  /**
   * Get likes count for content
   */
  async getContentLikesCount(
    contentId: string,
    contentType: 'video' | 'post' = 'video'
  ): Promise<number> {
    try {
      const tableName = contentType === 'video' ? 'video_likes' : 'post_likes';
      const idField = contentType === 'video' ? 'video_id' : 'post_id';

      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .eq(idField, contentId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting likes count:', error);
      return 0;
    }
  }

  /**
   * Share content (record share action)
   */
  async shareContent(
    contentId: string,
    contentType: 'video' | 'post' = 'video',
    platform?: string
  ): Promise<{ success: boolean; sharesCount: number; error?: string }> {
    try {
      const user = await this.getCurrentUserId();
      const tableName = contentType === 'video' ? 'video_shares' : 'post_shares';
      const idField = contentType === 'video' ? 'video_id' : 'post_id';

      // Record share action
      const { error: insertError } = await supabase
        .from(tableName)
        .insert({
          [idField]: contentId,
          user_id: user || null,
          platform: platform || 'internal',
          shared_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      // Get updated share count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .eq(idField, contentId);

      if (countError) throw countError;

      const newCount = count || 0;

      // Update the content's shares_count
      const { error: updateError } = await supabase
        .from(contentType === 'video' ? 'videos' : 'posts')
        .update({ shares_count: newCount })
        .eq('id', contentId);

      if (updateError) console.warn('Error updating shares count:', updateError);

      return { success: true, sharesCount: newCount };
    } catch (error) {
      console.error('Error sharing content:', error);
      return {
        success: false,
        sharesCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Follow user
   */
  async followUser(
    targetUserId: string,
    followerId?: string
  ): Promise<{ success: boolean; followersCount: number; error?: string }> {
    try {
      const follower = followerId || (await this.getCurrentUserId());
      if (!follower) {
        return { success: false, followersCount: 0, error: 'User not authenticated' };
      }

      const cacheKey = this.getCacheKey(follower, targetUserId, 'follow');

      // Check if already following
      const { data: existing, error: checkError } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', follower)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        return { success: false, followersCount: 0, error: 'Already following' };
      }

      // Add follow
      const { error: insertError } = await supabase
        .from('user_follows')
        .insert({
          follower_id: follower,
          following_id: targetUserId,
        });

      if (insertError) throw insertError;

      // Update cache
      this.actionCache.set(cacheKey, { timestamp: Date.now(), isActive: true });

      // Get updated followers count
      const { count, error: countError } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact' })
        .eq('following_id', targetUserId);

      if (countError) throw countError;

      return { success: true, followersCount: count || 0 };
    } catch (error) {
      console.error('Error following user:', error);
      return {
        success: false,
        followersCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Unfollow user
   */
  async unfollowUser(
    targetUserId: string,
    followerId?: string
  ): Promise<{ success: boolean; followersCount: number; error?: string }> {
    try {
      const follower = followerId || (await this.getCurrentUserId());
      if (!follower) {
        return { success: false, followersCount: 0, error: 'User not authenticated' };
      }

      const cacheKey = this.getCacheKey(follower, targetUserId, 'follow');

      // Remove follow
      const { error: deleteError } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', follower)
        .eq('following_id', targetUserId);

      if (deleteError) throw deleteError;

      // Update cache
      this.actionCache.set(cacheKey, { timestamp: Date.now(), isActive: false });

      // Get updated followers count
      const { count, error: countError } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact' })
        .eq('following_id', targetUserId);

      if (countError) throw countError;

      return { success: true, followersCount: count || 0 };
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return {
        success: false,
        followersCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if following user
   */
  async isFollowingUser(
    targetUserId: string,
    followerId?: string
  ): Promise<boolean> {
    try {
      const follower = followerId || (await this.getCurrentUserId());
      if (!follower) return false;

      const cacheKey = this.getCacheKey(follower, targetUserId, 'follow');
      if (this.isCacheValid(cacheKey)) {
        const entry = this.actionCache.get(cacheKey);
        return entry?.isActive || false;
      }

      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', follower)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (error) {
        console.error('Error checking if following user:', error);
        return false;
      }

      const isFollowing = !!data;
      this.actionCache.set(cacheKey, { timestamp: Date.now(), isActive: isFollowing });
      return isFollowing;
    } catch (error) {
      console.error('Error in isFollowingUser:', error);
      return false;
    }
  }

  /**
   * Get current user ID
   */
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch {
      return null;
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.actionCache.clear();
  }
}

export const persistentSocialActionsService = new PersistentSocialActionsService();

export default persistentSocialActionsService;
