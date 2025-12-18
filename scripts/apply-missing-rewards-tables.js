import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

async function applyMigration() {
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    return;
  }

  const sql = postgres(databaseUrl, { ssl: { rejectUnauthorized: false } });

  try {
    console.log('Applying migration for missing rewards tables...');

    await sql`
      CREATE TABLE IF NOT EXISTS redemptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        amount NUMERIC(15,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        payout_method VARCHAR(50) NOT NULL,
        payout_details JSONB,
        status VARCHAR(20) DEFAULT 'pending',
        approved_by UUID,
        approved_at TIMESTAMP,
        processed_at TIMESTAMP,
        rejection_reason TEXT,
        batch_id VARCHAR(100),
        fee_amount NUMERIC(15,2),
        net_amount NUMERIC(15,2),
        fee_breakdown JSONB,
        fee_calculated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ Table redemptions created');

    await sql`
      CREATE TABLE IF NOT EXISTS referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID NOT NULL,
        referee_id UUID,
        referral_code VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        depth INT DEFAULT 1,
        reward_earned NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        verified_at TIMESTAMP
      );
    `;
    console.log('✅ Table referrals created');

    await sql`
      CREATE TABLE IF NOT EXISTS system_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(100) NOT NULL UNIQUE,
        value TEXT NOT NULL,
        description TEXT,
        data_type VARCHAR(20) DEFAULT 'string',
        category VARCHAR(50) DEFAULT 'general',
        is_editable BOOLEAN DEFAULT true,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ Table system_config created');

    await sql`
      CREATE TABLE IF NOT EXISTS trust_decay_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        previous_score INT,
        new_score INT,
        decay_reason TEXT,
        decay_amount INT,
        activity_type VARCHAR(50),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ Table trust_decay_log created');

    // Add some default config
    await sql`
      INSERT INTO system_config (key, value, description, category)
      VALUES 
        ('conversion_rate', '1000', 'ELO points per 1 USD', 'rewards'),
        ('payout_mode', 'manual', 'Payout processing mode (manual/automated)', 'rewards'),
        ('minimum_redeemable_balance', '500', 'Minimum ELO points required to withdraw', 'rewards'),
        ('max_monthly_redemption_per_tier', '10000', 'Maximum USD value that can be redeemed per month', 'rewards')
      ON CONFLICT (key) DO NOTHING;
    `;
    console.log('✅ Default system configuration inserted');

  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    await sql.end();
  }
}

applyMigration();
