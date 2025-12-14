-- Migration: Fix RLS policy for group chat threads to allow viewing public groups
-- This allows users to view public groups even if they are not members

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view group chat threads they are members of" ON public.group_chat_threads;

-- Create new policy that allows viewing public groups or groups user is member of
CREATE POLICY "Users can view group chat threads" ON public.group_chat_threads
    FOR SELECT USING (
        privacy = 'public'
        OR EXISTS (
            SELECT 1 FROM public.group_participants 
            WHERE group_participants.group_id = group_chat_threads.id 
            AND group_participants.user_id = auth.uid()
        )
    );
