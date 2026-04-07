/**
 * Pagination Utilities
 * 
 * Provides optimized pagination support for database queries.
 * Implements cursor-based pagination and offset pagination for better performance.
 */

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CursorPaginationMeta {
  cursor?: string;
  nextCursor?: string;
  previousCursor?: string;
  hasMore: boolean;
  count: number;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: CursorPaginationMeta;
}

/**
 * Calculate pagination metadata
 */
export const calculatePaginationMeta = (
  page: number,
  pageSize: number,
  total: number
): PaginationMeta => ({
  page,
  pageSize,
  total,
  totalPages: Math.ceil(total / pageSize),
  hasNextPage: page * pageSize < total,
  hasPreviousPage: page > 1,
});

/**
 * Get offset from page number
 */
export const getOffset = (page: number, pageSize: number): number => {
  return (page - 1) * pageSize;
};

/**
 * Get page number from offset
 */
export const getPageNumber = (offset: number, pageSize: number): number => {
  return Math.floor(offset / pageSize) + 1;
};

/**
 * Cursor-based pagination - better for real-time data
 * Returns the next cursor for fetching more items
 */
export const encodeCursor = (id: string, timestamp: number): string => {
  return Buffer.from(`${id}:${timestamp}`).toString('base64');
};

export const decodeCursor = (cursor: string): { id: string; timestamp: number } => {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [id, timestamp] = decoded.split(':');
    return { id, timestamp: parseInt(timestamp, 10) };
  } catch (error) {
    throw new Error('Invalid cursor');
  }
};

/**
 * Build pagination query for Supabase
 */
export interface PaginationQuery {
  offset: number;
  limit: number;
}

export const buildPaginationQuery = (
  page: number = 1,
  pageSize: number = 20
): PaginationQuery => ({
  offset: getOffset(page, pageSize),
  limit: pageSize,
});

/**
 * Database-optimized pagination for Supabase queries
 */
export class DatabasePagination {
  /**
   * Create optimized limit and offset for Supabase RPC
   */
  static getLimitOffset(page: number, pageSize: number) {
    // Ensure pageSize is reasonable
    const validPageSize = Math.min(Math.max(pageSize, 1), 100); // Max 100 per page
    return {
      limit: validPageSize,
      offset: (page - 1) * validPageSize,
    };
  }

  /**
   * Validate and sanitize pagination parameters
   */
  static validate(page: number = 1, pageSize: number = 20) {
    return {
      page: Math.max(1, Math.floor(page)),
      pageSize: Math.min(Math.max(1, Math.floor(pageSize)), 100),
    };
  }

  /**
   * Generate cursor pagination query
   */
  static generateCursorQuery(cursor?: string, limit: number = 20) {
    if (!cursor) {
      return { limit: limit + 1 };
    }

    const { id, timestamp } = decodeCursor(cursor);
    return {
      limit: limit + 1,
      cursor: { id, timestamp },
    };
  }

  /**
   * Process cursor pagination response
   */
  static processCursorResponse<T extends { id: string; created_at?: string }>(
    items: T[],
    limit: number,
    cursor?: string
  ): CursorPaginatedResponse<T> {
    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;

    let nextCursor: string | undefined;
    if (hasMore && data.length > 0) {
      const lastItem = data[data.length - 1];
      const timestamp = new Date(lastItem.created_at || Date.now()).getTime();
      nextCursor = encodeCursor(lastItem.id, timestamp);
    }

    return {
      data,
      meta: {
        cursor,
        nextCursor,
        hasMore,
        count: data.length,
      },
    };
  }
}

/**
 * Marketplace-specific pagination
 */
export const MarketplacePagination = {
  // Default page sizes for different views
  listingPageSize: 20,
  gridPageSize: 24,
  searchResultsPageSize: 20,
  sellerProductsPageSize: 30,
  reviewsPageSize: 10,

  /**
   * Get product listing pagination
   */
  getProductListingPagination(page: number = 1) {
    return DatabasePagination.validate(page, this.listingPageSize);
  },

  /**
   * Get search results pagination
   */
  getSearchPagination(page: number = 1) {
    return DatabasePagination.validate(page, this.searchResultsPageSize);
  },

  /**
   * Get reviews pagination
   */
  getReviewsPagination(page: number = 1) {
    return DatabasePagination.validate(page, this.reviewsPageSize);
  },

  /**
   * Get seller products pagination
   */
  getSellerProductsPagination(page: number = 1) {
    return DatabasePagination.validate(page, this.sellerProductsPageSize);
  },

  /**
   * Calculate price range buckets for search filters
   */
  getPriceRangeBuckets() {
    return [
      { min: 0, max: 50, label: 'Under $50' },
      { min: 50, max: 100, label: '$50 - $100' },
      { min: 100, max: 500, label: '$100 - $500' },
      { min: 500, max: 1000, label: '$500 - $1000' },
      { min: 1000, max: null, label: 'Over $1000' },
    ];
  },
};

/**
 * Pagination state manager for React hooks
 */
export const usePaginationState = (initialPage: number = 1, pageSize: number = 20) => {
  const [page, setPage] = React.useState(initialPage);
  const [total, setTotal] = React.useState(0);

  const validatedParams = DatabasePagination.validate(page, pageSize);
  const meta = calculatePaginationMeta(validatedParams.page, validatedParams.pageSize, total);

  return {
    page: validatedParams.page,
    pageSize: validatedParams.pageSize,
    total,
    meta,
    setPage: (newPage: number) => setPage(Math.max(1, newPage)),
    setTotal,
    goToNextPage: () => setPage(p => (meta.hasNextPage ? p + 1 : p)),
    goToPreviousPage: () => setPage(p => (p > 1 ? p - 1 : p)),
  };
};

// Import React for the hook (will be injected in actual usage)
import React from 'react';
