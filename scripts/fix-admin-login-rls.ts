#!/usr/bin/env npx tsx

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSPolicies() {
  console.log("🔧 Applying RLS policies for admin_users table...\n");

  try {
    // Step 1: Check current policies
    console.log("📋 Checking existing policies...");
    const { data: policies, error: policyError } = await supabase
      .from('information_schema.role_routine_grants')
      .select('*')
      .catch(() => ({ data: null, error: null }));

    // Step 2: Get current admin user records to verify they exist
    console.log("✅ Checking admin_users table structure...");
    const { data: adminUsers, error: tableError } = await supabase
      .from('admin_users')
      .select('user_id, email, name, is_active')
      .limit(5);

    if (tableError) {
      console.error("❌ Error reading admin_users table:", tableError);
      console.log("\n⚠️  This might be due to RLS policies blocking access.");
      console.log("   The table exists but policies need to be fixed.\n");
    } else {
      console.log(`✅ Found ${adminUsers?.length || 0} admin users in table`);
      if (adminUsers && adminUsers.length > 0) {
        adminUsers.forEach((admin: any) => {
          console.log(`   - ${admin.email} (${admin.is_active ? 'Active' : 'Inactive'})`);
        });
      }
    }

    // Step 3: Apply the RLS policies using direct SQL
    console.log("\n🔐 Creating RLS policies...");

    // Use the Postgres admin function to execute SQL
    const policiesToApply = [
      {
        name: "Users can read their own admin record",
        sql: `CREATE POLICY IF NOT EXISTS "Users can read their own admin record" ON public.admin_users
            FOR SELECT
            USING (user_id = auth.uid());`,
      },
      {
        name: "Admins can view all admin users",
        sql: `CREATE POLICY IF NOT EXISTS "Admins can view all admin users" ON public.admin_users
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid()
                    AND is_active = true
                )
            );`,
      },
    ];

    // Try to execute policies through Postgres function if available
    for (const policy of policiesToApply) {
      try {
        // Attempt using rpc if available
        const { error } = await (supabase as any).rpc('exec_sql', { 
          sql: policy.sql 
        }).catch((e: any) => ({ error: e }));

        if (error && error.code !== 'PGRST102') {
          console.log(`⚠️  Could not apply via RPC: ${policy.name}`);
        } else {
          console.log(`✅ ${policy.name}`);
        }
      } catch (e) {
        console.log(`ℹ️  Policy application note: ${policy.name}`);
      }
    }

    console.log("\n📋 RLS Policies to Apply Manually (if automatic failed):");
    console.log("=" * 70);
    console.log(`
DROP POLICY IF EXISTS "Users can read their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;

CREATE POLICY "Users can read their own admin record" ON public.admin_users
    FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all admin users" ON public.admin_users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );
    `);
    console.log("=" * 70);

    console.log("\n📝 Instructions:");
    console.log("1. Go to https://app.supabase.com");
    console.log("2. Select your project");
    console.log("3. Click SQL Editor");
    console.log("4. Paste the SQL above and click Run");
    console.log("\n✅ After running, refresh the browser and try logging in again");

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

applyRLSPolicies().catch(console.error);
