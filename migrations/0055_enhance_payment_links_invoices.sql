-- ============================================================================
-- Enhanced Payment Links and Invoices with Transaction Syncing
-- ============================================================================

-- Extend payment_links table with new payment type fields
ALTER TABLE public.payment_links 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS link_category VARCHAR(50), -- standard, donation, registration, subscription, fundraising, product
ADD COLUMN IF NOT EXISTS recurring_interval VARCHAR(20), -- for subscriptions: monthly, quarterly, annually
ADD COLUMN IF NOT EXISTS recurring_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_amount NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS max_amount NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS custom_fields JSONB,
ADD COLUMN IF NOT EXISTS success_redirect_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Extend invoices table with transaction tracking
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS transaction_id UUID,
ADD COLUMN IF NOT EXISTS payment_link_id UUID REFERENCES public.payment_links(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reminder_sent_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Create payment_link_transactions table for tracking link usage
CREATE TABLE IF NOT EXISTS public.payment_link_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_link_id UUID NOT NULL REFERENCES public.payment_links(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payer_email TEXT,
  payer_name TEXT,
  amount NUMERIC(15, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'completed', -- pending, completed, failed, refunded
  payment_method TEXT,
  payment_reference TEXT UNIQUE,
  custom_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create invoice_transactions table for syncing invoices to wallet
CREATE TABLE IF NOT EXISTS public.invoice_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  transaction_id UUID, -- reference to wallet transaction
  wallet_sync_status VARCHAR(20) DEFAULT 'pending', -- pending, synced, failed
  sync_error TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create wallet transaction records table for invoice/payment link tracking
CREATE TABLE IF NOT EXISTS public.wallet_invoice_payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  payment_link_id UUID REFERENCES public.payment_links(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL, -- invoice_received, invoice_paid, payment_link_created, payment_link_used
  amount NUMERIC(15, 2),
  status VARCHAR(20) DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_payment_links_type ON public.payment_links(payment_type);
CREATE INDEX IF NOT EXISTS idx_payment_links_category ON public.payment_links(link_category);
CREATE INDEX IF NOT EXISTS idx_payment_link_transactions_link_id ON public.payment_link_transactions(payment_link_id);
CREATE INDEX IF NOT EXISTS idx_payment_link_transactions_user_id ON public.payment_link_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_link_transactions_created_at ON public.payment_link_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_invoice_transactions_invoice_id ON public.invoice_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_transactions_sync_status ON public.invoice_transactions(wallet_sync_status);
CREATE INDEX IF NOT EXISTS idx_wallet_invoice_payment_records_user_id ON public.wallet_invoice_payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_invoice_payment_records_invoice_id ON public.wallet_invoice_payment_records(invoice_id);
CREATE INDEX IF NOT EXISTS idx_wallet_invoice_payment_records_payment_link_id ON public.wallet_invoice_payment_records(payment_link_id);
CREATE INDEX IF NOT EXISTS idx_wallet_invoice_payment_records_transaction_type ON public.wallet_invoice_payment_records(transaction_type);

-- Enable RLS on new tables
ALTER TABLE public.payment_link_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_invoice_payment_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_link_transactions
CREATE POLICY "Users can view their payment link transactions" ON public.payment_link_transactions
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.payment_links 
      WHERE id = payment_link_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert payment link transactions for their links" ON public.payment_link_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.payment_links 
      WHERE id = payment_link_id
    )
  );

-- RLS Policies for invoice_transactions
CREATE POLICY "Users can view their invoice transactions" ON public.invoice_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert invoice transactions for their invoices" ON public.invoice_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invoice transactions for their invoices" ON public.invoice_transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for wallet_invoice_payment_records
CREATE POLICY "Users can view their wallet invoice payment records" ON public.wallet_invoice_payment_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their wallet invoice payment records" ON public.wallet_invoice_payment_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their wallet invoice payment records" ON public.wallet_invoice_payment_records
  FOR UPDATE USING (auth.uid() = user_id);
