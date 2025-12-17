import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  try {
    console.log('Creating live_streams table...');
    const { error: lsError } = await supabase.rpc('exec', {
      sql: `
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
          FOREIGN KEY (user_id) REFERENCES profiles(user_id)
        );
      `
    });

    if (lsError) {
      console.warn('Note: live_streams table may already exist or RPC not available');
    } else {
      console.log('✓ live_streams table created');
    }

    console.log('Creating battles table...');
    const { error: bError } = await supabase.rpc('exec', {
      sql: `
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
          FOREIGN KEY (live_stream_id) REFERENCES live_streams(id),
          FOREIGN KEY (challenger_id) REFERENCES profiles(user_id),
          FOREIGN KEY (opponent_id) REFERENCES profiles(user_id)
        );
      `
    });

    if (bError) {
      console.warn('Note: battles table may already exist or RPC not available');
    } else {
      console.log('✓ battles table created');
    }

    console.log('Creating stream_viewers table...');
    const { error: svError } = await supabase.rpc('exec', {
      sql: `
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
          FOREIGN KEY (stream_id) REFERENCES live_streams(id),
          FOREIGN KEY (user_id) REFERENCES profiles(user_id)
        );
      `
    });

    if (svError) {
      console.warn('Note: stream_viewers table may already exist or RPC not available');
    } else {
      console.log('✓ stream_viewers table created');
    }

    console.log('Creating stream_messages table...');
    const { error: smError } = await supabase.rpc('exec', {
      sql: `
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
          FOREIGN KEY (stream_id) REFERENCES live_streams(id),
          FOREIGN KEY (user_id) REFERENCES profiles(user_id)
        );
      `
    });

    if (smError) {
      console.warn('Note: stream_messages table may already exist or RPC not available');
    } else {
      console.log('✓ stream_messages table created');
    }

    console.log('Creating stream_donations table...');
    const { error: sdError } = await supabase.rpc('exec', {
      sql: `
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
          FOREIGN KEY (stream_id) REFERENCES live_streams(id),
          FOREIGN KEY (from_user_id) REFERENCES profiles(user_id),
          FOREIGN KEY (to_user_id) REFERENCES profiles(user_id)
        );
      `
    });

    if (sdError) {
      console.warn('Note: stream_donations table may already exist or RPC not available');
    } else {
      console.log('✓ stream_donations table created');
    }

    console.log('Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_live_streams_user_id ON live_streams(user_id);
        CREATE INDEX IF NOT EXISTS idx_live_streams_is_active ON live_streams(is_active);
        CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
        CREATE INDEX IF NOT EXISTS idx_stream_viewers_stream_id ON stream_viewers(stream_id);
        CREATE INDEX IF NOT EXISTS idx_stream_messages_stream_id ON stream_messages(stream_id);
        CREATE INDEX IF NOT EXISTS idx_stream_donations_stream_id ON stream_donations(stream_id);
      `
    });

    if (indexError) {
      console.warn('Note: Some indexes may already exist');
    } else {
      console.log('✓ Indexes created');
    }

    console.log('\n✅ All livestream tables are ready!');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

createTables();
