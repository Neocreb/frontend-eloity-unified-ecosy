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
