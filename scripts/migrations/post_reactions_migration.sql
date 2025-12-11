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
