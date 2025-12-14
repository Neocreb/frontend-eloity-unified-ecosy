-- Migration: Create chat participants table
-- This table tracks participants in chat conversations with proper foreign key relationships

CREATE TABLE IF NOT EXISTS public.chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
    left_at TIMESTAMP,
    last_read_message_id UUID REFERENCES public.chat_messages(id),
    last_read_at TIMESTAMP,
    is_muted BOOLEAN DEFAULT false,
    notification_settings JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_participants_conversation_id ON public.chat_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_conversation_user ON public.chat_participants(conversation_id, user_id);

-- Enable RLS (Row Level Security) on table
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for chat participants
CREATE POLICY "Users can view chat participants for conversations they are in" ON public.chat_participants
    FOR SELECT USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.chat_participants cp
            WHERE cp.conversation_id = chat_participants.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join conversations" ON public.chat_participants
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.chat_conversations
            WHERE chat_conversations.id = conversation_id
        )
    );

CREATE POLICY "Users can update their own participant info" ON public.chat_participants
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave conversations" ON public.chat_participants
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.chat_participants TO authenticated;
