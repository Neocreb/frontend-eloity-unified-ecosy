-- Migration: Complete reset of profiles trigger
-- Drops everything related to the old broken trigger and starts fresh

-- Step 1: Drop the broken trigger and function completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Ensure profiles table has required columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Step 3: Set defaults for null values to avoid constraint errors
UPDATE public.profiles SET username = 'user_' || SUBSTR(CAST(user_id AS TEXT), 1, 8) WHERE username IS NULL;
UPDATE public.profiles SET email = 'user_' || SUBSTR(CAST(user_id AS TEXT), 1, 8) || '@local' WHERE email IS NULL;

-- Step 4: Add NOT NULL constraints
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;

-- Step 5: Ensure unique constraint on username exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' AND table_name = 'profiles' 
    AND constraint_type = 'UNIQUE' AND constraint_name LIKE '%username%'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE(username);
  END IF;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END $$;

-- Step 6: Ensure RLS is enabled on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Grant basic permissions to service_role
GRANT ALL ON public.profiles TO service_role;

-- Step 8: Create a completely fresh, simple trigger function
-- This function has NO external table references
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_full_name TEXT;
  v_avatar_url TEXT;
  v_final_username TEXT;
  v_counter INT := 0;
BEGIN
  -- Get username from metadata or email
  v_username := NEW.raw_user_meta_data->>'username';
  IF v_username IS NULL OR v_username = '' THEN
    v_username := SPLIT_PART(NEW.email, '@', 1);
  END IF;
  
  -- Sanitize username
  v_username := LOWER(v_username);
  v_username := REGEXP_REPLACE(v_username, '[^a-z0-9_]', '_', 'g');
  v_username := REGEXP_REPLACE(v_username, '_+', '_', 'g');
  v_username := TRIM(BOTH '_' FROM v_username);
  
  IF v_username = '' OR v_username IS NULL THEN
    v_username := 'user_' || SUBSTR(CAST(NEW.id AS TEXT), 1, 8);
  END IF;
  
  -- Make username unique
  v_final_username := v_username;
  WHILE EXISTS(SELECT 1 FROM public.profiles WHERE username = v_final_username AND user_id != NEW.id) LOOP
    v_counter := v_counter + 1;
    v_final_username := v_username || '_' || v_counter;
    IF v_counter > 100 THEN
      v_final_username := SUBSTR(CAST(NEW.id AS TEXT), 1, 8);
      EXIT;
    END IF;
  END LOOP;
  
  -- Get full name
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  IF v_full_name IS NULL THEN
    v_full_name := NEW.raw_user_meta_data->>'name';
  END IF;
  IF v_full_name IS NULL THEN
    v_full_name := v_final_username;
  END IF;
  
  -- Get avatar
  v_avatar_url := NEW.raw_user_meta_data->>'avatar_url';
  IF v_avatar_url IS NULL THEN
    v_avatar_url := 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id;
  END IF;
  
  -- Upsert into profiles - this is the ONLY table we touch
  INSERT INTO public.profiles (user_id, email, username, full_name, avatar_url, is_verified, role, points, level, created_at, updated_at)
  VALUES (NEW.id, NEW.email, v_final_username, v_full_name, v_avatar_url, false, 'user', 0, 'bronze', NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Step 9: Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Done
SELECT 'Trigger reset and profiles table fixed successfully' as status;
