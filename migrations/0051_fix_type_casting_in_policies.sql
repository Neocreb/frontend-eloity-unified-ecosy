-- Migration: Fix type casting errors in RLS policies
-- The participants column is text[] not uuid[], so we need to cast auth.uid() to text

-- ============================================================================
-- FIX CHAT_MESSAGES POLICIES - Type casting
-- ============================================================================

DROP POLICY IF EXISTS "chat_messages_select" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;

CREATE POLICY "chat_messages_select" ON public.chat_messages
    FOR SELECT USING (
        -- Cast auth.uid() to text since participants is text[]
        auth.uid()::text = ANY(
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
        AND auth.uid()::text = ANY(
            (SELECT participants FROM public.chat_conversations 
             WHERE id = conversation_id)
        )
    );

-- Keep UPDATE and DELETE policies as they were (they only check auth.uid() = sender_id)
