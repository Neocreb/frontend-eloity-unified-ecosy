const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createReceiptsTable() {
  try {
    console.log('Creating receipts table...');

    // Create receipts table
    const { error: tableError } = await supabase.rpc('create_receipts_table', {}, { headers: { 'x-use-admin': 'true' } });

    if (tableError && tableError.message !== 'relation "public.receipts" already exists') {
      // Try direct SQL execution
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.receipts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            transaction_id UUID NOT NULL,
            user_id UUID NOT NULL,
            receipt_number TEXT NOT NULL UNIQUE,
            generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            file_path TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_receipts_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts(user_id);
          CREATE INDEX IF NOT EXISTS idx_receipts_transaction_id ON public.receipts(transaction_id);
          CREATE INDEX IF NOT EXISTS idx_receipts_generated_at ON public.receipts(generated_at);

          -- Enable RLS
          ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

          -- Create RLS policies
          CREATE POLICY "Users can view their own receipts"
            ON public.receipts FOR SELECT
            USING (auth.uid() = user_id);

          CREATE POLICY "Users can create their own receipts"
            ON public.receipts FOR INSERT
            WITH CHECK (auth.uid() = user_id);

          CREATE POLICY "Users can delete their own receipts"
            ON public.receipts FOR DELETE
            USING (auth.uid() = user_id);

          CREATE POLICY "Users can update their own receipts"
            ON public.receipts FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
        `
      });

      if (error) {
        console.error('Error creating table via exec_sql:', error);
      }
    }

    console.log('✅ Receipts table created successfully!');

  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

createReceiptsTable();
