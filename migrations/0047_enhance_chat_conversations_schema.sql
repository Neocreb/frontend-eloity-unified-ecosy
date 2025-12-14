-- Migration: Enhance chat_conversations table schema
-- This adds missing columns expected by the Drizzle schema

-- Add missing columns to chat_conversations if they don't exist
ALTER TABLE public.chat_conversations
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'direct' NOT NULL,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS avatar TEXT,
ADD COLUMN IF NOT EXISTS admin_ids TEXT[],
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_message_id UUID REFERENCES public.chat_messages(id),
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS settings JSONB;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_by ON public.chat_conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_type ON public.chat_conversations(type);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_activity ON public.chat_conversations(last_activity);

-- Enable RLS on chat_conversations if not already enabled
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_conversations if they don't exist
CREATE POLICY IF NOT EXISTS "Users can view their own conversations" ON public.chat_conversations
    FOR SELECT USING (
        auth.uid() = created_by
        OR auth.uid() = ANY(participants)
    );

CREATE POLICY IF NOT EXISTS "Users can create conversations" ON public.chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY IF NOT EXISTS "Conversation creators can update" ON public.chat_conversations
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY IF NOT EXISTS "Conversation creators can delete" ON public.chat_conversations
    FOR DELETE USING (auth.uid() = created_by);

-- Grant permissions
GRANT ALL ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;
