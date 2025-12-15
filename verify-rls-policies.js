#!/usr/bin/env node
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });

async function main() {
  try {
    const rows = await sql`
      SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
      FROM pg_policies 
      WHERE tablename = 'group_chat_threads'
      ORDER BY policyname;
    `;
    
    console.log('✅ Current RLS Policies on group_chat_threads:');
    console.log('=============================================');
    
    if (rows.length === 0) {
      console.log('No RLS policies found!');
      process.exit(1);
    }
    
    rows.forEach(row => {
      console.log(`\nPolicy: ${row.policyname}`);
      console.log(`  Type: ${row.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'}`);
      console.log(`  Roles: ${row.roles || 'all'}`);
      console.log(`  USING clause: ${row.qual || 'N/A'}`);
      console.log(`  WITH CHECK: ${row.with_check || 'N/A'}`);
    });
    
    // Check if the public visibility policy exists
    const hasPublicPolicy = rows.some(row => 
      row.policyname === 'Users can view group chat threads' &&
      row.qual && row.qual.includes("privacy = 'public'")
    );
    
    console.log('\n=============================================');
    if (hasPublicPolicy) {
      console.log('✅ PUBLIC VISIBILITY POLICY IS CORRECTLY APPLIED!');
    } else {
      console.log('❌ Public visibility policy not found or incorrect');
    }
    
    await sql.end();
    process.exit(hasPublicPolicy ? 0 : 1);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
