-- Migration: Safe fix for profiles registration
-- This migration avoids dropping primary keys with dependencies
-- Focus: Fix the trigger and RLS policies instead

-- Step 1: Add email column if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Safely handle null usernames and emails in existing data
UPDATE public.profiles 
SET username = COALESCE(username, 'user_' || SUBSTR(CAST(user_id AS TEXT), 1, 8))
WHERE username IS NULL;

UPDATE public.profiles 
SET email = COALESCE(email, 'unknown_' || SUBSTR(CAST(user_id AS TEXT), 1, 8) || '@unknown.local')
WHERE email IS NULL;

-- Step 3: Handle duplicate usernames by appending unique suffix
WITH duplicate_usernames AS (
  SELECT user_id, username, ROW_NUMBER() OVER (PARTITION BY username ORDER BY created_at DESC) as rn
  FROM public.profiles
  WHERE username IS NOT NULL
)
UPDATE public.profiles p
SET username = p.username || '_' || SUBSTR(CAST(p.user_id AS TEXT), 1, 6)
FROM duplicate_usernames dn
WHERE p.user_id = dn.user_id AND dn.rn > 1;

-- Step 4: Add NOT NULL constraints
ALTER TABLE public.profiles 
  ALTER COLUMN username SET NOT NULL;

ALTER TABLE public.profiles 
  ALTER COLUMN email SET NOT NULL;

-- Step 5: Ensure unique constraint on username
-- Drop if it exists with a different name
DO $$ 
BEGIN
  -- Try to drop with various possible names
  BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT "profiles_username_unique";
  EXCEPTION WHEN UNDEFINED_OBJECT THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_username_unique;
  EXCEPTION WHEN UNDEFINED_OBJECT THEN NULL;
  END;
  
  -- Now add fresh unique constraint
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE(username);
EXCEPTION WHEN DUPLICATE_OBJECT THEN
  -- Constraint already exists, that's fine
  NULL;
END $$;

-- Step 6: Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_full_name TEXT;
  v_avatar_url TEXT;
  v_counter INT := 0;
  v_final_username TEXT;
BEGIN
  -- Derive username: prefer metadata, fallback to email local part
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Clean up username to be valid
  v_username := LOWER(COALESCE(v_username, 'user_' || SUBSTR(CAST(NEW.id AS TEXT), 1, 8)));
  v_username := REGEXP_REPLACE(v_username, '[^a-z0-9_]', '_', 'g');
  v_username := REGEXP_REPLACE(v_username, '_+', '_', 'g');
  v_username := TRIM(BOTH '_' FROM v_username);
  
  -- Fallback if username is empty
  IF v_username = '' OR v_username IS NULL THEN
    v_username := 'user_' || SUBSTR(CAST(NEW.id AS TEXT), 1, 8);
  END IF;
  
  -- Handle username uniqueness - append counter if needed
  v_final_username := v_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_final_username AND user_id != NEW.id) LOOP
    v_counter := v_counter + 1;
    v_final_username := v_username || '_' || v_counter;
    IF v_counter > 100 THEN
      -- Safety check to avoid infinite loop
      v_final_username := v_username || '_' || SUBSTR(CAST(NEW.id AS TEXT), 1, 8);
      EXIT;
    END IF;
  END LOOP;
  
  -- Derive full name
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Set avatar URL
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id
  );
  
  -- Insert or update profile
  INSERT INTO public.profiles (
    user_id,
    email,
    username,
    full_name,
    avatar_url,
    is_verified,
    role,
    points,
    level,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_final_username,
    v_full_name,
    v_avatar_url,
    false,
    'user',
    0,
    'bronze',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    email = COALESCE(profiles.email, EXCLUDED.email),
    username = COALESCE(profiles.username, EXCLUDED.username),
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the signup
  RAISE WARNING 'Error in handle_new_user: % %', SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$$;

-- Step 7: Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Fix RLS policies - start fresh
-- Drop all existing policies
DO $$ 
DECLARE
  p RECORD;
BEGIN
  FOR p IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || p.policyname || '" ON public.profiles';
  END LOOP;
END $$;

-- SELECT: Everyone can view
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT
  USING (true);

-- INSERT: Users can insert their own, service_role can insert any
CREATE POLICY "profiles_insert_own_or_service" ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR auth.role() = 'service_role'
  );

-- UPDATE: Users can update their own, service_role can update any
CREATE POLICY "profiles_update_own_or_service" ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR auth.role() = 'service_role'
  );

-- DELETE: Users can delete their own, service_role can delete any
CREATE POLICY "profiles_delete_own_or_service" ON public.profiles
  FOR DELETE
  USING (
    auth.uid() = user_id 
    OR auth.role() = 'service_role'
  );

-- Step 9: Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 10: Grant permissions to service_role (used by Edge Functions and triggers)
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Step 11: Refresh PostgREST schema
NOTIFY pgrst, 'reload schema';

-- Step 12: Success message
SELECT 'Profile table fixed and ready for registration' as status;
