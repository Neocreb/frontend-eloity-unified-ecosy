-- ============================================================================
-- COMPLETE CHAT SYSTEM MIGRATION SCRIPT
-- Supabase/PostgreSQL
-- ============================================================================
-- This script creates all tables, indexes, RLS policies, and triggers
-- for a complete chat system with persistence, read receipts, and real-time updates.
--
-- IMPORTANT: Run this entire script in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

-- ============================================================================
-- Table: chat_conversations
-- Purpose: Store conversation metadata and participant lists
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT,                                    -- For group chats
  description TEXT,                             -- Group description
  avatar_url TEXT,                              -- Group avatar image
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  participants UUID[] NOT NULL,                 -- Array of participant UUIDs
  is_archived BOOLEAN DEFAULT FALSE,
  is_group BOOLEAN DEFAULT FALSE,
  last_message_id UUID,                         -- Reference to last message
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  settings JSONB DEFAULT '{}'::jsonb,           -- Custom settings: muted, notifications, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for chat_conversations
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_by 
  ON public.chat_conversations(created_by);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_activity 
  ON public.chat_conversations(last_activity DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_is_archived 
  ON public.chat_conversations(is_archived) WHERE is_archived = FALSE;

CREATE INDEX IF NOT EXISTS idx_chat_conversations_participants 
  ON public.chat_conversations USING GIN (participants);

-- ============================================================================
-- Table: chat_messages
-- Purpose: Store individual messages with content, metadata, and tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN (
    'text', 'image', 'file', 'voice', 'video', 'system', 'call', 'location'
  )),
  attachments JSONB DEFAULT '[]'::jsonb,        -- Array of {url, name, type, size}
  reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  read_by UUID[] DEFAULT ARRAY[]::uuid[],       -- Array of user IDs who read this
  reactions JSONB DEFAULT '{}'::jsonb,          -- {emoji: [user_ids]}
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,           -- Custom metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id 
  ON public.chat_messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id 
  ON public.chat_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at 
  ON public.chat_messages(created_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_chat_messages_is_deleted 
  ON public.chat_messages(is_deleted) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to_id 
  ON public.chat_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- Full-text search index for message content
CREATE INDEX IF NOT EXISTS idx_chat_messages_content_search 
  ON public.chat_messages USING GIN (to_tsvector('english', content));

-- ============================================================================
-- Table: chat_participants
-- Purpose: Track participant-specific settings and read status
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_read_message_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  muted BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  custom_name TEXT,                              -- Custom nickname for this participant
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(conversation_id, user_id)
);

-- Indexes for chat_participants
CREATE INDEX IF NOT EXISTS idx_chat_participants_conversation_id 
  ON public.chat_participants(conversation_id);

CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id 
  ON public.chat_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_participants_last_read_message_id 
  ON public.chat_participants(last_read_message_id) WHERE last_read_message_id IS NOT NULL;

-- ============================================================================
-- Table: chat_files
-- Purpose: Track file attachments separately for organization
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for chat_files
CREATE INDEX IF NOT EXISTS idx_chat_files_message_id 
  ON public.chat_files(message_id);

CREATE INDEX IF NOT EXISTS idx_chat_files_uploaded_by 
  ON public.chat_files(uploaded_by);

-- ============================================================================
-- Table: video_calls
-- Purpose: Track voice and video call history
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.video_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video')),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'ringing', 'active', 'completed', 'missed', 'declined', 'ended'
  )),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  call_data JSONB DEFAULT '{}'::jsonb,           -- Provider-specific data (Agora, Twilio, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for video_calls
CREATE INDEX IF NOT EXISTS idx_video_calls_conversation_id 
  ON public.video_calls(conversation_id);

CREATE INDEX IF NOT EXISTS idx_video_calls_initiator_id 
  ON public.video_calls(initiator_id);

CREATE INDEX IF NOT EXISTS idx_video_calls_recipient_id 
  ON public.video_calls(recipient_id);

CREATE INDEX IF NOT EXISTS idx_video_calls_status 
  ON public.video_calls(status) WHERE status IN ('pending', 'ringing', 'active');

-- ============================================================================
-- Table: typing_indicators
-- Purpose: Real-time typing status (temporary, auto-expires)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '10 seconds',
  UNIQUE(conversation_id, user_id)
);

-- Index for automatic cleanup of expired typing indicators
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires_at 
  ON public.typing_indicators(expires_at);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_user 
  ON public.typing_indicators(conversation_id, user_id);

-- ============================================================================
-- 2. CREATE TRIGGERS & FUNCTIONS
-- ============================================================================

-- ============================================================================
-- Function: Update chat_conversations.updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_chat_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update timestamp on chat_conversations changes
DROP TRIGGER IF EXISTS trigger_chat_conversations_updated_at ON public.chat_conversations;
CREATE TRIGGER trigger_chat_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_chat_conversations_updated_at();

-- ============================================================================
-- Function: Update chat_messages.updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update timestamp on chat_messages changes
DROP TRIGGER IF EXISTS trigger_chat_messages_updated_at ON public.chat_messages;
CREATE TRIGGER trigger_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_chat_messages_updated_at();

-- ============================================================================
-- Function: Update last_activity when new message is sent
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_conversation_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversations
  SET 
    last_message_id = NEW.id,
    last_activity = NEW.created_at,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update conversation activity on new message
DROP TRIGGER IF EXISTS trigger_update_conversation_last_activity ON public.chat_messages;
CREATE TRIGGER trigger_update_conversation_last_activity
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_activity();

-- ============================================================================
-- Function: Auto-cleanup expired typing indicators
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM public.typing_indicators
  WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all chat tables
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS: chat_conversations
-- Users can only see conversations they're part of
-- ============================================================================

-- Policy: Select - User can see conversations they're in
DROP POLICY IF EXISTS "Users can view their conversations" ON public.chat_conversations;
CREATE POLICY "Users can view their conversations"
  ON public.chat_conversations FOR SELECT
  USING (auth.uid() = ANY(participants));

-- Policy: Insert - User can create new conversations
DROP POLICY IF EXISTS "Users can create conversations" ON public.chat_conversations;
CREATE POLICY "Users can create conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = created_by AND auth.uid() = ANY(participants));

-- Policy: Update - User can update their own conversations
DROP POLICY IF EXISTS "Users can update their conversations" ON public.chat_conversations;
CREATE POLICY "Users can update their conversations"
  ON public.chat_conversations FOR UPDATE
  USING (auth.uid() = ANY(participants))
  WITH CHECK (auth.uid() = ANY(participants));

-- Policy: Delete - Only creator can delete
DROP POLICY IF EXISTS "Users can delete their conversations" ON public.chat_conversations;
CREATE POLICY "Users can delete their conversations"
  ON public.chat_conversations FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================================================
-- RLS: chat_messages
-- Users can only see/send messages in conversations they're part of
-- ============================================================================

-- Policy: Select - User can view messages in their conversations
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;
CREATE POLICY "Users can view messages in their conversations"
  ON public.chat_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.chat_conversations 
      WHERE auth.uid() = ANY(participants)
    )
  );

-- Policy: Insert - User can send messages to conversations they're in
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
CREATE POLICY "Users can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (
      SELECT id FROM public.chat_conversations 
      WHERE auth.uid() = ANY(participants)
    )
  );

-- Policy: Update - User can edit/delete their own messages
DROP POLICY IF EXISTS "Users can update their messages" ON public.chat_messages;
CREATE POLICY "Users can update their messages"
  ON public.chat_messages FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Policy: Delete - User can delete their own messages
DROP POLICY IF EXISTS "Users can delete their messages" ON public.chat_messages;
CREATE POLICY "Users can delete their messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = sender_id);

-- ============================================================================
-- RLS: chat_participants
-- Users can only view participants in conversations they're in
-- ============================================================================

DROP POLICY IF EXISTS "Users can view conversation participants" ON public.chat_participants;
CREATE POLICY "Users can view conversation participants"
  ON public.chat_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.chat_conversations 
      WHERE auth.uid() = ANY(participants)
    )
  );

DROP POLICY IF EXISTS "Users can update their participant record" ON public.chat_participants;
CREATE POLICY "Users can update their participant record"
  ON public.chat_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RLS: chat_files
-- Users can only see files in conversations they're in
-- ============================================================================

DROP POLICY IF EXISTS "Users can view files in their conversations" ON public.chat_files;
CREATE POLICY "Users can view files in their conversations"
  ON public.chat_files FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM public.chat_messages
      WHERE conversation_id IN (
        SELECT id FROM public.chat_conversations 
        WHERE auth.uid() = ANY(participants)
      )
    )
  );

-- ============================================================================
-- RLS: video_calls
-- Users can only see calls in conversations they're in
-- ============================================================================

DROP POLICY IF EXISTS "Users can view calls in their conversations" ON public.video_calls;
CREATE POLICY "Users can view calls in their conversations"
  ON public.video_calls FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.chat_conversations 
      WHERE auth.uid() = ANY(participants)
    )
  );

-- ============================================================================
-- RLS: typing_indicators
-- Users can see typing indicators in their conversations
-- ============================================================================

DROP POLICY IF EXISTS "Users can view typing indicators" ON public.typing_indicators;
CREATE POLICY "Users can view typing indicators"
  ON public.typing_indicators FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.chat_conversations 
      WHERE auth.uid() = ANY(participants)
    )
  );

DROP POLICY IF EXISTS "Users can create typing indicators" ON public.typing_indicators;
CREATE POLICY "Users can create typing indicators"
  ON public.typing_indicators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 4. VIEWS FOR COMMON QUERIES
-- ============================================================================

-- ============================================================================
-- View: conversation_with_last_message
-- Get conversations with last message details
-- ============================================================================
CREATE OR REPLACE VIEW public.conversation_with_last_message AS
SELECT
  c.id,
  c.created_by,
  c.name,
  c.avatar_url,
  c.type,
  c.participants,
  c.is_archived,
  c.is_group,
  c.last_activity,
  c.settings,
  c.created_at,
  c.updated_at,
  m.id as last_message_id,
  m.sender_id as last_message_sender_id,
  m.content as last_message_content,
  m.message_type as last_message_type,
  m.created_at as last_message_created_at
FROM public.chat_conversations c
LEFT JOIN public.chat_messages m ON c.last_message_id = m.id
ORDER BY c.last_activity DESC NULLS LAST;

-- ============================================================================
-- View: conversation_unread_counts
-- Get unread message counts per conversation per user
-- ============================================================================
CREATE OR REPLACE VIEW public.conversation_unread_counts AS
SELECT
  cp.conversation_id,
  cp.user_id,
  COUNT(cm.id) as unread_count
FROM public.chat_participants cp
LEFT JOIN public.chat_messages cm ON 
  cm.conversation_id = cp.conversation_id AND
  cm.created_at > cp.last_read_at AND
  cm.sender_id != cp.user_id AND
  NOT cm.is_deleted
GROUP BY cp.conversation_id, cp.user_id;

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify all tables were created successfully

-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name LIKE 'chat_%' OR table_name LIKE 'video_%' OR table_name LIKE 'typing_%'
-- ORDER BY table_name;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All tables, indexes, RLS policies, and triggers have been created.
-- Next steps:
-- 1. Enable replication in Supabase dashboard for real-time updates
-- 2. Test by creating a conversation and sending a message
-- 3. Deploy application code with new components
-- ============================================================================

-- Add success message
SELECT 'Chat system migration completed successfully!' as status;
