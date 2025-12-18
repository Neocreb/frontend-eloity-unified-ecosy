#!/usr/bin/env node

import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Error: Database URL not set. Set SUPABASE_DB_URL or DATABASE_URL');
  process.exit(1);
}

const sql = postgres(dbUrl);

async function applyMigration() {
  try {
    console.log('🔄 Applying product_reviews schema migration...\n');

    // 1. Create product_reviews table with proper structure
    console.log('📋 Creating product_reviews table...');
    await sql`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id uuid NOT NULL,
        user_id uuid NOT NULL,
        order_id uuid,
        rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title text,
        content text,
        images jsonb,
        verified_purchase boolean DEFAULT false,
        helpful_count integer DEFAULT 0,
        is_featured boolean DEFAULT false,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );
    `;
    console.log('✅ product_reviews table created\n');

    // 2. Add foreign key constraints if they don't exist
    console.log('🔗 Adding foreign key constraints...');
    
    // Check if products table exists before adding FK
    const productsExists = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'products'
      );
    `;
    
    if (productsExists[0].exists) {
      await sql`
        ALTER TABLE product_reviews 
        ADD CONSTRAINT fk_product_reviews_product_id 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        ON CONFLICT DO NOTHING;
      `;
      console.log('✅ Added FK constraint: product_reviews → products\n');
    }

    // Check if users table exists before adding FK
    const usersExists = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `;
    
    if (usersExists[0].exists) {
      await sql`
        ALTER TABLE product_reviews 
        ADD CONSTRAINT fk_product_reviews_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ON CONFLICT DO NOTHING;
      `;
      console.log('✅ Added FK constraint: product_reviews → users\n');
    }

    // Check if orders table exists before adding FK
    const ordersExists = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'orders'
      );
    `;
    
    if (ordersExists[0].exists) {
      await sql`
        ALTER TABLE product_reviews 
        ADD CONSTRAINT fk_product_reviews_order_id 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
        ON CONFLICT DO NOTHING;
      `;
      console.log('✅ Added FK constraint: product_reviews → orders\n');
    }

    // 3. Create indexes for performance
    console.log('⚡ Creating indexes for performance...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id 
      ON product_reviews(product_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id 
      ON product_reviews(user_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at 
      ON product_reviews(created_at DESC);
    `;
    console.log('✅ Indexes created\n');

    // 4. Verify the table structure
    console.log('🔍 Verifying table structure...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'product_reviews'
      ORDER BY ordinal_position;
    `;

    console.log('📊 product_reviews table structure:');
    columns.forEach((col) => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
      console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}`);
    });
    console.log();

    // 5. Check foreign keys
    console.log('🔗 Verifying foreign key constraints...');
    const fks = await sql`
      SELECT constraint_name, column_name, referenced_table_name
      FROM information_schema.key_column_usage
      WHERE table_name = 'product_reviews'
      AND referenced_table_name IS NOT NULL;
    `;

    if (fks.length > 0) {
      fks.forEach((fk) => {
        console.log(`   ✓ ${fk.constraint_name}`);
      });
    } else {
      console.log('   ⚠️  No foreign keys found (tables may not exist yet)');
    }
    console.log();

    console.log('✅ Migration completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Verify the schema in Supabase dashboard');
    console.log('   2. If all tables exist, the foreign keys should be active');
    console.log('   3. If tables are missing, they will be created by other migrations');
    console.log('   4. Restart the dev server to refresh Supabase schema cache\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyMigration();
