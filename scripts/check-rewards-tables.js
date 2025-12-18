import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

async function checkTables() {
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    return;
  }

  const sql = postgres(databaseUrl, { ssl: { rejectUnauthorized: false } });

  try {
    const tables = [
      'user_rewards',
      'reward_rules',
      'reward_transactions',
      'trust_history',
      'redemptions',
      'referrals',
      'system_config',
      'daily_action_counts',
      'spam_detection',
      'referral_links',
      'referral_events',
      'trust_decay_log',
      'gift_transactions',
      'tip_transactions'
    ];

    console.log('Checking tables...');
    for (const table of tables) {
      try {
        await sql`SELECT 1 FROM ${sql(table)} LIMIT 1`;
        console.log(`✅ Table ${table} exists`);
      } catch (e) {
        console.log(`❌ Table ${table} does NOT exist`);
      }
    }
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await sql.end();
  }
}

checkTables();
