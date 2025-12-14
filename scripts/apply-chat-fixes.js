#!/usr/bin/env node
/**
 * Apply chat database fixes to Supabase
 * Applies migrations: 0045, 0046, 0047, 0048
 */

import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local'), override: true });

const MIGRATIONS = [
  '0045_create_chat_participants_table.sql',
  '0046_fix_group_chat_threads_public_visibility.sql',
  '0047_enhance_chat_conversations_schema.sql',
  '0048_fix_chat_messages_schema.sql',
];

function splitStatements(sql) {
  if (sql.includes('--> statement-breakpoint')) {
    return sql.split(/--\> statement-breakpoint/g).filter(s => s.trim());
  }
  return [sql];
}

function isBenignError(err) {
  const code = err && (err.code || err.sqlState);
  const msg = (err && err.message) || '';
  return (
    code === '42P07' ||
    code === '42710' ||
    /already exists/i.test(msg) ||
    /duplicate/i.test(msg) ||
    (code === '42703' && /foreign key constraint/i.test(msg))
  );
}

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ No database URL found. Please set SUPABASE_DB_URL or DATABASE_URL');
    process.exit(1);
  }

  const sql = postgres(dbUrl);

  try {
    console.log('📦 Applying chat database fixes...\n');

    for (const migration of MIGRATIONS) {
      const filePath = path.join(__dirname, '../migrations', migration);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Migration not found: ${migration}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const statements = splitStatements(content);

      console.log(`📝 Applying ${migration}...`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (!stmt) continue;

        try {
          await sql.unsafe(stmt);
          console.log(`  ✓ Statement ${i + 1}/${statements.length} applied`);
        } catch (err) {
          if (isBenignError(err)) {
            console.log(`  ⊘ Statement ${i + 1}/${statements.length} skipped (already exists)`);
          } else {
            console.error(`  ✗ Error in statement ${i + 1}:`, err.message);
            throw err;
          }
        }
      }

      console.log(`✅ ${migration} completed\n`);
    }

    console.log('🎉 All migrations applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
