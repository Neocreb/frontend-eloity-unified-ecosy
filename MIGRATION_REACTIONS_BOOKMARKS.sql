-- ============================================================================
-- MIGRATION: Create post_reactions and user_saved_posts tables
-- ============================================================================
-- This migration creates two essential tables for post interactions:
-- 1. post_reactions: Stores user reactions (likes, love, haha, etc.) on posts
-- 2. user_saved_posts: Stores bookmarked/saved posts for later viewing
-- 
-- INSTRUCTIONS FOR RUNNING IN SUPABASE:
-- 1. Go to your Supabase project dashboard (https://app.supabase.com)
-- 2. Navigate to your project
-- 3. Click on "SQL Editor" in the left sidebar
-- 4. Click "New Query"
-- 5. Copy the entire contents of this file
-- 6. Paste into the SQL Editor
-- 7. Click "Run" button
-- 8. Wait for the migration to complete (you should see "Success" message)
-- 9. Verify the tables were created by running the verification queries below
--
-- ============================================================================

-- ============================================================================
-- 1. CREATE POST_REACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type varchar(50) NOT NULL DEFAULT 'like',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id) -- Only one reaction per user per post
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON public.post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_created_at ON public.post_reactions(created_at);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_user ON public.post_reactions(post_id, user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "post_reactions_select" ON public.post_reactions;
DROP POLICY IF EXISTS "post_reactions_insert" ON public.post_reactions;
DROP POLICY IF EXISTS "post_reactions_update" ON public.post_reactions;
DROP POLICY IF EXISTS "post_reactions_delete" ON public.post_reactions;

-- Policy: Users can view all reactions (for counting likes, etc.)
CREATE POLICY "post_reactions_select" ON public.post_reactions
  FOR SELECT USING (true);

-- Policy: Users can insert their own reactions
CREATE POLICY "post_reactions_insert" ON public.post_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reactions
CREATE POLICY "post_reactions_update" ON public.post_reactions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own reactions
CREATE POLICY "post_reactions_delete" ON public.post_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 2. CREATE USER_SAVED_POSTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_saved_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id) -- Only one save per user per post
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_saved_posts_post_id ON public.user_saved_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_posts_user_id ON public.user_saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_posts_created_at ON public.user_saved_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_user_saved_posts_user_post ON public.user_saved_posts(user_id, post_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.user_saved_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "user_saved_posts_select" ON public.user_saved_posts;
DROP POLICY IF EXISTS "user_saved_posts_insert" ON public.user_saved_posts;
DROP POLICY IF EXISTS "user_saved_posts_update" ON public.user_saved_posts;
DROP POLICY IF EXISTS "user_saved_posts_delete" ON public.user_saved_posts;

-- Policy: Users can only view their own saved posts
CREATE POLICY "user_saved_posts_select" ON public.user_saved_posts
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own saved posts
CREATE POLICY "user_saved_posts_insert" ON public.user_saved_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own saved posts
CREATE POLICY "user_saved_posts_update" ON public.user_saved_posts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own saved posts
CREATE POLICY "user_saved_posts_delete" ON public.user_saved_posts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION QUERIES - Run these to verify the migration was successful
-- ============================================================================
-- Run each query below separately to verify:
--
-- 1. Check if post_reactions table exists:
--    SELECT * FROM information_schema.tables WHERE table_name = 'post_reactions';
--
-- 2. Check if user_saved_posts table exists:
--    SELECT * FROM information_schema.tables WHERE table_name = 'user_saved_posts';
--
-- 3. Check post_reactions data (should be empty initially):
--    SELECT COUNT(*) as total_reactions FROM public.post_reactions;
--
-- 4. Check user_saved_posts data (should be empty initially):
--    SELECT COUNT(*) as total_saved_posts FROM public.user_saved_posts;
--
-- ============================================================================
