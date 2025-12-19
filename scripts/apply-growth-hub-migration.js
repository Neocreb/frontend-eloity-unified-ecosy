const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  try {
    console.log("Starting Growth Hub migrations...\n");

    // Create partnerships table
    console.log("Creating partnerships table...");
    const { error: partnershipError } = await supabase.rpc("execute_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS partnerships (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100),
          description TEXT,
          commission_rate DECIMAL(5, 2) DEFAULT 5,
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'inactive')),
          total_earnings DECIMAL(15, 2) DEFAULT 0,
          active_users INT DEFAULT 0,
          conversions INT DEFAULT 0,
          requirements TEXT,
          benefits TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS partnerships_status_idx ON partnerships(status);
        CREATE INDEX IF NOT EXISTS partnerships_category_idx ON partnerships(category);
      `,
    });

    if (partnershipError && !partnershipError.message.includes("already exists")) {
      throw partnershipError;
    }
    console.log("✓ Partnerships table created\n");

    // Create challenges table
    console.log("Creating challenges table...");
    const { error: challengeError } = await supabase.rpc("execute_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS challenges (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(50) DEFAULT 'weekly' CHECK (type IN ('daily', 'weekly', 'monthly', 'seasonal')),
          status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'scheduled', 'ended')),
          reward_amount DECIMAL(15, 2),
          reward_type VARCHAR(50) DEFAULT 'elo_points' CHECK (reward_type IN ('elo_points', 'cash', 'badge', 'mixed')),
          participant_count INT DEFAULT 0,
          completion_rate DECIMAL(5, 2) DEFAULT 0,
          difficulty VARCHAR(50) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
          category VARCHAR(100),
          requirements TEXT,
          start_date TIMESTAMP,
          end_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS challenges_status_idx ON challenges(status);
        CREATE INDEX IF NOT EXISTS challenges_type_idx ON challenges(type);
        CREATE INDEX IF NOT EXISTS challenges_category_idx ON challenges(category);
        CREATE INDEX IF NOT EXISTS challenges_dates_idx ON challenges(start_date, end_date);
      `,
    });

    if (challengeError && !challengeError.message.includes("already exists")) {
      throw challengeError;
    }
    console.log("✓ Challenges table created\n");

    // Create referral_programs table
    console.log("Creating referral_programs table...");
    const { error: referralError } = await supabase.rpc("execute_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS referral_programs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          referrer_id UUID REFERENCES auth.users(id),
          referred_user_id UUID REFERENCES auth.users(id),
          referral_code VARCHAR(50) UNIQUE,
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'cancelled')),
          conversion_date TIMESTAMP,
          reward_amount DECIMAL(15, 2),
          reward_type VARCHAR(50) DEFAULT 'elo_points',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS referral_programs_referrer_idx ON referral_programs(referrer_id);
        CREATE INDEX IF NOT EXISTS referral_programs_referred_idx ON referral_programs(referred_user_id);
        CREATE INDEX IF NOT EXISTS referral_programs_code_idx ON referral_programs(referral_code);
        CREATE INDEX IF NOT EXISTS referral_programs_status_idx ON referral_programs(status);
      `,
    });

    if (referralError && !referralError.message.includes("already exists")) {
      throw referralError;
    }
    console.log("✓ Referral programs table created\n");

    // Create partnership_applications table
    console.log("Creating partnership_applications table...");
    const { error: appError } = await supabase.rpc("execute_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS partnership_applications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id),
          partnership_id UUID REFERENCES partnerships(id),
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          applied_at TIMESTAMP DEFAULT NOW(),
          reviewed_at TIMESTAMP,
          notes TEXT
        );

        CREATE INDEX IF NOT EXISTS partnership_applications_user_idx ON partnership_applications(user_id);
        CREATE INDEX IF NOT EXISTS partnership_applications_partnership_idx ON partnership_applications(partnership_id);
        CREATE INDEX IF NOT EXISTS partnership_applications_status_idx ON partnership_applications(status);
      `,
    });

    if (appError && !appError.message.includes("already exists")) {
      throw appError;
    }
    console.log("✓ Partnership applications table created\n");

    // Create challenge_participants table
    console.log("Creating challenge_participants table...");
    const { error: participantError } = await supabase.rpc("execute_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS challenge_participants (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          challenge_id UUID REFERENCES challenges(id),
          user_id UUID REFERENCES auth.users(id),
          status VARCHAR(50) DEFAULT 'participating' CHECK (status IN ('participating', 'completed', 'abandoned')),
          progress DECIMAL(5, 2) DEFAULT 0,
          reward_claimed BOOLEAN DEFAULT FALSE,
          joined_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS challenge_participants_challenge_idx ON challenge_participants(challenge_id);
        CREATE INDEX IF NOT EXISTS challenge_participants_user_idx ON challenge_participants(user_id);
        CREATE INDEX IF NOT EXISTS challenge_participants_status_idx ON challenge_participants(status);
      `,
    });

    if (participantError && !participantError.message.includes("already exists")) {
      throw participantError;
    }
    console.log("✓ Challenge participants table created\n");

    // Create RLS policies for partnerships
    console.log("Setting up RLS policies...");
    
    // Partnerships - Public read, admin write
    await supabase.rpc("execute_sql", {
      sql: `
        ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "partnerships_read" ON partnerships;
        CREATE POLICY "partnerships_read" ON partnerships
          FOR SELECT
          USING (true);

        DROP POLICY IF EXISTS "partnerships_admin_write" ON partnerships;
        CREATE POLICY "partnerships_admin_write" ON partnerships
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM admin
              WHERE admin.user_id = auth.uid()
              AND admin.roles @> '["super_admin", "content_admin"]'::TEXT[]
            )
          );
      `,
    });

    // Challenges - Public read, admin write
    await supabase.rpc("execute_sql", {
      sql: `
        ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "challenges_read" ON challenges;
        CREATE POLICY "challenges_read" ON challenges
          FOR SELECT
          USING (true);

        DROP POLICY IF EXISTS "challenges_admin_write" ON challenges;
        CREATE POLICY "challenges_admin_write" ON challenges
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM admin
              WHERE admin.user_id = auth.uid()
              AND admin.roles @> '["super_admin", "content_admin"]'::TEXT[]
            )
          );
      `,
    });

    // Referral programs - Users can read own, admin write
    await supabase.rpc("execute_sql", {
      sql: `
        ALTER TABLE referral_programs ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "referral_read_own" ON referral_programs;
        CREATE POLICY "referral_read_own" ON referral_programs
          FOR SELECT
          USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

        DROP POLICY IF EXISTS "referral_admin_write" ON referral_programs;
        CREATE POLICY "referral_admin_write" ON referral_programs
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM admin
              WHERE admin.user_id = auth.uid()
              AND admin.roles @> '["super_admin"]'::TEXT[]
            )
          );
      `,
    });

    console.log("✓ RLS policies configured\n");

    console.log("✅ Growth Hub migration completed successfully!");
    console.log("\nNew tables created:");
    console.log("  - partnerships");
    console.log("  - challenges");
    console.log("  - referral_programs");
    console.log("  - partnership_applications");
    console.log("  - challenge_participants");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

// Run migrations
applyMigrations();
