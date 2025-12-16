-- Migration: Disable trigger temporarily to test signup
-- This will help us determine if the trigger is the problem

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

SELECT 'Trigger disabled - signup should now work without profile auto-creation' as status;
