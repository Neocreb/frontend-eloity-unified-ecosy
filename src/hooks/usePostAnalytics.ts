import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

        // Fetch post with all count columns
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('id, views_count, likes_count, comments_count, shares_count')
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

        // Use count columns directly from posts table (already maintained by database)
        const views = postData.views_count || 0;
        const likes = postData.likes_count || 0;
        const comments = postData.comments_count || 0;
        const shares = postData.shares_count || 0;

        // For now, saves count is 0 (post_saves table doesn't exist yet)
        // In the future, this can be fetched from post_saves table when implemented
        const saves = 0;

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
        let error: Error;

        if (err instanceof Error) {
          error = err;
        } else if (typeof err === 'object' && err !== null) {
          error = new Error(JSON.stringify(err));
        } else {
          error = new Error('Failed to fetch analytics');
        }

        setError(error);
        console.error('Error in usePostAnalytics:', error.message, {
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
