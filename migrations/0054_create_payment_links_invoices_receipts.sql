-- ============================================================================
-- Payment Links, Invoices, Receipts Tables
-- ============================================================================

-- Payment Links Table
CREATE TABLE IF NOT EXISTS public.payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code VARCHAR(8) NOT NULL UNIQUE,
  amount NUMERIC(15, 2),
  description TEXT,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  share_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'draft', -- draft, sent, paid, overdue
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(15, 2) DEFAULT 0,
  tax NUMERIC(15, 2) DEFAULT 0,
  total NUMERIC(15, 2) DEFAULT 0,
  due_date TIMESTAMPTZ,
  notes TEXT,
  customization_id UUID REFERENCES public.invoice_customizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Receipts Table
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_id UUID,
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  amount NUMERIC(15, 2) NOT NULL,
  payment_method TEXT,
  description TEXT,
  customization_id UUID REFERENCES public.receipt_customizations(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoice Customizations Table
CREATE TABLE IF NOT EXISTS public.invoice_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL DEFAULT 'Your Company',
  company_logo TEXT,
  company_email TEXT,
  company_phone TEXT,
  company_address TEXT,
  company_website TEXT,
  tax_id TEXT,
  invoice_prefix VARCHAR(10) DEFAULT 'INV',
  currency VARCHAR(3) DEFAULT 'USD',
  primary_color VARCHAR(7) DEFAULT '#2563eb',
  secondary_color VARCHAR(7) DEFAULT '#0f766e',
  font_family VARCHAR(50) DEFAULT 'Segoe UI',
  include_notes BOOLEAN DEFAULT true,
  include_terms BOOLEAN DEFAULT true,
  custom_notes TEXT,
  custom_terms TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Receipt Customizations Table
CREATE TABLE IF NOT EXISTS public.receipt_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL DEFAULT 'Your Company',
  company_logo TEXT,
  company_email TEXT,
  company_phone TEXT,
  company_address TEXT,
  receipt_prefix VARCHAR(10) DEFAULT 'RCP',
  currency VARCHAR(3) DEFAULT 'USD',
  primary_color VARCHAR(7) DEFAULT '#2563eb',
  include_qr_code BOOLEAN DEFAULT true,
  include_signature BOOLEAN DEFAULT false,
  custom_footer TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payment Link Customizations Table
CREATE TABLE IF NOT EXISTS public.payment_link_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL DEFAULT 'Your Company',
  company_logo TEXT,
  banner_image TEXT,
  banner_text TEXT,
  primary_color VARCHAR(7) DEFAULT '#2563eb',
  secondary_color VARCHAR(7) DEFAULT '#0f766e',
  success_message TEXT DEFAULT 'Thank you for your payment!',
  custom_css TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_links_user_id ON public.payment_links(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_code ON public.payment_links(code);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_transaction_id ON public.receipts(transaction_id);

-- Enable RLS on all tables
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_link_customizations ENABLE ROW LEVEL SECURITY;

-- Payment Links RLS Policies
CREATE POLICY "Users can view their own payment links" ON public.payment_links
  FOR SELECT USING (auth.uid() = user_id OR is_active = true);

CREATE POLICY "Users can create payment links" ON public.payment_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment links" ON public.payment_links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment links" ON public.payment_links
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can view active payment links by code" ON public.payment_links
  FOR SELECT USING (is_active = true);

-- Invoices RLS Policies
CREATE POLICY "Users can view their own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" ON public.invoices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" ON public.invoices
  FOR DELETE USING (auth.uid() = user_id);

-- Receipts RLS Policies
CREATE POLICY "Users can view their own receipts" ON public.receipts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create receipts" ON public.receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts" ON public.receipts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipts" ON public.receipts
  FOR DELETE USING (auth.uid() = user_id);

-- Invoice Customizations RLS Policies
CREATE POLICY "Users can view their own customization" ON public.invoice_customizations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create customization" ON public.invoice_customizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customization" ON public.invoice_customizations
  FOR UPDATE USING (auth.uid() = user_id);

-- Receipt Customizations RLS Policies
CREATE POLICY "Users can view their own customization" ON public.receipt_customizations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create customization" ON public.receipt_customizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customization" ON public.receipt_customizations
  FOR UPDATE USING (auth.uid() = user_id);

-- Payment Link Customizations RLS Policies
CREATE POLICY "Users can view their own customization" ON public.payment_link_customizations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create customization" ON public.payment_link_customizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customization" ON public.payment_link_customizations
  FOR UPDATE USING (auth.uid() = user_id);
