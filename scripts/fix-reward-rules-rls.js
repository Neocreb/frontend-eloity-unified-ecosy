#!/usr/bin/env node

import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Error: Database URL not set. Set SUPABASE_DB_URL or DATABASE_URL');
  process.exit(1);
}

const sql = postgres(dbUrl);

async function fixRewardRulesRLS() {
  try {
    console.log('🔄 Fixing reward_rules RLS policies...\n');

    // 1. Check if reward_rules table exists
    console.log('📋 Checking reward_rules table...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'reward_rules';
    `;

    if (tables.length === 0) {
      console.log('⚠️  reward_rules table does not exist. Skipping RLS setup.\n');
      console.log('💡 Hint: Run database migrations first with: npm run migrate:apply\n');
      process.exit(0);
    }

    console.log('✅ reward_rules table exists\n');

    // 2. Enable RLS on reward_rules
    console.log('🔐 Enabling Row Level Security on reward_rules...');
    await sql`ALTER TABLE public.reward_rules ENABLE ROW LEVEL SECURITY;`;
    console.log('✅ RLS enabled on reward_rules\n');

    // 3. Drop existing policies (safely)
    console.log('🗑️  Removing old RLS policies...');
    await sql`DROP POLICY IF EXISTS "reward_rules_public_select" ON public.reward_rules;`;
    await sql`DROP POLICY IF EXISTS "reward_rules_admin_all" ON public.reward_rules;`;
    await sql`DROP POLICY IF EXISTS "Admins can manage reward rules" ON public.reward_rules;`;
    console.log('✅ Old policies removed\n');

    // 4. Create new, simpler RLS policies
    console.log('📝 Creating new RLS policies for reward_rules...\n');

    // Policy 1: Anyone (authenticated and anonymous) can read active rules
    console.log('  - Creating policy: "reward_rules_read_active"');
    await sql`
      CREATE POLICY "reward_rules_read_active"
      ON public.reward_rules
      FOR SELECT
      USING (is_active = true);
    `;
    console.log('    ✓ Active rules readable by all');

    // Policy 2: Service role / admin can manage all rules
    console.log('  - Creating policy: "reward_rules_admin_manage"');
    await sql`
      CREATE POLICY "reward_rules_admin_manage"
      ON public.reward_rules
      FOR ALL
      USING (
        current_user_id() = 
        (SELECT id FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
      );
    `;
    console.log('    ✓ Admins can manage all rules');

    // Policy 3: Fallback for service role (bypasses RLS)
    // Note: Service role always bypasses RLS, so this is just for clarity
    console.log('  - Service role has full access (bypasses RLS)\n');

    // 5. Grant appropriate permissions
    console.log('📊 Setting table permissions...\n');

    console.log('  - Granting SELECT on reward_rules to authenticated users');
    await sql`GRANT SELECT ON public.reward_rules TO authenticated;`;

    console.log('  - Granting SELECT on reward_rules to anonymous users');
    await sql`GRANT SELECT ON public.reward_rules TO anon;`;

    console.log('  - Granting full access to service role');
    await sql`GRANT ALL ON public.reward_rules TO service_role;`;

    console.log('\n✅ Permissions configured\n');

    // 6. Verify the setup
    console.log('🔍 Verifying RLS configuration...');
    const policies = await sql`
      SELECT policyname, permissive, roles
      FROM pg_policies
      WHERE tablename = 'reward_rules'
      ORDER BY policyname;
    `;

    if (policies.length === 0) {
      console.log('⚠️  No policies found. This might be expected depending on RLS_BYPASS_RLS.\n');
    } else {
      console.log('\n📋 Active Policies on reward_rules:\n');
      policies.forEach((policy) => {
        console.log(`  ✓ ${policy.policyname} (${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'})`);
      });
    }

    console.log('\n✅ RLS setup completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Restart the development server');
    console.log('   2. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('   3. Test that reward_rules are loading without permission errors\n');
    console.log('💡 If you still see permission errors:');
    console.log('   - The RLS policy might be too restrictive');
    console.log('   - Check that your user has the admin role set in raw_user_meta_data');
    console.log('   - Or temporarily disable RLS for testing with: ALTER TABLE reward_rules DISABLE ROW LEVEL SECURITY;\n');

  } catch (error) {
    console.error('❌ Error fixing RLS:', error.message);
    if (error.message.includes('current_user_id')) {
      console.log('\n💡 Hint: The current_user_id() function might not exist.');
      console.log('   Use auth.uid() instead in your Supabase version.\n');
    }
    process.exit(1);
  } finally {
    await sql.end();
  }
}

fixRewardRulesRLS();
