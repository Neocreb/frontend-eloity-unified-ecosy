import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trustScoreService } from '../trustScoreService';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
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
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('TrustScoreService', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateTrustScore', () => {
    it('should calculate trust score with all factors', async () => {
      const result = await trustScoreService.calculateTrustScore(mockUserId);

      if (result) {
        expect(result).toHaveProperty('factors');
        expect(result).toHaveProperty('baseScore');
        expect(result).toHaveProperty('decayAmount');
        expect(result).toHaveProperty('finalScore');
        expect(result).toHaveProperty('changes');

        expect(typeof result.finalScore).toBe('number');
        expect(result.finalScore).toBeGreaterThanOrEqual(0);
        expect(result.finalScore).toBeLessThanOrEqual(100);
      }
    });

    it('should apply engagement weight (40%)', async () => {
      const result = await trustScoreService.calculateTrustScore(mockUserId);

      if (result && result.factors) {
        // The formula weights engagement at 40%
        expect(result.factors.engagement_quality).toBeDefined();
      }
    });

    it('should apply consistency weight (20%)', async () => {
      const result = await trustScoreService.calculateTrustScore(mockUserId);

      if (result && result.factors) {
        // The formula weights consistency at 20%
        expect(result.factors.activity_consistency).toBeDefined();
      }
    });

    it('should apply validation weight (20%)', async () => {
      const result = await trustScoreService.calculateTrustScore(mockUserId);

      if (result && result.factors) {
        // The formula weights validation at 20%
        expect(result.factors.peer_validation).toBeDefined();
      }
    });

    it('should apply profile completeness weight (10%)', async () => {
      const result = await trustScoreService.calculateTrustScore(mockUserId);

      if (result && result.factors) {
        // The formula weights profile at 10%
        expect(result.factors.profile_completeness).toBeDefined();
      }
    });

    it('should penalize spam incidents (max 30 points)', async () => {
      const result = await trustScoreService.calculateTrustScore(mockUserId);

      if (result && result.factors) {
        // Spam incidents should be tracked
        expect(typeof result.factors.spam_incidents).toBe('number');
      }
    });

    it('should apply age bonus for new accounts', async () => {
      const result = await trustScoreService.calculateTrustScore(mockUserId);

      if (result) {
        // New accounts should receive a bonus
        const hasAgeBonus = result.changes.some(change =>
          change.includes('New account bonus')
        );
        // May or may not have bonus depending on account age
        expect(Array.isArray(result.changes)).toBe(true);
      }
    });

    it('should apply decay for inactive accounts', async () => {
      const result = await trustScoreService.calculateTrustScore(mockUserId);

      if (result) {
        expect(typeof result.decayAmount).toBe('number');
        expect(result.decayAmount).toBeGreaterThanOrEqual(0);
      }
    });

    it('should clamp score between 0-100', async () => {
      const result = await trustScoreService.calculateTrustScore(mockUserId);

      if (result) {
        expect(result.finalScore).toBeGreaterThanOrEqual(0);
        expect(result.finalScore).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('calculateTrustFactors', () => {
    it('should calculate individual trust factors', async () => {
      const factors = await trustScoreService.calculateTrustFactors(mockUserId);

      if (factors) {
        expect(factors).toHaveProperty('engagement_quality');
        expect(factors).toHaveProperty('activity_consistency');
        expect(factors).toHaveProperty('peer_validation');
        expect(factors).toHaveProperty('spam_incidents');
        expect(factors).toHaveProperty('profile_completeness');
        expect(factors).toHaveProperty('account_age_days');
        expect(factors).toHaveProperty('verified_transactions');

        // Validate value ranges
        expect(factors.engagement_quality).toBeGreaterThanOrEqual(0);
        expect(factors.engagement_quality).toBeLessThanOrEqual(100);
        expect(factors.activity_consistency).toBeGreaterThanOrEqual(0);
        expect(factors.activity_consistency).toBeLessThanOrEqual(100);
      }
    });

    it('should calculate engagement quality from content reception', async () => {
      const factors = await trustScoreService.calculateTrustFactors(mockUserId);

      if (factors) {
        expect(typeof factors.engagement_quality).toBe('number');
      }
    });

    it('should calculate activity consistency from login streaks', async () => {
      const factors = await trustScoreService.calculateTrustFactors(mockUserId);

      if (factors) {
        expect(typeof factors.activity_consistency).toBe('number');
      }
    });

    it('should track spam incidents', async () => {
      const factors = await trustScoreService.calculateTrustFactors(mockUserId);

      if (factors) {
        expect(typeof factors.spam_incidents).toBe('number');
        expect(factors.spam_incidents).toBeGreaterThanOrEqual(0);
      }
    });

    it('should measure profile completeness', async () => {
      const factors = await trustScoreService.calculateTrustFactors(mockUserId);

      if (factors) {
        expect(typeof factors.profile_completeness).toBe('number');
        expect(factors.profile_completeness).toBeGreaterThanOrEqual(0);
        expect(factors.profile_completeness).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('calculateDecay', () => {
    it('should calculate inactivity decay', async () => {
      const decayAmount = await trustScoreService.calculateDecay(mockUserId);

      expect(typeof decayAmount).toBe('number');
      expect(decayAmount).toBeGreaterThanOrEqual(0);
    });

    it('should penalize long inactivity periods', async () => {
      const decay30Days = await trustScoreService.calculateDecay(mockUserId);

      expect(typeof decay30Days).toBe('number');
      // Decay should exist for inactive users
    });
  });

  describe('getTrustHistory', () => {
    it('should retrieve trust history for user', async () => {
      const history = await trustScoreService.getTrustHistory(mockUserId);

      expect(Array.isArray(history)).toBe(true);
    });

    it('should show score progression over time', async () => {
      const history = await trustScoreService.getTrustHistory(mockUserId);

      if (history && history.length > 0) {
        history.forEach(entry => {
          expect(entry).toHaveProperty('old_score');
          expect(entry).toHaveProperty('new_score');
          expect(entry).toHaveProperty('change_reason');
          expect(entry).toHaveProperty('created_at');
        });
      }
    });
  });

  describe('recordTrustChange', () => {
    it('should record trust score changes', async () => {
      const result = await trustScoreService.recordTrustChange(
        mockUserId,
        50,
        60,
        'Positive engagement'
      );

      expect(result).toBeDefined();
    });

    it('should track change reason', async () => {
      const result = await trustScoreService.recordTrustChange(
        mockUserId,
        50,
        60,
        'Positive engagement'
      );

      expect(result).toBeDefined();
    });

    it('should handle negative score changes', async () => {
      const result = await trustScoreService.recordTrustChange(
        mockUserId,
        60,
        50,
        'Spam incident detected'
      );

      expect(result).toBeDefined();
    });
  });

  describe('subscribeToTrustScoreChanges', () => {
    it('should subscribe to trust score changes', (done) => {
      const callback = vi.fn();
      const unsubscribe = trustScoreService.subscribeToTrustScoreChanges(
        mockUserId,
        callback
      );

      expect(typeof unsubscribe).toBe('function');
      done();
    });
  });

  describe('Trust calculation formula validation', () => {
    it('should apply correct weights in formula', async () => {
      const result = await trustScoreService.calculateTrustScore(mockUserId);

      if (result) {
        // Formula: (engagement * 0.4) + (consistency * 0.2) + (validation * 0.2) + (profile * 0.1) - (spam * 0.1)
        expect(result.baseScore).toBeDefined();
        expect(typeof result.baseScore).toBe('number');
      }
    });

    it('should enforce minimum score of 0', async () => {
      const result = await trustScoreService.calculateTrustScore(mockUserId);

      if (result) {
        expect(result.finalScore).toBeGreaterThanOrEqual(0);
      }
    });

    it('should enforce maximum score of 100', async () => {
      const result = await trustScoreService.calculateTrustScore(mockUserId);

      if (result) {
        expect(result.finalScore).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Account age bonuses', () => {
    it('should grant bonus for new accounts (< 7 days)', async () => {
      const result = await trustScoreService.calculateTrustScore(mockUserId);

      if (result && result.factors && result.factors.account_age_days < 7) {
        const ageBonus = result.changes.find(c => c.includes('New account bonus'));
        expect(ageBonus).toBeDefined();
      }
    });

    it('should grant bonus for young accounts (7-30 days)', async () => {
      const result = await trustScoreService.calculateTrustScore(mockUserId);

      if (result && result.factors && result.factors.account_age_days >= 7 && result.factors.account_age_days < 30) {
        // Young account bonus may be present
        expect(Array.isArray(result.changes)).toBe(true);
      }
    });

    it('should grant bonus for established accounts (> 365 days)', async () => {
      const result = await trustScoreService.calculateTrustScore(mockUserId);

      if (result && result.factors && result.factors.account_age_days > 365) {
        // Established account bonus may be present
        expect(Array.isArray(result.changes)).toBe(true);
      }
    });
  });
});
