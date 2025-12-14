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

async function fixAdminLogin() {
  console.log("🔧 Checking admin user status...\n");

  try {
    // Check if eloityhq@gmail.com exists in admin_users
    console.log("📋 Verifying admin_users table...");
    
    const { data: adminUsers, error: readError } = await supabase
      .from("admin_users")
      .select("id, user_id, email, name, roles, is_active")
      .eq("email", "eloityhq@gmail.com");

    if (readError) {
      console.log("⚠️  Error reading admin_users (this is the RLS problem):");
      console.log(`   Code: ${readError.code}`);
      console.log(`   Message: ${readError.message}`);
      console.log(`   Status: ${readError.status}`);
    } else if (adminUsers && adminUsers.length > 0) {
      const admin = adminUsers[0];
      console.log("✅ Admin user found in database:");
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Roles: ${admin.roles?.join(", ") || "None"}`);
      console.log(`   Status: ${admin.is_active ? "Active" : "Inactive"}`);
    } else {
      console.log("❌ Admin user not found in admin_users table");
    }

    // The issue is RLS policies - suggest manual fix
    console.log("\n" + "=".repeat(70));
    console.log("🔐 RLS POLICY FIX REQUIRED");
    console.log("=".repeat(70));
    console.log("\nThe admin_users table has Row Level Security enabled but");
    console.log("missing the policies needed for login.\n");
    
    console.log("📝 SOLUTION: Apply this SQL in Supabase SQL Editor:\n");
    
    console.log(`
-- Drop old policies
DROP POLICY IF EXISTS "Users can read their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;

-- Allow users to read their own admin record (required for login)
CREATE POLICY "Users can read their own admin record" ON public.admin_users
    FOR SELECT 
    USING (user_id = auth.uid());

-- Allow admins to read all admin records
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

    console.log("📋 STEPS:");
    console.log("1. Go to https://app.supabase.com");
    console.log("2. Select your project (hjebzdekquczudhrygns)");
    console.log("3. Click 'SQL Editor' in the left menu");
    console.log("4. Click 'New Query'");
    console.log("5. Paste the SQL above");
    console.log("6. Click 'Run'");
    console.log("\n✅ Then refresh your browser and try logging in");

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixAdminLogin().catch(console.error);
