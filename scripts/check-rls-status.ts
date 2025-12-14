#!/usr/bin/env npx tsx

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSStatus() {
  console.log("🔍 Checking actual RLS status on admin_users table...\n");

  try {
    // Try to query the table directly
    console.log("📋 Attempting direct table query...");
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1);

    if (error) {
      console.log("❌ Query failed:");
      console.log("   Code:", error.code);
      console.log("   Message:", error.message);
      console.log("   Status:", error.status);
      
      if (error.message && error.message.includes('recursion')) {
        console.log("\n🚨 CRITICAL: STILL HAS RECURSIVE POLICIES!");
        console.log("    The RLS disable command did not work.");
        console.log("    Need to fix this manually in Supabase SQL Editor.");
      }
    } else {
      console.log("✅ Query succeeded!");
      console.log("   Records:", data?.length);
    }

  } catch (e) {
    console.error("Error:", e);
  }
}

checkRLSStatus();
