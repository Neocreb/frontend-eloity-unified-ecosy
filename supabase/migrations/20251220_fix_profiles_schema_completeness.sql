-- Fix profiles table schema - ensure all required columns exist
-- This migration adds missing columns that the backend expects

-- 1. Add missing columns to profiles table if they don't exist
DO $$ 
BEGIN
  -- Add reputation column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'reputation'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN reputation INTEGER DEFAULT 0;
  END IF;

  -- Add followers_count column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'followers_count'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN followers_count INTEGER DEFAULT 0;
  END IF;

  -- Add following_count column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'following_count'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN following_count INTEGER DEFAULT 0;
  END IF;

  -- Add posts_count column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'posts_count'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN posts_count INTEGER DEFAULT 0;
  END IF;

  -- Add profile_views column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'profile_views'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN profile_views INTEGER DEFAULT 0;
  END IF;

  -- Add is_online column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_online'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_online BOOLEAN DEFAULT false;
  END IF;

  -- Add last_active column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'last_active'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_active TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add profile_visibility column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'profile_visibility'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN profile_visibility TEXT DEFAULT 'public';
  END IF;

  -- Add location column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'location'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN location TEXT;
  END IF;

  -- Add website column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'website'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN website TEXT;
  END IF;

  -- Add points column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'points'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN points INTEGER DEFAULT 0;
  END IF;

  -- Add level column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'level'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN level TEXT DEFAULT 'bronze';
  END IF;

  -- Add role column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;

  -- Add preferred_currency column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'preferred_currency'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN preferred_currency TEXT DEFAULT 'USD';
  END IF;

  -- Add timezone column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'timezone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN timezone TEXT;
  END IF;

  -- Add show_email column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'show_email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN show_email BOOLEAN DEFAULT false;
  END IF;

  -- Add show_phone column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'show_phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN show_phone BOOLEAN DEFAULT false;
  END IF;

  -- Add allow_direct_messages column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'allow_direct_messages'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN allow_direct_messages BOOLEAN DEFAULT true;
  END IF;

  -- Add allow_notifications column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'allow_notifications'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN allow_notifications BOOLEAN DEFAULT true;
  END IF;

  -- Add banner_url column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'banner_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN banner_url TEXT;
  END IF;

  -- Add phone column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
  END IF;

  -- Add date_of_birth column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN date_of_birth TEXT;
  END IF;

  -- Add gender column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'gender'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN gender TEXT;
  END IF;

  -- Add tier_level column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'tier_level'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN tier_level TEXT DEFAULT 'tier_1';
  END IF;

  -- Add font_size column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'font_size'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN font_size TEXT DEFAULT 'medium';
  END IF;

  -- Add ui_language column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'ui_language'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN ui_language TEXT DEFAULT 'en';
  END IF;

  -- Add auto_play_videos column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'auto_play_videos'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN auto_play_videos BOOLEAN DEFAULT true;
  END IF;

  -- Add reduced_motion column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'reduced_motion'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN reduced_motion BOOLEAN DEFAULT false;
  END IF;

  -- Add high_contrast column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'high_contrast'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN high_contrast BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 2. Ensure the profiles table has the email column and it's not nullable
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- 3. Fix the user provisioning trigger to properly populate profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table with all necessary fields
  INSERT INTO public.profiles (
    user_id,
    email,
    username,
    full_name,
    avatar_url,
    bio,
    is_verified,
    points,
    level,
    role,
    reputation,
    followers_count,
    following_count,
    posts_count,
    profile_views,
    is_online,
    profile_visibility,
    allow_direct_messages,
    allow_notifications,
    preferred_currency,
    tier_level,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id
    ),
    NULL,
    false,
    0,
    'bronze',
    'user',
    0,
    0,
    0,
    0,
    0,
    false,
    'public',
    true,
    true,
    'USDT',
    'tier_1',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(profiles.username, EXCLUDED.username),
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Backfill existing users who don't have profiles
-- IMPORTANT: Only backfill for users that exist in BOTH auth.users AND public.users
-- This prevents foreign key constraint violations
INSERT INTO public.profiles (
  user_id,
  email,
  username,
  full_name,
  avatar_url,
  is_verified,
  points,
  level,
  role,
  reputation,
  followers_count,
  following_count,
  posts_count,
  profile_views,
  is_online,
  profile_visibility,
  allow_direct_messages,
  allow_notifications,
  preferred_currency,
  tier_level,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.email,
  COALESCE(
    p.username,
    SPLIT_PART(u.email, '@', 1)
  ),
  COALESCE(
    p.full_name,
    u.full_name,
    SPLIT_PART(u.email, '@', 1)
  ),
  COALESCE(
    p.avatar_url,
    u.avatar_url,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || u.id
  ),
  COALESCE(p.is_verified, false),
  COALESCE(p.points, 0),
  COALESCE(p.level, 'bronze'),
  COALESCE(p.role, 'user'),
  COALESCE(p.reputation, 0),
  COALESCE(p.followers_count, 0),
  COALESCE(p.following_count, 0),
  COALESCE(p.posts_count, 0),
  COALESCE(p.profile_views, 0),
  false,
  'public',
  true,
  true,
  'USDT',
  'tier_1',
  COALESCE(p.created_at, u.created_at),
  NOW()
FROM public.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id)
DO NOTHING;

-- 5. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_reputation ON public.profiles (reputation DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_followers_count ON public.profiles (followers_count DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles (is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_visibility ON public.profiles (profile_visibility);

-- 6. Refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';
