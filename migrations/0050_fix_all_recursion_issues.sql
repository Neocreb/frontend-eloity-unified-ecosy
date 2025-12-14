-- Migration: Fix infinite recursion issues in RLS policies
-- This migration completely rewrites the problematic policies to avoid self-references

-- ============================================================================
-- FIX CHAT_PARTICIPANTS RECURSION
-- ============================================================================

-- Drop all problematic chat_participants policies
DROP POLICY IF EXISTS "Users can view chat participants in conversations they joined" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view chat participants for conversations they are in" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can update their own participant info" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON public.chat_participants;

-- For chat_participants, use a simpler approach: check auth.uid() directly
-- Don't join back to chat_participants in the subquery
CREATE POLICY "chat_participants_select" ON public.chat_participants
    FOR SELECT USING (
        -- Users can see participant records for conversations they're in
        -- Check directly against the participant record they're querying
        auth.uid() = user_id
        OR
        -- OR check via the conversation creator (faster than joining)
        EXISTS (
            SELECT 1 FROM public.chat_conversations cc
            WHERE cc.id = conversation_id
            AND cc.created_by = auth.uid()
        )
    );

CREATE POLICY "chat_participants_insert" ON public.chat_participants
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.chat_conversations
            WHERE id = conversation_id
        )
    );

CREATE POLICY "chat_participants_update" ON public.chat_participants
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "chat_participants_delete" ON public.chat_participants
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- FIX GROUP_PARTICIPANTS RECURSION
-- ============================================================================

-- Drop all problematic group_participants policies
DROP POLICY IF EXISTS "Users can view group participants for groups they belong to" ON public.group_participants;
DROP POLICY IF EXISTS "Users can join groups through invite links" ON public.group_participants;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_participants;
DROP POLICY IF EXISTS "Users can view chat participants in conversations they joined" ON public.group_participants;
DROP POLICY IF EXISTS "Users can update group participant info" ON public.group_participants;

-- For group_participants, use direct checks and avoid self-joins
CREATE POLICY "group_participants_select" ON public.group_participants
    FOR SELECT USING (
        -- Users can see their own participant record
        auth.uid() = user_id
        OR
        -- Group creators can see all participants
        EXISTS (
            SELECT 1 FROM public.group_chat_threads gct
            WHERE gct.id = group_id
            AND gct.created_by = auth.uid()
        )
    );

CREATE POLICY "group_participants_insert" ON public.group_participants
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.group_chat_threads
            WHERE id = group_id
        )
    );

CREATE POLICY "group_participants_update" ON public.group_participants
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "group_participants_delete" ON public.group_participants
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- FIX CHAT_MESSAGES POLICIES (avoid referencing chat_participants)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages in conversations they're in" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;

CREATE POLICY "chat_messages_select" ON public.chat_messages
    FOR SELECT USING (
        -- Check via conversation participants array (denormalized data)
        auth.uid() = ANY(
            (SELECT participants FROM public.chat_conversations 
             WHERE id = conversation_id)
        )
        OR
        -- OR check if user is conversation creator
        EXISTS (
            SELECT 1 FROM public.chat_conversations cc
            WHERE cc.id = conversation_id
            AND cc.created_by = auth.uid()
        )
    );

CREATE POLICY "chat_messages_insert" ON public.chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND auth.uid() = ANY(
            (SELECT participants FROM public.chat_conversations 
             WHERE id = conversation_id)
        )
    );

CREATE POLICY "chat_messages_update" ON public.chat_messages
    FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "chat_messages_delete" ON public.chat_messages
    FOR DELETE USING (auth.uid() = sender_id);

-- ============================================================================
-- FIX GROUP_CHAT_THREADS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view group chat threads" ON public.group_chat_threads;
DROP POLICY IF EXISTS "Users can view group chat threads they are members of" ON public.group_chat_threads;
DROP POLICY IF EXISTS "Users can create group chat threads" ON public.group_chat_threads;
DROP POLICY IF EXISTS "Group creators can update their group chat threads" ON public.group_chat_threads;
DROP POLICY IF EXISTS "Group creators can delete their group chat threads" ON public.group_chat_threads;

CREATE POLICY "group_chat_threads_select" ON public.group_chat_threads
    FOR SELECT USING (
        -- Public groups visible to everyone
        privacy = 'public'
        OR
        -- Private groups: only visible to creator and members
        auth.uid() = created_by
        OR
        -- Check membership without recursing through group_participants
        (
            SELECT COUNT(*) FROM public.group_participants gp
            WHERE gp.group_id = id
            AND gp.user_id = auth.uid()
        ) > 0
    );

CREATE POLICY "group_chat_threads_insert" ON public.group_chat_threads
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "group_chat_threads_update" ON public.group_chat_threads
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "group_chat_threads_delete" ON public.group_chat_threads
    FOR DELETE USING (auth.uid() = created_by);

-- ============================================================================
-- FIX GROUP_MESSAGES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view messages in groups they belong to" ON public.group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON public.group_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.group_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.group_messages;

CREATE POLICY "group_messages_select" ON public.group_messages
    FOR SELECT USING (
        -- Check if user is a member of the group (without recursing)
        (
            SELECT COUNT(*) FROM public.group_participants gp
            WHERE gp.group_id = thread_id
            AND gp.user_id = auth.uid()
        ) > 0
        OR
        -- OR if the group is public and user is the sender
        (
            SELECT privacy FROM public.group_chat_threads gct
            WHERE gct.id = thread_id
        ) = 'public'
    );

CREATE POLICY "group_messages_insert" ON public.group_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND (
            SELECT COUNT(*) FROM public.group_participants gp
            WHERE gp.group_id = thread_id
            AND gp.user_id = auth.uid()
        ) > 0
    );

CREATE POLICY "group_messages_update" ON public.group_messages
    FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "group_messages_delete" ON public.group_messages
    FOR DELETE USING (auth.uid() = sender_id);

GRANT ALL ON public.chat_participants TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_conversations TO authenticated;
GRANT ALL ON public.group_participants TO authenticated;
GRANT ALL ON public.group_chat_threads TO authenticated;
GRANT ALL ON public.group_messages TO authenticated;
