-- ============================================================================
-- MIGRATION: Create post_reactions and user_saved_posts tables
-- ============================================================================
-- This migration creates two essential tables for post interactions:
-- 1. post_reactions: Stores user reactions (likes, love, haha, etc.) on posts
-- 2. user_saved_posts: Stores bookmarked/saved posts for later viewing
-- 
-- INSTRUCTIONS FOR RUNNING IN SUPABASE:
-- 1. Go to your Supabase project dashboard
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Paste the entire contents of this file
-- 5. Click "Run"
-- ============================================================================

-- Create post_reactions table for storing user reactions on posts
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type varchar(50) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON public.post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_created_at ON public.post_reactions(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all reactions
CREATE POLICY IF NOT EXISTS "post_reactions_select" ON public.post_reactions
  FOR SELECT USING (true);

-- Policy: Users can insert their own reactions
CREATE POLICY IF NOT EXISTS "post_reactions_insert" ON public.post_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reactions
CREATE POLICY IF NOT EXISTS "post_reactions_update" ON public.post_reactions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own reactions
CREATE POLICY IF NOT EXISTS "post_reactions_delete" ON public.post_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================

-- Create user_saved_posts table for storing bookmarked/saved posts
CREATE TABLE IF NOT EXISTS public.user_saved_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_saved_posts_post_id ON public.user_saved_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_posts_user_id ON public.user_saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_posts_created_at ON public.user_saved_posts(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.user_saved_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own saved posts
CREATE POLICY IF NOT EXISTS "user_saved_posts_select" ON public.user_saved_posts
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own saved posts
CREATE POLICY IF NOT EXISTS "user_saved_posts_insert" ON public.user_saved_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own saved posts
CREATE POLICY IF NOT EXISTS "user_saved_posts_update" ON public.user_saved_posts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own saved posts
CREATE POLICY IF NOT EXISTS "user_saved_posts_delete" ON public.user_saved_posts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION QUERIES (Run these separately to verify tables were created):
-- ============================================================================
-- SELECT * FROM public.post_reactions LIMIT 10;
-- SELECT * FROM public.user_saved_posts LIMIT 10;
-- ============================================================================
