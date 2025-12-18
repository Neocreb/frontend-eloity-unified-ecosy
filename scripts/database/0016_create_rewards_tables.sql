-- ============================================================================
-- PHASE 1a: CREATE REWARDS TABLES - Core Schema for Creator Economy System
-- ============================================================================
-- This migration creates all necessary tables for the Eloity Rewards system
-- Includes: activities, summaries, challenges, referrals, rules, transactions
-- Status: Ready for Supabase deployment
-- ============================================================================

-- ============================================================================
-- 1. ACTIVITY_TRANSACTIONS - Core earning events tracking
-- ============================================================================
-- Stores all earning activities: post creation, engagement, challenges, gifts, etc.
-- Purpose: Complete audit trail of user earnings with metadata
-- Performance: Indexed by (user_id, created_at DESC) for fast queries
-- RLS: Users see only their own activities

CREATE TABLE IF NOT EXISTS public.activity_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Activity classification
  activity_type VARCHAR(50) NOT NULL, -- 'post_creation', 'engagement', 'challenge', 'battle', 'gift', etc.
  category VARCHAR(50) NOT NULL,      -- 'content', 'engagement', 'community', 'marketplace', 'freelance'
  description TEXT,                    -- Human-readable description
  
  -- Earnings information
  amount_eloits NUMERIC(15,2) NOT NULL DEFAULT 0,      -- Eloits earned
  amount_currency NUMERIC(15,2) DEFAULT 0,              -- Fiat value
  currency_code VARCHAR(3) DEFAULT 'USD',               -- Currency of fiat amount
  
  -- Transaction metadata
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  source_id VARCHAR(100),                                -- ID of source (post_id, product_id, etc.)
  source_type VARCHAR(50),                               -- Type of source (post, product, job, etc.)
  metadata JSONB DEFAULT '{}',                          -- Flexible data storage
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_activity_transactions_user_date 
  ON public.activity_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_transactions_type 
  ON public.activity_transactions(activity_type);

CREATE INDEX IF NOT EXISTS idx_activity_transactions_category 
  ON public.activity_transactions(category);

CREATE INDEX IF NOT EXISTS idx_activity_transactions_status 
  ON public.activity_transactions(status);

-- ============================================================================
-- 2. USER_REWARDS_SUMMARY - Denormalized user stats for performance
-- ============================================================================
-- Purpose: Fast dashboard queries without aggregating millions of transactions
-- Updates: Triggered by activity_transactions INSERT
-- Structure: Single row per user (PK = user_id)

CREATE TABLE IF NOT EXISTS public.user_rewards_summary (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Earnings summary
  total_earned NUMERIC(15,2) DEFAULT 0,           -- Total Eloits earned all time
  available_balance NUMERIC(15,2) DEFAULT 0,      -- Available for withdrawal
  total_withdrawn NUMERIC(15,2) DEFAULT 0,        -- Amount already withdrawn
  pending_withdrawal NUMERIC(15,2) DEFAULT 0,     -- Amount in withdrawal request
  
  -- Engagement metrics
  current_streak INT DEFAULT 0,                   -- Current day activity streak
  longest_streak INT DEFAULT 0,                   -- Best streak achieved
  total_activities INT DEFAULT 0,                 -- Total activities completed
  activities_this_month INT DEFAULT 0,            -- Activities in current month
  
  -- Trust & Level System
  trust_score INT DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  level INT DEFAULT 1 CHECK (level >= 1 AND level <= 6),
  next_level_threshold NUMERIC(15,2),             -- Eloits needed for next level
  
  -- Preferences
  currency_code VARCHAR(3) DEFAULT 'USD',
  preferred_withdrawal_method VARCHAR(50),        -- 'bank_transfer', 'crypto', 'gift_card'
  
  -- Tracking
  last_activity_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_rewards_summary_level 
  ON public.user_rewards_summary(level);

-- ============================================================================
-- 3. USER_CHALLENGES - Challenge progress tracking
-- ============================================================================
-- Purpose: Track individual user progress on challenges
-- Structure: Many-to-many between users and challenges
-- Features: Progress tracking, status, reward claiming

CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL,  -- Can reference challenges table if created
  
  -- Progress
  progress INT DEFAULT 0,            -- Current progress toward target
  target_value INT NOT NULL,         -- Goal value
  progress_percentage INT DEFAULT 0, -- Calculated percentage (0-100)
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'abandoned')),
  completion_date TIMESTAMP WITH TIME ZONE,
  
  -- Rewards
  reward_claimed BOOLEAN DEFAULT FALSE,
  claim_date TIMESTAMP WITH TIME ZONE,
  reward_amount NUMERIC(15,2),  -- Amount to claim
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user_status 
  ON public.user_challenges(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_challenges_active 
  ON public.user_challenges(user_id, completion_date) 
  WHERE status = 'active';

-- ============================================================================
-- 4. REFERRAL_TRACKING - Multi-level referral system
-- ============================================================================
-- Purpose: Track referral relationships and earnings
-- Tier System: Bronze (5%), Silver (7.5%), Gold (10%), Platinum (15%)
-- Auto-share: 0.5% automatic sharing from referred user earnings

CREATE TABLE IF NOT EXISTS public.referral_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Referral code
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'active', 'inactive')),
  referral_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verification_date TIMESTAMP WITH TIME ZONE,
  first_purchase_date TIMESTAMP WITH TIME ZONE,
  
  -- Earnings tracking
  earnings_total NUMERIC(15,2) DEFAULT 0,
  earnings_this_month NUMERIC(15,2) DEFAULT 0,
  earnings_last_month NUMERIC(15,2) DEFAULT 0,
  
  -- Tier system
  tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  commission_percentage NUMERIC(5,2),  -- Current tier commission percentage
  
  -- Auto-share feature
  auto_share_total NUMERIC(15,2) DEFAULT 0,
  auto_share_percentage NUMERIC(5,2) DEFAULT 0.5,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(referrer_id, referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer 
  ON public.referral_tracking(referrer_id, status);

CREATE INDEX IF NOT EXISTS idx_referral_tracking_referred 
  ON public.referral_tracking(referred_user_id);

CREATE INDEX IF NOT EXISTS idx_referral_tracking_code 
  ON public.referral_tracking(referral_code);

-- ============================================================================
-- 5. USER_DAILY_STATS - Daily aggregated statistics
-- ============================================================================
-- Purpose: Fast daily/weekly/monthly reporting without full aggregation
-- Updated: Once per day via scheduled task
-- Retention: Keep for at least 1 year for historical analysis

CREATE TABLE IF NOT EXISTS public.user_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Date
  stats_date DATE NOT NULL,
  
  -- Activity counts
  activities_count INT DEFAULT 0,
  activities_by_type JSONB DEFAULT '{}',  -- { "post_creation": 2, "engagement": 5, ... }
  
  -- Earnings
  earnings_amount NUMERIC(15,2) DEFAULT 0,
  earnings_by_type JSONB DEFAULT '{}',
  
  -- Engagement
  engagement_count INT DEFAULT 0,
  views INT DEFAULT 0,
  
  -- Performance
  best_activity_type VARCHAR(50),
  best_earning_amount NUMERIC(15,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, stats_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_stats_user_date 
  ON public.user_daily_stats(user_id, stats_date DESC);

-- ============================================================================
-- 6. REWARD_RULES - Configurable reward definitions
-- ============================================================================
-- Purpose: Defines all possible reward activities and their values
-- Admin: Can create/modify rules for different seasons/promotions
-- Flexibility: Supports decay, limits, trust score requirements

CREATE TABLE IF NOT EXISTS public.reward_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  action_type VARCHAR(50) NOT NULL UNIQUE,  -- 'post_creation', 'like_received', etc.
  display_name VARCHAR(255) NOT NULL,       -- User-facing name
  description TEXT,                          -- Full description
  
  -- Reward amounts
  base_eloits NUMERIC(10,2) NOT NULL,        -- Base Eloits rewarded
  base_wallet_bonus NUMERIC(20,8) DEFAULT 0, -- Optional fiat bonus
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Limits
  daily_limit INT,      -- Max activities per day
  weekly_limit INT,     -- Max activities per week
  monthly_limit INT,    -- Max activities per month
  
  -- Requirements
  minimum_trust_score NUMERIC(5,2) DEFAULT 0,
  minimum_value NUMERIC(15,2),  -- Min value for transaction-based rewards
  
  -- Decay system (for repetitive actions)
  decay_enabled BOOLEAN DEFAULT FALSE,
  decay_start INT DEFAULT 1,           -- After Nth activity, start decay
  decay_rate NUMERIC(5,4) DEFAULT 0.1, -- Decay factor per activity
  min_multiplier NUMERIC(3,2) DEFAULT 0.1, -- Minimum multiplier (floor)
  
  -- Quality & moderation
  requires_moderation BOOLEAN DEFAULT FALSE,
  quality_threshold NUMERIC(3,2) DEFAULT 0,  -- Min quality score (0-100)
  
  -- Conditions & metadata
  conditions JSONB,  -- Custom conditions (JSON constraints)
  
  -- Activation
  is_active BOOLEAN DEFAULT TRUE,
  active_from TIMESTAMP WITH TIME ZONE,
  active_to TIMESTAMP WITH TIME ZONE,
  
  -- Admin tracking
  created_by UUID,
  last_modified_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_rules_active 
  ON public.reward_rules(is_active, action_type);

-- ============================================================================
-- 7. REWARD_TRANSACTIONS - Individual reward transactions
-- ============================================================================
-- Purpose: Complete history of reward processing
-- Different from activity_transactions - records actual reward payouts

CREATE TABLE IF NOT EXISTS public.reward_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.reward_rules(id),
  
  -- Reward details
  amount_eloits NUMERIC(10,2) NOT NULL,
  amount_currency NUMERIC(15,2),
  base_amount NUMERIC(10,2),  -- Amount before multipliers
  multiplier NUMERIC(5,2) DEFAULT 1.0,
  
  -- Context
  bonus_reason VARCHAR(255),  -- Why bonus was applied
  activity_id UUID,  -- Link to related activity
  
  -- Status
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  source_id VARCHAR(100),
  source_type VARCHAR(50),
  
  -- Processed by
  processed_by VARCHAR(50),  -- System/admin/bot that processed this
  processed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_transactions_user_date 
  ON public.reward_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reward_transactions_rule 
  ON public.reward_transactions(rule_id);

-- ============================================================================
-- 8. TRUST_HISTORY - Trust score change log
-- ============================================================================
-- Purpose: Full audit trail of trust score changes
-- Analysis: Understand what affects user trust
-- Privacy: Users can review their trust history

CREATE TABLE IF NOT EXISTS public.trust_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Score change
  old_score INT,
  new_score INT,
  change_amount INT,
  change_percentage NUMERIC(5,2),
  
  -- Reason
  change_reason VARCHAR(255),  -- Why the trust changed
  
  -- Details
  factor_type VARCHAR(50),  -- 'engagement_quality', 'spam_detection', 'activity_streak', etc.
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_trust_history_user_date (user_id, created_at DESC)
);

-- ============================================================================
-- 9. DAILY_ACTION_COUNTS - Daily activity frequency tracking
-- ============================================================================
-- Purpose: Enforce daily/weekly limits on activities
-- Used for: Decay system, spam detection, rate limiting

CREATE TABLE IF NOT EXISTS public.daily_action_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Activity
  action_type VARCHAR(50) NOT NULL,
  count INT DEFAULT 0,
  
  -- Date
  action_date DATE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, action_type, action_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_action_counts_date 
  ON public.daily_action_counts(user_id, action_date);

-- ============================================================================
-- 10. SPAM_DETECTION - Spam & abuse tracking
-- ============================================================================
-- Purpose: Detect and prevent reward abuse
-- Actions: Freeze rewards, reduce trust score, flag for review

CREATE TABLE IF NOT EXISTS public.spam_detection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Violation
  violation_type VARCHAR(50),  -- 'excessive_activity', 'ip_duplication', 'engagement_pattern', 'content_spam'
  severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  endpoint VARCHAR(255),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',  -- Custom data about violation
  
  -- Action taken
  action_taken VARCHAR(50),  -- 'warning', 'freeze', 'suspend', 'review'
  
  -- Resolution
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  INDEX idx_spam_detection_user_date (user_id, created_at DESC)
);

-- ============================================================================
-- TRIGGERS - Automatic timestamp updates
-- ============================================================================

-- Function for updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE OR REPLACE TRIGGER trigger_activity_transactions_updated_at
  BEFORE UPDATE ON public.activity_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER trigger_user_rewards_summary_updated_at
  BEFORE UPDATE ON public.user_rewards_summary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER trigger_user_challenges_updated_at
  BEFORE UPDATE ON public.user_challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER trigger_referral_tracking_updated_at
  BEFORE UPDATE ON public.referral_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER trigger_reward_transactions_updated_at
  BEFORE UPDATE ON public.reward_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER trigger_daily_action_counts_updated_at
  BEFORE UPDATE ON public.daily_action_counts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- END OF PHASE 1a - CORE TABLES CREATED
-- ============================================================================
-- Next: Apply 0017_setup_rewards_rls.sql for Row Level Security
-- Then: Apply 0018_seed_reward_rules.sql for default reward rules
-- ============================================================================
