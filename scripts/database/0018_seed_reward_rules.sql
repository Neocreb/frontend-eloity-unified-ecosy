-- ============================================================================
-- PHASE 1c: SEED REWARD RULES & SYSTEM DATA
-- ============================================================================
-- Populates default reward rules for all activity types
-- These can be modified by admins via API
-- Status: Ready for production (all values configurable)
-- ============================================================================

-- ============================================================================
-- REWARD RULES - Content Creation & Engagement
-- ============================================================================

-- Post Creation
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, weekly_limit,
  monthly_limit, minimum_trust_score, decay_enabled, decay_start, decay_rate,
  min_multiplier, is_active
) VALUES (
  'post_creation', 
  'Create Post', 
  'Earn Eloits for creating a new post, article, or video',
  50.00,
  10, 50, 200,
  0, true, 3, 0.15, 0.1, true
) ON CONFLICT (action_type) DO NOTHING;

-- Like Received
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, weekly_limit,
  monthly_limit, minimum_trust_score, decay_enabled, decay_start, decay_rate,
  min_multiplier, is_active
) VALUES (
  'like_received',
  'Receive Like',
  'Earn Eloits when your content gets liked',
  2.00,
  100, 500, 2000,
  0, true, 20, 0.05, 0.2, true
) ON CONFLICT (action_type) DO NOTHING;

-- Comment Received
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, weekly_limit,
  monthly_limit, minimum_trust_score, decay_enabled, decay_start, decay_rate,
  min_multiplier, is_active
) VALUES (
  'comment_received',
  'Receive Comment',
  'Earn Eloits when someone comments on your content',
  5.00,
  50, 200, 800,
  0, true, 15, 0.1, 0.15, true
) ON CONFLICT (action_type) DO NOTHING;

-- Share Received
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, weekly_limit,
  monthly_limit, minimum_trust_score, decay_enabled, decay_start, decay_rate,
  min_multiplier, is_active
) VALUES (
  'share_received',
  'Share Received',
  'Earn Eloits when your content is shared',
  10.00,
  20, 80, 300,
  0, true, 5, 0.2, 0.1, true
) ON CONFLICT (action_type) DO NOTHING;

-- ============================================================================
-- REWARD RULES - View Engagement
-- ============================================================================

-- Content Viewed (1 minute+)
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, weekly_limit,
  monthly_limit, minimum_trust_score, decay_enabled, decay_start, decay_rate,
  min_multiplier, is_active
) VALUES (
  'content_view_engaged',
  'Content View (1+ min)',
  'Earn Eloits for viewers spending 1+ minutes on your content',
  1.00,
  500, 2000, 8000,
  0, true, 50, 0.02, 0.5, true
) ON CONFLICT (action_type) DO NOTHING;

-- ============================================================================
-- REWARD RULES - Challenges & Battles
-- ============================================================================

-- Challenge Completion
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, weekly_limit,
  monthly_limit, minimum_trust_score, decay_enabled, decay_start, decay_rate,
  min_multiplier, is_active
) VALUES (
  'challenge_completed',
  'Complete Challenge',
  'Earn Eloits for completing daily or weekly challenges',
  100.00,
  1, 3, 12,
  30, false, 1, 0, 1.0, true
) ON CONFLICT (action_type) DO NOTHING;

-- Battle Vote Won
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, weekly_limit,
  monthly_limit, minimum_trust_score, decay_enabled, decay_start, decay_rate,
  min_multiplier, is_active
) VALUES (
  'battle_vote_won',
  'Battle Vote Won',
  'Earn Eloits when your battle vote wins',
  5.00,
  50, 200, 800,
  30, false, 1, 0, 1.0, true
) ON CONFLICT (action_type) DO NOTHING;

-- ============================================================================
-- REWARD RULES - Marketplace
-- ============================================================================

-- Product Purchase
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, weekly_limit,
  monthly_limit, minimum_trust_score, minimum_value, decay_enabled, is_active
) VALUES (
  'product_purchase',
  'Product Purchase',
  'Earn 1% Eloits on product purchases + 10 base Eloits',
  10.00,
  10, 50, 200,
  30, 10.00, false, true
) ON CONFLICT (action_type) DO NOTHING;

-- Product Sold
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, monthly_limit,
  minimum_trust_score, decay_enabled, is_active
) VALUES (
  'product_sold',
  'Product Sold',
  'Earn Eloits when you sell a product (750 + tier multiplier)',
  750.00,
  10, 30,
  50, false, true
) ON CONFLICT (action_type) DO NOTHING;

-- ============================================================================
-- REWARD RULES - Referrals
-- ============================================================================

-- Referral Signup
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, monthly_limit,
  minimum_trust_score, decay_enabled, is_active
) VALUES (
  'referral_signup',
  'Referral Sign Up',
  'Earn Eloits when your referral creates an account',
  500.00,
  null, null,
  50, false, true
) ON CONFLICT (action_type) DO NOTHING;

-- Referral First Purchase
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, monthly_limit,
  minimum_trust_score, decay_enabled, is_active
) VALUES (
  'referral_first_purchase',
  'Referral First Purchase',
  'Earn Eloits when your referral makes their first purchase',
  1500.00,
  null, null,
  50, false, true
) ON CONFLICT (action_type) DO NOTHING;

-- Referral Monthly Bonus
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, monthly_limit,
  minimum_trust_score, decay_enabled, is_active
) VALUES (
  'referral_monthly_bonus',
  'Monthly Referral Bonus',
  'Earn 5-15% of referral''s earnings monthly (tier-based)',
  0.00,
  null,
  50, false, true
) ON CONFLICT (action_type) DO NOTHING;

-- ============================================================================
-- REWARD RULES - Freelance
-- ============================================================================

-- Job Completed
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, monthly_limit,
  minimum_trust_score, decay_enabled, is_active
) VALUES (
  'job_completed',
  'Job Completed',
  'Earn Eloits for completing a freelance job (5% of earnings)',
  0.00,
  5, 20,
  50, false, true
) ON CONFLICT (action_type) DO NOTHING;

-- ============================================================================
-- REWARD RULES - Gifts & Tips
-- ============================================================================

-- Gift Received
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, weekly_limit,
  monthly_limit, minimum_trust_score, decay_enabled, is_active
) VALUES (
  'gift_received',
  'Gift Received',
  'Earn Eloits from the value of gifts you receive',
  0.00,
  null, null,
  0, false, true
) ON CONFLICT (action_type) DO NOTHING;

-- Tip Received
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, monthly_limit,
  minimum_trust_score, decay_enabled, is_active
) VALUES (
  'tip_received',
  'Tip Received',
  'Earn Eloits from tips you receive',
  0.00,
  null, null,
  0, false, true
) ON CONFLICT (action_type) DO NOTHING;

-- ============================================================================
-- REWARD RULES - Community & Engagement
-- ============================================================================

-- Community Contribution
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, weekly_limit,
  monthly_limit, minimum_trust_score, decay_enabled, is_active
) VALUES (
  'community_contribution',
  'Community Contribution',
  'Earn Eloits for helping others in the community',
  25.00,
  5, 20, 80,
  40, true, 3, 0.1, 0.1, true
) ON CONFLICT (action_type) DO NOTHING;

-- Login Streak
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, monthly_limit,
  minimum_trust_score, decay_enabled, is_active
) VALUES (
  'login_streak',
  'Login Streak',
  'Earn bonus Eloits for consecutive daily logins (multiplies daily)',
  5.00,
  1, 31,
  0, false, true
) ON CONFLICT (action_type) DO NOTHING;

-- ============================================================================
-- REWARD RULES - Profile & Verification
-- ============================================================================

-- Profile Completion
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, monthly_limit,
  minimum_trust_score, decay_enabled, is_active
) VALUES (
  'profile_completion',
  'Profile Completion',
  'Earn Eloits for completing your profile (one-time)',
  50.00,
  1, 1,
  0, false, true
) ON CONFLICT (action_type) DO NOTHING;

-- KYC Verification
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, daily_limit, monthly_limit,
  minimum_trust_score, decay_enabled, is_active
) VALUES (
  'kyc_verification',
  'KYC Verification',
  'Earn Eloits for completing KYC verification (one-time)',
  100.00,
  1, 1,
  0, false, true
) ON CONFLICT (action_type) DO NOTHING;

-- ============================================================================
-- REWARD RULES - Admin/Manual Rewards
-- ============================================================================

-- Manual Award (for admin use)
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, decay_enabled, is_active
) VALUES (
  'manual_award',
  'Manual Award',
  'Awarded manually by administrators',
  0.00,
  false, true
) ON CONFLICT (action_type) DO NOTHING;

-- Bonus Award (for promotions/events)
INSERT INTO public.reward_rules (
  action_type, display_name, description, base_eloits, decay_enabled, is_active
) VALUES (
  'bonus_award',
  'Bonus Award',
  'Promotional bonus awarded to users',
  0.00,
  false, true
) ON CONFLICT (action_type) DO NOTHING;

-- ============================================================================
-- SYSTEM INITIALIZATION - Create sample user summaries for testing
-- ============================================================================
-- NOTE: In production, summaries are auto-created when users first earn rewards
-- Uncomment below if you want to seed test data

-- Initialize admin user's reward summary (if admin user_id known)
-- INSERT INTO public.user_rewards_summary (user_id, trust_score, level)
-- VALUES ('<admin-user-uuid>', 100, 6)
-- ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- VERIFY SEED DATA
-- ============================================================================

-- View all active rules
SELECT action_type, display_name, base_eloits, daily_limit
FROM public.reward_rules
WHERE is_active = true
ORDER BY action_type;

-- Count total rules
SELECT COUNT(*) as total_rules FROM public.reward_rules;

-- ============================================================================
-- END OF PHASE 1c - SEED DATA LOADED
-- ============================================================================
-- System is now ready for user interactions
-- All default reward rules are configured
-- Next: Apply Phase 2 (Services) implementation
-- ============================================================================
