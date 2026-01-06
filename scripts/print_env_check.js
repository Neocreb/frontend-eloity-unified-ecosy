require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
console.log('VITE_SUPABASE_URL =', process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY =', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('SUPABASE_URL =', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
