import {
  calculatePaginationMeta,
  getOffset,
  getPageNumber,
  encodeCursor,
  decodeCursor,
  DatabasePagination,
  MarketplacePagination,
} from '@/utils/paginationUtils';

describe('Pagination Utilities', () => {
  describe('calculatePaginationMeta', () => {
    test('calculates pagination metadata correctly', () => {
      const meta = calculatePaginationMeta(1, 20, 100);

      expect(meta).toEqual({
        page: 1,
        pageSize: 20,
        total: 100,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    test('handles last page correctly', () => {
      const meta = calculatePaginationMeta(5, 20, 100);

      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPreviousPage).toBe(true);
    });

    test('calculates total pages correctly for uneven numbers', () => {
      const meta = calculatePaginationMeta(1, 20, 105);

      expect(meta.totalPages).toBe(6);
    });
  });

  describe('getOffset and getPageNumber', () => {
    test('calculates offset correctly', () => {
      expect(getOffset(1, 20)).toBe(0);
      expect(getOffset(2, 20)).toBe(20);
      expect(getOffset(5, 50)).toBe(200);
    });

    test('calculates page number correctly', () => {
      expect(getPageNumber(0, 20)).toBe(1);
      expect(getPageNumber(20, 20)).toBe(2);
      expect(getPageNumber(200, 50)).toBe(5);
    });

    test('offset and page number are inversions', () => {
      for (let page = 1; page <= 10; page++) {
        const offset = getOffset(page, 20);
        const calculatedPage = getPageNumber(offset, 20);
        expect(calculatedPage).toBe(page);
      }
    });
  });

  describe('Cursor pagination', () => {
    test('encodes and decodes cursor correctly', () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const timestamp = Date.now();

      const cursor = encodeCursor(id, timestamp);
      const decoded = decodeCursor(cursor);

      expect(decoded.id).toBe(id);
      expect(decoded.timestamp).toBe(timestamp);
    });

    test('handles invalid cursor gracefully', () => {
      expect(() => {
        decodeCursor('invalid-cursor');
      }).toThrow('Invalid cursor');
    });

    test('cursor format is base64 encoded', () => {
      const cursor = encodeCursor('test-id', 1234567890);

      // Should be valid base64
      expect(() => {
        Buffer.from(cursor, 'base64').toString('utf-8');
      }).not.toThrow();
    });
  });

  describe('DatabasePagination', () => {
    test('validates pagination parameters', () => {
      const result = DatabasePagination.validate(1, 20);

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    test('enforces minimum page size', () => {
      const result = DatabasePagination.validate(1, 0);

      expect(result.pageSize).toBeGreaterThanOrEqual(1);
    });

    test('enforces maximum page size', () => {
      const result = DatabasePagination.validate(1, 200);

      expect(result.pageSize).toBeLessThanOrEqual(100);
    });

    test('enforces minimum page number', () => {
      const result = DatabasePagination.validate(0, 20);

      expect(result.page).toBe(1);
    });

    test('gets correct limit and offset', () => {
      const { limit, offset } = DatabasePagination.getLimitOffset(1, 20);

      expect(offset).toBe(0);
      expect(limit).toBe(20);

      const { limit: limit2, offset: offset2 } = DatabasePagination.getLimitOffset(2, 20);

      expect(offset2).toBe(20);
      expect(limit2).toBe(20);
    });

    test('processes cursor response correctly', () => {
      const items = [
        { id: '1', created_at: new Date().toISOString() },
        { id: '2', created_at: new Date().toISOString() },
        { id: '3', created_at: new Date().toISOString() },
      ];

      const response = DatabasePagination.processCursorResponse(items, 2);

      expect(response.data.length).toBe(2);
      expect(response.meta.hasMore).toBe(true);
      expect(response.meta.nextCursor).toBeDefined();
    });

    test('handles cursor response with exact limit', () => {
      const items = [
        { id: '1', created_at: new Date().toISOString() },
        { id: '2', created_at: new Date().toISOString() },
      ];

      const response = DatabasePagination.processCursorResponse(items, 2);

      expect(response.data.length).toBe(2);
      expect(response.meta.hasMore).toBe(false);
      expect(response.meta.nextCursor).toBeUndefined();
    });
  });

  describe('MarketplacePagination', () => {
    test('provides correct default page sizes', () => {
      expect(MarketplacePagination.listingPageSize).toBeDefined();
      expect(MarketplacePagination.gridPageSize).toBeDefined();
      expect(MarketplacePagination.searchResultsPageSize).toBeDefined();
      expect(MarketplacePagination.reviewsPageSize).toBeDefined();
    });

    test('get product listing pagination', () => {
      const pagination = MarketplacePagination.getProductListingPagination(1);

      expect(pagination.page).toBe(1);
      expect(pagination.pageSize).toBe(MarketplacePagination.listingPageSize);
    });

    test('get search pagination', () => {
      const pagination = MarketplacePagination.getSearchPagination(1);

      expect(pagination.page).toBe(1);
      expect(pagination.pageSize).toBe(MarketplacePagination.searchResultsPageSize);
    });

    test('get reviews pagination', () => {
      const pagination = MarketplacePagination.getReviewsPagination(1);

      expect(pagination.page).toBe(1);
      expect(pagination.pageSize).toBe(MarketplacePagination.reviewsPageSize);
    });

    test('price range buckets are defined', () => {
      const buckets = MarketplacePagination.getPriceRangeBuckets();

      expect(Array.isArray(buckets)).toBe(true);
      expect(buckets.length).toBeGreaterThan(0);
      expect(buckets[0]).toHaveProperty('min');
      expect(buckets[0]).toHaveProperty('max');
      expect(buckets[0]).toHaveProperty('label');
    });
  });
});
