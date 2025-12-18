-- Marketplace Enhancements Migration
-- This script adds comprehensive marketplace features to Supabase
-- Run this script to set up all necessary tables for a complete e-commerce platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PRODUCT VARIANTS AND STOCK MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  price NUMERIC(10,2),
  stock_quantity INTEGER DEFAULT 0,
  images JSONB,
  attributes JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

-- ============================================================================
-- 2. PRODUCT ATTRIBUTES FOR FILTERING
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_name TEXT NOT NULL,
  attribute_value TEXT NOT NULL,
  attribute_type TEXT CHECK (attribute_type IN ('size', 'color', 'material', 'capacity', 'custom')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id ON product_attributes(product_id);

-- ============================================================================
-- 3. DETAILED PRODUCT IMAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER,
  is_primary BOOLEAN DEFAULT false,
  image_type TEXT CHECK (image_type IN ('thumbnail', 'main', 'gallery')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- ============================================================================
-- 4. FLASH SALES AND PROMOTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS flash_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage NUMERIC(5,2),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  featured_products UUID[] DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flash_sales_is_active ON flash_sales(is_active);
CREATE INDEX IF NOT EXISTS idx_flash_sales_dates ON flash_sales(start_date, end_date);

-- ============================================================================
-- 5. INVENTORY TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  action TEXT NOT NULL CHECK (action IN ('purchase', 'return', 'restock', 'adjustment')),
  quantity_changed INTEGER NOT NULL,
  previous_quantity INTEGER,
  new_quantity INTEGER,
  reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_date ON inventory_logs(created_at);

-- ============================================================================
-- 6. SELLER REVIEWS (DISTINCT FROM PRODUCT REVIEWS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS seller_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  communication_rating INTEGER CHECK (communication_rating IS NULL OR (communication_rating >= 1 AND communication_rating <= 5)),
  shipping_rating INTEGER CHECK (shipping_rating IS NULL OR (shipping_rating >= 1 AND shipping_rating <= 5)),
  quality_rating INTEGER CHECK (quality_rating IS NULL OR (quality_rating >= 1 AND quality_rating <= 5)),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, order_id),
  CONSTRAINT no_self_review CHECK (seller_id != reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller_id ON seller_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_reviewer_id ON seller_reviews(reviewer_id);

-- ============================================================================
-- 7. PRODUCT Q&A SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_qa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  user_id UUID NOT NULL REFERENCES users(id),
  question TEXT NOT NULL,
  answer TEXT,
  answered_by UUID REFERENCES users(id),
  answered_at TIMESTAMP WITH TIME ZONE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_qa_product_id ON product_qa(product_id);
CREATE INDEX IF NOT EXISTS idx_product_qa_user_id ON product_qa(user_id);

-- ============================================================================
-- 8. PROMOTIONAL CODES AND DISCOUNT CODES
-- ============================================================================

CREATE TABLE IF NOT EXISTS promotional_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_shipping')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_purchase_amount NUMERIC(10,2),
  max_discount NUMERIC(10,2),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  applicable_categories UUID[] DEFAULT '{}',
  applicable_products UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotional_codes_code ON promotional_codes(code);
CREATE INDEX IF NOT EXISTS idx_promotional_codes_is_active ON promotional_codes(is_active);

-- ============================================================================
-- 9. STORE-SPECIFIC COUPONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS store_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id),
  code TEXT NOT NULL,
  discount_percentage NUMERIC(5,2),
  max_discount NUMERIC(10,2),
  min_purchase_amount NUMERIC(10,2),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, code)
);

CREATE INDEX IF NOT EXISTS idx_store_coupons_seller_id ON store_coupons(seller_id);

-- ============================================================================
-- 10. SHIPPING ZONES AND RATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS shipping_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id),
  zone_name TEXT NOT NULL,
  countries TEXT[] DEFAULT '{}',
  base_rate NUMERIC(10,2) NOT NULL,
  weight_rate NUMERIC(10,2),
  free_shipping_threshold NUMERIC(10,2),
  estimated_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_zones_seller_id ON shipping_zones(seller_id);

-- ============================================================================
-- 11. RETURNS AND REFUNDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  order_item_id UUID NOT NULL REFERENCES order_items(id),
  return_reason TEXT NOT NULL,
  return_status TEXT DEFAULT 'initiated' CHECK (return_status IN ('initiated', 'approved', 'rejected', 'in_transit', 'completed')),
  refund_amount NUMERIC(10,2) NOT NULL,
  return_tracking_number TEXT,
  images JSONB,
  admin_notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(return_status);

-- ============================================================================
-- 12. SELLER PERFORMANCE METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS seller_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL UNIQUE REFERENCES users(id),
  total_products INTEGER DEFAULT 0,
  active_products INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_revenue NUMERIC(15,2) DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  response_rate NUMERIC(5,2) DEFAULT 0,
  on_time_delivery_rate NUMERIC(5,2) DEFAULT 0,
  return_rate NUMERIC(5,2) DEFAULT 0,
  refund_rate NUMERIC(5,2) DEFAULT 0,
  seller_level TEXT DEFAULT 'bronze' CHECK (seller_level IN ('bronze', 'silver', 'gold', 'platinum')),
  last_active TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_metrics_seller_id ON seller_metrics(seller_id);

-- ============================================================================
-- 13. PRODUCT ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  cart_adds INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue NUMERIC(15,2) DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, date)
);

CREATE INDEX IF NOT EXISTS idx_product_analytics_product_id ON product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_date ON product_analytics(date);

-- ============================================================================
-- 14. APPLY SCHEMA CHANGES TO EXISTING TABLES
-- ============================================================================

-- Update products table with new columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'physical';
ALTER TABLE products ADD COLUMN IF NOT EXISTS digital_product_type TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS download_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS license_type TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS download_limit INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS download_expiry_days INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS file_format TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS publication_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS isbn TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pages INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS material TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS care_instructions TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS assembly_required BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS assembly_time TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_weight NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS attributes JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS boost_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS boost_type TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_keywords TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_order_quantity INTEGER DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved';

-- Update orders table with new columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_initiated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_reason TEXT;

-- Update store_profiles (or marketplace_profiles) with new columns
ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS seller_level TEXT DEFAULT 'bronze';
ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS monthly_sales_target INTEGER;
ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS badge_tier TEXT;
ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER;
ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS avg_rating_communication NUMERIC(3,2);
ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS avg_rating_shipping NUMERIC(3,2);
ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS avg_rating_quality NUMERIC(3,2);

-- ============================================================================
-- 15. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_moderation_status ON products(moderation_status);
CREATE INDEX IF NOT EXISTS idx_products_boost_until ON products(boost_until) WHERE boost_until > NOW();
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);
CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery ON orders(estimated_delivery_date);

-- ============================================================================
-- 16. CREATE VIEWS FOR COMMON QUERIES
-- ============================================================================

CREATE OR REPLACE VIEW active_products AS
SELECT * FROM products
WHERE is_active = true
AND moderation_status = 'approved'
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW boosted_products AS
SELECT * FROM products
WHERE boost_until > NOW()
ORDER BY boost_until DESC;

CREATE OR REPLACE VIEW pending_returns AS
SELECT r.*, o.order_number, oi.product_id
FROM returns r
JOIN orders o ON r.order_id = o.id
JOIN order_items oi ON r.order_item_id = oi.id
WHERE r.return_status IN ('initiated', 'approved', 'in_transit');

CREATE OR REPLACE VIEW seller_performance AS
SELECT 
  sm.seller_id,
  sm.total_products,
  sm.active_products,
  sm.total_sales,
  sm.average_rating,
  sm.response_rate,
  sm.seller_level,
  COUNT(DISTINCT sr.id) as review_count,
  AVG(sr.rating) as avg_seller_rating
FROM seller_metrics sm
LEFT JOIN seller_reviews sr ON sm.seller_id = sr.seller_id
GROUP BY sm.seller_id, sm.total_products, sm.active_products, sm.total_sales, sm.average_rating, sm.response_rate, sm.seller_level;

-- ============================================================================
-- 17. GRANT PERMISSIONS
-- ============================================================================

-- Grant appropriate permissions to service role (update with your actual service role if different)
GRANT SELECT ON product_variants TO anon, authenticated;
GRANT SELECT ON product_attributes TO anon, authenticated;
GRANT SELECT ON product_images TO anon, authenticated;
GRANT SELECT ON flash_sales TO anon, authenticated;
GRANT SELECT ON product_qa TO anon, authenticated;
GRANT SELECT ON seller_reviews TO anon, authenticated;
GRANT SELECT ON promotional_codes TO anon, authenticated;
GRANT SELECT ON store_coupons TO anon, authenticated;
GRANT SELECT ON shipping_zones TO authenticated;
GRANT SELECT ON seller_metrics TO anon, authenticated;
GRANT SELECT ON product_analytics TO authenticated;
GRANT SELECT ON inventory_logs TO authenticated;
GRANT SELECT ON returns TO authenticated;

-- ============================================================================
-- 18. SEED DATA (OPTIONAL - Remove if not needed)
-- ============================================================================

-- Example flash sale
INSERT INTO flash_sales (title, description, discount_percentage, start_date, end_date, is_active)
VALUES (
  'Welcome Flash Sale',
  'Amazing deals on selected products - limited time only!',
  20,
  NOW(),
  NOW() + INTERVAL '7 days',
  true
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Log migration completion
INSERT INTO system_logs (event_type, message, created_at)
SELECT 'migration', 'Marketplace enhancements migration completed successfully', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM system_logs WHERE event_type = 'migration' AND message LIKE '%Marketplace enhancements%'
) LIMIT 1;
