import dotenv from 'dotenv';
import path from 'path';

// Load env files
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    console.error('Missing Supabase configuration. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

  try {
    console.log('Checking chat_messages count...');
    const { data: messagesSample, error: msgErr } = await supabase
      .from('chat_messages')
      .select('id, conversation_id, content, sender_id, created_at')
      .limit(5);

    if (msgErr) {
      console.error('Error fetching chat_messages sample:', msgErr.message || msgErr);
    } else {
      console.log('chat_messages sample rows:', messagesSample.length);
      console.dir(messagesSample, { depth: 2 });
    }

    const { data: convSample, error: convErr } = await supabase
      .from('chat_conversations')
      .select('id, type, name, participants, last_activity')
      .limit(5);

    if (convErr) {
      console.error('Error fetching chat_conversations sample:', convErr.message || convErr);
    } else {
      console.log('chat_conversations sample rows:', convSample.length);
      console.dir(convSample, { depth: 2 });
    }

    const { data: profilesSample, error: profErr } = await supabase
      .from('profiles')
      .select('id, user_id, username, full_name, avatar')
      .limit(10);

    if (profErr) {
      console.error('Error fetching profiles sample:', profErr.message || profErr);
    } else {
      console.log('profiles sample rows:', profilesSample.length);
      console.dir(profilesSample, { depth: 2 });
    }

    // Get counts using head + count
    const { error: countErr1, count: messagesCount } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true });

    const { error: countErr2, count: profilesCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (countErr1) console.error('Error counting chat_messages:', countErr1.message || countErr1);
    if (countErr2) console.error('Error counting profiles:', countErr2.message || countErr2);

    console.log('chat_messages count:', messagesCount ?? 'unknown');
    console.log('profiles count:', profilesCount ?? 'unknown');

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exitCode = 1;
  }
}

main();
