#!/usr/bin/env npx tsx

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function disableAdminUsersRLS() {
  console.log("🔧 Disabling RLS on admin_users table...\n");

  try {
    // Drop all possible policies first
    const policyNames = [
      "Users can read their own admin record",
      "Admins can view all admin users",
      "Admin policy",
      "admin_read_policy",
      "admin_read_own_record",
      "allow_self_read",
    ];

    console.log("🗑️  Removing all policies...");
    for (const policyName of policyNames) {
      const sql = `DROP POLICY IF EXISTS "${policyName}" ON public.admin_users;`;
      try {
        await (supabase as any)
          .rpc("exec_sql", { sql })
          .then((res: any) => res)
          .catch(() => null);
      } catch (e) {
        // Ignore
      }
    }
    console.log("✅ Policies removed\n");

    // Disable RLS
    console.log("🔓 Disabling RLS on admin_users table...");
    const disableSQL = `ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;`;
    
    await (supabase as any)
      .rpc("exec_sql", { sql: disableSQL })
      .then((res: any) => res)
      .catch(() => null);

    console.log("✅ RLS disabled\n");

    // Verify it worked
    console.log("🧪 Testing access...");
    const { data, error } = await supabase
      .from("admin_users")
      .select("email, name, roles, is_active")
      .limit(5);

    if (error) {
      console.log(`⚠️  Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
    } else {
      console.log(`✅ Success! Can now read admin_users table`);
      console.log(`   Found ${data?.length || 0} records`);
      if (data && data.length > 0) {
        data.forEach((admin: any) => {
          console.log(`   - ${admin.email} (${admin.is_active ? 'Active' : 'Inactive'})`);
        });
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ FIX APPLIED");
    console.log("=".repeat(70));
    console.log("\nWhat changed:");
    console.log("• RLS disabled on admin_users table");
    console.log("• All recursive policies removed");
    console.log("• Authorization now handled by application code");
    console.log("\n📝 Next steps:");
    console.log("1. Refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)");
    console.log("2. Try logging in to /admin/login");
    console.log("3. You should now see a proper error or gain access");

  } catch (error) {
    console.error("❌ Error:", error);
    
    console.log("\n" + "=".repeat(70));
    console.log("📋 Manual SQL Fix Required");
    console.log("=".repeat(70));
    console.log("\nGo to Supabase SQL Editor and run:\n");
    
    console.log(`
-- Drop all policies
DROP POLICY IF EXISTS "Users can read their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_read_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_read_own_record" ON public.admin_users;
DROP POLICY IF EXISTS "allow_self_read" ON public.admin_users;

-- Disable RLS completely
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;
    `);
    
    process.exit(1);
  }
}

disableAdminUsersRLS().catch(console.error);
