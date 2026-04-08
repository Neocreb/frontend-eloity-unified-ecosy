-- Add columns for post pinning feature to support featured posts on profiles
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pinned_order INTEGER,
ADD COLUMN IF NOT EXISTS pinned_date TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on pinned posts
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON public.posts(is_pinned, user_id);
CREATE INDEX IF NOT EXISTS idx_posts_pinned_order ON public.posts(user_id, pinned_order) WHERE is_pinned = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN public.posts.is_pinned IS 'Whether this post is pinned/featured on the user profile';
COMMENT ON COLUMN public.posts.pinned_order IS 'Display order for pinned posts (0-2, max 3 pinned posts per profile)';
COMMENT ON COLUMN public.posts.pinned_date IS 'Timestamp when the post was pinned';
