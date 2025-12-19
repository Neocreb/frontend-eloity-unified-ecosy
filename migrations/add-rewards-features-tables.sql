-- Add Rewards Features Tables
-- This migration adds tables for boost manager, partnerships, referrals, and earning history

-- Create boost_packages table (global boost offerings)
CREATE TABLE IF NOT EXISTS boost_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(10),
  price DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  estimated_reach VARCHAR(100),
  features JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT FALSE,
  tier_level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT positive_price CHECK (price > 0),
  CONSTRAINT positive_duration CHECK (duration_days > 0)
);

-- Create user_boosts table (active boosts per user)
CREATE TABLE IF NOT EXISTS user_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boost_package_id UUID NOT NULL REFERENCES boost_packages(id),
  boost_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  price_paid DECIMAL(10, 2),
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  content_type VARCHAR(100),
  content_id UUID,
  reach_achieved INTEGER DEFAULT 0,
  engagement_achieved INTEGER DEFAULT 0,
  analytics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT boost_date_order CHECK (end_date >= start_date)
);

-- Create available_partnerships table (global partnership listings)
CREATE TABLE IF NOT EXISTS available_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  icon VARCHAR(10),
  description TEXT,
  commission_rate DECIMAL(5, 2) DEFAULT 5.0,
  min_commission DECIMAL(10, 2) DEFAULT 0,
  max_commission DECIMAL(10, 2),
  terms TEXT,
  support_contact VARCHAR(255),
  support_email VARCHAR(255),
  dashboard_url VARCHAR(500),
  is_featured BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_partnerships table (user's partnership status and earnings)
CREATE TABLE IF NOT EXISTS user_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partnership_id UUID NOT NULL REFERENCES available_partnerships(id),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'rejected', 'paused')),
  commission_rate DECIMAL(5, 2),
  total_earned DECIMAL(12, 2) DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  last_payout_date TIMESTAMP,
  approval_date TIMESTAMP,
  rejection_reason TEXT,
  custom_url VARCHAR(500),
  tracking_code VARCHAR(255),
  applied_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, partnership_id)
);

-- Create user_invitations table (track referrals/invitations)
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_email VARCHAR(255),
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invitation_code VARCHAR(100) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'converted', 'expired')),
  reward_amount DECIMAL(10, 2) DEFAULT 0,
  reward_currency VARCHAR(3) DEFAULT 'USD',
  conversion_date TIMESTAMP,
  expires_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_rewards_history table (transaction/earning history)
CREATE TABLE IF NOT EXISTS user_rewards_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(100) NOT NULL,
  source VARCHAR(100),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  related_boost_id UUID REFERENCES user_boosts(id),
  related_partnership_id UUID REFERENCES user_partnerships(id),
  related_invitation_id UUID REFERENCES user_invitations(id),
  balance_before DECIMAL(12, 2),
  balance_after DECIMAL(12, 2),
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create platform_leaderboard table (materialized leaderboard data)
CREATE TABLE IF NOT EXISTS platform_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leaderboard_type VARCHAR(50) NOT NULL,
  rank INTEGER,
  score DECIMAL(12, 2),
  display_name VARCHAR(255),
  avatar_url VARCHAR(500),
  period VARCHAR(50) DEFAULT 'all_time',
  refresh_date TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, leaderboard_type, period)
);

-- Create indexes for better query performance
CREATE INDEX idx_user_boosts_user_id ON user_boosts(user_id);
CREATE INDEX idx_user_boosts_status ON user_boosts(status);
CREATE INDEX idx_user_boosts_dates ON user_boosts(start_date, end_date);
CREATE INDEX idx_user_partnerships_user_id ON user_partnerships(user_id);
CREATE INDEX idx_user_partnerships_status ON user_partnerships(status);
CREATE INDEX idx_user_invitations_referrer ON user_invitations(referrer_user_id);
CREATE INDEX idx_user_invitations_status ON user_invitations(status);
CREATE INDEX idx_user_rewards_history_user_id ON user_rewards_history(user_id);
CREATE INDEX idx_user_rewards_history_created ON user_rewards_history(created_at);
CREATE INDEX idx_user_rewards_history_type ON user_rewards_history(transaction_type);
CREATE INDEX idx_platform_leaderboard_type ON platform_leaderboard(leaderboard_type, period);
CREATE INDEX idx_platform_leaderboard_user ON platform_leaderboard(user_id);

-- Insert default boost packages
INSERT INTO boost_packages (name, icon, price, duration_days, estimated_reach, is_popular, tier_level, features) VALUES
('Starter Boost', '⚡', 9.99, 7, '1-5K', FALSE, 1, '["Increase visibility", "7 days duration", "Basic analytics"]'),
('Pro Boost', '🚀', 24.99, 14, '5-20K', TRUE, 2, '["Priority ranking", "14 days duration", "Advanced analytics", "Custom targeting"]'),
('Elite Boost', '👑', 49.99, 30, '20-100K', FALSE, 3, '["Top ranking", "30 days duration", "Premium analytics", "Dedicated support", "Custom content placement"]')
ON CONFLICT DO NOTHING;

-- Insert default partnerships
INSERT INTO available_partnerships (name, category, icon, description, commission_rate, is_featured) VALUES
('Crypto Exchange', 'Finance', '💱', 'Earn commission on successful referrals', 8.0, TRUE),
('Premium Subscription', 'SaaS', '⭐', 'Promote premium features to earn recurring commissions', 15.0, TRUE),
('E-learning Platform', 'Education', '📚', 'Earn from course referrals', 10.0, FALSE),
('Gaming Studio', 'Gaming', '🎮', 'High commission for game referrals', 12.0, FALSE),
('Web Hosting', 'Technology', '🌐', 'High commission for web hosting referrals', 20.0, FALSE)
ON CONFLICT DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE boost_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boost_packages (public read)
CREATE POLICY "boost_packages_public_read" ON boost_packages
  FOR SELECT USING (true);

-- RLS Policies for user_boosts (users can only see their own)
CREATE POLICY "user_boosts_select" ON user_boosts
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "user_boosts_insert" ON user_boosts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_boosts_update" ON user_boosts
  FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for available_partnerships (public read)
CREATE POLICY "available_partnerships_public_read" ON available_partnerships
  FOR SELECT USING (status = 'active' OR auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for user_partnerships (users can only see their own)
CREATE POLICY "user_partnerships_select" ON user_partnerships
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "user_partnerships_insert" ON user_partnerships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_partnerships_update" ON user_partnerships
  FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for user_invitations
CREATE POLICY "user_invitations_select" ON user_invitations
  FOR SELECT USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "user_invitations_insert" ON user_invitations
  FOR INSERT WITH CHECK (auth.uid() = referrer_user_id);

CREATE POLICY "user_invitations_update" ON user_invitations
  FOR UPDATE USING (auth.uid() = referrer_user_id OR auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for user_rewards_history (users can only see their own)
CREATE POLICY "user_rewards_history_select" ON user_rewards_history
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "user_rewards_history_insert" ON user_rewards_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for platform_leaderboard (public read)
CREATE POLICY "platform_leaderboard_public_read" ON platform_leaderboard
  FOR SELECT USING (true);

-- Create helper functions for common operations

-- Function to get user boost stats
CREATE OR REPLACE FUNCTION get_user_boost_stats(p_user_id UUID)
RETURNS TABLE (
  active_boosts_count INTEGER,
  total_spent DECIMAL,
  total_reach BIGINT,
  total_engagement BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as active_boosts_count,
    COALESCE(SUM(price_paid), 0::DECIMAL) as total_spent,
    COALESCE(SUM(reach_achieved), 0::BIGINT) as total_reach,
    COALESCE(SUM(engagement_achieved), 0::BIGINT) as total_engagement
  FROM user_boosts
  WHERE user_id = p_user_id AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user partnership earnings
CREATE OR REPLACE FUNCTION get_user_partnership_stats(p_user_id UUID)
RETURNS TABLE (
  total_partnerships INTEGER,
  active_partnerships INTEGER,
  total_earned DECIMAL,
  total_referrals INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_partnerships,
    COUNT(*) FILTER (WHERE status = 'active')::INTEGER as active_partnerships,
    COALESCE(SUM(total_earned), 0::DECIMAL) as total_earned,
    COALESCE(SUM(total_referrals), 0::INTEGER) as total_referrals
  FROM user_partnerships
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get monthly earnings history
CREATE OR REPLACE FUNCTION get_monthly_earnings(p_user_id UUID, p_months INTEGER DEFAULT 12)
RETURNS TABLE (
  month TEXT,
  total_amount DECIMAL,
  transaction_count INTEGER,
  sources TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(created_at, 'YYYY-MM') as month,
    SUM(amount)::DECIMAL as total_amount,
    COUNT(*)::INTEGER as transaction_count,
    ARRAY_AGG(DISTINCT transaction_type) FILTER (WHERE transaction_type IS NOT NULL) as sources
  FROM user_rewards_history
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '1 month' * p_months
  GROUP BY TO_CHAR(created_at, 'YYYY-MM')
  ORDER BY month DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
