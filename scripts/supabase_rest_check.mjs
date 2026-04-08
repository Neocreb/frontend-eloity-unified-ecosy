import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase URL or service key');
  process.exit(1);
}

async function check(table) {
  let url;
  if (table === 'profiles') {
    url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}?select=user_id,username,full_name,avatar&limit=10`;
  } else {
    url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}?select=id&limit=1`;
  }
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: 'count=exact'
    }
  });

  const text = await res.text();
  console.log('---', table, 'status', res.status);
  console.log('headers:');
  console.log(Object.fromEntries(res.headers.entries()));
  console.log('body:', text);
}

(async () => {
  try {
    await check('profiles');
    await check('chat_messages');
  } catch (e) {
    console.error('fetch error', e);
  }
})();
