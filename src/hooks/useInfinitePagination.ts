import { useState, useCallback, useRef, useEffect } from 'react';

interface PaginationOptions {
  pageSize?: number;
  onFetchPage: (page: number, pageSize: number) => Promise<any[]>;
  onError?: (error: Error) => void;
}

interface InfinitePaginationResult<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  page: number;
  loadMore: () => Promise<void>;
  reset: () => void;
  refresh: () => Promise<void>;
}

export function useInfinitePagination<T>(
  options: PaginationOptions
): InfinitePaginationResult<T> {
  const {
    pageSize = 20,
    onFetchPage,
    onError
  } = options;

  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const pendingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (pendingRef.current || !hasMore || isLoadingMore) return;

    pendingRef.current = true;
    setIsLoadingMore(true);
    setError(null);

    try {
      const newPage = page + 1;
      const newItems = await onFetchPage(newPage, pageSize);

      setItems(prev => [...prev, ...newItems]);
      setPage(newPage);
      setHasMore(newItems.length === pageSize);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load more items');
      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoadingMore(false);
      pendingRef.current = false;
    }
  }, [page, pageSize, hasMore, isLoadingMore, onFetchPage, onError]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setIsLoading(false);
    setIsLoadingMore(false);
    pendingRef.current = false;
  }, []);

  const refresh = useCallback(async () => {
    pendingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const newItems = await onFetchPage(1, pageSize);
      setItems(newItems);
      setPage(1);
      setHasMore(newItems.length === pageSize);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh');
      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
      pendingRef.current = false;
    }
  }, [pageSize, onFetchPage, onError]);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    page,
    loadMore,
    reset,
    refresh
  };
}

export default useInfinitePagination;
