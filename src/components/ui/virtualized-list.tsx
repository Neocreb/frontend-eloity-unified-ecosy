import React, { useRef, useEffect, useState, forwardRef } from 'react';
import { cn } from '@/utils/utils';
import { Loader2 } from 'lucide-react';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number | ((index: number) => number);
  containerHeight?: number;
  overscan?: number;
  pageSize?: number;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: (page: number) => Promise<void>;
  className?: string;
  emptyMessage?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  onScroll?: (scrollTop: number) => void;
}

export const VirtualizedList = forwardRef<HTMLDivElement, VirtualizedListProps<any>>(
  ({
    items,
    renderItem,
    itemHeight,
    containerHeight = 600,
    overscan = 5,
    pageSize = 20,
    isLoading = false,
    hasMore = true,
    onLoadMore,
    className,
    emptyMessage = 'No items found',
    loadingComponent = <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>,
    onScroll
  }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pendingLoadRef = useRef(false);

    const getItemHeight = (index: number): number => {
      if (typeof itemHeight === 'function') {
        return itemHeight(index);
      }
      return itemHeight;
    };

    // Calculate visible items
    const itemHeights: number[] = items.map((_, i) => getItemHeight(i));
    let totalHeight = itemHeights.reduce((sum, h) => sum + h, 0);

    let accumulatedHeight = 0;
    let startIndex = 0;

    for (let i = 0; i < items.length; i++) {
      if (accumulatedHeight + itemHeights[i] >= scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += itemHeights[i];
    }

    accumulatedHeight = 0;
    let endIndex = items.length - 1;
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

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const newScrollTop = target.scrollTop;
      setScrollTop(newScrollTop);

      if (onScroll) {
        onScroll(newScrollTop);
      }

      // Load more when scrolling near bottom
      const threshold = 500;
      const distanceFromBottom = target.scrollHeight - (target.scrollTop + target.clientHeight);

      if (
        distanceFromBottom < threshold &&
        hasMore &&
        !isLoadingMore &&
        !pendingLoadRef.current &&
        onLoadMore
      ) {
        pendingLoadRef.current = true;
        setIsLoadingMore(true);
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);

        onLoadMore(nextPage).finally(() => {
          setIsLoadingMore(false);
          pendingLoadRef.current = false;
        });
      }
    };

    useEffect(() => {
      const container = containerRef.current || (ref as any)?.current;
      if (!container) return;

      container.addEventListener('scroll', handleScroll as any);
      return () => {
        container.removeEventListener('scroll', handleScroll as any);
      };
    }, [isLoadingMore, hasMore, onLoadMore, currentPage]);

    if (items.length === 0 && !isLoading) {
      return (
        <div
          ref={ref || containerRef}
          className={cn('overflow-auto', className)}
          style={{ height: containerHeight }}
        >
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {emptyMessage}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref || containerRef}
        className={cn('overflow-auto', className)}
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {items.length > 0 && (
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {items.slice(startIndex, endIndex + 1).map((item, i) => (
                <div
                  key={startIndex + i}
                  style={{ height: getItemHeight(startIndex + i) }}
                >
                  {renderItem(item, startIndex + i)}
                </div>
              ))}
            </div>
          )}
          
          {isLoadingMore && (
            <div className="sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur">
              {loadingComponent}
            </div>
          )}
        </div>
      </div>
    );
  }
);

VirtualizedList.displayName = 'VirtualizedList';

export default VirtualizedList;
