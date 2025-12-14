-- Fix infinite recursion in admin_users RLS policies
-- The previous recursive policy causes: "infinite recursion detected in policy for relation "admin_users""
-- Solution: Use only a simple, non-recursive policy

-- Drop all problematic policies
DROP POLICY IF EXISTS "Users can read their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin policy" ON public.admin_users;

-- Create ONLY the simple policy (non-recursive)
-- This allows each authenticated user to read only their own admin record
CREATE POLICY "Users can read their own admin record" ON public.admin_users
    FOR SELECT 
    USING (user_id = auth.uid());
