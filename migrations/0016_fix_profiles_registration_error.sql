-- Migration: Fix profiles registration error by ensuring proper schema and triggers
-- Issue: Registration fails with "Database error saving new user" because profiles table lacks required columns or constraints
-- Solution: Add missing columns, fix constraints, and set up proper trigger

-- Step 1: Ensure profiles table has email column
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

-- Step 2: Add NOT NULL and UNIQUE constraints to username and email
-- First, populate missing usernames from email if they exist
UPDATE public.profiles 
SET username = COALESCE(username, SPLIT_PART(email, '@', 1))
WHERE username IS NULL AND email IS NOT NULL;

-- Drop old unique constraint if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS "profiles_username_unique";

-- Add username NOT NULL constraint only if there are no null values
ALTER TABLE public.profiles 
ALTER COLUMN username SET NOT NULL;

-- Add back unique constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_unique UNIQUE(username);

-- Add email NOT NULL constraint
ALTER TABLE public.profiles 
ALTER COLUMN email SET NOT NULL;

-- Step 3: Set user_id as primary key (replacing the id column if needed)
-- Check if user_id is already the primary key
DO $$ 
BEGIN
  -- Drop the old id-based primary key if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND constraint_type = 'PRIMARY KEY'
    AND constraint_name != 'profiles_pkey'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
  END IF;
  
  -- Add user_id as primary key if not already
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE public.profiles ADD PRIMARY KEY (user_id);
  END IF;
END $$;

-- Step 4: Create or replace the handle_new_user trigger function
-- This function will be called automatically when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,
    username,
    full_name,
    avatar_url,
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
$$;

-- Step 5: Drop and recreate the trigger to ensure it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Fix RLS policies for profiles table
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;

-- Create new RLS policies
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Grant appropriate permissions
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Step 8: Backfill existing auth.users into profiles if they don't exist
INSERT INTO public.profiles (
  user_id,
  email,
  username,
  full_name,
  avatar_url,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'username',
    SPLIT_PART(au.email, '@', 1)
  ),
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    SPLIT_PART(au.email, '@', 1)
  ),
  COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || au.id
  ),
  COALESCE(p.created_at, au.created_at),
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) 
DO UPDATE SET
  email = EXCLUDED.email,
  username = COALESCE(profiles.username, EXCLUDED.username),
  full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
  avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
  updated_at = NOW();

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
