# Setting Up the Receipts Table in Supabase

## Problem
The Receipts page is showing error: "Error fetching user receipts: [object Object]" because the `receipts` table doesn't exist in your Supabase database.

## Solution

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the SQL Migration
Copy and paste the entire SQL script below into the SQL editor:

```sql
-- Create receipts table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_transaction_id ON public.receipts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_receipts_generated_at ON public.receipts(generated_at);

-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing ones first)
DROP POLICY IF EXISTS "Users can view their own receipts" ON public.receipts;
DROP POLICY IF EXISTS "Users can create their own receipts" ON public.receipts;
DROP POLICY IF EXISTS "Users can delete their own receipts" ON public.receipts;
DROP POLICY IF EXISTS "Users can update their own receipts" ON public.receipts;

CREATE POLICY "Users can view their own receipts"
  ON public.receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own receipts"
  ON public.receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts"
  ON public.receipts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipts"
  ON public.receipts FOR DELETE
  USING (auth.uid() = user_id);
```

### Step 3: Execute the Query
1. Click the **Run** button (or press `Ctrl+Enter`)
2. You should see the message: "Executed successfully"
3. Check the **Tables** section in the left sidebar - you should now see the `receipts` table

### Step 4: Verify in Your App
1. Go back to your app
2. Navigate to the Receipts page (`/app/wallet/receipts`)
3. The error should be resolved and you should see "No Transactions Yet" or your transaction list

## What Was Changed

### Code Updates Made:
1. **Schema** (`shared/enhanced-schema.ts`):
   - Added `receipts` table definition with Drizzle ORM

2. **Error Handling** (`src/services/receiptService.ts`):
   - Improved error messages to show actual error details instead of "[object Object]"
   - Better error propagation and logging

3. **Hook** (`src/hooks/useReceipts.ts`):
   - Enhanced error handling with more descriptive messages

4. **Component** (`src/pages/wallet/Receipts.tsx`):
   - Added error state display to show database errors to users
   - Added retry button for failed loads

## Troubleshooting

### If you get "relation 'receipts' already exists"
This is fine - the table already exists. Just close the error and refresh your browser.

### If you still get an error after running the SQL
1. Check that you're using a **Supabase role with admin/owner permissions**
2. Verify the SQL didn't have syntax errors
3. Check the **Logs** section in Supabase dashboard for error details
4. Try copying the raw SQL from `scripts/setup-receipts-table.sql`

### If the page shows "No Transactions Yet"
This is normal! You either:
- Haven't made any transactions yet, or
- The Receipts table is created but doesn't have data

You can generate receipts once you have transactions.

## Database Structure

The receipts table has:
- `id`: Unique identifier
- `transaction_id`: Links to the transaction being receipted
- `user_id`: Who owns this receipt
- `receipt_number`: Unique receipt number (format: RCP-{timestamp}-{random})
- `generated_at`: When the receipt was created
- `file_path`: Optional path to stored PDF
- `created_at` / `updated_at`: Timestamps for tracking

Row Level Security (RLS) policies ensure:
- Users can only view their own receipts
- Users can only create receipts for their own transactions
- Users can only update/delete their own receipts
