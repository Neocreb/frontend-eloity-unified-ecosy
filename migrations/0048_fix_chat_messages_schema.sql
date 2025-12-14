-- Migration: Fix chat_messages schema
-- This migration renames thread_id to conversation_id and adds missing columns

-- First, check if thread_id column exists and rename it to conversation_id
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' AND column_name = 'thread_id'
    ) THEN
        ALTER TABLE public.chat_messages 
        RENAME COLUMN thread_id TO conversation_id;
    END IF;
END $$;

-- Add missing columns if they don't exist
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS reactions JSONB,
ADD COLUMN IF NOT EXISTS mentions TEXT[],
ADD COLUMN IF NOT EXISTS forwarded_from UUID,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Drop existing foreign key on conversation_id if it exists with wrong constraint
ALTER TABLE public.chat_messages 
DROP CONSTRAINT IF EXISTS chat_messages_thread_id_fkey;

-- Add proper foreign key constraint
ALTER TABLE public.chat_messages
ADD CONSTRAINT chat_messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;

-- Add foreign key for sender_id if not present
ALTER TABLE public.chat_messages
ADD CONSTRAINT chat_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for conversation_id if not exists
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);

-- Enable RLS if not already enabled
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_messages
CREATE POLICY IF NOT EXISTS "Users can view messages in their conversations" ON public.chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_participants.conversation_id = chat_messages.conversation_id
            AND chat_participants.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.chat_conversations
            WHERE chat_conversations.id = chat_messages.conversation_id
            AND chat_conversations.created_by = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can send messages in conversations they're in" ON public.chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_participants.conversation_id = conversation_id
            AND chat_participants.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can update their own messages" ON public.chat_messages
    FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own messages" ON public.chat_messages
    FOR DELETE USING (auth.uid() = sender_id);

-- Grant permissions
GRANT ALL ON public.chat_messages TO authenticated;
