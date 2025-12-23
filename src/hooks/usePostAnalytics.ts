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

        // Fetch post with view count
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('id, view_count, likes, shares')
          .eq('id', postId)
          .single();

        if (postError) {
          console.error('Error fetching post:', postError);
          throw postError;
        }

        if (!postData) {
          throw new Error('Post not found');
        }

        // Fetch likes count
        const { count: likesCount = 0, error: likesError } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        if (likesError && !likesError.message.includes('does not exist')) {
          console.error('Error fetching likes count:', likesError);
        }

        // Fetch comments count
        const { count: commentsCount = 0, error: commentsError } = await supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        if (commentsError && !commentsError.message.includes('does not exist')) {
          console.error('Error fetching comments count:', commentsError);
        }

        // Fetch saves count (if table exists)
        let savesCount = 0;
        try {
          const { count = 0, error: savesError } = await supabase
            .from('post_saves')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

          if (!savesError && count !== null) {
            savesCount = count;
          }
        } catch (err) {
          console.warn('post_saves table may not exist or is inaccessible');
        }

        const views = postData.view_count || 0;
        const likes = likesCount || postData.likes || 0;
        const comments = commentsCount || 0;
        const shares = postData.shares || 0;
        const saves = savesCount;

        // Calculate engagement rate
        const totalEngagement = likes + comments + shares + saves;
        const engagementRate = views > 0 ? (totalEngagement / views) * 100 : 0;

        setAnalytics({
          postId,
          views,
          likes,
          comments,
          shares,
          saves,
          engagementRate: parseFloat(engagementRate.toFixed(2)),
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch analytics');
        setError(error);
        console.error('Error in usePostAnalytics:', error);
        setAnalytics(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [postId]);

  return { analytics, isLoading, error };
};
