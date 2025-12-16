-- Fix missing RLS policy for admin_sessions table
-- The table had RLS enabled but no policies, causing all access to be denied

-- Drop any existing policies
DROP POLICY IF EXISTS "Admins can manage admin sessions" ON public.admin_sessions;
DROP POLICY IF EXISTS "Admin session policy" ON public.admin_sessions;

-- Create policy allowing admins to insert and manage sessions
CREATE POLICY "Admins can manage admin sessions" ON public.admin_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Ensure the authenticated role has grant permissions
GRANT ALL ON public.admin_sessions TO authenticated;
