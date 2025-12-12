import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface VirtualizationOptions {
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number;
  pageSize?: number;
  onLoadMore?: (page: number) => Promise<void>;
}

interface VirtualizedItem<T> {
  index: number;
  item: T;
  offset: number;
}

interface VirtualizationResult<T> {
  visibleItems: VirtualizedItem<T>[];
  totalHeight: number;
  startIndex: number;
  endIndex: number;
  offsetY: number;
  isLoading: boolean;
  currentPage: number;
  hasMore: boolean;
}

export function useAdvancedVirtualization<T>(
  items: T[],
  options: VirtualizationOptions
): VirtualizationResult<T> {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    pageSize = 20,
    onLoadMore
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingLoadRef = useRef(false);

  const getItemHeight = useCallback((index: number): number => {
    if (typeof itemHeight === 'function') {
      return itemHeight(index);
    }
    return itemHeight;
  }, [itemHeight]);

  const result = useMemo(() => {
    const itemHeights: number[] = [];
    let totalHeight = 0;
    
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i);
      itemHeights.push(height);
      totalHeight += height;
    }

    let accumulatedHeight = 0;
    let startIndex = 0;
    let endIndex = items.length - 1;
    
    for (let i = 0; i < items.length; i++) {
      if (accumulatedHeight + itemHeights[i] >= scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += itemHeights[i];
    }

    accumulatedHeight = 0;
    for (let i = 0; i < items.length; i++) {
      accumulatedHeight += itemHeights[i];
      if (accumulatedHeight >= scrollTop + containerHeight) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
    }

    let offsetY = 0;
    for (let i = 0; i < startIndex; i++) {
      offsetY += itemHeights[i];
    }

    const visibleItems: VirtualizedItem<T>[] = [];
    let itemOffset = offsetY;
    for (let i = startIndex; i <= endIndex && i < items.length; i++) {
      visibleItems.push({
        index: i,
        item: items[i],
        offset: itemOffset
      });
      itemOffset += itemHeights[i];
    }

    return {
      visibleItems,
      totalHeight,
      startIndex,
      endIndex,
      offsetY,
      isLoading,
      currentPage,
      hasMore
    };
  }, [items, scrollTop, containerHeight, overscan, getItemHeight, isLoading, currentPage, hasMore]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);

    // Trigger load more when user scrolls near bottom
    const threshold = 500; // pixels from bottom
    const distanceFromBottom = target.scrollHeight - (target.scrollTop + target.clientHeight);
    
    if (
      distanceFromBottom < threshold &&
      hasMore &&
      !isLoading &&
      !pendingLoadRef.current &&
      onLoadMore
    ) {
      pendingLoadRef.current = true;
      setIsLoading(true);
      setCurrentPage(prev => prev + 1);

      onLoadMore(currentPage + 1).finally(() => {
        setIsLoading(false);
        pendingLoadRef.current = false;
      });
    }
  }, [hasMore, isLoading, onLoadMore, currentPage]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll as any);
      return () => {
        container.removeEventListener('scroll', handleScroll as any);
      };
    }
  }, [handleScroll]);

  return result;
}

export default useAdvancedVirtualization;
