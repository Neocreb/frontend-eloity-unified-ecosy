-- Migration: Add missing schema columns and tables
-- This fixes "Failed to load data" errors throughout the app

-- Step 1: Add missing column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reputation INTEGER DEFAULT 0;

-- Step 2: Add missing columns to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 3: Add missing column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Step 4: Add missing column to crypto_wallets table (if it exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'crypto_wallets') THEN
    ALTER TABLE public.crypto_wallets ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USDT';
  END IF;
END $$;

-- Step 5: Create freelance_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.freelance_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 6: Create user_rewards table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_amount NUMERIC(10, 2) NOT NULL,
  reward_type TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 7: Ensure referral_rewards table has reward_amount column
ALTER TABLE public.referral_rewards ADD COLUMN IF NOT EXISTS reward_amount NUMERIC(10, 2) DEFAULT 0;

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_reputation ON public.profiles(reputation);
CREATE INDEX IF NOT EXISTS idx_freelance_payments_user ON public.freelance_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON public.user_rewards(user_id);

-- Step 9: Grant permissions
GRANT ALL ON public.freelance_payments TO authenticated;
GRANT ALL ON public.user_rewards TO authenticated;
GRANT SELECT ON public.freelance_payments TO anon;
GRANT SELECT ON public.user_rewards TO anon;

SELECT 'Missing schema columns and tables added successfully' as status;
