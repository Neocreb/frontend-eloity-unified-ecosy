-- Migration: Minimal fix for profiles registration
-- Focus ONLY on what's needed: email column, NOT NULL constraints, and trigger

-- Step 1: Add email column if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Safe handle null values
UPDATE public.profiles 
SET username = COALESCE(username, 'user_' || SUBSTR(CAST(user_id AS TEXT), 1, 8))
WHERE username IS NULL;

UPDATE public.profiles 
SET email = COALESCE(email, 'noemail_' || SUBSTR(CAST(user_id AS TEXT), 1, 8) || '@local')
WHERE email IS NULL;

-- Step 3: Add NOT NULL constraints
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;

-- Step 4: Ensure username unique constraint exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%username%'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE(username);
  END IF;
EXCEPTION WHEN DUPLICATE_OBJECT THEN
  NULL;
END $$;

-- Step 5: Create the trigger function that handles new user signup
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
  -- Derive username from metadata or email
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Sanitize username
  v_username := LOWER(v_username);
  v_username := REGEXP_REPLACE(v_username, '[^a-z0-9_]', '_', 'g');
  v_username := REGEXP_REPLACE(v_username, '_+', '_', 'g');
  v_username := TRIM(BOTH '_' FROM v_username);
  
  -- Fallback if empty
  IF v_username = '' OR v_username IS NULL THEN
    v_username := 'user_' || SUBSTR(CAST(NEW.id AS TEXT), 1, 8);
  END IF;
  
  -- Check for uniqueness and handle duplicates
  v_final_username := v_username;
  WHILE EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE username = v_final_username AND user_id != NEW.id
  ) LOOP
    v_counter := v_counter + 1;
    v_final_username := v_username || '_' || v_counter;
    IF v_counter > 50 THEN
      v_final_username := SUBSTR(CAST(NEW.id AS TEXT), 1, 8) || '_' || v_counter;
      EXIT;
    END IF;
  END LOOP;
  
  -- Get full name
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    v_username
  );
  
  -- Get avatar
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id
  );
  
  -- Upsert profile
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
  ) VALUES (
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
  ON CONFLICT (user_id) DO UPDATE SET
    email = COALESCE(profiles.email, EXCLUDED.email),
    username = COALESCE(profiles.username, EXCLUDED.username),
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error: % %', SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$$;

-- Step 6: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 8: Grant permissions to service_role (for trigger execution)
GRANT ALL ON public.profiles TO service_role;

-- Done
SELECT 'Profile registration fix applied successfully' as status;
