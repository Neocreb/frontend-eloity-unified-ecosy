-- Phase 5: Promotions & Analytics Database Schema
-- This migration creates tables for flash sales, coupons, bundles, tiered discounts, and analytics

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.conversion_funnel CASCADE;
DROP TABLE IF EXISTS public.coupon_usage CASCADE;
DROP TABLE IF EXISTS public.tiered_discounts CASCADE;
DROP TABLE IF EXISTS public.bundle_deals CASCADE;
DROP TABLE IF EXISTS public.store_coupons CASCADE;
DROP TABLE IF EXISTS public.flash_sales CASCADE;

-- ============================================================================
-- 1. FLASH SALES TABLE
-- ============================================================================
CREATE TABLE public.flash_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended', 'paused')),
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  max_discount numeric,
  min_order_amount numeric,
  applicable_categories text[] DEFAULT '{}',
  applicable_products uuid[] DEFAULT '{}',
  max_usage_per_user integer,
  total_budget numeric,
  current_spent numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_flash_sales_status ON public.flash_sales(status);
CREATE INDEX idx_flash_sales_dates ON public.flash_sales(start_date, end_date);

-- ============================================================================
-- 2. STORE COUPONS TABLE
-- ============================================================================
CREATE TABLE public.store_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  max_discount numeric,
  min_order_amount numeric,
  max_usage_per_user integer,
  total_usage_limit integer,
  current_usage integer DEFAULT 0,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  active boolean DEFAULT true,
  applicable_categories text[] DEFAULT '{}',
  applicable_products uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_store_coupons_code ON public.store_coupons(code);
CREATE INDEX idx_store_coupons_active ON public.store_coupons(active);
CREATE INDEX idx_store_coupons_validity ON public.store_coupons(valid_from, valid_until);

-- ============================================================================
-- 3. COUPON USAGE TRACKING TABLE
-- ============================================================================
CREATE TABLE public.coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.store_coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid,
  discount_amount numeric,
  used_at timestamptz DEFAULT now()
);

CREATE INDEX idx_coupon_usage_coupon ON public.coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user ON public.coupon_usage(user_id);
CREATE INDEX idx_coupon_usage_order ON public.coupon_usage(order_id);

-- ============================================================================
-- 4. BUNDLE DEALS TABLE
-- ============================================================================
CREATE TABLE public.bundle_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  product_ids uuid[] NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  min_quantity integer DEFAULT 2,
  max_quantity integer,
  bundle_price numeric,
  active boolean DEFAULT true,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_bundle_deals_active ON public.bundle_deals(active);
CREATE INDEX idx_bundle_deals_validity ON public.bundle_deals(valid_from, valid_until);

-- ============================================================================
-- 5. TIERED DISCOUNTS TABLE
-- ============================================================================
CREATE TABLE public.tiered_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tiers jsonb NOT NULL DEFAULT '[]',
  active boolean DEFAULT true,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_tiered_discounts_product ON public.tiered_discounts(product_id);
CREATE INDEX idx_tiered_discounts_active ON public.tiered_discounts(active);

-- COMMENT ON TABLE tiered_discounts
COMMENT ON COLUMN public.tiered_discounts.tiers IS 
  'Array of tier objects: [{minQuantity: number, maxQuantity?: number, discountType: "percentage"|"fixed", discountValue: number}]';

-- ============================================================================
-- 6. ANALYTICS EVENTS TABLE
-- ============================================================================
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN (
    'page_view', 'product_view', 'add_to_cart', 'remove_from_cart',
    'checkout_start', 'checkout_complete', 'purchase', 'return',
    'search', 'filter_applied', 'product_click', 'category_view'
  )),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  category_id uuid,
  order_id uuid,
  search_query text,
  filters jsonb,
  properties jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_product ON public.analytics_events(product_id);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at);

-- ============================================================================
-- 7. CONVERSION FUNNEL TABLE
-- ============================================================================
CREATE TABLE public.conversion_funnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  funnel_stage text NOT NULL CHECK (funnel_stage IN (
    'landing', 'browse', 'product_view', 'cart_add',
    'cart_view', 'checkout_start', 'checkout_review',
    'payment', 'order_complete'
  )),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  category_id uuid,
  completed boolean DEFAULT false,
  timestamp timestamptz DEFAULT now(),
  exit_reason text
);

CREATE INDEX idx_conversion_funnel_user ON public.conversion_funnel(user_id);
CREATE INDEX idx_conversion_funnel_session ON public.conversion_funnel(session_id);
CREATE INDEX idx_conversion_funnel_stage ON public.conversion_funnel(funnel_stage);
CREATE INDEX idx_conversion_funnel_timestamp ON public.conversion_funnel(timestamp);

-- ============================================================================
-- 8. ANALYTICS VIEWS (for dashboard queries)
-- ============================================================================

-- Daily Flash Sale Performance
CREATE OR REPLACE VIEW flash_sales_performance_daily AS
SELECT
  fs.id,
  fs.title,
  DATE(fs.start_date) as date,
  COUNT(DISTINCT ae.user_id) as unique_visitors,
  COUNT(CASE WHEN ae.event_type = 'product_click' THEN 1 END) as product_clicks,
  COUNT(DISTINCT CASE WHEN ae.event_type = 'add_to_cart' THEN ae.user_id END) as users_added_to_cart,
  COUNT(DISTINCT CASE WHEN ae.event_type = 'purchase' THEN ae.user_id END) as purchases,
  COALESCE(SUM(CASE WHEN ae.event_type = 'purchase' THEN 1 END), 0) as total_orders
FROM public.flash_sales fs
LEFT JOIN public.analytics_events ae ON 
  ae.created_at >= fs.start_date AND ae.created_at <= fs.end_date
GROUP BY fs.id, fs.title, DATE(fs.start_date);

-- Coupon Performance Summary
CREATE OR REPLACE VIEW coupon_performance_summary AS
SELECT
  sc.id,
  sc.code,
  sc.title,
  COUNT(DISTINCT cu.user_id) as unique_users,
  COUNT(cu.id) as total_uses,
  COALESCE(SUM(cu.discount_amount), 0) as total_discount_amount,
  ROUND(100.0 * COUNT(cu.id) / NULLIF(sc.total_usage_limit, 0), 2) as usage_percentage,
  sc.current_usage,
  sc.active
FROM public.store_coupons sc
LEFT JOIN public.coupon_usage cu ON sc.id = cu.coupon_id
GROUP BY sc.id, sc.code, sc.title, sc.total_usage_limit, sc.current_usage, sc.active;

-- Conversion Funnel Summary
CREATE OR REPLACE VIEW conversion_funnel_summary AS
SELECT
  funnel_stage,
  COUNT(DISTINCT user_id) as users,
  COUNT(DISTINCT session_id) as sessions,
  COUNT(CASE WHEN completed THEN 1 END) as completed_count,
  ROUND(100.0 * COUNT(CASE WHEN completed THEN 1 END) / COUNT(*), 2) as completion_rate
FROM public.conversion_funnel
GROUP BY funnel_stage;

-- Product Performance Analytics
CREATE OR REPLACE VIEW product_analytics_summary AS
SELECT
  ae.product_id,
  p.name,
  COUNT(CASE WHEN ae.event_type = 'product_view' THEN 1 END) as views,
  COUNT(CASE WHEN ae.event_type = 'add_to_cart' THEN 1 END) as add_to_cart,
  COUNT(CASE WHEN ae.event_type = 'purchase' THEN 1 END) as purchases,
  ROUND(100.0 * COUNT(CASE WHEN ae.event_type = 'add_to_cart' THEN 1 END) / 
    NULLIF(COUNT(CASE WHEN ae.event_type = 'product_view' THEN 1 END), 0), 2) as view_to_cart_rate,
  ROUND(100.0 * COUNT(CASE WHEN ae.event_type = 'purchase' THEN 1 END) / 
    NULLIF(COUNT(CASE WHEN ae.event_type = 'product_view' THEN 1 END), 0), 2) as conversion_rate
FROM public.analytics_events ae
LEFT JOIN public.products p ON ae.product_id = p.id
WHERE ae.product_id IS NOT NULL
GROUP BY ae.product_id, p.name;

-- ============================================================================
-- 9. RLS POLICIES
-- ============================================================================

-- Flash Sales RLS
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Flash sales readable by all" ON public.flash_sales
  FOR SELECT USING (true);

CREATE POLICY "Flash sales managed by admin" ON public.flash_sales
  FOR ALL USING (
    auth.jwt() ->> 'user_role' = 'admin' OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Store Coupons RLS
ALTER TABLE public.store_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coupons readable by all" ON public.store_coupons
  FOR SELECT USING (active = true);

CREATE POLICY "Coupons managed by admin" ON public.store_coupons
  FOR ALL USING (
    auth.jwt() ->> 'user_role' = 'admin' OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Coupon Usage RLS
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert coupon usage" ON public.coupon_usage
  FOR INSERT WITH CHECK (true);

-- Bundle Deals RLS
ALTER TABLE public.bundle_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bundle deals readable by all" ON public.bundle_deals
  FOR SELECT USING (active = true);

CREATE POLICY "Bundle deals managed by admin" ON public.bundle_deals
  FOR ALL USING (
    auth.jwt() ->> 'user_role' = 'admin' OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Tiered Discounts RLS
ALTER TABLE public.tiered_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tiered discounts readable by all" ON public.tiered_discounts
  FOR SELECT USING (active = true);

CREATE POLICY "Tiered discounts managed by seller" ON public.tiered_discounts
  FOR ALL USING (
    product_id IN (
      SELECT id FROM public.products WHERE seller_id = auth.uid()
    )
  );

-- Analytics Events RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analytics insertable by all" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Analytics viewable by admin" ON public.analytics_events
  FOR SELECT USING (
    auth.jwt() ->> 'user_role' = 'admin' OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Conversion Funnel RLS
ALTER TABLE public.conversion_funnel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Funnel insertable by all" ON public.conversion_funnel
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Funnel viewable by admin" ON public.conversion_funnel
  FOR SELECT USING (
    auth.jwt() ->> 'user_role' = 'admin' OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- ============================================================================
-- 10. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update current_spent on flash_sales
CREATE OR REPLACE FUNCTION update_flash_sale_spent()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.flash_sales
  SET current_spent = COALESCE(current_spent, 0) + NEW.discount_amount
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment coupon usage
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.store_coupons
  SET current_usage = COALESCE(current_usage, 0) + 1
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_coupon_usage
AFTER INSERT ON public.coupon_usage
FOR EACH ROW EXECUTE FUNCTION increment_coupon_usage();

-- ============================================================================
-- 11. INITIAL DATA (Optional)
-- ============================================================================

-- You can add sample flash sales, coupons, or bundle deals here for testing
-- Example:
-- INSERT INTO public.flash_sales (title, description, start_date, end_date, discount_type, discount_value)
-- VALUES (
--   'Weekend Special',
--   'Get 20% off on selected items',
--   NOW(),
--   NOW() + INTERVAL '2 days',
--   'percentage',
--   20
-- );

GRANT SELECT ON public.flash_sales TO anon, authenticated;
GRANT SELECT ON public.store_coupons TO anon, authenticated;
GRANT SELECT ON public.bundle_deals TO anon, authenticated;
GRANT SELECT ON public.tiered_discounts TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT SELECT ON public.conversion_funnel TO authenticated;

GRANT ALL ON public.flash_sales TO service_role;
GRANT ALL ON public.store_coupons TO service_role;
GRANT ALL ON public.coupon_usage TO service_role;
GRANT ALL ON public.bundle_deals TO service_role;
GRANT ALL ON public.tiered_discounts TO service_role;
GRANT ALL ON public.analytics_events TO service_role;
GRANT ALL ON public.conversion_funnel TO service_role;
