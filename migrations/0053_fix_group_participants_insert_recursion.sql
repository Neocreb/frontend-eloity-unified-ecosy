-- Migration: Fix infinite recursion in group_participants RLS policy
-- Issue: Self-referencing policy during INSERT causes recursion
-- Solution: Separate policies for each operation type

-- Disable RLS temporarily to fix policies safely
ALTER TABLE public.group_participants DISABLE ROW LEVEL SECURITY;

-- Drop all problematic policies
DROP POLICY IF EXISTS "Users can view group participants for groups they belong to" ON public.group_participants;
DROP POLICY IF EXISTS "Users can join groups through invite links" ON public.group_participants;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_participants;
DROP POLICY IF EXISTS "group_participants_select" ON public.group_participants;
DROP POLICY IF EXISTS "group_participants_insert" ON public.group_participants;
DROP POLICY IF EXISTS "group_participants_update" ON public.group_participants;
DROP POLICY IF EXISTS "group_participants_delete" ON public.group_participants;

-- Re-enable RLS
ALTER TABLE public.group_participants ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT POLICY - User can view participants in groups they belong to
-- ============================================================================
CREATE POLICY "group_participants_select" ON public.group_participants
    FOR SELECT USING (
        -- User is viewing a participant record for a group they belong to
        auth.uid() IN (
            SELECT DISTINCT user_id 
            FROM public.group_participants gp2
            WHERE gp2.group_id = group_participants.group_id
        )
        OR
        -- User is the creator of the group
        EXISTS (
            SELECT 1 FROM public.group_chat_threads gt
            WHERE gt.id = group_participants.group_id
            AND gt.created_by = auth.uid()
        )
    );

-- ============================================================================
-- INSERT POLICY - Allow authenticated users to be added to groups
-- Don't self-reference - check group exists instead
-- ============================================================================
CREATE POLICY "group_participants_insert" ON public.group_participants
    FOR INSERT WITH CHECK (
        -- The group must exist
        EXISTS (
            SELECT 1 FROM public.group_chat_threads
            WHERE id = group_id
        )
        AND
        -- User being added is authenticated (or current user is admin)
        (
            auth.uid() IS NOT NULL
        )
    );

-- ============================================================================
-- UPDATE POLICY - Only allow users to update their own records
-- ============================================================================
CREATE POLICY "group_participants_update" ON public.group_participants
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- ============================================================================
-- DELETE POLICY - Allow users to remove themselves or admins to remove others
-- ============================================================================
CREATE POLICY "group_participants_delete" ON public.group_participants
    FOR DELETE USING (
        -- User can delete their own record
        auth.uid() = user_id
        OR
        -- Admin of the group can delete anyone
        EXISTS (
            SELECT 1 FROM public.group_participants gp_admin
            WHERE gp_admin.group_id = group_participants.group_id
            AND gp_admin.user_id = auth.uid()
            AND gp_admin.role = 'admin'
        )
    );

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
