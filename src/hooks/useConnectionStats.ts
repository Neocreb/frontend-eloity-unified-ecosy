import { useState, useEffect } from 'react';
import { Connection } from '@/components/profile/ConnectionStats';

interface UseConnectionStatsOptions {
  userId?: string;
  limit?: number;
}

interface UseConnectionStatsResult {
  totalConnections: number;
  mutualConnections: number;
  networkSize: number;
  topConnections: Connection[];
  isLoading: boolean;
  error: Error | null;
}

export const useConnectionStats = ({
  userId,
  limit = 10,
}: UseConnectionStatsOptions = {}): UseConnectionStatsResult => {
  const [totalConnections, setTotalConnections] = useState(0);
  const [mutualConnections, setMutualConnections] = useState(0);
  const [networkSize, setNetworkSize] = useState(0);
  const [topConnections, setTopConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Default connections data
  const defaultConnections: Connection[] = [
    {
      id: 'conn-1',
      name: 'Alice Martinez',
      username: 'alicemtz',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60',
      role: 'Senior Designer',
      mutualConnections: 12,
      sharedInterests: ['Design', 'UI/UX', 'Web Development'],
    },
    {
      id: 'conn-2',
      name: 'David Lee',
      username: 'davidlee_dev',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60',
      role: 'Full Stack Developer',
      mutualConnections: 8,
      sharedInterests: ['Web Development', 'Node.js', 'React'],
    },
    {
      id: 'conn-3',
      name: 'Lisa Chen',
      username: 'lisachen',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60',
      role: 'Product Manager',
      mutualConnections: 15,
      sharedInterests: ['Product Management', 'Design', 'Strategy'],
    },
    {
      id: 'conn-4',
      name: 'James Wilson',
      username: 'jameswil',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60',
      role: 'Marketing Specialist',
      mutualConnections: 6,
      sharedInterests: ['Marketing', 'Growth', 'Analytics'],
    },
    {
      id: 'conn-5',
      name: 'Emma Johnson',
      username: 'emmaj_design',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60',
      role: 'Creative Director',
      mutualConnections: 10,
      sharedInterests: ['Design', 'Branding', 'Creative Strategy'],
    },
  ];

  useEffect(() => {
    let isMounted = true;

    const fetchConnectionStats = async () => {
      if (!userId) {
        if (isMounted) {
          setTopConnections(defaultConnections.slice(0, limit));
          setTotalConnections(defaultConnections.length);
          setMutualConnections(defaultConnections.reduce((sum, c) => sum + (c.mutualConnections || 0), 0));
          setNetworkSize(defaultConnections.length * 3);
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }

      try {
        // In a real implementation, this would fetch from your API
        // For now, we'll use default data
        const { supabase } = await import('@/integrations/supabase/client');

        try {
          // Try to fetch connections from database
          const { data: connections, error: dbError } = await supabase
            .from('connections')
            .select(`
              id,
              connected_user:profiles!connections_connected_user_id_fkey(
                id,
                full_name,
                username,
                avatar_url
              ),
              mutual_count,
              created_at
            `)
            .eq('user_id', userId)
            .order('mutual_count', { ascending: false })
            .limit(limit);

          if (isMounted) {
            if (!dbError && connections && connections.length > 0) {
              const transformedConnections = connections.map((conn: any) => ({
                id: conn.connected_user?.id || conn.id,
                name: conn.connected_user?.full_name || 'User',
                username: conn.connected_user?.username || 'user',
                avatar: conn.connected_user?.avatar_url || undefined,
                mutualConnections: conn.mutual_count || 0,
              }));

              setTopConnections(transformedConnections);
              setTotalConnections(connections.length);
              setMutualConnections(
                transformedConnections.reduce((sum, c) => sum + (c.mutualConnections || 0), 0)
              );
              setNetworkSize(connections.length * 3); // Approximate network reach
            } else {
              // Fall back to default data
              setTopConnections(defaultConnections.slice(0, limit));
              setTotalConnections(defaultConnections.length);
              setMutualConnections(
                defaultConnections.reduce((sum, c) => sum + (c.mutualConnections || 0), 0)
              );
              setNetworkSize(defaultConnections.length * 3);
            }
          }
        } catch (dbError) {
          if (isMounted) {
            console.warn('Failed to fetch connections from database:', dbError);
            setTopConnections(defaultConnections.slice(0, limit));
            setTotalConnections(defaultConnections.length);
            setMutualConnections(
              defaultConnections.reduce((sum, c) => sum + (c.mutualConnections || 0), 0)
            );
            setNetworkSize(defaultConnections.length * 3);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching connection stats:', err);
          setError(err instanceof Error ? err : new Error('Failed to fetch connection stats'));
          setTopConnections(defaultConnections.slice(0, limit));
          setTotalConnections(defaultConnections.length);
          setMutualConnections(
            defaultConnections.reduce((sum, c) => sum + (c.mutualConnections || 0), 0)
          );
          setNetworkSize(defaultConnections.length * 3);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchConnectionStats();

    return () => {
      isMounted = false;
    };
  }, [userId, limit]);

  return {
    totalConnections,
    mutualConnections,
    networkSize,
    topConnections,
    isLoading,
    error,
  };
};
