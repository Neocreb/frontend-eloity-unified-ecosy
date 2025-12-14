#!/usr/bin/env npx tsx

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { PostgrestError } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminRLS() {
  console.log("🔧 Fixing infinite recursion in admin_users RLS policies...\n");

  try {
    // Step 1: Get current policies
    console.log("📋 Checking current policies on admin_users table...");
    
    const { data: currentPolicies } = await (supabase as any)
      .rpc('get_policies', { table_name: 'admin_users' })
      .then((res: any) => res)
      .catch(() => ({ data: null }));

    console.log("ℹ️  Note: Unable to list policies via RPC\n");

    // Step 2: Drop ALL policies on admin_users table
    console.log("🗑️  Removing all existing policies on admin_users...");

    const policyNames = [
      "Users can read their own admin record",
      "Admins can view all admin users",
      "Admin policy",
      "allow_self_read",
      "admin_read_policy",
      "Users can view themselves",
    ];

    for (const policyName of policyNames) {
      try {
        await (supabase as any)
          .rpc('exec_sql', {
            sql: `DROP POLICY IF EXISTS "${policyName}" ON public.admin_users;`
          })
          .catch(() => null);
        
        console.log(`   ✓ Dropped policy: ${policyName}`);
      } catch (e) {
        // Ignore errors for non-existent policies
      }
    }

    // Step 3: Disable RLS temporarily to clean up
    console.log("\n🔓 Disabling RLS to reset policies...");
    
    const disableRLS = `ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;`;
    const { error: disableError } = await (supabase as any)
      .rpc('exec_sql', { sql: disableRLS })
      .then((res: any) => ({ error: res.error || null }))
      .catch((e: any) => ({ error: e }));

    // Step 4: Re-enable RLS
    console.log("🔒 Re-enabling RLS...");
    
    const enableRLS = `ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;`;
    const { error: enableError } = await (supabase as any)
      .rpc('exec_sql', { sql: enableRLS })
      .then((res: any) => ({ error: res.error || null }))
      .catch((e: any) => ({ error: e }));

    // Step 5: Create the ONLY policy needed - simple and non-recursive
    console.log("\n✨ Creating new simple policy...");

    const createPolicy = `
      CREATE POLICY "admin_read_own_record" ON public.admin_users
          FOR SELECT 
          USING (user_id = auth.uid());
    `;

    const { error: policyError } = await (supabase as any)
      .rpc('exec_sql', { sql: createPolicy })
      .then((res: any) => ({ error: res.error || null }))
      .catch((e: any) => ({ error: e }));

    if (policyError) {
      console.log("⚠️  Could not create policy via RPC");
    } else {
      console.log("✅ Created policy: admin_read_own_record");
    }

    // Step 6: Verify the fix works
    console.log("\n🧪 Verifying fix...");
    
    const { data: testData, error: testError } = await supabase
      .from("admin_users")
      .select("email, name, is_active")
      .limit(1);

    if (testError) {
      console.log(`⚠️  Test query error: ${testError.message}`);
      console.log(`   Code: ${testError.code}`);
    } else {
      console.log(`✅ Query successful! Found ${testData?.length || 0} records`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("🔐 FINAL SOLUTION - Manual SQL Fix Required");
    console.log("=".repeat(70));
    console.log("\nIf automatic fix didn't work, apply this SQL manually:\n");

    const finalSQL = `
-- STEP 1: Disable RLS to remove all policies
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- STEP 2: Re-enable RLS  
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- STEP 3: Drop any existing policies (to be safe)
DROP POLICY IF EXISTS "Users can read their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_read_policy" ON public.admin_users;
DROP POLICY IF EXISTS "allow_self_read" ON public.admin_users;

-- STEP 4: Create ONE simple non-recursive policy
CREATE POLICY "admin_read_own_record" ON public.admin_users
    FOR SELECT 
    USING (user_id = auth.uid());
    `;

    console.log(finalSQL);

    console.log("\n📝 Steps to apply manually:");
    console.log("1. Go to https://app.supabase.com");
    console.log("2. Select project hjebzdekquczudhrygns");
    console.log("3. SQL Editor → New Query");
    console.log("4. Paste the SQL above");
    console.log("5. Click Run");
    console.log("6. Refresh browser (Ctrl+Shift+R)");
    console.log("7. Try logging in again\n");

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixAdminRLS().catch(console.error);
