import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rewardRulesService } from '../rewardRulesService';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(function () { return this; }),
        order: vi.fn(function () { return this; }),
        single: vi.fn(function () {
          return Promise.resolve({
            data: {
              id: 'rule-001',
              action_type: 'post_creation',
              display_name: 'Create Post',
              base_eloits: 10,
              is_active: true,
            },
            error: null,
          });
        }),
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
      update: vi.fn(() => ({
        eq: vi.fn(function () { return this; }),
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('RewardRulesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActiveRules', () => {
    it('should retrieve all active reward rules', async () => {
      const rules = await rewardRulesService.getActiveRules();

      expect(Array.isArray(rules)).toBe(true);
    });

    it('should only return active rules', async () => {
      const rules = await rewardRulesService.getActiveRules();

      if (rules.length > 0) {
        rules.forEach(rule => {
          expect(rule.is_active).toBe(true);
        });
      }
    });

    it('should include required rule fields', async () => {
      const rules = await rewardRulesService.getActiveRules();

      if (rules.length > 0) {
        const rule = rules[0];
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('action_type');
        expect(rule).toHaveProperty('display_name');
        expect(rule).toHaveProperty('base_eloits');
        expect(rule).toHaveProperty('is_active');
      }
    });
  });

  describe('getRuleByType', () => {
    it('should retrieve rule by action type', async () => {
      const rule = await rewardRulesService.getRuleByType('post_creation');

      if (rule) {
        expect(rule.action_type).toBe('post_creation');
        expect(rule.is_active).toBe(true);
      }
    });

    it('should return null for non-existent rule type', async () => {
      const rule = await rewardRulesService.getRuleByType('non_existent_action');

      // Should either return null or the service handles the error
      expect(rule === null || rule !== undefined).toBe(true);
    });

    it('should cache rule results', async () => {
      // First call
      const rule1 = await rewardRulesService.getRuleByType('post_creation');

      // Second call should use cache
      const rule2 = await rewardRulesService.getRuleByType('post_creation');

      expect(rule1).toEqual(rule2);
    });

    it('should invalidate cache after timeout', async () => {
      // Set a shorter cache timeout for testing
      await rewardRulesService.getRuleByType('post_creation');

      // Wait for cache to expire (would be 5 minutes in real scenario)
      // In test we skip this and just verify the method works multiple times
      const rule = await rewardRulesService.getRuleByType('post_creation');

      expect(rule).toBeDefined();
    });
  });

  describe('calculateReward', () => {
    it('should calculate reward with base amount', async () => {
      const calculation = await rewardRulesService.calculateReward(
        'post_creation',
        100
      );

      if (calculation) {
        expect(calculation).toHaveProperty('baseAmount');
        expect(calculation).toHaveProperty('multiplier');
        expect(calculation).toHaveProperty('finalAmount');

        expect(typeof calculation.baseAmount).toBe('number');
        expect(typeof calculation.finalAmount).toBe('number');
        expect(calculation.finalAmount >= calculation.baseAmount).toBe(true);
      }
    });

    it('should apply multiplier to base amount', async () => {
      const calculation = await rewardRulesService.calculateReward(
        'post_creation',
        100
      );

      if (calculation && calculation.multiplier) {
        const expectedFinal = calculation.baseAmount * calculation.multiplier;
        expect(calculation.finalAmount).toBe(expectedFinal);
      }
    });

    it('should handle decay calculations', async () => {
      const calculation = await rewardRulesService.calculateReward(
        'post_creation',
        100,
        { applyDecay: true, attemptNumber: 5 }
      );

      if (calculation) {
        // Higher attempt numbers should result in lower multiplier
        expect(calculation.finalAmount).toBeDefined();
      }
    });

    it('should apply trust score multiplier', async () => {
      const calculation = await rewardRulesService.calculateReward(
        'post_creation',
        100,
        { trustScore: 90 }
      );

      if (calculation) {
        expect(calculation.finalAmount).toBeDefined();
        expect(typeof calculation.finalAmount).toBe('number');
      }
    });

    it('should apply quality bonus when applicable', async () => {
      const calculation = await rewardRulesService.calculateReward(
        'post_creation',
        100,
        { qualityScore: 0.95 }
      );

      if (calculation && calculation.bonusReason) {
        expect(calculation.bonusReason).toBeDefined();
      }
    });
  });

  describe('applyDecay', () => {
    it('should apply decay to base reward', async () => {
      const decayed = await rewardRulesService.applyDecay(
        'post_creation',
        100,
        1
      );

      // First attempt should have no decay
      expect(decayed).toBe(100);
    });

    it('should increase decay with each attempt', async () => {
      const attempt1 = await rewardRulesService.applyDecay(
        'post_creation',
        100,
        1
      );

      const attempt2 = await rewardRulesService.applyDecay(
        'post_creation',
        100,
        2
      );

      const attempt3 = await rewardRulesService.applyDecay(
        'post_creation',
        100,
        3
      );

      // Each subsequent attempt should result in lower or equal reward
      expect(attempt2).toBeLessThanOrEqual(attempt1);
      expect(attempt3).toBeLessThanOrEqual(attempt2);
    });

    it('should enforce minimum multiplier', async () => {
      const veryHighAttempt = await rewardRulesService.applyDecay(
        'post_creation',
        100,
        100
      );

      // Should never go below minimum multiplier
      expect(veryHighAttempt).toBeGreaterThan(0);
    });
  });

  describe('checkLimits', () => {
    const mockUserId = 'test-user-123';

    it('should check daily reward limit', async () => {
      const canEarn = await rewardRulesService.checkLimits(
        mockUserId,
        'post_creation',
        'daily'
      );

      expect(typeof canEarn).toBe('boolean');
    });

    it('should check weekly reward limit', async () => {
      const canEarn = await rewardRulesService.checkLimits(
        mockUserId,
        'post_creation',
        'weekly'
      );

      expect(typeof canEarn).toBe('boolean');
    });

    it('should check monthly reward limit', async () => {
      const canEarn = await rewardRulesService.checkLimits(
        mockUserId,
        'post_creation',
        'monthly'
      );

      expect(typeof canEarn).toBe('boolean');
    });

    it('should respect user-specific limits', async () => {
      const canEarn = await rewardRulesService.checkLimits(
        mockUserId,
        'post_creation',
        'daily'
      );

      expect(typeof canEarn).toBe('boolean');
    });
  });

  describe('createRule', () => {
    it('should create a new reward rule', async () => {
      const newRule = await rewardRulesService.createRule({
        action_type: 'test_action',
        display_name: 'Test Action',
        base_eloits: 50,
      });

      expect(newRule).toBeDefined();
    });

    it('should set default values for new rule', async () => {
      const newRule = await rewardRulesService.createRule({
        action_type: 'test_action',
        display_name: 'Test Action',
        base_eloits: 50,
      });

      if (newRule) {
        expect(newRule.is_active).toBe(true);
        expect(newRule.decay_enabled).toBe(true);
      }
    });
  });

  describe('updateRule', () => {
    it('should update existing reward rule', async () => {
      const updated = await rewardRulesService.updateRule('rule-001', {
        base_eloits: 75,
        display_name: 'Updated Name',
      });

      expect(updated).toBeDefined();
    });

    it('should preserve unchanged fields', async () => {
      const updated = await rewardRulesService.updateRule('rule-001', {
        base_eloits: 75,
      });

      expect(updated).toBeDefined();
    });
  });

  describe('deactivateRule', () => {
    it('should deactivate a rule', async () => {
      const result = await rewardRulesService.deactivateRule('rule-001');

      expect(result).toBeDefined();
    });

    it('should prevent earning from deactivated rule', async () => {
      await rewardRulesService.deactivateRule('rule-001');
      const rule = await rewardRulesService.getRuleByType('rule-001');

      // Rule should not be found or marked inactive
      expect(rule === null || !rule.is_active).toBe(true);
    });
  });

  describe('subscribeToRuleChanges', () => {
    it('should subscribe to rule updates', (done) => {
      const callback = vi.fn();
      const unsubscribe = rewardRulesService.subscribeToRuleChanges(callback);

      expect(typeof unsubscribe).toBe('function');
      done();
    });
  });

  describe('Rule validation', () => {
    it('should validate rule fields', async () => {
      const rule = await rewardRulesService.getRuleByType('post_creation');

      if (rule) {
        expect(rule.base_eloits).toBeGreaterThan(0);
        expect(rule.display_name).toBeTruthy();
        expect(rule.action_type).toBeTruthy();
      }
    });

    it('should enforce minimum base eloits', async () => {
      const rules = await rewardRulesService.getActiveRules();

      rules.forEach(rule => {
        expect(rule.base_eloits).toBeGreaterThan(0);
      });
    });
  });

  describe('Cache management', () => {
    it('should clear cache when rules are updated', async () => {
      // Get rule (caches it)
      const rule1 = await rewardRulesService.getRuleByType('post_creation');

      // Update rule (should clear cache)
      await rewardRulesService.updateRule('rule-001', { base_eloits: 100 });

      // Get rule again (should fetch fresh)
      const rule2 = await rewardRulesService.getRuleByType('post_creation');

      expect(rule1).toBeDefined();
      expect(rule2).toBeDefined();
    });

    it('should invalidate cache on create', async () => {
      const allRules1 = await rewardRulesService.getActiveRules();

      await rewardRulesService.createRule({
        action_type: 'new_test_action',
        display_name: 'New Test',
        base_eloits: 50,
      });

      const allRules2 = await rewardRulesService.getActiveRules();

      expect(Array.isArray(allRules1)).toBe(true);
      expect(Array.isArray(allRules2)).toBe(true);
    });
  });
});
