-- Solution: Disable RLS on admin_users table
-- The recursive RLS policy causes infinite recursion errors
-- Instead, we'll handle authorization at the application level

-- Step 1: Disable RLS on admin_users (allows authenticated users to read it)
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all policies if any still exist
DROP POLICY IF EXISTS "Users can read their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_read_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_read_own_record" ON public.admin_users;
DROP POLICY IF EXISTS "allow_self_read" ON public.admin_users;

-- Note: With RLS disabled, the standard Supabase grants will allow 
-- authenticated users to read the table. The application code will 
-- verify admin status by checking the admin_users record.
