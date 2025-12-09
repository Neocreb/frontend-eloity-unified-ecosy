-- Migration: Add original_post_id and post_type columns to posts table for repost and quote support
-- This migration enables the repost and quote functionality on the feed

-- Add original_post_id column to track which post this is a repost/quote of
ALTER TABLE IF EXISTS public.posts ADD COLUMN IF NOT EXISTS original_post_id UUID;

-- Add post_type column to distinguish between regular posts, reposts, and quotes
-- Values: 'post', 'repost', 'quote'
ALTER TABLE IF EXISTS public.posts ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'post';

-- Add is_boosted column if it doesn't exist (used by feedService)
ALTER TABLE IF EXISTS public.posts ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT false;

-- Add foreign key constraint for original_post_id to reference posts table (self-referencing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_original_post_id_fkey' 
        AND table_name = 'posts'
    ) THEN
        ALTER TABLE public.posts
        ADD CONSTRAINT posts_original_post_id_fkey
        FOREIGN KEY (original_post_id) 
        REFERENCES public.posts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_original_post_id ON public.posts(original_post_id);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON public.posts(post_type);

-- Add check constraint for valid post types
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_post_type_check' 
        AND table_name = 'posts'
    ) THEN
        ALTER TABLE public.posts
        ADD CONSTRAINT posts_post_type_check
        CHECK (post_type IN ('post', 'repost', 'quote'));
    END IF;
END $$;

-- Notify PostgREST to reload the schema
NOTIFY pgrst, 'reload schema';
