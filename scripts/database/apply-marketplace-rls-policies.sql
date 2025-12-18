-- ============================================================================
-- PHASE 1.4: ROW LEVEL SECURITY (RLS) POLICIES FOR MARKETPLACE TABLES
-- ============================================================================
-- This script implements comprehensive RLS policies for marketplace functionality
-- Run this script AFTER applying the schema migrations
-- ============================================================================

-- Enable RLS on all marketplace tables
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS seller_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shopping_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS store_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS promotional_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS store_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS seller_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PRODUCTS TABLE POLICIES
-- ============================================================================

-- Policy 1: Anyone can view active (published) products
CREATE POLICY IF NOT EXISTS "Enable read access for all users on active products"
ON products FOR SELECT
USING (is_active = true);

-- Policy 2: Sellers can view their own unpublished products
CREATE POLICY IF NOT EXISTS "Enable sellers to view their own unpublished products"
ON products FOR SELECT
USING (seller_id = auth.uid() OR is_active = true);

-- Policy 3: Sellers can insert their own products
CREATE POLICY IF NOT EXISTS "Enable sellers to create products"
ON products FOR INSERT
WITH CHECK (seller_id = auth.uid());

-- Policy 4: Sellers can update their own products
CREATE POLICY IF NOT EXISTS "Enable sellers to update their own products"
ON products FOR UPDATE
USING (seller_id = auth.uid())
WITH CHECK (seller_id = auth.uid());

-- Policy 5: Sellers can delete their own products
CREATE POLICY IF NOT EXISTS "Enable sellers to delete their own products"
ON products FOR DELETE
USING (seller_id = auth.uid());

-- ============================================================================
-- PRODUCT VARIANTS TABLE POLICIES
-- ============================================================================

-- Anyone can read variants of active products
CREATE POLICY IF NOT EXISTS "Enable read access for product variants"
ON product_variants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_variants.product_id 
    AND (products.is_active = true OR products.seller_id = auth.uid())
  )
);

-- Sellers can manage variants for their products
CREATE POLICY IF NOT EXISTS "Enable sellers to manage variants"
ON product_variants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_variants.product_id 
    AND products.seller_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Enable sellers to update variants"
ON product_variants FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_variants.product_id 
    AND products.seller_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_variants.product_id 
    AND products.seller_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Enable sellers to delete variants"
ON product_variants FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_variants.product_id 
    AND products.seller_id = auth.uid()
  )
);

-- ============================================================================
-- PRODUCT REVIEWS TABLE POLICIES
-- ============================================================================

-- Anyone can read product reviews
CREATE POLICY IF NOT EXISTS "Enable read access for product reviews"
ON product_reviews FOR SELECT
USING (true);

-- Users can create reviews for purchased products
CREATE POLICY IF NOT EXISTS "Enable users to create product reviews"
ON product_reviews FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own reviews
CREATE POLICY IF NOT EXISTS "Enable users to update their own reviews"
ON product_reviews FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own reviews
CREATE POLICY IF NOT EXISTS "Enable users to delete their own reviews"
ON product_reviews FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- ORDERS TABLE POLICIES
-- ============================================================================

-- Users can view their own orders
CREATE POLICY IF NOT EXISTS "Enable users to view their own orders"
ON orders FOR SELECT
USING (
  buyer_id = auth.uid() 
  OR seller_id = auth.uid()
  OR EXISTS (SELECT 1 FROM order_items WHERE order_items.order_id = orders.id AND order_items.seller_id = auth.uid())
);

-- Users can create orders
CREATE POLICY IF NOT EXISTS "Enable users to create orders"
ON orders FOR INSERT
WITH CHECK (buyer_id = auth.uid());

-- Buyers and sellers can update orders
CREATE POLICY IF NOT EXISTS "Enable order updates"
ON orders FOR UPDATE
USING (buyer_id = auth.uid() OR seller_id = auth.uid())
WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

-- ============================================================================
-- SHOPPING CART TABLE POLICIES
-- ============================================================================

-- Users can only manage their own cart items
CREATE POLICY IF NOT EXISTS "Enable users to read their own cart"
ON shopping_cart FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Enable users to add to cart"
ON shopping_cart FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Enable users to update their cart"
ON shopping_cart FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Enable users to delete from cart"
ON shopping_cart FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- WISHLIST TABLE POLICIES
-- ============================================================================

-- Users can only manage their own wishlist
CREATE POLICY IF NOT EXISTS "Enable users to read their own wishlist"
ON wishlist FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Enable users to add to wishlist"
ON wishlist FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Enable users to remove from wishlist"
ON wishlist FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- STORE PROFILES TABLE POLICIES
-- ============================================================================

-- Anyone can view active store profiles
CREATE POLICY IF NOT EXISTS "Enable read access for store profiles"
ON store_profiles FOR SELECT
USING (is_active = true);

-- Store owners can view and update their own profile
CREATE POLICY IF NOT EXISTS "Enable sellers to view their own store profile"
ON store_profiles FOR SELECT
USING (user_id = auth.uid() OR is_active = true);

CREATE POLICY IF NOT EXISTS "Enable sellers to update their store profile"
ON store_profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- FLASH SALES TABLE POLICIES
-- ============================================================================

-- Anyone can view active flash sales
CREATE POLICY IF NOT EXISTS "Enable read access for flash sales"
ON flash_sales FOR SELECT
USING (is_active = true);

-- Only admins can create, update, or delete flash sales
-- (This can be checked via auth.jwt() -> 'role' = 'admin')
CREATE POLICY IF NOT EXISTS "Enable admins to manage flash sales"
ON flash_sales FOR ALL
USING ((auth.jwt() ->> 'role' = 'admin'))
WITH CHECK ((auth.jwt() ->> 'role' = 'admin'));

-- ============================================================================
-- PRODUCT_QA TABLE POLICIES
-- ============================================================================

-- Anyone can read Q&A
CREATE POLICY IF NOT EXISTS "Enable read access for product Q&A"
ON product_qa FOR SELECT
USING (true);

-- Users can ask questions
CREATE POLICY IF NOT EXISTS "Enable users to ask questions"
ON product_qa FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Product sellers can answer questions and users can update their questions
CREATE POLICY IF NOT EXISTS "Enable Q&A updates"
ON product_qa FOR UPDATE
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_qa.product_id 
    AND products.seller_id = auth.uid()
  )
);

-- ============================================================================
-- PROMOTIONAL CODES TABLE POLICIES
-- ============================================================================

-- Anyone can view active promotional codes
CREATE POLICY IF NOT EXISTS "Enable read access for active promotional codes"
ON promotional_codes FOR SELECT
USING (is_active = true);

-- Only admins can manage promotional codes
CREATE POLICY IF NOT EXISTS "Enable admins to manage promotional codes"
ON promotional_codes FOR ALL
USING ((auth.jwt() ->> 'role' = 'admin'))
WITH CHECK ((auth.jwt() ->> 'role' = 'admin'));

-- ============================================================================
-- STORE COUPONS TABLE POLICIES
-- ============================================================================

-- Anyone can view active store coupons
CREATE POLICY IF NOT EXISTS "Enable read access for store coupons"
ON store_coupons FOR SELECT
USING (is_active = true);

-- Sellers can manage their own coupons
CREATE POLICY IF NOT EXISTS "Enable sellers to manage their coupons"
ON store_coupons FOR INSERT
WITH CHECK (seller_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Enable sellers to update their coupons"
ON store_coupons FOR UPDATE
USING (seller_id = auth.uid())
WITH CHECK (seller_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Enable sellers to delete their coupons"
ON store_coupons FOR DELETE
USING (seller_id = auth.uid());

-- ============================================================================
-- INVENTORY LOGS TABLE POLICIES
-- ============================================================================

-- Sellers can view inventory logs for their products
CREATE POLICY IF NOT EXISTS "Enable sellers to view inventory logs"
ON inventory_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = inventory_logs.product_id 
    AND products.seller_id = auth.uid()
  )
);

-- Sellers can create inventory logs for their products
CREATE POLICY IF NOT EXISTS "Enable sellers to create inventory logs"
ON inventory_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = inventory_logs.product_id 
    AND products.seller_id = auth.uid()
  )
);

-- ============================================================================
-- PRODUCT ANALYTICS TABLE POLICIES
-- ============================================================================

-- Sellers can view analytics for their products
CREATE POLICY IF NOT EXISTS "Enable sellers to view product analytics"
ON product_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_analytics.product_id 
    AND products.seller_id = auth.uid()
  )
);

-- ============================================================================
-- SELLER METRICS TABLE POLICIES
-- ============================================================================

-- Sellers can view their own metrics
CREATE POLICY IF NOT EXISTS "Enable sellers to view their metrics"
ON seller_metrics FOR SELECT
USING (seller_id = auth.uid());

-- Sellers can update their own metrics (timestamp-based auto-updates)
CREATE POLICY IF NOT EXISTS "Enable sellers to update their metrics"
ON seller_metrics FOR UPDATE
USING (seller_id = auth.uid())
WITH CHECK (seller_id = auth.uid());

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- To verify RLS is properly configured, run:
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE tablename LIKE 'product%' OR tablename LIKE 'order%' OR tablename LIKE 'shopping%' OR tablename LIKE 'wishlist%' OR tablename LIKE 'store_%' OR tablename LIKE 'flash_%' OR tablename LIKE 'promotional%' OR tablename LIKE 'seller_%' OR tablename LIKE 'inventory_%';

-- To check policies for a specific table, run:
-- SELECT * FROM pg_policies WHERE tablename = 'products';
