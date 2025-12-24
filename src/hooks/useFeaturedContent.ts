import { useState, useEffect } from 'react';
import { FeaturedPost } from '@/components/profile/FeaturedContent';

interface UseFeaturedContentOptions {
  userId?: string;
  limit?: number;
}

interface UseFeaturedContentResult {
  featuredPosts: FeaturedPost[];
  isLoading: boolean;
  error: Error | null;
  reorderPosts: (reorderedPosts: FeaturedPost[]) => void;
  removePost: (postId: string) => void;
}

export const useFeaturedContent = ({
  userId,
  limit = 5,
}: UseFeaturedContentOptions = {}): UseFeaturedContentResult => {
  const [featuredPosts, setFeaturedPosts] = useState<FeaturedPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Default featured content (can be replaced with real API calls)
  const defaultFeaturedPosts: FeaturedPost[] = [
    {
      id: 'featured-1',
      content: 'Just launched my new design system for modern web applications',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
      likes: 342,
      comments: 28,
      shares: 45,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      engagement: {
        likes: 342,
        comments: 28,
        shares: 45,
        saves: 156,
      },
    },
    {
      id: 'featured-2',
      content: 'Tips for optimizing React performance in large scale applications',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
      likes: 287,
      comments: 42,
      shares: 63,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      engagement: {
        likes: 287,
        comments: 42,
        shares: 63,
        saves: 134,
      },
    },
    {
      id: 'featured-3',
      content: 'Building scalable backend services with Node.js and PostgreSQL',
      likes: 198,
      comments: 35,
      shares: 52,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      engagement: {
        likes: 198,
        comments: 35,
        shares: 52,
        saves: 89,
      },
    },
  ];

  useEffect(() => {
    const fetchFeaturedContent = async () => {
      if (!userId) {
        setFeaturedPosts(defaultFeaturedPosts.slice(0, limit));
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // In a real implementation, this would fetch from your API
        // For now, we'll use default data
        const { supabase } = await import('@/integrations/supabase/client');

        try {
          // Try to fetch pinned posts from database
          const { data: pinnedPosts, error: dbError } = await supabase
            .from('posts')
            .select('id, content, image_url, likes_count, comments_count, shares_count, created_at, is_pinned, pinned_order')
            .eq('user_id', userId)
            .eq('is_pinned', true)
            .order('pinned_order', { ascending: true })
            .limit(limit);

          if (!dbError && pinnedPosts && pinnedPosts.length > 0) {
            const transformedPosts = pinnedPosts.map(post => ({
              id: post.id,
              content: post.content || 'Untitled post',
              image: post.image_url || undefined,
              likes: post.likes_count || 0,
              comments: post.comments_count || 0,
              shares: post.shares_count || 0,
              createdAt: post.created_at || new Date().toISOString(),
              engagement: {
                likes: post.likes_count || 0,
                comments: post.comments_count || 0,
                shares: post.shares_count || 0,
                saves: 0,
              },
            }));
            setFeaturedPosts(transformedPosts);
          } else {
            // Fall back to default data
            setFeaturedPosts(defaultFeaturedPosts.slice(0, limit));
          }
        } catch (dbError) {
          console.warn('Failed to fetch featured content from database:', dbError);
          setFeaturedPosts(defaultFeaturedPosts.slice(0, limit));
        }
      } catch (err) {
        console.error('Error fetching featured content:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch featured content'));
        setFeaturedPosts(defaultFeaturedPosts.slice(0, limit));
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedContent();
  }, [userId, limit]);

  const reorderPosts = (reorderedPosts: FeaturedPost[]) => {
    setFeaturedPosts(reorderedPosts);
    // In a real implementation, this would update the database
  };

  const removePost = (postId: string) => {
    setFeaturedPosts(prev => prev.filter(post => post.id !== postId));
    // In a real implementation, this would update the database
  };

  return {
    featuredPosts,
    isLoading,
    error,
    reorderPosts,
    removePost,
  };
};
