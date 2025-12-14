-- Migration: Fix infinite recursion in chat_participants RLS policy
-- The previous policy caused infinite recursion by self-referencing

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view chat participants for conversations they are in" ON public.chat_participants;

-- Create a simpler policy that doesn't self-reference
CREATE POLICY "Users can view chat participants in conversations they joined" ON public.chat_participants
    FOR SELECT USING (
        -- Users can see participants in conversations where they are a participant
        EXISTS (
            SELECT 1 FROM public.chat_conversations
            WHERE chat_conversations.id = chat_participants.conversation_id
            AND (
                auth.uid() = chat_conversations.created_by
                OR auth.uid() = ANY(chat_conversations.participants)
            )
        )
    );

-- Update the INSERT policy to be simpler
DROP POLICY IF EXISTS "Users can join conversations" ON public.chat_participants;

CREATE POLICY "Users can join conversations" ON public.chat_participants
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.chat_conversations
            WHERE chat_conversations.id = conversation_id
        )
    );

-- Keep UPDATE and DELETE policies as they are
-- Users should be able to update/delete their own records
