import { useCallback, useEffect, useRef, useState } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number; // Distance from bottom to trigger load (in pixels)
  onLoadMore?: () => void | Promise<void>;
  hasMore?: boolean;
  isLoading?: boolean;
}

interface UseInfiniteScrollReturn {
  observerTarget: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  hasMore: boolean;
}

/**
 * useInfiniteScroll Hook
 * 
 * Provides infinite scroll functionality using Intersection Observer.
 * Automatically loads more items as the user scrolls near the bottom.
 * 
 * @example
 * const { observerTarget, isLoading, hasMore } = useInfiniteScroll({
 *   onLoadMore: fetchMoreProducts,
 *   hasMore: true
 * });
 * 
 * return (
 *   <>
 *     <ProductList />
 *     <div ref={observerTarget}>
 *       {isLoading && <Spinner />}
 *     </div>
 *   </>
 * );
 */
export const useInfiniteScroll = ({
  threshold = 500,
  onLoadMore,
  hasMore = true,
  isLoading = false,
}: UseInfiniteScrollOptions = {}): UseInfiniteScrollReturn => {
  const observerTarget = useRef<HTMLDivElement>(null);
  const [localIsLoading, setLocalIsLoading] = useState(isLoading);
  const [localHasMore, setLocalHasMore] = useState(hasMore);
  const isLoadingRef = useRef(isLoading);

  useEffect(() => {
    isLoadingRef.current = isLoading;
    setLocalIsLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    setLocalHasMore(hasMore);
  }, [hasMore]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingRef.current || !localHasMore || !onLoadMore) return;

    try {
      setLocalIsLoading(true);
      isLoadingRef.current = true;
      await onLoadMore();
    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      setLocalIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [onLoadMore, localHasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && localHasMore && !isLoadingRef.current) {
            handleLoadMore();
          }
        });
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [handleLoadMore, threshold, localHasMore]);

  return {
    observerTarget,
    isLoading: localIsLoading,
    hasMore: localHasMore,
  };
};

/**
 * useVirtualScroll Hook
 * 
 * Provides virtual scrolling with infinite scroll support.
 * Optimizes rendering of large lists.
 */
export interface UseVirtualScrollOptions<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  onLoadMore?: () => void | Promise<void>;
  hasMore?: boolean;
  isLoading?: boolean;
  buffer?: number; // Number of items to render outside visible area
}

export interface UseVirtualScrollReturn {
  visibleItems: any[];
  visibleRange: { start: number; end: number };
  offset: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const useVirtualScroll = <T>({
  items,
  itemHeight,
  containerHeight,
  onLoadMore,
  hasMore = true,
  isLoading = false,
  buffer = 5,
}: UseVirtualScrollOptions<T>): UseVirtualScrollReturn => {
  const [scrollOffset, setScrollOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollOffset / itemHeight) - buffer);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollOffset + containerHeight) / itemHeight) + buffer
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const visibleRange = { start: startIndex, end: endIndex };

  // Handle scroll
  const handleScroll = useCallback(
    (e: Event) => {
      const target = e.target as HTMLDivElement;
      setScrollOffset(target.scrollTop);

      // Load more when near the end
      if (
        hasMore &&
        onLoadMore &&
        !isLoading &&
        target.scrollHeight - target.scrollTop - containerHeight < 500
      ) {
        onLoadMore();
      }
    },
    [hasMore, onLoadMore, isLoading, containerHeight]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  return {
    visibleItems,
    visibleRange,
    offset: scrollOffset,
    containerRef,
  };
};

/**
 * usePaginatedScroll Hook
 * 
 * Combines pagination with infinite scroll.
 */
export interface UsePaginatedScrollOptions<T> {
  items: T[];
  pageSize: number;
  containerHeight: number;
  onFetchPage?: (page: number) => Promise<T[]>;
  itemHeight?: number;
}

export interface UsePaginatedScrollReturn<T> {
  visibleItems: T[];
  currentPage: number;
  isLoading: boolean;
  hasMore: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const usePaginatedScroll = <T>({
  items,
  pageSize,
  containerHeight,
  onFetchPage,
  itemHeight = 300,
}: UsePaginatedScrollOptions<T>): UsePaginatedScrollReturn<T> => {
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(items.length / pageSize);
  const hasNextPage = page < totalPages;

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasNextPage || !onFetchPage) return;

    setIsLoading(true);
    try {
      const nextPage = page + 1;
      await onFetchPage(nextPage);
      setPage(nextPage);
    } catch (error) {
      console.error('Failed to load page:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasNextPage, onFetchPage]);

  // Setup infinite scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 500) {
        handleLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleLoadMore]);

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, items.length);
  const visibleItems = items.slice(startIndex, endIndex);

  return {
    visibleItems,
    currentPage: page,
    isLoading,
    hasMore: hasNextPage,
    containerRef,
  };
};
