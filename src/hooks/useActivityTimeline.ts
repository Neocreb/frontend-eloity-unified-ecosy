import { useState, useEffect } from 'react';

export type ActivityType =
  | 'post_created'
  | 'post_deleted'
  | 'content_liked'
  | 'content_unliked'
  | 'comment_added'
  | 'comment_deleted'
  | 'content_shared'
  | 'content_purchased'
  | 'product_listed'
  | 'product_sold'
  | 'job_posted'
  | 'job_completed'
  | 'trade_executed'
  | 'followers_gained'
  | 'profile_updated'
  | 'badge_earned'
  | 'level_up'
  | 'milestone_reached';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  timestamp: string;
  description: string;
  icon: string;
  color: string;
  relatedEntity?: {
    id: string;
    type: string;
    title: string;
    url: string;
  };
  metadata?: Record<string, any>;
}

interface UseActivityTimelineOptions {
  userId: string;
  filters?: ActivityType[];
  limit?: number;
  offset?: number;
}

const activityConfig: Record<ActivityType, { icon: string; color: string; label: string }> = {
  'post_created': { icon: 'FileText', color: 'bg-blue-100 text-blue-700', label: 'Created a post' },
  'post_deleted': { icon: 'Trash2', color: 'bg-red-100 text-red-700', label: 'Deleted a post' },
  'content_liked': { icon: 'Heart', color: 'bg-red-100 text-red-700', label: 'Liked content' },
  'content_unliked': { icon: 'Heart', color: 'bg-gray-100 text-gray-700', label: 'Unliked content' },
  'comment_added': { icon: 'MessageSquare', color: 'bg-green-100 text-green-700', label: 'Added a comment' },
  'comment_deleted': { icon: 'MessageSquare', color: 'bg-red-100 text-red-700', label: 'Deleted a comment' },
  'content_shared': { icon: 'Share2', color: 'bg-blue-100 text-blue-700', label: 'Shared content' },
  'content_purchased': { icon: 'ShoppingCart', color: 'bg-green-100 text-green-700', label: 'Purchased content' },
  'product_listed': { icon: 'Package', color: 'bg-blue-100 text-blue-700', label: 'Listed a product' },
  'product_sold': { icon: 'TrendingUp', color: 'bg-green-100 text-green-700', label: 'Sold a product' },
  'job_posted': { icon: 'Briefcase', color: 'bg-blue-100 text-blue-700', label: 'Posted a job' },
  'job_completed': { icon: 'CheckCircle', color: 'bg-green-100 text-green-700', label: 'Completed a job' },
  'trade_executed': { icon: 'TrendingUp', color: 'bg-orange-100 text-orange-700', label: 'Executed a trade' },
  'followers_gained': { icon: 'Users', color: 'bg-purple-100 text-purple-700', label: 'Gained a follower' },
  'profile_updated': { icon: 'User', color: 'bg-gray-100 text-gray-700', label: 'Updated profile' },
  'badge_earned': { icon: 'Award', color: 'bg-yellow-100 text-yellow-700', label: 'Earned a badge' },
  'level_up': { icon: 'Zap', color: 'bg-purple-100 text-purple-700', label: 'Leveled up' },
  'milestone_reached': { icon: 'Trophy', color: 'bg-gold-100 text-gold-700', label: 'Reached a milestone' },
};

// Mock activity data
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'post_created',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    description: 'Created a new post about cryptocurrency trends',
    icon: 'FileText',
    color: 'bg-blue-100 text-blue-700',
    relatedEntity: {
      id: 'post1',
      type: 'post',
      title: 'Cryptocurrency trends analysis',
      url: '/posts/post1',
    },
  },
  {
    id: '2',
    type: 'content_liked',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    description: 'Liked a post by John Doe',
    icon: 'Heart',
    color: 'bg-red-100 text-red-700',
    relatedEntity: {
      id: 'post2',
      type: 'post',
      title: 'Amazing marketplace features',
      url: '/posts/post2',
    },
  },
  {
    id: '3',
    type: 'comment_added',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    description: 'Added a comment to a post',
    icon: 'MessageSquare',
    color: 'bg-green-100 text-green-700',
    relatedEntity: {
      id: 'post3',
      type: 'post',
      title: 'Best trading strategies',
      url: '/posts/post3',
    },
  },
  {
    id: '4',
    type: 'profile_updated',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    description: 'Updated profile information',
    icon: 'User',
    color: 'bg-gray-100 text-gray-700',
  },
  {
    id: '5',
    type: 'followers_gained',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    description: 'Gained 3 new followers',
    icon: 'Users',
    color: 'bg-purple-100 text-purple-700',
    metadata: { count: 3 },
  },
  {
    id: '6',
    type: 'badge_earned',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    description: 'Earned "Top Contributor" badge',
    icon: 'Award',
    color: 'bg-yellow-100 text-yellow-700',
    relatedEntity: {
      id: 'badge1',
      type: 'badge',
      title: 'Top Contributor',
      url: '/badges/top-contributor',
    },
  },
  {
    id: '7',
    type: 'trade_executed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    description: 'Executed a crypto trade',
    icon: 'TrendingUp',
    color: 'bg-orange-100 text-orange-700',
    metadata: { amount: '$500', pair: 'BTC/USD' },
  },
  {
    id: '8',
    type: 'product_sold',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    description: 'Sold a product on marketplace',
    icon: 'TrendingUp',
    color: 'bg-green-100 text-green-700',
    relatedEntity: {
      id: 'product1',
      type: 'product',
      title: 'Digital Design Course',
      url: '/marketplace/product1',
    },
  },
];

export function useActivityTimeline({
  userId,
  filters = [],
  limit = 10,
  offset = 0,
}: UseActivityTimelineOptions) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Import Supabase client
        const { supabase } = await import('@/integrations/supabase/client');

        // Fetch activities from database
        const activities: ActivityItem[] = [];

        // 1. Fetch user's posts (post_created events)
        const { data: userPosts } = await supabase
          .from('posts')
          .select('id, content, created_at, likes_count, comments_count, shares_count')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (userPosts) {
          userPosts.forEach(post => {
            activities.push({
              id: `post_created_${post.id}`,
              type: 'post_created',
              timestamp: post.created_at,
              description: `Created a new post`,
              icon: 'FileText',
              color: 'bg-blue-100 text-blue-700',
              relatedEntity: {
                id: post.id,
                type: 'post',
                title: post.content?.substring(0, 50) || 'Post',
                url: `/post/${post.id}`,
              },
            });
          });
        }

        // 2. Fetch user's post likes (content_liked events)
        const { data: userLikes } = await supabase
          .from('post_likes')
          .select('id, post_id, created_at, posts(content)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (userLikes) {
          userLikes.forEach((like: any) => {
            activities.push({
              id: `liked_${like.id}`,
              type: 'content_liked',
              timestamp: like.created_at,
              description: `Liked a post`,
              icon: 'Heart',
              color: 'bg-red-100 text-red-700',
              relatedEntity: {
                id: like.post_id,
                type: 'post',
                title: like.posts?.content?.substring(0, 50) || 'Post',
                url: `/post/${like.post_id}`,
              },
            });
          });
        }

        // 3. Fetch user's comments (comment_added events)
        const { data: userComments } = await supabase
          .from('post_comments')
          .select('id, post_id, content, created_at, posts(content)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (userComments) {
          userComments.forEach((comment: any) => {
            activities.push({
              id: `comment_${comment.id}`,
              type: 'comment_added',
              timestamp: comment.created_at,
              description: `Added a comment`,
              icon: 'MessageSquare',
              color: 'bg-green-100 text-green-700',
              relatedEntity: {
                id: comment.post_id,
                type: 'post',
                title: comment.posts?.content?.substring(0, 50) || 'Post',
                url: `/post/${comment.post_id}`,
              },
              metadata: { comment: comment.content },
            });
          });
        }

        // 4. Fetch user's saved posts (content_purchased / bookmarks)
        const { data: userSaves } = await supabase
          .from('user_saved_posts')
          .select('id, post_id, created_at, posts(content)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (userSaves) {
          userSaves.forEach((save: any) => {
            activities.push({
              id: `saved_${save.id}`,
              type: 'content_purchased',
              timestamp: save.created_at,
              description: `Saved a post`,
              icon: 'ShoppingCart',
              color: 'bg-green-100 text-green-700',
              relatedEntity: {
                id: save.post_id,
                type: 'post',
                title: save.posts?.content?.substring(0, 50) || 'Post',
                url: `/post/${save.post_id}`,
              },
            });
          });
        }

        // 5. Fetch profile views (followers_gained as proxy)
        const { data: profileViews } = await supabase
          .from('profile_views')
          .select('id, viewer_id, created_at, profiles(full_name, username, avatar_url)')
          .eq('profile_id', userId)
          .order('created_at', { ascending: false })
          .limit(Math.floor(limit / 2));

        if (profileViews) {
          profileViews.forEach((view: any) => {
            if (view.profiles) {
              activities.push({
                id: `view_${view.id}`,
                type: 'followers_gained',
                timestamp: view.created_at,
                description: `Profile viewed by ${view.profiles.full_name}`,
                icon: 'Users',
                color: 'bg-purple-100 text-purple-700',
                relatedEntity: {
                  id: view.viewer_id,
                  type: 'profile',
                  title: view.profiles.username,
                  url: `/profile/${view.profiles.username}`,
                },
              });
            }
          });
        }

        // Sort by timestamp (newest first)
        activities.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Apply filters
        let filtered = activities;
        if (filters && filters.length > 0) {
          filtered = filtered.filter(a => filters.includes(a.type));
        }

        // Apply pagination
        const paginated = filtered.slice(offset, offset + limit);
        setActivities(paginated);
        setHasMore(filtered.length > offset + limit);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch activities');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [userId, filters, limit, offset]);

  return {
    activities,
    isLoading,
    hasMore,
    error,
    activityConfig,
  };
}

export { activityConfig };
