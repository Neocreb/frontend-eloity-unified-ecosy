#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL and Service Role Key are required');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('\n🚀 Applying landing page schema to Supabase...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/landing_page_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📋 Step 1: Creating landing tables...');

    // Execute the migration
    const { error } = await supabase.rpc('exec', { sql: migrationSQL });

    if (error) {
      // RPC exec might not be available, try alternative approach
      console.log('⚠️  RPC method not available, attempting alternative approach...');
      
      // Split SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (!statement) continue;
        
        try {
          const { error: stmtError } = await supabase.rpc('exec', { sql: statement + ';' });
          if (stmtError && !stmtError.message.includes('PGRST')) {
            console.log(`⚠️  Some statements may have failed. Please run manually via Supabase SQL Editor.`);
            break;
          }
        } catch (e) {
          // Continue with next statement
        }
      }
    }

    console.log('✅ Step 2: Verifying tables were created...');

    // Check if tables exist
    const tables = [
      'landing_testimonials',
      'landing_faqs',
      'landing_use_cases',
      'landing_social_proof_stats',
      'landing_comparison_matrix',
      'landing_waitlist_leads'
    ];

    let allTablesExist = true;
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ Table '${table}' not found or not accessible`);
        allTablesExist = false;
      } else {
        console.log(`✅ Table '${table}' verified`);
      }
    }

    if (allTablesExist) {
      console.log('\n' + '='.repeat(60));
      console.log('✅ SUCCESS: Landing page schema applied successfully!');
      console.log('='.repeat(60));
      console.log('\nAvailable endpoints:');
      console.log('  GET /api/landing/testimonials');
      console.log('  GET /api/landing/faqs');
      console.log('  GET /api/landing/use-cases');
      console.log('  GET /api/landing/social-proof-stats');
      console.log('  GET /api/landing/comparison-matrix');
      console.log('  POST /api/landing/waitlist\n');
    } else {
      console.log('\n⚠️  Some tables may not be accessible. You may need to:');
      console.log('1. Apply the migration manually via Supabase SQL Editor');
      console.log('2. Check your Supabase credentials');
      console.log('3. Ensure RLS policies allow table access\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.log('\n📝 MANUAL ALTERNATIVE:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Click "SQL Editor"');
    console.log('3. Click "New Query"');
    console.log('4. Paste the contents of: migrations/landing_page_schema.sql');
    console.log('5. Click "Run"\n');
    process.exit(1);
  }
}

applyMigration().catch(console.error);
