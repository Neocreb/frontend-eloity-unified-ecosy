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

async function grantAdminAccess(email: string) {
  console.log(`🚀 Granting admin access to: ${email}\n`);

  try {
    // Step 1: Find the user in auth.users by email
    console.log("📧 Searching for user in authentication system...");
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error listing auth users:", authError);
      process.exit(1);
    }

    const authUser = authUsers?.users.find((u) => u.email === email);

    if (!authUser) {
      console.error(`❌ User with email ${email} not found in authentication system`);
      console.log("Please ensure the user has created an account on the platform first.");
      process.exit(1);
    }

    console.log(`✅ Found auth user: ${authUser.email} (ID: ${authUser.id})`);

    // Step 2: Check if user already exists in admin_users table
    console.log("🔍 Checking if user already has admin access...");
    const { data: existingAdmin, error: checkError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", authUser.id)
      .single();

    if (!checkError && existingAdmin) {
      if (existingAdmin.is_active) {
        console.log("✅ User already has active admin access");
        console.log(`   Email: ${existingAdmin.email}`);
        console.log(`   Name: ${existingAdmin.name || "Not set"}`);
        console.log(`   Roles: ${existingAdmin.roles?.join(", ") || "None"}`);
        process.exit(0);
      } else {
        console.log("⚠️  User has inactive admin record. Activating...");
      }
    }

    // Step 3: Add or update admin user record
    console.log("➕ Adding user to admin system...");

    const adminData = {
      user_id: authUser.id,
      email: authUser.email || email,
      name: authUser.user_metadata?.full_name || "Admin User",
      roles: ["super_admin"],
      permissions: [
        "admin.all",
        "users.all",
        "content.all",
        "marketplace.all",
        "crypto.all",
        "freelance.all",
        "financial.all",
        "settings.all",
        "moderation.all",
        "analytics.all",
        "system.all",
      ],
      is_active: true,
    };

    const { data: adminUser, error: insertError } = await supabase
      .from("admin_users")
      .upsert(adminData, { onConflict: "user_id" })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Error granting admin access:", insertError);
      process.exit(1);
    }

    console.log("✅ Admin access granted successfully!\n");
    console.log("📋 Admin Account Details:");
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.roles?.join(", ") || "super_admin"}`);
    console.log(`   Status: ${adminUser.is_active ? "Active" : "Inactive"}`);
    console.log(`\n🌐 Access the admin dashboard: /admin/login`);
    console.log(`📧 Use email: ${adminUser.email}`);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

// Get email from command line or use default
const email = process.argv[2] || "eloityhq@gmail.com";

grantAdminAccess(email)
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
