#!/usr/bin/env node

/**
 * Migration Script: Remove Crypto Trading Feature
 * This script safely removes the crypto_trades table and backs it up
 * 
 * Usage: npm run migrate:remove-trading
 * or: node scripts/remove-crypto-trading.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Log file for migration
const logFile = path.join(__dirname, 'logs', `crypto-trading-removal-${new Date().toISOString().split('T')[0]}.log`);
const logsDir = path.dirname(logFile);

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

async function backupCryptoTrades() {
  log('📦 Starting backup of crypto_trades table...');
  
  try {
    const { data, error } = await supabase
      .from('crypto_trades')
      .select('*');
    
    if (error) {
      if (error.code === 'PGRST116') {
        log('ℹ️  Table crypto_trades does not exist (already removed)');
        return null;
      }
      throw error;
    }

    if (data && data.length > 0) {
      const backupFileName = path.join(__dirname, '..', 'backups', `crypto_trades_backup_${new Date().toISOString().split('T')[0]}.json`);
      const backupDir = path.dirname(backupFileName);
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      fs.writeFileSync(backupFileName, JSON.stringify(data, null, 2));
      log(`✅ Backup created: ${backupFileName}`);
      log(`   Records backed up: ${data.length}`);
      return backupFileName;
    } else {
      log('ℹ️  crypto_trades table is empty (no backup needed)');
      return null;
    }
  } catch (error) {
    log(`❌ Backup error: ${error.message}`);
    throw error;
  }
}

async function dropCryptoTradesTable() {
  log('🗑️  Dropping crypto_trades table...');
  
  try {
    const { error } = await supabase.rpc('execute_sql', {
      sql: 'DROP TABLE IF EXISTS crypto_trades CASCADE;'
    });

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    log('✅ crypto_trades table dropped successfully');
  } catch (error) {
    if (error.message && error.message.includes('does not exist')) {
      log('ℹ️  crypto_trades table does not exist (already removed)');
    } else {
      log(`❌ Drop table error: ${error.message}`);
      throw error;
    }
  }
}

async function removeCryptoTrades() {
  log('📋 Removing crypto_trades table from database...');
  
  try {
    // Note: This approach uses raw SQL execution if available
    // If not available, you may need to use the Supabase CLI or SQL editor
    
    const sql = `
    -- Drop crypto_trades table and related objects
    DROP TABLE IF EXISTS crypto_trades CASCADE;
    
    -- Log the migration
    INSERT INTO public.migrations (name, executed_at) 
    VALUES ('remove_crypto_trades_table', NOW())
    ON CONFLICT DO NOTHING;
    `;

    // Since Supabase doesn't provide direct SQL execution via JS client,
    // we'll provide instructions for manual execution
    log('⚠️  Supabase JS client does not support raw SQL execution');
    log('');
    log('📝 Please execute the following SQL in your Supabase SQL Editor:');
    log('');
    log(sql);
    log('');
    
  } catch (error) {
    log(`❌ Error: ${error.message}`);
  }
}

async function verifyRemoval() {
  log('🔍 Verifying table removal...');
  
  try {
    const { data, error } = await supabase
      .from('crypto_trades')
      .select('count', { count: 'exact' });
    
    if (error && error.code === 'PGRST116') {
      log('✅ Verification complete: crypto_trades table successfully removed');
      return true;
    }
    
    log('⚠️  crypto_trades table still exists');
    return false;
  } catch (error) {
    log(`⚠️  Verification check skipped: ${error.message}`);
    return null;
  }
}

async function main() {
  log('═══════════════════════════════════════════════════════════════');
  log('🚀 CRYPTO TRADING FEATURE REMOVAL MIGRATION');
  log('═══════════════════════════════════════════════════════════════');
  log('');
  log('This script will:');
  log('1. Backup the crypto_trades table (if it contains data)');
  log('2. Remove the crypto_trades table from the database');
  log('3. Verify the removal was successful');
  log('');

  try {
    // Step 1: Backup
    const backupFile = await backupCryptoTrades();
    
    // Step 2: Drop table
    await removeCryptoTrades();
    
    // Step 3: Verify
    const verified = await verifyRemoval();

    log('');
    log('═══════════════════════════════════════════════════════════════');
    if (verified) {
      log('✅ MIGRATION COMPLETED SUCCESSFULLY');
    } else if (verified === null) {
      log('⚠️  MIGRATION STATUS UNCLEAR - MANUAL VERIFICATION NEEDED');
    } else {
      log('❌ MIGRATION INCOMPLETE - MANUAL EXECUTION REQUIRED');
    }
    log('═══════════════════════════════════════════════════════════════');
    log('');
    log(`📄 Migration log saved to: ${logFile}`);
    
    if (backupFile) {
      log(`💾 Backup saved to: ${backupFile}`);
    }
    
    log('');
    log('📚 Next Steps:');
    log('1. Execute the SQL provided above in Supabase SQL Editor');
    log('2. Remove trading-related component files from src/');
    log('3. Update App.tsx to remove crypto-trading route');
    log('4. Update ViewAllCoins.tsx to remove trading navigation');
    log('5. Run: npm run build');
    log('6. Test the new Crypto Intelligence hub at /app/crypto-intelligence');
    log('');

  } catch (error) {
    log('');
    log('═══════════════════════════════════════════════════════════════');
    log(`❌ MIGRATION FAILED: ${error.message}`);
    log('═══════════════════════════════════════════════════════════════');
    process.exit(1);
  }
}

// Run the migration
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
