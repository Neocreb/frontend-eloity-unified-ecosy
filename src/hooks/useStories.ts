import { useState, useEffect } from 'react';
import { UserStory, StoryView, storiesService } from '@/services/storiesService';
import { useAuth } from '@/contexts/AuthContext';

export interface Story {
  id: string;
  username: string;
  avatar: string;
  hasNewStory?: boolean;
  stories: UserStory[];
}

export const useStories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStories();
    }
  }, [user]);

  const fetchStories = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const activeStories = await storiesService.getActiveStories(user.id);

      // Group stories by user
      const groupedStories: Record<string, UserStory[]> = {};
      activeStories.forEach(story => {
        if (!groupedStories[story.user_id]) {
          groupedStories[story.user_id] = [];
        }
        groupedStories[story.user_id].push(story);
      });

      // Convert to Story format with proper user data from profiles
      const formattedStories: Story[] = Object.entries(groupedStories).map(([userId, userStories]) => {
        const firstStory = userStories[0];
        const profile = firstStory.profiles;

        return {
          id: userId,
          username: profile?.full_name || profile?.username || 'Unknown User',
          avatar: profile?.avatar_url || '/placeholder.svg',
          stories: userStories,
          hasNewStory: true
        };
      });

      setStories(formattedStories);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stories';
      setError(errorMessage);
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  };

  const createStory = async (storyData: any) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      const newStory = await storiesService.createStory(storyData, user.id);
      // Refresh stories
      await fetchStories();
      setError(null);
      return newStory;
    } catch (err) {
      setError('Failed to create story');
      console.error('Error creating story:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      await storiesService.deleteStory(storyId, user.id);
      // Refresh stories
      await fetchStories();
      setError(null);
    } catch (err) {
      setError('Failed to delete story');
      console.error('Error deleting story:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const viewStory = async (storyId: string) => {
    if (!user) {
      console.warn('User not authenticated, skipping story view');
      return null;
    }

    // Validate storyId before attempting to view
    if (!storyId || storyId === 'create' || typeof storyId !== 'string' || storyId.length < 36) {
      console.warn('Invalid story ID, skipping view:', storyId);
      return null;
    }

    try {
      const view = await storiesService.viewStory(storyId, user.id);
      // Refresh stories to update view counts
      await fetchStories();
      return view;
    } catch (err) {
      console.error('Error viewing story:', err);
      // Don't throw - just log and continue
      return null;
    }
  };

  const likeStory = async (storyId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      await storiesService.likeStory(storyId, user.id);
      // Refresh stories to update like counts
      await fetchStories();
    } catch (err) {
      console.error('Error liking story:', err);
      throw err;
    }
  };

  const unlikeStory = async (storyId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      await storiesService.unlikeStory(storyId, user.id);
      // Refresh stories to update like counts
      await fetchStories();
    } catch (err) {
      console.error('Error unliking story:', err);
      throw err;
    }
  };

  return {
    stories,
    loading,
    error,
    createStory,
    deleteStory,
    viewStory,
    likeStory,
    unlikeStory,
    refresh: fetchStories,
  };
};

export const useUserStories = (userId: string) => {
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (userId) {
      fetchUserStories();
    }
  }, [userId]);

  const fetchUserStories = async () => {
    try {
      setLoading(true);
      const stories = await storiesService.getUserStories(userId);
      setUserStories(stories);
      setError(null);
    } catch (err) {
      setError('Failed to fetch user stories');
      console.error('Error fetching user stories:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    userStories,
    loading,
    error,
    refresh: fetchUserStories,
  };
};

export const useStoryViewers = (storyId: string) => {
  const [viewers, setViewers] = useState<StoryView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storyId) {
      fetchViewers();
    }
  }, [storyId]);

  const fetchViewers = async () => {
    try {
      setLoading(true);
      const storyViewers = await storiesService.getStoryViewers(storyId);
      setViewers(storyViewers);
      setError(null);
    } catch (err) {
      setError('Failed to fetch story viewers');
      console.error('Error fetching story viewers:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    viewers,
    loading,
    error,
    refresh: fetchViewers,
  };
};
