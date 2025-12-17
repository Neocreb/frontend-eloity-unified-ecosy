-- Create live_streams table
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  viewer_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  stream_key TEXT,
  rtmp_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  recording_enabled BOOLEAN DEFAULT false,
  recording_url TEXT,
  is_private BOOLEAN DEFAULT false,
  requires_subscription BOOLEAN DEFAULT false,
  monetization_enabled BOOLEAN DEFAULT false,
  chat_enabled BOOLEAN DEFAULT true,
  moderation_enabled BOOLEAN DEFAULT true,
  tags TEXT[],
  language TEXT DEFAULT 'en',
  max_viewers INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Create battles table
CREATE TABLE IF NOT EXISTS battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id UUID,
  challenger_id UUID NOT NULL,
  opponent_id UUID,
  battle_type TEXT DEFAULT 'general',
  status TEXT DEFAULT 'pending',
  time_remaining INTEGER,
  challenger_score INTEGER DEFAULT 0,
  opponent_score INTEGER DEFAULT 0,
  winner_id UUID,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (live_stream_id) REFERENCES live_streams(id) ON DELETE CASCADE,
  FOREIGN KEY (challenger_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (opponent_id) REFERENCES profiles(user_id) ON DELETE SET NULL
);

-- Create stream_viewers table
CREATE TABLE IF NOT EXISTS stream_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  watch_time INTEGER DEFAULT 0,
  interaction_count INTEGER DEFAULT 0,
  gifts_sent INTEGER DEFAULT 0,
  tips_sent NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (stream_id) REFERENCES live_streams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Create stream_messages table
CREATE TABLE IF NOT EXISTS stream_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL,
  user_id UUID NOT NULL,
  username TEXT,
  user_avatar TEXT,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'chat',
  metadata JSONB,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (stream_id) REFERENCES live_streams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Create stream_donations table
CREATE TABLE IF NOT EXISTS stream_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  donation_type TEXT DEFAULT 'gift',
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (stream_id) REFERENCES live_streams(id) ON DELETE CASCADE,
  FOREIGN KEY (from_user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_streams_user_id ON live_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_is_active ON live_streams(is_active);
CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_stream_id ON stream_viewers(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_messages_stream_id ON stream_messages(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_donations_stream_id ON stream_donations(stream_id);

-- Enable RLS on all tables
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_streams: anyone can view public streams, only owner can modify
CREATE POLICY "Anyone can view public streams" ON live_streams
  FOR SELECT USING (NOT is_private OR user_id = auth.uid());

CREATE POLICY "Users can create live streams" ON live_streams
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own streams" ON live_streams
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own streams" ON live_streams
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for battles: anyone can view
CREATE POLICY "Anyone can view battles" ON battles
  FOR SELECT USING (true);

CREATE POLICY "Users can create battles" ON battles
  FOR INSERT WITH CHECK (challenger_id = auth.uid());

CREATE POLICY "Users can update their own battles" ON battles
  FOR UPDATE USING (challenger_id = auth.uid() OR opponent_id = auth.uid());

-- RLS Policies for stream_viewers: anyone can view, users can add themselves
CREATE POLICY "Anyone can view stream viewers" ON stream_viewers
  FOR SELECT USING (true);

CREATE POLICY "Users can record themselves as viewers" ON stream_viewers
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for stream_messages: anyone can view, users can add messages
CREATE POLICY "Anyone can view stream messages" ON stream_messages
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send messages" ON stream_messages
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON stream_messages
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for stream_donations: donors and recipients can view their own, stream owner can view all
CREATE POLICY "Users can view their donations" ON stream_donations
  FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Authenticated users can donate" ON stream_donations
  FOR INSERT WITH CHECK (from_user_id = auth.uid());
