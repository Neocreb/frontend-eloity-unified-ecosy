-- Fix RLS policies for profiles table to allow service role inserts
-- This fixes the registration error: "Database error saving new user"

-- Drop the restrictive insert policy that blocks service role
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- Create new INSERT policy that allows both users and service role
-- Users can insert their own profiles, service role can insert any profile
CREATE POLICY "profiles_insert_own_or_service_role" ON profiles
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Also update users table if it has similar RLS policies
-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;

-- Create new INSERT policy that allows both users and service role
CREATE POLICY "users_insert_own_or_service_role" ON public.users
  FOR INSERT
  WITH CHECK (
    id = auth.uid()
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Ensure INSERT permission is granted to service_role on both tables
GRANT INSERT ON profiles TO service_role;
GRANT INSERT ON public.users TO service_role;
