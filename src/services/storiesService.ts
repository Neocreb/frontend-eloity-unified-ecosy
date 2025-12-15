import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

export interface UserStory {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  expires_at: string;
  views_count: number;
  created_at: string;
  profiles?: UserProfile;
}

export interface StoryView {
  id: string;
  story_id: string;
  user_id: string;
  viewed_at: string;
}

export interface CreateStoryData {
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  expires_in_hours?: number; // Default: 24 hours
}

class StoriesService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = supabase;
  }

  // Get all active stories for users that the current user follows
  async getActiveStories(currentUserId: string): Promise<UserStory[]> {
    try {
      // Get active stories - only filter by expires_at on the database side
      // Do NOT run cleanup on client, it should run on server via scheduled task
      const { data: stories, error: storiesError } = await this.supabase
        .from('user_stories')
        .select('id, user_id, created_at, expires_at, media_url, media_type, caption, views_count')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      if (!stories || stories.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(stories.map(s => s.user_id))];

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await this.supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('Error fetching profiles:', profilesError);
        // Return stories without profile data if profiles fetch fails
        return stories.map(story => ({
          ...story,
          profiles: undefined
        })) as UserStory[];
      }

      // Create a map of profiles by user_id
      const profileMap: Record<string, any> = {};
      (profiles || []).forEach(profile => {
        profileMap[profile.user_id] = profile;
      });

      // Merge stories with profiles
      const enrichedStories = stories.map(story => ({
        ...story,
        profiles: profileMap[story.user_id]
      })) as UserStory[];

      return enrichedStories;
    } catch (error) {
      console.error('Error fetching active stories:', error);
      throw error;
    }
  }

  // Get stories for a specific user
  async getUserStories(userId: string): Promise<UserStory[]> {
    try {
      const { data: stories, error: storiesError } = await this.supabase
        .from('user_stories')
        .select('id, user_id, created_at, expires_at, media_url, media_type, caption, views_count')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      if (!stories || stories.length === 0) {
        return [];
      }

      // Fetch profile for this user
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.warn('Error fetching user profile:', profileError);
        // Return stories without profile data if profile fetch fails
        return stories.map(story => ({
          ...story,
          profiles: undefined
        })) as UserStory[];
      }

      // Merge stories with profile
      const enrichedStories = stories.map(story => ({
        ...story,
        profiles: profile
      })) as UserStory[];

      return enrichedStories;
    } catch (error) {
      console.error('Error fetching user stories:', error);
      throw error;
    }
  }

  // Create a new story
  async createStory(storyData: CreateStoryData, userId: string): Promise<UserStory> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (storyData.expires_in_hours || 24));

      const newStory = {
        user_id: userId,
        media_url: storyData.media_url,
        media_type: storyData.media_type,
        caption: storyData.caption || null,
        expires_at: expiresAt.toISOString(),
      };

      const { data, error } = await this.supabase
        .from('user_stories')
        .insert(newStory)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  }

  // Delete a story
  async deleteStory(storyId: string, userId: string): Promise<void> {
    try {
      // Check if user is the owner
      const { data: story, error: fetchError } = await this.supabase
        .from('user_stories')
        .select('user_id')
        .eq('id', storyId)
        .single();

      if (fetchError) throw fetchError;
      if (!story || story.user_id !== userId) {
        throw new Error('Unauthorized: Only story owners can delete stories');
      }

      const { error } = await this.supabase
        .from('user_stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }

  // Mark a story as viewed
  async viewStory(storyId: string, userId: string): Promise<StoryView> {
    try {
      // Validate storyId is a valid UUID and not "create" or other invalid values
      if (!storyId || storyId === 'create' || typeof storyId !== 'string' || storyId.length < 36) {
        console.warn(`Invalid story ID for view: ${storyId}`);
        return {
          id: '',
          story_id: storyId,
          user_id: userId,
          viewed_at: new Date().toISOString()
        };
      }

      // Check if already viewed using user_id column (not viewer_id)
      const { data: existingView, error: viewError } = await this.supabase
        .from('story_views')
        .select('id')
        .eq('story_id', storyId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingView) {
        // Already viewed, return existing view
        return {
          id: existingView.id,
          story_id: storyId,
          user_id: userId,
          viewed_at: new Date().toISOString()
        };
      }

      // Insert new view using correct column name user_id (not viewer_id)
      const { data, error } = await this.supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          user_id: userId,
          viewed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting story view:', {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          fullError: JSON.stringify(error)
        });
        return {
          id: '',
          story_id: storyId,
          user_id: userId,
          viewed_at: new Date().toISOString()
        };
      }

      // Update view count using read-modify-write
      const { data: story } = await this.supabase
        .from('user_stories')
        .select('views_count')
        .eq('id', storyId)
        .single();

      if (story) {
        await this.supabase
          .from('user_stories')
          .update({ views_count: (story.views_count || 0) + 1 })
          .eq('id', storyId);
      }

      return data;
    } catch (error) {
      console.error('Error viewing story:', error);
      return {
        id: '',
        story_id: storyId,
        user_id: userId,
        viewed_at: new Date().toISOString()
      };
    }
  }

  // Get viewers for a story
  async getStoryViewers(storyId: string): Promise<StoryView[]> {
    try {
      const { data, error } = await this.supabase
        .from('story_views')
        .select('*')
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching story viewers:', error);
      throw error;
    }
  }

  // Like a story (note: user_stories table doesn't have like_count column)
  async likeStory(storyId: string, userId: string): Promise<void> {
    try {
      // user_stories table doesn't support likes in the current schema
      // This is a placeholder for potential future implementation
      console.warn('Like functionality not yet supported for stories');
      return;
    } catch (error) {
      console.error('Error liking story:', error);
      throw error;
    }
  }

  // Unlike a story (note: user_stories table doesn't have like_count column)
  async unlikeStory(storyId: string, userId: string): Promise<void> {
    try {
      // user_stories table doesn't support likes in the current schema
      // This is a placeholder for potential future implementation
      console.warn('Unlike functionality not yet supported for stories');
      return;
    } catch (error) {
      console.error('Error unliking story:', error);
      throw error;
    }
  }
}

export const storiesService = new StoriesService();
