-- Migration: Remove broken auto_join_pioneer_v1 function and its trigger
-- Issue: This function tries to query group_chat_threads which doesn't exist
-- It's being called during signup and causing "Database error saving new user"

-- Step 1: Drop the trigger that calls auto_join_pioneer_v1
DROP TRIGGER IF EXISTS auto_join_pioneer_v1_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS auto_join_pioneer ON auth.users CASCADE;

-- Step 2: Drop the broken function
DROP FUNCTION IF EXISTS public.auto_join_pioneer_v1() CASCADE;

-- Done
SELECT 'Broken auto_join_pioneer function removed' as status;
