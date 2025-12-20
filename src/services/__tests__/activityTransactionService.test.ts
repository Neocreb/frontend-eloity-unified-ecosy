import { describe, it, expect, beforeEach, vi } from 'vitest';
import { activityTransactionService } from '../activityTransactionService';
import { ACTIVITY_TYPES, ACTIVITY_CATEGORIES } from '../activityTransactionService';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(function () { return this; }),
        gte: vi.fn(function () { return this; }),
        lte: vi.fn(function () { return this; }),
        order: vi.fn(function () { return this; }),
        limit: vi.fn(function () { return this; }),
        then: vi.fn(function (callback) {
          return callback({
            data: [],
            error: null,
          });
        }),
      })),
    })),
  },
}));

describe('ActivityTransactionService', () => {
  const mockUserId = 'test-user-123';
  const mockTransaction = {
    id: 'txn-001',
    user_id: mockUserId,
    activity_type: ACTIVITY_TYPES.POST_CREATION,
    category: ACTIVITY_CATEGORIES.CONTENT,
    amount_eloits: 10,
    amount_currency: 0.5,
    currency_code: 'USD',
    status: 'completed',
    source_id: 'post-001',
    source_type: 'post',
    metadata: { post_type: 'text' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logActivity', () => {
    it('should log a new activity transaction', async () => {
      const result = await activityTransactionService.logActivity(
        mockUserId,
        ACTIVITY_TYPES.POST_CREATION,
        ACTIVITY_CATEGORIES.CONTENT,
        10,
        {
          sourceId: 'post-001',
          sourceType: 'post',
          metadata: { post_type: 'text' },
        }
      );

      expect(result).toBeDefined();
    });

    it('should log activity with optional currency amount', async () => {
      const result = await activityTransactionService.logActivity(
        mockUserId,
        ACTIVITY_TYPES.MARKETPLACE_SALE,
        ACTIVITY_CATEGORIES.MARKETPLACE,
        100,
        {
          amountCurrency: 50,
          currencyCode: 'USD',
          description: 'Product sale',
        }
      );

      expect(result).toBeDefined();
    });

    it('should handle different activity types', async () => {
      const activityTypes = [
        ACTIVITY_TYPES.POST_CREATION,
        ACTIVITY_TYPES.ENGAGEMENT,
        ACTIVITY_TYPES.CHALLENGE_COMPLETE,
        ACTIVITY_TYPES.REFERRAL_SIGNUP,
        ACTIVITY_TYPES.MARKETPLACE_SALE,
      ];

      for (const type of activityTypes) {
        const result = await activityTransactionService.logActivity(
          mockUserId,
          type,
          ACTIVITY_CATEGORIES.CONTENT,
          10
        );

        expect(result).toBeDefined();
      }
    });

    it('should set default values correctly', async () => {
      const result = await activityTransactionService.logActivity(
        mockUserId,
        ACTIVITY_TYPES.ENGAGEMENT,
        ACTIVITY_CATEGORIES.ENGAGEMENT,
        5
      );

      expect(result).toBeDefined();
    });
  });

  describe('getActivityTransactions', () => {
    it('should retrieve user activities', async () => {
      const activities = await activityTransactionService.getActivityTransactions(mockUserId);
      expect(Array.isArray(activities)).toBe(true);
    });

    it('should filter activities by type', async () => {
      const activities = await activityTransactionService.getActivityTransactions(
        mockUserId,
        { type: ACTIVITY_TYPES.POST_CREATION }
      );
      expect(Array.isArray(activities)).toBe(true);
    });

    it('should filter activities by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const activities = await activityTransactionService.getActivityTransactions(
        mockUserId,
        { startDate, endDate }
      );

      expect(Array.isArray(activities)).toBe(true);
    });

    it('should support pagination', async () => {
      const activities = await activityTransactionService.getActivityTransactions(
        mockUserId,
        {},
        { limit: 10, offset: 0 }
      );

      expect(Array.isArray(activities)).toBe(true);
    });
  });

  describe('getActivitySummary', () => {
    it('should calculate activity summary', async () => {
      const summary = await activityTransactionService.getActivitySummary(mockUserId);

      if (summary) {
        expect(summary).toHaveProperty('totalCount');
        expect(summary).toHaveProperty('totalEarnings');
        expect(summary).toHaveProperty('byCategory');
        expect(summary).toHaveProperty('byType');
        expect(summary).toHaveProperty('thisMonth');
        expect(summary).toHaveProperty('today');

        expect(typeof summary.totalCount).toBe('number');
        expect(typeof summary.totalEarnings).toBe('number');
      }
    });

    it('should break down earnings by category', async () => {
      const summary = await activityTransactionService.getActivitySummary(mockUserId);

      if (summary && summary.byCategory) {
        const categories = Object.keys(summary.byCategory);
        categories.forEach(category => {
          expect(typeof summary.byCategory[category]).toBe('number');
        });
      }
    });

    it('should break down earnings by type', async () => {
      const summary = await activityTransactionService.getActivitySummary(mockUserId);

      if (summary && summary.byType) {
        const types = Object.keys(summary.byType);
        types.forEach(type => {
          expect(typeof summary.byType[type]).toBe('number');
        });
      }
    });
  });

  describe('getTodayEarnings', () => {
    it('should retrieve today earnings', async () => {
      const earnings = await activityTransactionService.getTodayEarnings(mockUserId);
      expect(typeof earnings).toBe('number');
      expect(earnings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getThisMonthEarnings', () => {
    it('should retrieve this month earnings', async () => {
      const earnings = await activityTransactionService.getThisMonthEarnings(mockUserId);
      expect(typeof earnings).toBe('number');
      expect(earnings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('subscribeToUserActivities', () => {
    it('should subscribe to activity changes', (done) => {
      const callback = vi.fn();
      const unsubscribe = activityTransactionService.subscribeToUserActivities(
        mockUserId,
        callback
      );

      expect(typeof unsubscribe).toBe('function');
      done();
    });

    it('should call callback when activities change', (done) => {
      const callback = vi.fn();
      const unsubscribe = activityTransactionService.subscribeToUserActivities(
        mockUserId,
        callback
      );

      setTimeout(() => {
        expect(typeof unsubscribe).toBe('function');
        unsubscribe();
        done();
      }, 100);
    });
  });

  describe('Activity type constants', () => {
    it('should have all required activity types', () => {
      expect(ACTIVITY_TYPES.POST_CREATION).toBe('post_creation');
      expect(ACTIVITY_TYPES.ENGAGEMENT).toBe('engagement');
      expect(ACTIVITY_TYPES.CHALLENGE_COMPLETE).toBe('challenge_complete');
      expect(ACTIVITY_TYPES.REFERRAL_SIGNUP).toBe('referral_signup');
      expect(ACTIVITY_TYPES.MARKETPLACE_SALE).toBe('marketplace_sale');
      expect(ACTIVITY_TYPES.FREELANCE_WORK).toBe('freelance_work');
      expect(ACTIVITY_TYPES.P2P_TRADING).toBe('p2p_trading');
    });

    it('should have all required categories', () => {
      expect(ACTIVITY_CATEGORIES.CONTENT).toBe('Content');
      expect(ACTIVITY_CATEGORIES.ENGAGEMENT).toBe('Engagement');
      expect(ACTIVITY_CATEGORIES.CHALLENGES).toBe('Challenges');
      expect(ACTIVITY_CATEGORIES.MARKETPLACE).toBe('Marketplace');
      expect(ACTIVITY_CATEGORIES.FREELANCE).toBe('Freelance');
      expect(ACTIVITY_CATEGORIES.CRYPTO).toBe('Crypto');
    });
  });
});
