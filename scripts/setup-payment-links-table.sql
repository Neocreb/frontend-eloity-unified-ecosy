-- Create payment_links table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_links_user_id ON public.payment_links(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_code ON public.payment_links(code);
CREATE INDEX IF NOT EXISTS idx_payment_links_is_active ON public.payment_links(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_links_created_at ON public.payment_links(created_at);

-- Enable RLS
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can create payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can update their own payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can delete their own payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Anyone can view active payment links by code" ON public.payment_links;

-- Create RLS policies
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

-- Allow anyone to view active payment links by code (for public payment pages)
CREATE POLICY "Anyone can view active payment links by code"
  ON public.payment_links FOR SELECT
  USING (is_active = true);
