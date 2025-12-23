import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from '@/utils/utils';

export interface PostAnalyticsData {
  postId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
}

export const usePostAnalytics = (postId: string) => {
  const [analytics, setAnalytics] = useState<PostAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!postId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch post basic data
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('id')
          .eq('id', postId)
          .single();

        if (postError) {
          const errorMessage = postError.message || 'Failed to fetch post data';
          console.error('Error fetching post:', {
            code: postError.code,
            message: errorMessage,
            details: postError.details,
          });
          throw new Error(`Failed to fetch post: ${errorMessage}`);
        }

        if (!postData) {
          throw new Error('Post not found');
        }

        // Get actual counts from related tables
        const { count: likesCount, error: likesError } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        const { count: commentsCount, error: commentsError } = await supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        const { count: savesCount, error: savesError } = await supabase
          .from('user_saved_posts')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        // For views and shares, try to get from posts table but fallback to 0
        let views = 0;
        let shares = 0;

        // Try to fetch views and shares from posts table (if columns exist)
        const { data: postDataWithCounts } = await supabase
          .from('posts')
          .select('shares_count')
          .eq('id', postId)
          .single()
          .catch(() => ({ data: null }));

        if (postDataWithCounts && 'shares_count' in postDataWithCounts) {
          shares = postDataWithCounts.shares_count || 0;
        }

        // Views is not commonly tracked, default to 0
        views = 0;

        const likes = likesCount || 0;
        const comments = commentsCount || 0;
        const saves = savesCount || 0;

        // Calculate engagement rate
        const totalEngagement = likes + comments + shares + saves;
        const engagementRate = views > 0 ? (totalEngagement / views) * 100 : 0;

        const analyticsData: PostAnalyticsData = {
          postId,
          views,
          likes,
          comments,
          shares,
          saves,
          engagementRate: parseFloat(engagementRate.toFixed(2)),
        };

        setAnalytics(analyticsData);
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        const error = err instanceof Error ? err : new Error(errorMessage);

        setError(error);
        console.error('Error in usePostAnalytics:', errorMessage, {
          stack: error.stack,
          details: err instanceof Error ? { code: (err as any).code, details: (err as any).details } : err,
        });
        setAnalytics(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [postId]);

  return { analytics, isLoading, error };
};
