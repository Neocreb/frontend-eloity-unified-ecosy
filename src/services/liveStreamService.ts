import { supabase } from "@/integrations/supabase/client";

export interface LiveStream {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  viewer_count: number;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
  category: string | null;
  stream_key: string | null;
  user?: {
    username: string;
    full_name: string;
    avatar_url: string;
    is_verified: boolean;
  };
}

export interface Battle {
  id: string;
  live_stream_id: string;
  challenger_id: string;
  opponent_id: string | null;
  battle_type: 'dance' | 'rap' | 'comedy' | 'general';
  time_remaining: number | null;
  challenger_score: number;
  opponent_score: number;
  winner_id: string | null;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
}

interface Profile {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  is_verified: boolean;
}

export const liveStreamService = {
  async getActiveLiveStreams(): Promise<LiveStream[]> {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select('id, user_id, title, description, viewer_count, is_active, started_at, ended_at, category, stream_key')
        .eq('is_active', true)
        .order('viewer_count', { ascending: false })
        .limit(20);

      if (error) {
        // Check if table doesn't exist (PGRST116 or similar error codes)
        if (error.code === 'PGRST116' || error.message?.includes('relation "public.live_streams" does not exist')) {
          console.warn('Live streams table not yet created. Please run the migration script.');
          return [];
        }
        // Log detailed error information
        console.error('Error loading live streams - Details:', {
          message: error?.message,
          code: error?.code,
          hint: error?.hint,
          details: error?.details,
          fullError: JSON.stringify(error)
        });
        return [];
      }

      // Get user profiles separately
      if (!data || data.length === 0) return [];

      const userIds = Array.from(new Set(data.map((s: any) => s.user_id)));

      // Fetch profiles with error handling
      let profiles = [];
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, avatar_url, is_verified')
          .in('user_id', userIds);

        if (profilesError) {
          console.warn('Warning: Could not load profiles, continuing without them:', {
            message: profilesError?.message,
            code: profilesError?.code
          });
        } else {
          profiles = profilesData || [];
        }
      } catch (profileError) {
        console.warn('Exception while loading profiles:', profileError instanceof Error ? profileError.message : 'Unknown');
      }

      const profileMap = new Map(
        profiles.map((p: any) => [p.user_id, p])
      );

      return data.map((stream: any) => {
        const profile = profileMap.get(stream.user_id);
        return {
          ...stream,
          user: profile ? {
            username: (profile as Profile).username || 'unknown',
            full_name: (profile as Profile).full_name || 'Unknown User',
            avatar_url: (profile as Profile).avatar_url || '',
            is_verified: (profile as Profile).is_verified || false
          } : undefined
        };
      });
    } catch (error) {
      console.error('Exception in getActiveLiveStreams:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return [];
    }
  },

  async getLiveStreamById(id: string): Promise<LiveStream | null> {
    const { data, error } = await supabase
      .from('live_streams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url, is_verified')
      .eq('user_id', data.user_id)
      .single();

    return {
      ...data,
      user: profile ? {
        username: (profile as Profile).username || 'unknown',
        full_name: (profile as Profile).full_name || 'Unknown User',
        avatar_url: (profile as Profile).avatar_url || '',
        is_verified: (profile as Profile).is_verified || false
      } : undefined
    };
  },

  async createLiveStream(streamData: {
    title: string;
    description?: string;
    category?: string;
  }): Promise<LiveStream> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('live_streams')
      .insert({
        user_id: user.id,
        title: streamData.title,
        description: streamData.description,
        category: streamData.category,
        // Let the database generate the ID and stream_key
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateViewerCount(streamId: string, count: number): Promise<void> {
    const { error } = await supabase
      .from('live_streams')
      .update({ viewer_count: count })
      .eq('id', streamId);

    if (error) throw error;
  },

  async endLiveStream(streamId: string): Promise<void> {
    const { error } = await supabase
      .from('live_streams')
      .update({ 
        is_active: false,
        ended_at: new Date().toISOString()
      })
      .eq('id', streamId);

    if (error) throw error;
  },

  async getActiveBattles(): Promise<(LiveStream & { battle: Battle })[]> {
    try {
      let battles: any[] = [];
      let error: any = null;

      try {
        const result = await supabase
          .from('battles')
          .select('*')
          .in('status', ['pending', 'active'])
          .order('created_at', { ascending: false });

        battles = result.data || [];
        error = result.error;
      } catch (fetchErr) {
        console.warn('Network error fetching battles, returning empty array:', {
          message: fetchErr instanceof Error ? fetchErr.message : 'Unknown network error'
        });
        return [];
      }

      if (error) {
        // Check if table doesn't exist
        if (error.code === 'PGRST116' || error.message?.includes('relation "public.battles" does not exist')) {
          console.warn('Battles table not yet created. Please run the migration script.');
          return [];
        }
        console.error('Error fetching battles - Details:', {
          message: error?.message,
          code: error?.code,
          hint: error?.hint,
          details: error?.details,
          fullError: JSON.stringify(error)
        });
        // Return empty array as fallback
        return [];
      }

      if (!battles || battles.length === 0) return [];

      const streamIds = battles.map((b: any) => b.live_stream_id);
      if (!streamIds.length) return [];

      const { data: streams, error: streamsError } = await supabase
        .from('live_streams')
        .select('id, user_id, title, description, viewer_count, is_active, started_at, ended_at, category, stream_key')
        .in('id', streamIds);

      if (streamsError) {
        // Only log network errors at debug level
        if (streamsError?.message?.includes('Failed to fetch')) {
          console.debug('Network unavailable for battle streams - will retry when available');
        } else {
          console.warn('Warning fetching live streams for battles:', {
            message: streamsError?.message,
            code: streamsError?.code
          });
        }
        // Return empty array as fallback
        return [];
      }

      if (!streams) return [];

      const userIds = Array.from(new Set(streams.map((s: any) => s.user_id)));
      let profiles = [];

      if (userIds.length > 0) {
        try {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, username, full_name, avatar_url, is_verified')
            .in('user_id', userIds);

          if (profilesError) {
            // Only log network errors at debug level
            if (profilesError?.message?.includes('Failed to fetch')) {
              console.debug('Network unavailable for profiles - continuing without');
            } else {
              console.warn('Warning: Could not load profiles for battles:', {
                message: profilesError?.message,
                code: profilesError?.code
              });
            }
          } else {
            profiles = profilesData || [];
          }
        } catch (profileError) {
          // Network errors are expected
          if (profileError instanceof Error && profileError.message.includes('Failed to fetch')) {
            console.debug('Network error loading profiles - continuing without');
          } else {
            console.warn('Exception while loading profiles for battles:', profileError instanceof Error ? profileError.message : 'Unknown');
          }
        }
      }

      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));
      const streamMap = new Map(streams.map((s: any) => [s.id, s]));

      return battles.map((battle: any) => {
        const stream = streamMap.get(battle.live_stream_id);
        if (!stream) return null;

        const profile: any = profileMap.get((stream as any).user_id);
        
        return {
          ...stream,
          user: profile ? {
            username: (profile as Profile).username || 'unknown',
            full_name: (profile as Profile).full_name || 'Unknown User',
            avatar_url: (profile as Profile).avatar_url || '',
            is_verified: (profile as Profile).is_verified || false
          } : undefined,
          battle: {
            id: battle.id,
            live_stream_id: battle.live_stream_id,
            challenger_id: battle.challenger_id,
            opponent_id: battle.opponent_id,
            battle_type: battle.battle_type as 'dance' | 'rap' | 'comedy' | 'general',
            time_remaining: battle.time_remaining,
            challenger_score: battle.challenger_score,
            opponent_score: battle.opponent_score,
            winner_id: battle.winner_id,
            status: battle.status as 'pending' | 'active' | 'completed' | 'cancelled'
          }
        };
      }).filter(Boolean) as (LiveStream & { battle: Battle })[];
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Network error fetching battles:', errorMsg);
      // Return empty array as fallback for network errors
      return [];
    }
  },

  async createBattle(battleData: {
    liveStreamId: string;
    battleType: 'dance' | 'rap' | 'comedy' | 'general';
    opponentId?: string;
  }): Promise<Battle> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('battles')
      .insert({
        live_stream_id: battleData.liveStreamId,
        challenger_id: user.id,
        opponent_id: battleData.opponentId,
        battle_type: battleData.battleType,
        time_remaining: 300,
        status: 'pending'
        // Let the database generate the ID
      })
      .select()
      .single();

    if (error) throw error;
    return data as Battle;
  }
};
