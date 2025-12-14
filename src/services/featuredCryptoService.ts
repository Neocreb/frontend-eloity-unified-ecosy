import { supabase } from "@/integrations/supabase/client";
import { blogService } from "./blogService";
import { courseService } from "./courseService";

export interface FeaturedCryptoListing {
  id: string;
  symbol: string;
  name: string;
  coingecko_id: string;
  image_url: string;
  current_price: number;
  price_change_24h: number;
  market_cap_rank: number;
  category: 'gemw' | 'new_listing' | 'trending' | 'hot';
  is_featured: boolean;
  order_index: number;
}

export interface CommunityFeaturedPost {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  title: string;
  content: string;
  category: 'discover' | 'community' | 'announcement' | 'event';
  sentiment: 'positive' | 'negative' | 'neutral';
  impact_percentage: number;
  is_featured: boolean;
  engagement_count: number;
  created_at: string;
  updated_at: string;
}

export class FeaturedCryptoService {
  static async getFeaturedListingsByCategory(
    category: 'gemw' | 'new_listing' | 'trending' | 'hot',
    limit: number = 6
  ): Promise<FeaturedCryptoListing[]> {
    try {
      const { data, error } = await supabase
        .from('featured_crypto_listings')
        .select('*')
        .eq('category', category)
        .order('order_index', { ascending: true })
        .order('featured_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn(`[FeaturedCrypto] Error fetching ${category} listings:`, error);
        return this.getMockListings(category, limit);
      }

      return data || [];
    } catch (err) {
      console.warn(`[FeaturedCrypto] Exception fetching ${category}:`, err);
      return this.getMockListings(category, limit);
    }
  }

  static async getAllFeaturedListings(limit: number = 12): Promise<FeaturedCryptoListing[]> {
    try {
      const { data, error } = await supabase
        .from('featured_crypto_listings')
        .select('*')
        .eq('is_featured', true)
        .order('order_index', { ascending: true })
        .order('featured_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('[FeaturedCrypto] Error fetching all featured:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.warn('[FeaturedCrypto] Exception fetching all featured:', err);
      return [];
    }
  }

  static async getCommunityFeaturedPosts(
    category?: 'discover' | 'community' | 'announcement' | 'event',
    limit: number = 5
  ): Promise<CommunityFeaturedPost[]> {
    try {
      // Try to fetch from different sources based on category
      if (category === 'discover') {
        return this.getDiscoverPosts(limit);
      } else if (category === 'announcement') {
        return this.getAnnouncementPosts(limit);
      } else if (category === 'event') {
        return this.getEventPosts(limit);
      } else if (category === 'community') {
        return this.getCommunityPosts(limit);
      }

      // If no category, try to fetch from database first
      try {
        let query = supabase
          .from('community_featured_posts')
          .select('*')
          .eq('is_featured', true);

        const { data, error } = await query
          .order('order_index', { ascending: true })
          .order('featured_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        if (data && data.length > 0) return data;
      } catch (dbError) {
        console.warn('[FeaturedCrypto] Database query failed:', dbError);
      }

      // Fallback to mock
      return this.getMockCommunityPosts(category, limit);
    } catch (err) {
      console.warn('[FeaturedCrypto] Exception fetching community posts:', err);
      return this.getMockCommunityPosts(category, limit);
    }
  }

  static async getDiscoverPosts(limit: number = 5): Promise<CommunityFeaturedPost[]> {
    try {
      // Fetch from blog posts and courses for discover section
      const [blogPosts, courses] = await Promise.all([
        blogService.getBlogPostsSimple(undefined, undefined, 'published', Math.ceil(limit * 0.6)),
        courseService.getAllCourses().slice(0, Math.ceil(limit * 0.4))
      ]);

      const posts: CommunityFeaturedPost[] = [];

      // Add blog posts
      blogPosts.forEach((post, idx) => {
        if (idx < Math.ceil(limit * 0.6)) {
          posts.push({
            id: post.id,
            user_id: '',
            username: 'Eloity Learn',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eloity-learn',
            title: post.title,
            content: post.excerpt || post.content.substring(0, 150),
            category: 'discover',
            sentiment: 'positive',
            impact_percentage: 5.5,
            is_featured: true,
            engagement_count: post.views || 0,
            created_at: post.publishedAt || new Date().toISOString(),
            updated_at: post.updatedAt || new Date().toISOString(),
          });
        }
      });

      // Add courses
      courses.forEach((course, idx) => {
        if (posts.length < limit) {
          posts.push({
            id: `course_${course.id}`,
            user_id: '',
            username: 'Eloity Academy',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eloity-academy',
            title: course.title,
            content: course.description || `Learn ${course.title}`,
            category: 'discover',
            sentiment: 'positive',
            impact_percentage: 0,
            is_featured: true,
            engagement_count: course.enrollments?.length || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      });

      return posts.slice(0, limit);
    } catch (err) {
      console.warn('[FeaturedCrypto] Error fetching discover posts:', err);
      return [];
    }
  }

  static async getAnnouncementPosts(limit: number = 5): Promise<CommunityFeaturedPost[]> {
    try {
      // Fetch blog posts tagged as announcements
      const posts = await blogService.getBlogPostsSimple(undefined, ['announcement', 'news', 'update'], 'published', limit);

      return posts.map((post) => ({
        id: post.id,
        user_id: '',
        username: 'Eloity Announcements',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eloity-announce',
        title: post.title,
        content: post.excerpt || post.content.substring(0, 150),
        category: 'announcement',
        sentiment: 'neutral',
        impact_percentage: 0,
        is_featured: true,
        engagement_count: post.views || 0,
        created_at: post.publishedAt || new Date().toISOString(),
        updated_at: post.updatedAt || new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('[FeaturedCrypto] Error fetching announcements:', err);
      return [];
    }
  }

  static async getEventPosts(limit: number = 5): Promise<CommunityFeaturedPost[]> {
    try {
      // Try to fetch from events table
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_type', 'crypto')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(limit);

      if (error || !data || data.length === 0) {
        // Return mock events if no database data
        return this.getMockEventPosts(limit);
      }

      return data.map((event: any) => ({
        id: event.id,
        user_id: event.user_id || '',
        username: event.organizer || 'Eloity Events',
        avatar_url: event.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=eloity-events',
        title: event.title,
        content: event.description || 'Upcoming crypto event',
        category: 'event',
        sentiment: 'positive',
        impact_percentage: 0,
        is_featured: true,
        engagement_count: event.attendees_count || 0,
        created_at: event.created_at || new Date().toISOString(),
        updated_at: event.updated_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('[FeaturedCrypto] Error fetching events:', err);
      return this.getMockEventPosts(limit);
    }
  }

  static async getCommunityPosts(limit: number = 5): Promise<CommunityFeaturedPost[]> {
    try {
      // Fetch crypto-related posts from feed
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles:user_id(*)')
        .ilike('content', '%crypto%')
        .ilike('content', '%trading%,bitcoin,ethereum')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data || data.length === 0) {
        return this.getMockCommunityPosts('community', limit);
      }

      return data.map((post: any) => ({
        id: post.id,
        user_id: post.user_id,
        username: post.profiles?.full_name || post.profiles?.username || 'Anonymous',
        avatar_url: post.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
        title: '',
        content: post.content,
        category: 'community',
        sentiment: 'positive',
        impact_percentage: 0,
        is_featured: true,
        engagement_count: (post.likes_count || 0) + (post.shares_count || 0),
        created_at: post.created_at,
        updated_at: post.updated_at || post.created_at,
      }));
    } catch (err) {
      console.warn('[FeaturedCrypto] Error fetching community posts:', err);
      return this.getMockCommunityPosts('community', limit);
    }
  }

  static async createCommunityPost(post: Omit<CommunityFeaturedPost, 'id' | 'created_at' | 'updated_at'>): Promise<CommunityFeaturedPost | null> {
    try {
      const { data, error } = await supabase
        .from('community_featured_posts')
        .insert([post])
        .select()
        .single();

      if (error) {
        console.error('[FeaturedCrypto] Error creating community post:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('[FeaturedCrypto] Exception creating community post:', err);
      return null;
    }
  }

  static async updateCommunityPostEngagement(postId: string, incrementBy: number = 1): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('increment_post_engagement', {
        post_id: postId,
        increment_count: incrementBy
      });

      if (error) {
        console.warn('[FeaturedCrypto] Error updating engagement:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('[FeaturedCrypto] Exception updating engagement:', err);
      return false;
    }
  }

  // Mock data for fallback
  private static getMockListings(category: string, limit: number): FeaturedCryptoListing[] {
    const allMocks = {
      gemw: [
        {
          id: '1',
          symbol: 'GemW',
          name: 'GemW Onchain',
          coingecko_id: 'gemw',
          image_url: 'https://api.dicebear.com/7.x/identicon/svg?seed=gemw',
          current_price: 0.000045,
          price_change_24h: 125.50,
          market_cap_rank: null,
          category: 'gemw' as const,
          is_featured: true,
          order_index: 1
        }
      ],
      new_listing: [
        {
          id: '2',
          symbol: 'FUTR',
          name: 'Futures Trading Platform',
          coingecko_id: 'futures-trading',
          image_url: 'https://api.dicebear.com/7.x/identicon/svg?seed=futr',
          current_price: 2.50,
          price_change_24h: 45.30,
          market_cap_rank: 5000,
          category: 'new_listing' as const,
          is_featured: true,
          order_index: 1
        }
      ],
      hot: [
        {
          id: '3',
          symbol: 'BTC',
          name: 'Bitcoin',
          coingecko_id: 'bitcoin',
          image_url: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
          current_price: 43250,
          price_change_24h: 8.75,
          market_cap_rank: 1,
          category: 'hot' as const,
          is_featured: true,
          order_index: 1
        }
      ],
      trending: [
        {
          id: '4',
          symbol: 'ETH',
          name: 'Ethereum',
          coingecko_id: 'ethereum',
          image_url: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
          current_price: 2350,
          price_change_24h: 5.42,
          market_cap_rank: 2,
          category: 'trending' as const,
          is_featured: true,
          order_index: 1
        }
      ]
    };

    return (allMocks[category as keyof typeof allMocks] || []).slice(0, limit);
  }

  private static getMockCommunityPosts(category?: string, limit: number = 5): CommunityFeaturedPost[] {
    const mockPosts: CommunityFeaturedPost[] = [
      {
        id: '1',
        user_id: '123',
        username: 'CoinW Community',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coinw',
        title: 'Spot the next big thing in crypto?',
        content: '$STABLE is going to be listed on CoinW — and it\'s more than just a token.',
        category: 'discover',
        sentiment: 'positive',
        impact_percentage: 11.10,
        is_featured: true,
        engagement_count: 342,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        user_id: '124',
        username: 'Crypto Enthusiast',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
        title: 'New opportunities unlocked',
        content: 'New DeFi opportunities unlocked this week. Don\'t miss out!',
        category: 'community',
        sentiment: 'positive',
        impact_percentage: 8.50,
        is_featured: true,
        engagement_count: 256,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        user_id: '125',
        username: 'Trading Master',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
        title: 'Market Update',
        content: 'Bitcoin holding strong above resistance levels. Market sentiment remains bullish.',
        category: 'announcement',
        sentiment: 'positive',
        impact_percentage: 2.30,
        is_featured: true,
        engagement_count: 128,
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    if (category) {
      return mockPosts.filter(p => p.category === category).slice(0, limit);
    }

    return mockPosts.slice(0, limit);
  }
}

export default FeaturedCryptoService;
