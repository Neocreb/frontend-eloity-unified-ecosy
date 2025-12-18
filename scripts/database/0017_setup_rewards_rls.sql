-- ============================================================================
-- PHASE 1b: ROW LEVEL SECURITY (RLS) - Data Privacy & Security
-- ============================================================================
-- Enforces privacy: Users can only see their own data
-- Admin access: System can update summary tables
-- Real-time: Enables Supabase Realtime for live updates
-- ============================================================================

-- ============================================================================
-- 1. ACTIVITY_TRANSACTIONS - RLS Policies
-- ============================================================================
-- Users: Read own activities only
-- System/Admin: Can insert/update activities

ALTER TABLE public.activity_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own activities
CREATE POLICY "activity_transactions_user_select"
  ON public.activity_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert new activities
CREATE POLICY "activity_transactions_insert"
  ON public.activity_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- System can update activity status
CREATE POLICY "activity_transactions_update"
  ON public.activity_transactions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. USER_REWARDS_SUMMARY - RLS Policies
-- ============================================================================
-- Users: Read own summary only
-- System: Can update summary via triggers/functions

ALTER TABLE public.user_rewards_summary ENABLE ROW LEVEL SECURITY;

-- Users can view their own summary
CREATE POLICY "user_rewards_summary_select"
  ON public.user_rewards_summary FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert new summary
CREATE POLICY "user_rewards_summary_insert"
  ON public.user_rewards_summary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- System can update summary
CREATE POLICY "user_rewards_summary_update"
  ON public.user_rewards_summary FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. USER_CHALLENGES - RLS Policies
-- ============================================================================
-- Users: Can view/manage own challenges

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- Users can view their own challenges
CREATE POLICY "user_challenges_select"
  ON public.user_challenges FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert challenges for user
CREATE POLICY "user_challenges_insert"
  ON public.user_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own challenges
CREATE POLICY "user_challenges_update"
  ON public.user_challenges FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. REFERRAL_TRACKING - RLS Policies
-- ============================================================================
-- Users: Can view referrals they made AND referrals that led to them
-- This is bidirectional: referrer_id OR referred_user_id

ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view referrals they made OR referrals that led to them
CREATE POLICY "referral_tracking_select"
  ON public.referral_tracking FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- System can create referral tracking
CREATE POLICY "referral_tracking_insert"
  ON public.referral_tracking FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- Referrer can update their referrals (status, etc.)
CREATE POLICY "referral_tracking_update"
  ON public.referral_tracking FOR UPDATE
  USING (auth.uid() = referrer_id);

-- ============================================================================
-- 5. USER_DAILY_STATS - RLS Policies
-- ============================================================================
-- Users: Can view their own stats only

ALTER TABLE public.user_daily_stats ENABLE ROW LEVEL SECURITY;

-- Users can view their own daily stats
CREATE POLICY "user_daily_stats_select"
  ON public.user_daily_stats FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert daily stats
CREATE POLICY "user_daily_stats_insert"
  ON public.user_daily_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. REWARD_RULES - RLS Policies
-- ============================================================================
-- Public: Everyone can read active rules
-- Admin: Only admins can modify rules

ALTER TABLE public.reward_rules ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read active rules
CREATE POLICY "reward_rules_public_select"
  ON public.reward_rules FOR SELECT
  USING (is_active = true);

-- Only admins can insert/update/delete rules
-- This requires adding role check - you'll need to set this based on your auth setup
CREATE POLICY "reward_rules_admin_all"
  ON public.reward_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- 7. REWARD_TRANSACTIONS - RLS Policies
-- ============================================================================
-- Users: Can view their own reward transactions
-- Admin: Can view all

ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "reward_transactions_select"
  ON public.reward_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert transactions
CREATE POLICY "reward_transactions_insert"
  ON public.reward_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 8. TRUST_HISTORY - RLS Policies
-- ============================================================================
-- Users: Can view their own trust history
-- Helps with transparency

ALTER TABLE public.trust_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own trust history
CREATE POLICY "trust_history_select"
  ON public.trust_history FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert trust history
CREATE POLICY "trust_history_insert"
  ON public.trust_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 9. DAILY_ACTION_COUNTS - RLS Policies
-- ============================================================================
-- Users: Can view their own counts

ALTER TABLE public.daily_action_counts ENABLE ROW LEVEL SECURITY;

-- Users can view their own action counts
CREATE POLICY "daily_action_counts_select"
  ON public.daily_action_counts FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert/update action counts
CREATE POLICY "daily_action_counts_insert"
  ON public.daily_action_counts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_action_counts_update"
  ON public.daily_action_counts FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 10. SPAM_DETECTION - RLS Policies
-- ============================================================================
-- Users: Can view spam detection entries about them (for transparency)
-- Admin: Can see all spam entries

ALTER TABLE public.spam_detection ENABLE ROW LEVEL SECURITY;

-- Users can view spam entries about themselves
CREATE POLICY "spam_detection_user_select"
  ON public.spam_detection FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert spam detection entries
CREATE POLICY "spam_detection_insert"
  ON public.spam_detection FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- REALTIME PUBLICATION - Enable Supabase Realtime subscriptions
-- ============================================================================
-- Allows frontend to subscribe to real-time changes for live updates
-- Only works for tables with RLS properly configured

ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_rewards_summary;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_daily_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reward_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trust_history;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Allows authenticated users to interact with tables based on RLS

GRANT SELECT, INSERT, UPDATE ON public.activity_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_rewards_summary TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_challenges TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.referral_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_daily_stats TO authenticated;
GRANT SELECT ON public.reward_rules TO authenticated;
GRANT SELECT, INSERT ON public.reward_transactions TO authenticated;
GRANT SELECT, INSERT ON public.trust_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.daily_action_counts TO authenticated;
GRANT SELECT, INSERT ON public.spam_detection TO authenticated;

-- Allow anon to read reward rules
GRANT SELECT ON public.reward_rules TO anon;

-- ============================================================================
-- END OF PHASE 1b - RLS POLICIES CONFIGURED
-- ============================================================================
-- Security now enforced at database level
-- Real-time subscriptions enabled for live updates
-- ============================================================================
