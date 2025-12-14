-- Fix missing RLS policies for admin_users table
-- This allows authenticated users to read their own admin record

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;

-- Policy 1: Allow authenticated users to read their own admin_users record
-- This is needed for the login flow to check if the authenticated user is an admin
CREATE POLICY "Users can read their own admin record" ON public.admin_users
    FOR SELECT 
    USING (user_id = auth.uid());

-- Policy 2: Allow authenticated admins to view other admins
-- This is useful for the admin dashboard to list all admins
CREATE POLICY "Admins can view all admin users" ON public.admin_users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- Verify the table has the correct structure
-- The admin_users table should have these columns:
-- id, user_id, email, name, avatar_url, roles, permissions, is_active, created_at, updated_at
