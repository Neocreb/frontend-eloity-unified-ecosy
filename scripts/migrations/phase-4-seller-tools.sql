-- Phase 4: Seller Tools Database Migration
-- This migration adds tables and functionality for:
-- 4.1: Enhanced Seller Dashboard
-- 4.2: Product Management
-- 4.3: Returns & Refunds

-- ============================================================
-- PHASE 4.1: ENHANCED SELLER DASHBOARD
-- ============================================================

-- Sales analytics aggregation (materialized view data)
CREATE TABLE IF NOT EXISTS seller_sales_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  total_items_sold INTEGER DEFAULT 0,
  avg_order_value DECIMAL(15, 2) DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  unique_customers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, date)
);

-- Product performance metrics
CREATE TABLE IF NOT EXISTS product_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  total_sold INTEGER DEFAULT 0,
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  avg_rating DECIMAL(3, 2) DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  add_to_cart_count INTEGER DEFAULT 0,
  wishlist_count INTEGER DEFAULT 0,
  last_sold_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id)
);

-- Inventory alerts and management
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock')),
  current_stock INTEGER NOT NULL,
  threshold_value INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, product_id, alert_type)
);

-- Seller performance metrics (KPIs)
CREATE TABLE IF NOT EXISTS seller_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  avg_response_time_hours DECIMAL(10, 2),
  avg_fulfillment_time_hours DECIMAL(10, 2),
  order_acceptance_rate DECIMAL(5, 2),
  on_time_delivery_rate DECIMAL(5, 2),
  customer_satisfaction_rate DECIMAL(5, 2),
  refund_rate DECIMAL(5, 2),
  return_rate DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, metric_date)
);

-- Seller badges and tiers
CREATE TABLE IF NOT EXISTS seller_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  badge_type VARCHAR(100) NOT NULL,
  badge_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, badge_type)
);

-- ============================================================
-- PHASE 4.2: PRODUCT MANAGEMENT
-- ============================================================

-- Bulk import batches for tracking
CREATE TABLE IF NOT EXISTS bulk_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  batch_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(500),
  file_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_rows INTEGER DEFAULT 0,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  error_log JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SKU management and tracking
CREATE TABLE IF NOT EXISTS product_skus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  sku_code VARCHAR(100) NOT NULL UNIQUE,
  sku_pattern VARCHAR(100),
  variant_id VARCHAR(100),
  variant_attributes JSONB,
  barcode VARCHAR(100),
  quantity INTEGER DEFAULT 0,
  warehouse_location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants with detailed management
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  parent_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  variant_name VARCHAR(255) NOT NULL,
  variant_attributes JSONB,
  sku VARCHAR(100),
  price DECIMAL(15, 2),
  cost DECIMAL(15, 2),
  quantity INTEGER DEFAULT 0,
  images JSONB,
  variant_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, variant_name)
);

-- SEO optimization tracking
CREATE TABLE IF NOT EXISTS product_seo_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  title_length INTEGER,
  description_length INTEGER,
  has_meta_description BOOLEAN DEFAULT false,
  has_keywords BOOLEAN DEFAULT false,
  image_alt_text_count INTEGER DEFAULT 0,
  seo_score INTEGER DEFAULT 0,
  recommendations JSONB,
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id)
);

-- Price history for tracking changes
CREATE TABLE IF NOT EXISTS product_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  old_price DECIMAL(15, 2),
  new_price DECIMAL(15, 2) NOT NULL,
  change_reason VARCHAR(100),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PHASE 4.3: RETURNS & REFUNDS
-- ============================================================

-- Enhanced returns with detailed information
CREATE TABLE IF NOT EXISTS returns_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_request_id UUID REFERENCES return_requests(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  return_reason VARCHAR(255) NOT NULL,
  reason_category VARCHAR(100) CHECK (reason_category IN ('quality', 'damage', 'wrong_item', 'not_as_described', 'changed_mind', 'no_longer_needed', 'other')),
  detailed_reason TEXT,
  customer_comment TEXT,
  return_status VARCHAR(50) DEFAULT 'initiated' CHECK (return_status IN ('initiated', 'approved', 'rejected', 'in_transit', 'received', 'inspected', 'refunded')),
  refund_status VARCHAR(50) DEFAULT 'pending' CHECK (refund_status IN ('pending', 'approved', 'partial', 'rejected', 'completed')),
  refund_amount DECIMAL(15, 2),
  refund_reason VARCHAR(255),
  partial_refund_reason TEXT,
  return_label_url VARCHAR(500),
  tracking_number VARCHAR(100),
  inspection_notes TEXT,
  inspection_photos JSONB,
  seller_response TEXT,
  dispute_filed BOOLEAN DEFAULT false,
  dispute_reason TEXT,
  appeal_filed BOOLEAN DEFAULT false,
  appeal_reason TEXT,
  appeal_status VARCHAR(50),
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  inspected_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Return reasons and their statistics
CREATE TABLE IF NOT EXISTS return_reason_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  reason_category VARCHAR(100) NOT NULL,
  reason_text VARCHAR(255) NOT NULL,
  occurrence_count INTEGER DEFAULT 0,
  average_refund_rate DECIMAL(5, 2) DEFAULT 100,
  month_year DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, reason_category, reason_text, month_year)
);

-- Refund processing log
CREATE TABLE IF NOT EXISTS refund_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns_management(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  refund_amount DECIMAL(15, 2) NOT NULL,
  refund_method VARCHAR(100) NOT NULL CHECK (refund_method IN ('original_payment', 'wallet_credit', 'store_credit')),
  payment_reference VARCHAR(255),
  status VARCHAR(50) DEFAULT 'initiated' CHECK (status IN ('initiated', 'processing', 'completed', 'failed')),
  failure_reason TEXT,
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Return appeal process tracking
CREATE TABLE IF NOT EXISTS return_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns_management(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appeal_type VARCHAR(100) NOT NULL CHECK (appeal_type IN ('seller_appeal', 'customer_dispute')),
  reason TEXT NOT NULL,
  supporting_documents JSONB,
  appeal_status VARCHAR(50) DEFAULT 'open' CHECK (appeal_status IN ('open', 'under_review', 'resolved', 'rejected')),
  resolution TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Phase 4.1 indexes
CREATE INDEX IF NOT EXISTS idx_seller_sales_analytics_seller_date ON seller_sales_analytics(seller_id, date);
CREATE INDEX IF NOT EXISTS idx_seller_sales_analytics_date ON seller_sales_analytics(date);
CREATE INDEX IF NOT EXISTS idx_product_performance_seller ON product_performance(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_performance_product ON product_performance(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_seller_active ON inventory_alerts(seller_id, is_active);
CREATE INDEX IF NOT EXISTS idx_seller_performance_metrics_seller_date ON seller_performance_metrics(seller_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_seller_badges_seller ON seller_badges(seller_id);

-- Phase 4.2 indexes
CREATE INDEX IF NOT EXISTS idx_bulk_import_batches_seller_status ON bulk_import_batches(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_product_skus_product ON product_skus(product_id);
CREATE INDEX IF NOT EXISTS idx_product_skus_seller ON product_skus(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_skus_sku_code ON product_skus(sku_code);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_seller ON product_variants(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_seo_metrics_product ON product_seo_metrics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_price_history_product_date ON product_price_history(product_id, changed_at);

-- Phase 4.3 indexes
CREATE INDEX IF NOT EXISTS idx_returns_management_seller_status ON returns_management(seller_id, return_status);
CREATE INDEX IF NOT EXISTS idx_returns_management_order ON returns_management(order_id);
CREATE INDEX IF NOT EXISTS idx_return_reason_stats_seller_month ON return_reason_stats(seller_id, month_year);
CREATE INDEX IF NOT EXISTS idx_refund_processing_log_return ON refund_processing_log(return_id);
CREATE INDEX IF NOT EXISTS idx_return_appeals_return ON return_appeals(return_id);
CREATE INDEX IF NOT EXISTS idx_return_appeals_seller_status ON return_appeals(seller_id, appeal_status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE seller_sales_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_seo_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_reason_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_processing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_appeals ENABLE ROW LEVEL SECURITY;

-- Seller can view their own analytics
CREATE POLICY "Users can view their own sales analytics"
  ON seller_sales_analytics FOR SELECT
  USING (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()));

-- Seller can view their own product performance
CREATE POLICY "Users can view their own product performance"
  ON product_performance FOR SELECT
  USING (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()));

-- Seller can manage their own inventory alerts
CREATE POLICY "Users can manage their own inventory alerts"
  ON inventory_alerts FOR ALL
  USING (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()));

-- Seller can view their own performance metrics
CREATE POLICY "Users can view their own performance metrics"
  ON seller_performance_metrics FOR SELECT
  USING (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()));

-- Seller can view their own badges
CREATE POLICY "Users can view their own badges"
  ON seller_badges FOR SELECT
  USING (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()));

-- Seller can view their own bulk imports
CREATE POLICY "Users can manage their own bulk imports"
  ON bulk_import_batches FOR ALL
  USING (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()));

-- Seller can manage their own SKUs
CREATE POLICY "Users can manage their own product SKUs"
  ON product_skus FOR ALL
  USING (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()));

-- Seller can manage their own variants
CREATE POLICY "Users can manage their own product variants"
  ON product_variants FOR ALL
  USING (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()));

-- Seller can manage their own SEO metrics
CREATE POLICY "Users can view their own product SEO metrics"
  ON product_seo_metrics FOR SELECT
  USING (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()));

-- Seller can view their own price history
CREATE POLICY "Users can view their own price history"
  ON product_price_history FOR SELECT
  USING (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()));

-- Seller can manage their own returns
CREATE POLICY "Sellers can manage their own returns"
  ON returns_management FOR ALL
  USING (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()));

-- Customers can view their own returns
CREATE POLICY "Customers can view their own returns"
  ON returns_management FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

-- Seller can view their own return stats
CREATE POLICY "Sellers can view their own return stats"
  ON return_reason_stats FOR SELECT
  USING (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()));

-- Seller can view their own refund logs
CREATE POLICY "Sellers can view their own refund logs"
  ON refund_processing_log FOR SELECT
  USING (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()));

-- Seller can view their own appeals
CREATE POLICY "Sellers can view their own appeals"
  ON return_appeals FOR SELECT
  USING (seller_id IN (SELECT id FROM store_profiles WHERE user_id = auth.uid()));

-- Customer can view their own appeals
CREATE POLICY "Customers can view their own appeals"
  ON return_appeals FOR SELECT
  USING (customer_id = auth.uid());

-- ============================================================
-- VIEWS FOR ANALYTICS
-- ============================================================

-- Seller dashboard summary view
CREATE OR REPLACE VIEW seller_dashboard_summary AS
SELECT
  sp.id as seller_id,
  sp.user_id,
  sp.store_name,
  COALESCE(sa.total_orders, 0) as today_orders,
  COALESCE(sa.total_revenue, 0) as today_revenue,
  COALESCE(spm.customer_satisfaction_rate, 0) as satisfaction_rate,
  COALESCE(spm.on_time_delivery_rate, 0) as delivery_rate,
  COALESCE(spm.refund_rate, 0) as refund_rate,
  (SELECT COUNT(*) FROM inventory_alerts WHERE seller_id = sp.id AND is_active = true) as active_alerts,
  sa.updated_at
FROM
  store_profiles sp
LEFT JOIN seller_sales_analytics sa ON sp.id = sa.seller_id AND sa.date = CURRENT_DATE
LEFT JOIN seller_performance_metrics spm ON sp.id = spm.seller_id AND spm.metric_date = CURRENT_DATE;

-- Monthly sales trend view
CREATE OR REPLACE VIEW monthly_sales_trend AS
SELECT
  seller_id,
  DATE_TRUNC('month', date)::DATE as month,
  SUM(total_orders) as total_orders,
  SUM(total_revenue) as total_revenue,
  AVG(avg_order_value) as avg_order_value,
  SUM(total_items_sold) as total_items_sold
FROM
  seller_sales_analytics
GROUP BY
  seller_id,
  DATE_TRUNC('month', date);

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE seller_sales_analytics IS 'Daily sales metrics aggregation for seller analytics dashboard';
COMMENT ON TABLE product_performance IS 'Product-level performance metrics including sales, ratings, and engagement';
COMMENT ON TABLE inventory_alerts IS 'Low stock and inventory alerts for sellers';
COMMENT ON TABLE seller_performance_metrics IS 'KPI metrics including response time, fulfillment time, and delivery rate';
COMMENT ON TABLE seller_badges IS 'Achievement badges earned by sellers (Top Rated, Fast Shipper, etc.)';
COMMENT ON TABLE bulk_import_batches IS 'Tracks batch imports of products for sellers';
COMMENT ON TABLE product_skus IS 'SKU management with barcode and warehouse tracking';
COMMENT ON TABLE product_variants IS 'Product variants with parent-child relationships and attributes';
COMMENT ON TABLE product_seo_metrics IS 'SEO optimization metrics and recommendations';
COMMENT ON TABLE product_price_history IS 'Historical price tracking for products';
COMMENT ON TABLE returns_management IS 'Comprehensive returns and refunds management';
COMMENT ON TABLE return_reason_stats IS 'Statistical analysis of return reasons';
COMMENT ON TABLE refund_processing_log IS 'Detailed refund processing history';
COMMENT ON TABLE return_appeals IS 'Appeal process tracking for returns disputes';
