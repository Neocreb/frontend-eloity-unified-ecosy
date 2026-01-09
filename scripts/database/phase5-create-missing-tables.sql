-- Phase 5 Database Migration Script
-- Creates missing tables for Phase 5: Unified Integration & Advanced Features
-- Tables: freelance_notifications, user_engagement, freelance_disputes, job_matching_scores, freelance_analytics, deadline_reminders

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Create freelance_notifications table
CREATE TABLE IF NOT EXISTS freelance_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES freelance_projects(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES freelance_proposals(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES freelance_contracts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  actor_id UUID REFERENCES auth.users(id),
  actor_name TEXT,
  actor_avatar TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create user_engagement table
CREATE TABLE IF NOT EXISTS user_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  points_earned INTEGER DEFAULT 0,
  multiplier NUMERIC(3, 2) DEFAULT 1.0,
  total_points INTEGER DEFAULT 0,
  description TEXT,
  metadata JSONB,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create freelance_disputes table
CREATE TABLE IF NOT EXISTS freelance_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES freelance_contracts(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES freelance_projects(id) ON DELETE CASCADE,
  filed_by_id UUID NOT NULL REFERENCES auth.users(id),
  filed_against_id UUID NOT NULL REFERENCES auth.users(id),
  arbiter_id UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_urls JSONB,
  initial_offer NUMERIC(12, 2),
  counter_offer NUMERIC(12, 2),
  status TEXT DEFAULT 'open',
  resolution TEXT,
  final_amount NUMERIC(12, 2),
  appeal_status TEXT,
  appeal_reason TEXT,
  resolution_date TIMESTAMP,
  appeal_deadline TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create job_matching_scores table
CREATE TABLE IF NOT EXISTS job_matching_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES freelance_projects(id) ON DELETE CASCADE,
  skills_match_percentage NUMERIC(5, 2) DEFAULT 0,
  experience_match_percentage NUMERIC(5, 2) DEFAULT 0,
  budget_match_percentage NUMERIC(5, 2) DEFAULT 0,
  availability_match_percentage NUMERIC(5, 2) DEFAULT 0,
  past_success_percentage NUMERIC(5, 2) DEFAULT 0,
  overall_match_score NUMERIC(5, 2) DEFAULT 0,
  score_breakdown JSONB,
  recommendation_reason TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create freelance_analytics table
CREATE TABLE IF NOT EXISTS freelance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMP NOT NULL,
  period TEXT NOT NULL,
  total_earnings NUMERIC(12, 2) DEFAULT 0,
  projects_posted INTEGER DEFAULT 0,
  projects_completed INTEGER DEFAULT 0,
  projects_in_progress INTEGER DEFAULT 0,
  proposals_sent INTEGER DEFAULT 0,
  proposals_accepted INTEGER DEFAULT 0,
  acceptance_rate NUMERIC(5, 2) DEFAULT 0,
  average_project_value NUMERIC(10, 2) DEFAULT 0,
  average_rating NUMERIC(3, 2) DEFAULT 0,
  client_reviews_count INTEGER DEFAULT 0,
  repeat_client_percentage NUMERIC(5, 2) DEFAULT 0,
  completion_rate NUMERIC(5, 2) DEFAULT 0,
  on_time_percentage NUMERIC(5, 2) DEFAULT 0,
  budget_adherence_percentage NUMERIC(5, 2) DEFAULT 0,
  projected_monthly_earnings NUMERIC(12, 2) DEFAULT 0,
  trends_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create deadline_reminders table
CREATE TABLE IF NOT EXISTS deadline_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES freelance_contracts(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES freelance_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  deadline_date TIMESTAMP NOT NULL,
  reminder_dates JSONB NOT NULL,
  reminders_sent JSONB,
  notification_preferences JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_freelance_notifications_user_id ON freelance_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_freelance_notifications_is_read ON freelance_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_freelance_notifications_created_at ON freelance_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_engagement_user_id ON user_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_activity_type ON user_engagement(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_engagement_created_at ON user_engagement(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_freelance_disputes_project_id ON freelance_disputes(project_id);
CREATE INDEX IF NOT EXISTS idx_freelance_disputes_status ON freelance_disputes(status);
CREATE INDEX IF NOT EXISTS idx_freelance_disputes_filed_by_id ON freelance_disputes(filed_by_id);

CREATE INDEX IF NOT EXISTS idx_job_matching_scores_project_id ON job_matching_scores(project_id);
CREATE INDEX IF NOT EXISTS idx_job_matching_scores_overall_match_score ON job_matching_scores(overall_match_score DESC);

CREATE INDEX IF NOT EXISTS idx_freelance_analytics_user_id ON freelance_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_freelance_analytics_date ON freelance_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_freelance_analytics_period ON freelance_analytics(period);

CREATE INDEX IF NOT EXISTS idx_deadline_reminders_deadline_date ON deadline_reminders(deadline_date);
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_is_active ON deadline_reminders(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE freelance_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelance_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matching_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadline_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for freelance_notifications
CREATE POLICY "Users can view their own notifications"
  ON freelance_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (read status)"
  ON freelance_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS Policies for user_engagement
CREATE POLICY "Users can view their own engagement"
  ON user_engagement FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS Policies for freelance_disputes
CREATE POLICY "Dispute participants can view disputes"
  ON freelance_disputes FOR SELECT
  USING (auth.uid() = filed_by_id OR auth.uid() = filed_against_id OR auth.uid() = arbiter_id);

-- Create RLS Policies for job_matching_scores
CREATE POLICY "Freelancers can view their own matching scores"
  ON job_matching_scores FOR SELECT
  USING (auth.uid() = freelancer_id);

-- Create RLS Policies for freelance_analytics
CREATE POLICY "Users can view their own analytics"
  ON freelance_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS Policies for deadline_reminders
CREATE POLICY "Users can view their own deadline reminders"
  ON deadline_reminders FOR SELECT
  USING (auth.uid() = user_id);

-- Create trigger functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_freelance_notifications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_freelance_notifications_timestamp
BEFORE UPDATE ON freelance_notifications
FOR EACH ROW
EXECUTE FUNCTION update_freelance_notifications_timestamp();

CREATE OR REPLACE FUNCTION update_user_engagement_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_engagement_timestamp
BEFORE UPDATE ON user_engagement
FOR EACH ROW
EXECUTE FUNCTION update_user_engagement_timestamp();

-- Verify table creation
SELECT 
  tablename 
FROM pg_tables 
WHERE tablename IN (
  'freelance_notifications',
  'user_engagement',
  'freelance_disputes',
  'job_matching_scores',
  'freelance_analytics',
  'deadline_reminders'
)
ORDER BY tablename;
