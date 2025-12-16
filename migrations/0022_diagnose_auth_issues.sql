-- Diagnostic: Check all triggers and functions that might affect auth.users

-- List all triggers on auth.users table
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';

-- List all functions in public schema that might be called by triggers
SELECT routine_name, routine_type, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Check if there are any webhooks or functions enabled
SELECT * FROM pg_extension WHERE extname LIKE '%webhook%' OR extname LIKE '%http%';

-- Check RLS policies on auth.users (if any)
SELECT policyname, tablename, qual, with_check
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'auth';
