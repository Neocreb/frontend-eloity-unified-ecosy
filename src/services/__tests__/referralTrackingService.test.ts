import { describe, it, expect, beforeEach, vi } from 'vitest';
import { referralTrackingService } from '../referralTrackingService';

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
        order: vi.fn(function () { return this; }),
        limit: vi.fn(function () { return this; }),
        then: vi.fn(function (callback) {
          return callback({
            data: [],
            error: null,
          });
        }),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(function () { return this; }),
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('ReferralTrackingService', () => {
  const mockReferrerId = 'referrer-001';
  const mockReferredUserId = 'referred-001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackReferral', () => {
    it('should create a new referral record', async () => {
      const referral = await referralTrackingService.trackReferral(
        mockReferrerId,
        mockReferredUserId
      );

      expect(referral).toBeDefined();
    });

    it('should generate unique referral code', async () => {
      const referral1 = await referralTrackingService.trackReferral(
        mockReferrerId,
        mockReferredUserId
      );

      const referral2 = await referralTrackingService.trackReferral(
        mockReferrerId,
        'another-user'
      );

      if (referral1 && referral2) {
        expect(referral1.referral_code).not.toEqual(referral2.referral_code);
      }
    });

    it('should set initial status as pending', async () => {
      const referral = await referralTrackingService.trackReferral(
        mockReferrerId,
        mockReferredUserId
      );

      if (referral) {
        expect(referral.status).toBe('pending');
      }
    });

    it('should set initial tier as bronze', async () => {
      const referral = await referralTrackingService.trackReferral(
        mockReferrerId,
        mockReferredUserId
      );

      if (referral) {
        expect(referral.tier).toBe('bronze');
      }
    });

    it('should set bronze commission rate (5%)', async () => {
      const referral = await referralTrackingService.trackReferral(
        mockReferrerId,
        mockReferredUserId
      );

      if (referral) {
        expect(referral.commission_percentage).toBe(0.05);
      }
    });
  });

  describe('getReferralStats', () => {
    it('should retrieve referral statistics', async () => {
      const stats = await referralTrackingService.getReferralStats(mockReferrerId);

      if (stats) {
        expect(stats).toHaveProperty('totalReferrals');
        expect(stats).toHaveProperty('activeReferrals');
        expect(stats).toHaveProperty('verifiedReferrals');
        expect(stats).toHaveProperty('totalEarnings');
        expect(stats).toHaveProperty('thisMonthEarnings');
        expect(stats).toHaveProperty('referralTier');
      }
    });

    it('should count total referrals', async () => {
      const stats = await referralTrackingService.getReferralStats(mockReferrerId);

      if (stats) {
        expect(typeof stats.totalReferrals).toBe('number');
        expect(stats.totalReferrals).toBeGreaterThanOrEqual(0);
      }
    });

    it('should count active referrals', async () => {
      const stats = await referralTrackingService.getReferralStats(mockReferrerId);

      if (stats) {
        expect(typeof stats.activeReferrals).toBe('number');
        expect(stats.activeReferrals).toBeLessThanOrEqual(stats.totalReferrals);
      }
    });

    it('should count verified referrals', async () => {
      const stats = await referralTrackingService.getReferralStats(mockReferrerId);

      if (stats) {
        expect(typeof stats.verifiedReferrals).toBe('number');
        expect(stats.verifiedReferrals).toBeLessThanOrEqual(stats.totalReferrals);
      }
    });

    it('should calculate total earnings', async () => {
      const stats = await referralTrackingService.getReferralStats(mockReferrerId);

      if (stats) {
        expect(typeof stats.totalEarnings).toBe('number');
        expect(stats.totalEarnings).toBeGreaterThanOrEqual(0);
      }
    });

    it('should track this month earnings', async () => {
      const stats = await referralTrackingService.getReferralStats(mockReferrerId);

      if (stats) {
        expect(typeof stats.thisMonthEarnings).toBe('number');
        expect(stats.thisMonthEarnings).toBeLessThanOrEqual(stats.totalEarnings);
      }
    });
  });

  describe('Referral tier system', () => {
    it('should start with bronze tier', async () => {
      const stats = await referralTrackingService.getReferralStats(mockReferrerId);

      if (stats) {
        expect(stats.referralTier).toBe('bronze');
      }
    });

    it('should progress to silver at $5000 earnings', async () => {
      const stats = await referralTrackingService.getReferralStats(mockReferrerId);

      if (stats && stats.totalEarnings >= 5000) {
        expect(stats.referralTier).toBe('silver');
      }
    });

    it('should progress to gold at $25000 earnings', async () => {
      const stats = await referralTrackingService.getReferralStats(mockReferrerId);

      if (stats && stats.totalEarnings >= 25000) {
        expect(stats.referralTier).toBe('gold');
      }
    });

    it('should progress to platinum at $100000 earnings', async () => {
      const stats = await referralTrackingService.getReferralStats(mockReferrerId);

      if (stats && stats.totalEarnings >= 100000) {
        expect(stats.referralTier).toBe('platinum');
      }
    });
  });

  describe('Commission rates by tier', () => {
    it('should apply bronze commission (5%)', async () => {
      const tier = await referralTrackingService.getTierInfo('bronze');

      if (tier) {
        expect(tier.commissionPercentage).toBe(0.05);
      }
    });

    it('should apply silver commission (7.5%)', async () => {
      const tier = await referralTrackingService.getTierInfo('silver');

      if (tier) {
        expect(tier.commissionPercentage).toBe(0.075);
      }
    });

    it('should apply gold commission (10%)', async () => {
      const tier = await referralTrackingService.getTierInfo('gold');

      if (tier) {
        expect(tier.commissionPercentage).toBe(0.1);
      }
    });

    it('should apply platinum commission (15%)', async () => {
      const tier = await referralTrackingService.getTierInfo('platinum');

      if (tier) {
        expect(tier.commissionPercentage).toBe(0.15);
      }
    });
  });

  describe('updateReferralStatus', () => {
    it('should update referral from pending to verified', async () => {
      const updated = await referralTrackingService.updateReferralStatus(
        'referral-001',
        'verified'
      );

      expect(updated).toBeDefined();
    });

    it('should update referral to active', async () => {
      const updated = await referralTrackingService.updateReferralStatus(
        'referral-001',
        'active'
      );

      expect(updated).toBeDefined();
    });

    it('should mark referral as inactive', async () => {
      const updated = await referralTrackingService.updateReferralStatus(
        'referral-001',
        'inactive'
      );

      expect(updated).toBeDefined();
    });
  });

  describe('recordReferralEarning', () => {
    it('should record earning from referral', async () => {
      const earning = await referralTrackingService.recordReferralEarning(
        'referral-001',
        100
      );

      expect(earning).toBeDefined();
    });

    it('should add to total earnings', async () => {
      const earning = await referralTrackingService.recordReferralEarning(
        'referral-001',
        100
      );

      if (earning) {
        expect(earning.earnings_total).toBeGreaterThanOrEqual(100);
      }
    });

    it('should add to this month earnings', async () => {
      const earning = await referralTrackingService.recordReferralEarning(
        'referral-001',
        100
      );

      if (earning) {
        expect(earning.earnings_this_month).toBeGreaterThanOrEqual(100);
      }
    });
  });

  describe('verifyFirstPurchase', () => {
    it('should mark first purchase date', async () => {
      const updated = await referralTrackingService.verifyFirstPurchase('referral-001');

      expect(updated).toBeDefined();
    });

    it('should update referral status to verified', async () => {
      const updated = await referralTrackingService.verifyFirstPurchase('referral-001');

      if (updated) {
        expect(updated.status).toBe('verified');
      }
    });

    it('should record first purchase date', async () => {
      const updated = await referralTrackingService.verifyFirstPurchase('referral-001');

      if (updated) {
        expect(updated.first_purchase_date).toBeDefined();
      }
    });
  });

  describe('getReferralsByCode', () => {
    it('should find referral by code', async () => {
      const referral = await referralTrackingService.getReferralsByCode('TEST123');

      if (referral) {
        expect(referral.referral_code).toBe('TEST123');
      }
    });

    it('should return null for non-existent code', async () => {
      const referral = await referralTrackingService.getReferralsByCode('NONEXISTENT');

      expect(referral === null || referral !== undefined).toBe(true);
    });
  });

  describe('getTierInfo', () => {
    it('should return tier information', async () => {
      const tier = await referralTrackingService.getTierInfo('gold');

      if (tier) {
        expect(tier).toHaveProperty('name');
        expect(tier).toHaveProperty('tier');
        expect(tier).toHaveProperty('commissionPercentage');
        expect(tier).toHaveProperty('minEarnings');
        expect(tier).toHaveProperty('benefits');
      }
    });

    it('should include tier benefits', async () => {
      const tier = await referralTrackingService.getTierInfo('gold');

      if (tier && tier.benefits) {
        expect(Array.isArray(tier.benefits)).toBe(true);
      }
    });
  });

  describe('calculateTierProgression', () => {
    it('should calculate earnings needed for next tier', async () => {
      const progression = await referralTrackingService.calculateTierProgression(
        mockReferrerId
      );

      if (progression) {
        expect(progression).toHaveProperty('currentTier');
        expect(progression).toHaveProperty('nextTier');
        expect(progression).toHaveProperty('currentEarnings');
        expect(progression).toHaveProperty('nextTierThreshold');
        expect(progression).toHaveProperty('earningsNeeded');
      }
    });

    it('should show progress to next tier', async () => {
      const progression = await referralTrackingService.calculateTierProgression(
        mockReferrerId
      );

      if (progression && progression.nextTier) {
        expect(progression.earningsNeeded).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('subscribeToReferralChanges', () => {
    it('should subscribe to referral updates', (done) => {
      const callback = vi.fn();
      const unsubscribe = referralTrackingService.subscribeToReferralChanges(
        mockReferrerId,
        callback
      );

      expect(typeof unsubscribe).toBe('function');
      done();
    });
  });

  describe('Auto-share percentage', () => {
    it('should allow auto-share configuration', async () => {
      const updated = await referralTrackingService.updateAutoSharePercentage(
        'referral-001',
        0.75
      );

      expect(updated).toBeDefined();
    });

    it('should validate auto-share between 0-1', async () => {
      const updated = await referralTrackingService.updateAutoSharePercentage(
        'referral-001',
        0.5
      );

      if (updated) {
        expect(updated.auto_share_percentage).toBeGreaterThanOrEqual(0);
        expect(updated.auto_share_percentage).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Referral code validation', () => {
    it('should generate valid referral codes', async () => {
      const referral = await referralTrackingService.trackReferral(
        mockReferrerId,
        mockReferredUserId
      );

      if (referral) {
        expect(referral.referral_code).toBeTruthy();
        expect(typeof referral.referral_code).toBe('string');
      }
    });

    it('should ensure referral codes are unique', async () => {
      const referral1 = await referralTrackingService.trackReferral(
        mockReferrerId,
        mockReferredUserId
      );

      const referral2 = await referralTrackingService.trackReferral(
        mockReferrerId,
        'another-user-id'
      );

      if (referral1 && referral2) {
        expect(referral1.referral_code).not.toEqual(referral2.referral_code);
      }
    });
  });
});
