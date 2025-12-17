-- ============================================================================
-- WALLET FEATURE TABLES MIGRATION
-- ============================================================================
-- This script creates all database tables needed for the wallet features:
-- 1. Receipts - for transaction receipts
-- 2. Payment Links - for shareable payment requests
-- 3. Invoices - for invoice management
--
-- Run this script in Supabase SQL Editor to set up all tables at once
-- ============================================================================

-- ============================================================================
-- 1. RECEIPTS TABLE
-- ============================================================================
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

-- Indexes for receipts
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_transaction_id ON public.receipts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_receipts_generated_at ON public.receipts(generated_at);

-- RLS for receipts
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own receipts" ON public.receipts;
DROP POLICY IF EXISTS "Users can create their own receipts" ON public.receipts;
DROP POLICY IF EXISTS "Users can update their own receipts" ON public.receipts;
DROP POLICY IF EXISTS "Users can delete their own receipts" ON public.receipts;

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

-- ============================================================================
-- 2. PAYMENT LINKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  amount NUMERIC(10, 2),
  description TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  share_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_links_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for payment_links
CREATE INDEX IF NOT EXISTS idx_payment_links_user_id ON public.payment_links(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_code ON public.payment_links(code);
CREATE INDEX IF NOT EXISTS idx_payment_links_is_active ON public.payment_links(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_links_created_at ON public.payment_links(created_at);

-- RLS for payment_links
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can create payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can update their own payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can delete their own payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Anyone can view active payment links by code" ON public.payment_links;

CREATE POLICY "Users can view their own payment links"
  ON public.payment_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment links"
  ON public.payment_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment links"
  ON public.payment_links FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment links"
  ON public.payment_links FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active payment links by code"
  ON public.payment_links FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- 3. INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  recipient_email TEXT,
  recipient_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  notes TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoices_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_recipient_email ON public.invoices(recipient_email);

-- RLS for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;

CREATE POLICY "Users can view their own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
  ON public.invoices FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All three tables have been created with:
-- ✓ Primary keys and relationships
-- ✓ Appropriate indexes for performance
-- ✓ Foreign keys with auth.users
-- ✓ Row Level Security (RLS) enabled
-- ✓ User-specific access policies
-- ✓ Proper timestamps and constraints
--
-- The app is now ready to use all wallet features!
-- ============================================================================
