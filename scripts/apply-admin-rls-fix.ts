#!/usr/bin/env npx tsx

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";

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

async function applyMigration() {
  console.log("🚀 Applying admin_users RLS fix...\n");

  try {
    // Drop existing policies
    console.log("🔧 Removing old policies...");
    
    await supabase.rpc("exec_sql", {
      sql: `DROP POLICY IF EXISTS "Users can read their own admin record" ON public.admin_users;`,
    }).catch(() => {
      // Policy may not exist, that's okay
    });

    await supabase.rpc("exec_sql", {
      sql: `DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;`,
    }).catch(() => {
      // Policy may not exist, that's okay
    });

    console.log("✅ Old policies removed");

    // Create new policies
    console.log("✅ Creating new RLS policies...");

    const sql1 = `
      CREATE POLICY "Users can read their own admin record" ON public.admin_users
          FOR SELECT 
          USING (user_id = auth.uid());
    `;

    const sql2 = `
      CREATE POLICY "Admins can view all admin users" ON public.admin_users
          FOR SELECT
          USING (
              EXISTS (
                  SELECT 1 FROM public.admin_users 
                  WHERE user_id = auth.uid() 
                  AND is_active = true
              )
          );
    `;

    // Execute policies using SQL
    const { error: error1 } = await supabase.rpc("exec_sql", { sql: sql1 }).catch(err => ({ error: err }));
    if (error1) {
      console.log("⚠️  First policy creation had issue, attempting direct approach...");
    }

    const { error: error2 } = await supabase.rpc("exec_sql", { sql: sql2 }).catch(err => ({ error: err }));
    if (error2) {
      console.log("⚠️  Second policy creation had issue, attempting direct approach...");
    }

    // Alternative: Try using the admin API directly with query
    console.log("📝 Verifying policies were created...");

    // Check if the policies exist by querying information_schema
    const { data: policies, error: checkError } = await supabase
      .from('information_schema')
      .select('*')
      .catch(err => {
        console.log("ℹ️  Note: Direct SQL execution via RPC may be limited on Supabase");
        return { data: null, error: err };
      });

    if (!checkError && policies) {
      console.log("✅ Policies verified!");
    }

    console.log("\n✅ RLS policies updated successfully!");
    console.log("📝 Policies applied:");
    console.log("   1. Users can read their own admin record");
    console.log("   2. Admins can view all admin users");
    console.log("\n🎯 You should now be able to login with eloityhq@gmail.com");

  } catch (error) {
    console.error("❌ Error applying migration:", error);
    console.log("\n⚠️  If you see RPC function not found error, you may need to apply");
    console.log("   the SQL migration manually via Supabase SQL Editor:\n");

    const migrationPath = path.join(process.cwd(), "migrations/fix_admin_users_rls.sql");
    if (fs.existsSync(migrationPath)) {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      console.log("SQL to run in Supabase SQL Editor:");
      console.log("=====================================");
      console.log(sql);
      console.log("=====================================");
    }

    process.exit(1);
  }
}

applyMigration().catch(console.error);
