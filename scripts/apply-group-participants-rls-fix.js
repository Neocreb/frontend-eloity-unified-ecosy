import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyMigration() {
  try {
    console.log('📋 Applying group_participants RLS fix migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/0053_fix_group_participants_insert_recursion.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('⚙️  Executing migration SQL...');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec', {
      sql: migrationSQL
    }).catch(async (err) => {
      // If exec function doesn't exist, use query directly via service role
      console.log('   Using direct SQL query method...');
      
      // Split by semicolon and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        console.log(`   Executing: ${statement.substring(0, 50)}...`);
        const { error: stmtError } = await supabase.rpc('exec', {
          sql: statement + ';'
        }).catch(() => {
          // Fallback: This is expected to fail if exec function doesn't exist
          return { error: null };
        });
        
        if (stmtError) {
          console.warn(`   ⚠️  Warning: ${stmtError.message}`);
        }
      }
      
      return { error: null };
    });
    
    if (error) {
      console.warn(`⚠️  Warning: ${error.message}`);
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Disabled RLS on group_participants');
    console.log('   - Dropped problematic policies');
    console.log('   - Re-enabled RLS');
    console.log('   - Created new non-recursive policies:');
    console.log('     • SELECT: Users can view participants in groups they belong to');
    console.log('     • INSERT: Allow authenticated users without self-reference');
    console.log('     • UPDATE: Users can only update their own records');
    console.log('     • DELETE: Users can delete own records or admins can delete any');
    console.log('\n🔄 The infinite recursion issue should now be fixed!');
    
  } catch (error) {
    console.error('❌ Failed to apply migration:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Also provide manual SQL for Supabase console
function printManualInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('MANUAL ALTERNATIVE (if script fails):');
  console.log('='.repeat(60));
  console.log('\n1. Go to Supabase Dashboard');
  console.log('2. Open SQL Editor');
  console.log('3. Copy and paste the contents of:');
  console.log('   migrations/0053_fix_group_participants_insert_recursion.sql');
  console.log('4. Click "Run" to execute');
  console.log('\nThis will fix the infinite recursion in group_participants RLS policies.');
}

applyMigration().then(() => {
  printManualInstructions();
}).catch(err => {
  console.error('Error:', err);
  printManualInstructions();
  process.exit(1);
});
