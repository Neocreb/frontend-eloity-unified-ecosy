import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { activityTransactionService, ActivityTransaction, ActivityFilter } from "@/services/activityTransactionService";

interface UseActivityFeedReturn {
  activities: ActivityTransaction[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  totalCount: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  filter: (filters: ActivityFilter) => Promise<void>;
  clearFilters: () => Promise<void>;
  search: (query: string) => Promise<void>;
  clearSearch: () => Promise<void>;
  searchQuery: string;
  isSearching: boolean;
}

const DEFAULT_LIMIT = 50;
const SEARCH_DEBOUNCE_MS = 500;

export const useActivityFeed = (initialLimit: number = DEFAULT_LIMIT): UseActivityFeedReturn => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<ActivityFilter | undefined>();
  const [limit] = useState(initialLimit);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Initial fetch
  const fetchActivities = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [data, count] = await Promise.all([
        activityTransactionService.getActivityFeed(user.id, limit, 0, currentFilters),
        activityTransactionService.getActivityCount(user.id, currentFilters),
      ]);

      setActivities(data);
      setTotalCount(count);
      setOffset(limit);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch activities"));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, limit, currentFilters]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    // Fetch initial data
    fetchActivities();

    // Subscribe to real-time updates
    subscriptionRef.current = activityTransactionService.subscribeToActivities(
      user.id,
      (newActivity) => {
        // Add new activity to the top of the list if matches current filters
        if (matchesFilters(newActivity, currentFilters)) {
          setActivities((prev) => [newActivity, ...prev]);
          setTotalCount((prev) => prev + 1);
        }
      },
      (err) => {
        console.error("Subscription error:", err);
        setError(err instanceof Error ? err : new Error("Real-time subscription error"));
      }
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [user?.id, fetchActivities, currentFilters]);

  // Load more activities
  const loadMore = useCallback(async () => {
    if (!user?.id || isLoading || offset >= totalCount) return;

    try {
      const moreData = await activityTransactionService.getActivityFeed(
        user.id,
        limit,
        offset,
        currentFilters
      );

      setActivities((prev) => [...prev, ...moreData]);
      setOffset((prev) => prev + limit);
    } catch (err) {
      console.error("Error loading more activities:", err);
      setError(err instanceof Error ? err : new Error("Failed to load more activities"));
    }
  }, [user?.id, isLoading, offset, totalCount, limit, currentFilters]);

  // Refresh data
  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchActivities();
  }, [fetchActivities]);

  // Apply filters
  const filter = useCallback(async (filters: ActivityFilter) => {
    setCurrentFilters(filters);
    setOffset(0);
    // Filters will trigger re-fetch via useEffect dependency
  }, []);

  // Clear filters
  const clearFilters = useCallback(async () => {
    setCurrentFilters(undefined);
    setOffset(0);
  }, []);

  // Search with debounce
  const search = useCallback(async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    setOffset(0);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(async () => {
      if (!user?.id) {
        setIsSearching(false);
        return;
      }

      try {
        setError(null);

        // Search in activity descriptions
        const allActivities = await activityTransactionService.getActivityFeed(
          user.id,
          1000,
          0,
          currentFilters
        );

        // Filter by search query in description
        const filtered = allActivities.filter((activity) =>
          activity.description?.toLowerCase().includes(query.toLowerCase()) ||
          activity.activity_type.toLowerCase().includes(query.toLowerCase()) ||
          activity.category.toLowerCase().includes(query.toLowerCase())
        );

        setActivities(filtered);
        setTotalCount(filtered.length);
      } catch (err) {
        console.error("Error searching activities:", err);
        setError(err instanceof Error ? err : new Error("Search failed"));
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  }, [user?.id, currentFilters]);

  // Clear search
  const clearSearch = useCallback(async () => {
    setSearchQuery("");
    setIsSearching(false);
    setOffset(0);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    await fetchActivities();
  }, [fetchActivities]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // Helper function to check if activity matches current filters
  const matchesFilters = (activity: ActivityTransaction, filters?: ActivityFilter): boolean => {
    if (!filters) return true;

    if (filters.type && activity.activity_type !== filters.type) return false;
    if (filters.category && activity.category !== filters.category) return false;
    if (filters.status && activity.status !== filters.status) return false;

    if (filters.startDate) {
      const activityDate = new Date(activity.created_at);
      if (activityDate < filters.startDate) return false;
    }

    if (filters.endDate) {
      const activityDate = new Date(activity.created_at);
      if (activityDate > filters.endDate) return false;
    }

    return true;
  };

  return {
    activities,
    isLoading,
    error,
    hasMore: offset < totalCount,
    totalCount,
    loadMore,
    refresh,
    filter,
    clearFilters,
    search,
    clearSearch,
    searchQuery,
    isSearching,
  };
};
