-- Migration: Add About tab fields to profiles table for Phase 5
-- Adds support for: skills, social links, professional info, and social URLs

-- Add skills array column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills text[] DEFAULT ARRAY[]::text[];

-- Add social_links JSONB column (stores structured social link data)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links jsonb;

-- Add professional_info JSONB column (stores title, company, experience, languages, certifications)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS professional_info jsonb;

-- Add individual social URL columns for easy querying
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_url text;

-- Create indexes for better query performance on social URLs
CREATE INDEX IF NOT EXISTS idx_profiles_linkedin_url ON profiles(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_profiles_github_url ON profiles(github_url);
CREATE INDEX IF NOT EXISTS idx_profiles_twitter_url ON profiles(twitter_url);
CREATE INDEX IF NOT EXISTS idx_profiles_portfolio_url ON profiles(portfolio_url);
