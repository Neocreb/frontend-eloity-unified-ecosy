# 🔧 Database Migration & Setup Guide

## Overview

This guide will walk you through applying the marketplace enhancements migration script to your Supabase database and setting up the necessary components.

---

## Prerequisites

- Supabase account and project set up
- Access to Supabase dashboard/SQL editor
- Basic understanding of SQL and database schema
- Node.js installed locally (for running migration scripts)

---

## Part 1: Apply SQL Migration

### Step 1.1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New query** button
4. You should now see a blank SQL editor

### Step 1.2: Copy and Paste Migration Script

1. Open the file: `scripts/migrations/marketplace-enhancements.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL editor
4. The script is formatted to be safe to run multiple times (uses `IF NOT EXISTS` clauses)

### Step 1.3: Execute the Migration

1. Click the **Run** button (or press Ctrl+Enter / Cmd+Enter)
2. Wait for the query to complete (should take 30-60 seconds depending on database size)
3. Check the **Results** panel for success message
4. You should see output like: "Marketplace enhancements migration completed successfully"

### Step 1.4: Verify Tables Were Created

Run the following verification query in a new SQL editor tab:

```sql
-- Verify all new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'product_variants',
  'product_attributes',
  'product_images',
  'flash_sales',
  'inventory_logs',
  'seller_reviews',
  'product_qa',
  'promotional_codes',
  'store_coupons',
  'shipping_zones',
  'returns',
  'seller_metrics',
  'product_analytics'
)
ORDER BY table_name;
```

Expected result: 13 tables should be returned.

### Step 1.5: Verify Views Were Created

```sql
-- Verify views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
AND table_name IN (
  'active_products',
  'boosted_products',
  'pending_returns',
  'seller_performance'
)
ORDER BY table_name;
```

Expected result: 4 views should be returned.

---

## Part 2: Verify Schema Updates

### Step 2.1: Check Products Table New Columns

```sql
-- Check if products table has new columns
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN (
  'sku',
  'product_type',
  'boost_until',
  'seo_title',
  'moderation_status'
)
ORDER BY column_name;
```

### Step 2.2: Check Orders Table New Columns

```sql
-- Check if orders table has new columns
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN (
  'coupon_code',
  'coupon_discount',
  'shipping_cost',
  'estimated_delivery_date'
)
ORDER BY column_name;
```

---

## Part 3: Update Application Services

### Step 3.1: Update marketplaceService.ts

Add these new methods to handle the new tables:

```typescript
// In src/services/marketplaceService.ts

// Product Variants
async getProductVariants(productId: string) {
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId);
  if (error) throw error;
  return data;
}

// Product Images
async getProductImages(productId: string) {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

// Product Q&A
async getProductQuestions(productId: string) {
  const { data, error } = await supabase
    .from('product_qa')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Seller Reviews
async getSellerReviews(sellerId: string) {
  const { data, error } = await supabase
    .from('seller_reviews')
    .select('*')
    .eq('seller_id', sellerId);
  if (error) throw error;
  return data;
}

// Flash Sales
async getActiveFlashSales() {
  const { data, error } = await supabase
    .from('flash_sales')
    .select('*')
    .eq('is_active', true)
    .gt('end_date', new Date().toISOString());
  if (error) throw error;
  return data;
}

// Promotional Codes
async validatePromotionalCode(code: string) {
  const { data, error } = await supabase
    .from('promotional_codes')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single();
  if (error) throw error;
  return data;
}
```

### Step 3.2: Create New Service File for Digital Products

**File**: `src/services/digitalProductService.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';

class DigitalProductService {
  async getDownloadUrl(productId: string, userId: string) {
    // Verify user purchased the product
    const { data: purchase, error: purchaseError } = await supabase
      .from('order_items')
      .select('product_id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .single();

    if (purchaseError || !purchase) {
      throw new Error('No valid purchase found');
    }

    // Get the digital product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('download_url, license_type, download_limit, download_expiry_days')
      .eq('id', productId)
      .single();

    if (productError) throw productError;

    // Generate secure download link (implement security measures)
    return {
      downloadUrl: product.download_url,
      expiresAt: new Date(Date.now() + (product.download_expiry_days || 30) * 24 * 60 * 60 * 1000),
      remainingDownloads: product.download_limit
    };
  }
}

export const digitalProductService = new DigitalProductService();
```

### Step 3.3: Create Returns Service

**File**: `src/services/returnsService.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';

class ReturnsService {
  async initiateReturn(orderId: string, orderItemId: string, reason: string, images?: string[]) {
    const { data, error } = await supabase
      .from('returns')
      .insert({
        order_id: orderId,
        order_item_id: orderItemId,
        return_reason: reason,
        return_status: 'initiated',
        images: images || [],
        refund_amount: 0 // Will be calculated by seller
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getReturnStatus(returnId: string) {
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .eq('id', returnId)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserReturns(userId: string) {
    const { data, error } = await supabase
      .from('returns')
      .select(`
        *,
        orders(*)
      `)
      .eq('orders.buyer_id', userId);

    if (error) throw error;
    return data;
  }
}

export const returnsService = new ReturnsService();
```

---

## Part 4: Update TypeScript Types

### Step 4.1: Extend Product Type

**File**: `src/types/marketplace.ts`

```typescript
export interface Product {
  // ... existing fields ...
  
  // New fields from migration
  sku?: string;
  productType?: 'physical' | 'digital' | 'service';
  digitalProductType?: 'ebook' | 'online_course' | 'template' | 'digital_art' | 'software';
  downloadUrl?: string;
  licenseType?: 'single' | 'multiple' | 'unlimited';
  downloadLimit?: number;
  downloadExpiryDays?: number;
  fileSize?: number;
  fileFormat?: string;
  author?: string;
  publicationDate?: string;
  isbn?: string;
  pages?: number;
  language?: string;
  material?: string;
  size?: string;
  color?: string;
  careInstructions?: string;
  assemblyRequired?: boolean;
  assemblyTime?: string;
  packageWeight?: number;
  variants?: ProductVariant[];
  attributes?: ProductAttribute[];
  boostUntil?: string;
  boostType?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  minOrderQuantity?: number;
  isVerified?: boolean;
  moderationStatus?: 'approved' | 'pending' | 'rejected';
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  price?: number;
  stockQuantity: number;
  images?: string[];
  attributes?: Record<string, string>;
  isActive: boolean;
}

export interface ProductAttribute {
  id: string;
  productId: string;
  attributeName: string;
  attributeValue: string;
  attributeType: 'size' | 'color' | 'material' | 'capacity' | 'custom';
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
  imageType?: 'thumbnail' | 'main' | 'gallery';
}

export interface SellerReview {
  id: string;
  sellerId: string;
  reviewerId: string;
  orderId?: string;
  rating: number;
  communicationRating?: number;
  shippingRating?: number;
  qualityRating?: number;
  content?: string;
  createdAt: string;
}

export interface ProductQA {
  id: string;
  productId: string;
  userId: string;
  question: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  helpfulCount: number;
  createdAt: string;
}

export interface FlashSale {
  id: string;
  title: string;
  description?: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  featuredProducts: string[];
}

export interface Return {
  id: string;
  orderId: string;
  orderItemId: string;
  returnReason: string;
  returnStatus: 'initiated' | 'approved' | 'rejected' | 'in_transit' | 'completed';
  refundAmount: number;
  returnTrackingNumber?: string;
  images?: string[];
  adminNotes?: string;
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
}

export interface PromotionalCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount' | 'free_shipping';
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscount?: number;
  maxUses?: number;
  currentUses: number;
  validFrom: string;
  validUntil?: string;
  applicableCategories?: string[];
  applicableProducts?: string[];
  isActive: boolean;
}
```

---

## Part 5: Update Row-Level Security (RLS) Policies

**Important**: Add these RLS policies to your Supabase dashboard for security.

### Step 5.1: Product Images Policy

```sql
-- Product images are public readable
CREATE POLICY "Product images are publicly readable"
ON product_images FOR SELECT
USING (true);

-- Only sellers can insert/update their product images
CREATE POLICY "Sellers can manage their product images"
ON product_images FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT seller_id FROM products WHERE id = product_id
  )
);
```

### Step 5.2: Product Reviews Policy

```sql
-- Anyone can read reviews
CREATE POLICY "Reviews are publicly readable"
ON seller_reviews FOR SELECT
USING (true);

-- Only authorized users can write reviews
CREATE POLICY "Users can create seller reviews"
ON seller_reviews FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_id
);
```

### Step 5.3: Q&A Policy

```sql
-- Q&A is publicly readable
CREATE POLICY "Product QA is publicly readable"
ON product_qa FOR SELECT
USING (true);

-- Users can ask questions
CREATE POLICY "Users can ask questions"
ON product_qa FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- Sellers can answer questions
CREATE POLICY "Sellers can answer questions"
ON product_qa FOR UPDATE
USING (
  auth.uid() IN (
    SELECT seller_id FROM products WHERE id = product_id
  )
);
```

---

## Part 6: Test the Migration

### Step 6.1: Insert Test Data

```sql
-- Insert a test product variant
INSERT INTO product_variants (product_id, name, sku, price, stock_quantity)
SELECT id, 'Test Variant', 'TEST-SKU-001', 99.99, 50
FROM products
LIMIT 1;

-- Insert test product images
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT id, 'https://example.com/image.jpg', 'Test Image', true, 1
FROM products
LIMIT 1;

-- Verify inserts
SELECT COUNT(*) as variant_count FROM product_variants;
SELECT COUNT(*) as image_count FROM product_images;
```

### Step 6.2: Query the Views

```sql
-- Test the views
SELECT COUNT(*) as active_products_count FROM active_products;
SELECT COUNT(*) as boosted_products_count FROM boosted_products;
SELECT COUNT(*) as pending_returns_count FROM pending_returns;
```

---

## Part 7: Backup Before Migration (Recommended)

### Step 7.1: Create a Backup in Supabase

1. Go to **Settings** → **Database** in Supabase
2. Scroll down to **Backups**
3. Click **Create backup** button
4. Wait for backup to complete
5. You can restore from this backup if needed

### Step 7.2: Export Data (Optional)

```bash
# Using pgAdmin or pgdump
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres > backup.sql
```

---

## Part 8: Run Migration Script via CLI (Alternative)

If you prefer to run the migration via command line:

### Step 8.1: Install psql

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### Step 8.2: Run Migration

```bash
# Set your database connection details
export PGHOST=db.xxxxx.supabase.co
export PGPORT=5432
export PGDATABASE=postgres
export PGUSER=postgres
export PGPASSWORD=your_password

# Run the migration script
psql < scripts/migrations/marketplace-enhancements.sql
```

---

## Part 9: Troubleshooting

### Issue: "Permission denied" error

**Solution**: Ensure you're using a user with sufficient privileges (service_role or postgres user)

### Issue: "Table already exists" error

**Solution**: This is expected if the table already exists - the script uses `IF NOT EXISTS` to handle this

### Issue: Foreign key constraint errors

**Solution**: 
- Ensure parent tables (products, orders, users) exist first
- Check that product IDs actually exist in the database
- Run the migration in the correct order

### Issue: UUID generation fails

**Solution**: Ensure the `uuid-ossp` extension is enabled:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## Part 10: Post-Migration Checklist

- [ ] All 13 tables created successfully
- [ ] All 4 views created successfully
- [ ] New columns added to existing tables
- [ ] Indexes created for performance
- [ ] RLS policies configured
- [ ] Test data inserted and verified
- [ ] Application services updated
- [ ] TypeScript types updated
- [ ] Backup created
- [ ] Deployment planned

---

## Next Steps

1. **Update Frontend Components**: Use the new tables in your React components
2. **Implement Product Detail Page**: See MARKETPLACE_FEATURE_IMPLEMENTATION_GUIDE.md
3. **Add Reviews/Q&A System**: Implement user interactions
4. **Set Up Admin Dashboard**: For managing promotions and returns
5. **Test Thoroughly**: Across all devices and browsers

---

**Migration Version**: 1.0
**Last Updated**: 2024
**Status**: Production Ready
