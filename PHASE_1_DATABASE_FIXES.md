# 🔧 Phase 1: Database Schema Alignment

**Status**: 🟢 Starting Now
**Duration**: 1 Week
**Priority**: 🔴 CRITICAL (Blocking all other work)
**Estimated Hours**: 30

---

## Problem Summary

The current codebase has **3 major database schema issues** that will cause runtime failures:

### Issue 1: Wishlist Table Naming Conflict
**Severity**: 🔴 Critical

- **Schema defines**: `wishlist` (singular) table
- **Services expect**: `wishlists` and `wishlist_items` (plural) tables
- **Impact**: WishlistService.getWishlistItems() will fail at runtime

### Issue 2: Reviews Table Naming Conflict
**Severity**: 🔴 Critical

- **Schema defines**: `product_reviews` table
- **Services use multiple names**:
  - `reviews` (MarketplaceService.getReviews())
  - `marketplace_reviews` (MarketplaceService.getProductReviews())
  - `product_reviews` (schema definition)
- **Impact**: Review queries will fail or create duplicate data

### Issue 3: Store Profile Duplication
**Severity**: 🟡 High

- **Schema defines two tables**:
  - `marketplace_profiles` (for sellers)
  - `store_profiles` (also for sellers)
- **Impact**: Confusion about which table to use; potential data duplication

---

## Solution Strategy

### Step 1: Standardize to Canonical Names
Use these standard names throughout codebase:

```
✅ wishlist_items (not wishlists)
✅ product_reviews (not reviews or marketplace_reviews)
✅ store_profiles (consolidate marketplace_profiles → store_profiles)
```

### Step 2: Create Migration Script
Design migration to:
- Rename tables without losing data
- Update all foreign keys
- Create views for backward compatibility
- Log migration in database

### Step 3: Update All Service Queries
Update all service files to use canonical table names

### Step 4: Test & Verify
Run comprehensive tests to ensure all queries work

---

## Implementation Tasks

### Task 1.1: Create Database Migration
**Status**: ⏳ Pending
**Time Estimate**: 3 hours
**Files to Create**: `scripts/migrations/001_fix_schema_naming.sql`

**What it does**:
1. Renames `wishlist` → `wishlist` (no change, but creates `wishlist_items` if needed)
2. Consolidates product review tables
3. Aliases marketplace_profiles → store_profiles
4. Creates views for backward compatibility
5. Updates foreign keys

**SQL Script Structure**:
```sql
-- Phase 1: Backup existing data (if needed)
-- Phase 2: Create new table structures
-- Phase 3: Migrate data
-- Phase 4: Update foreign keys
-- Phase 5: Create compatibility views
-- Phase 6: Verify data integrity
-- Phase 7: Drop old tables (after verification)
```

**Next Steps After**: Run script in Supabase → Verify in database → Update services

---

### Task 1.2: Update MarketplaceService Queries
**Status**: ⏳ Pending
**Time Estimate**: 4 hours
**File**: `src/services/marketplaceService.ts`

**Required Changes**:

```typescript
// BEFORE - Multiple table references
async getReviews(productId: string) {
  const { data, error } = await supabase
    .from('reviews') // ❌ Wrong table name
    .select('*')
    .eq('product_id', productId);
}

async getProductReviews(productId: string) {
  const { data, error } = await supabase
    .from('marketplace_reviews') // ❌ Different name
    .select('*');
}

// AFTER - Single table reference
async getProductReviews(productId: string) {
  const { data, error } = await supabase
    .from('product_reviews') // ✅ Consistent
    .select('*')
    .eq('product_id', productId);
}

async getReviews(productId: string) {
  // Now delegates to getProductReviews or just uses product_reviews
  return this.getProductReviews(productId);
}
```

**Changes Required**:
- [ ] Change `from('reviews')` → `from('product_reviews')`
- [ ] Remove duplicate review methods
- [ ] Change `from('marketplace_reviews')` → `from('product_reviews')`
- [ ] Add JSDoc comments
- [ ] Test after changes

---

### Task 1.3: Update WishlistService Queries
**Status**: ⏳ Pending
**Time Estimate**: 2 hours
**File**: `src/services/wishlistService.ts`

**Required Changes**:

```typescript
// BEFORE - Expects wishlists/wishlist_items
async getWishlistItems(wishlistId: string) {
  const { data } = await supabase
    .from('wishlist_items') // ❌ May not exist
    .select('*')
    .eq('wishlist_id', wishlistId);
}

// AFTER - Use correct table name
async getWishlistItems(wishlistId: string) {
  const { data } = await supabase
    .from('wishlist') // ✅ Correct table
    .select('*')
    .eq('id', wishlistId);
}

async getWishlistItemsByUser(userId: string) {
  const { data } = await supabase
    .from('wishlist') // ✅ Single source of truth
    .select('*')
    .eq('user_id', userId);
}
```

**Changes Required**:
- [ ] Change `from('wishlists')` → `from('wishlist')`
- [ ] Change `from('wishlist_items')` → `from('wishlist')`
- [ ] Update foreign key references
- [ ] Test after changes

---

### Task 1.4: Update ReviewService Queries
**Status**: ⏳ Pending
**Time Estimate**: 1 hour
**File**: `src/services/reviewService.ts`

**Required Changes**:

```typescript
// Ensure all references use product_reviews
async getProductReviews(productId: string) {
  const { data } = await supabase
    .from('product_reviews') // ✅ Standard name
    .select('*')
    .eq('product_id', productId);
  return data;
}
```

---

### Task 1.5: Update OrderService Queries
**Status**: ⏳ Pending
**Time Estimate**: 2 hours
**File**: `src/services/orderService.ts`

**Check for**:
- [ ] All product references use `products` table
- [ ] All review references use `product_reviews` table
- [ ] All order references are consistent
- [ ] Update if any use wrong table names

---

### Task 1.6: Fix Store Profile Consolidation
**Status**: ⏳ Pending
**Time Estimate**: 3 hours
**File**: Multiple

**What to do**:

```typescript
// Option A: Use store_profiles everywhere
// This is recommended to reduce confusion

// Find all: marketplace_profiles → store_profiles
// Check files:
// - src/contexts/EnhancedMarketplaceContext.tsx
// - src/pages/marketplace/EnhancedSellerDashboard.tsx
// - src/services/marketplaceService.ts
```

**Search & Replace**:
```
Find: marketplace_profiles
Replace: store_profiles
```

**Files to Update**:
- [ ] `src/contexts/EnhancedMarketplaceContext.tsx`
- [ ] `src/pages/marketplace/EnhancedSellerDashboard.tsx`
- [ ] `src/services/marketplaceService.ts`
- [ ] `src/components/marketplace/SellerDashboard.tsx`

---

### Task 1.7: Add RLS Security Policies
**Status**: ⏳ Pending
**Time Estimate**: 4 hours
**Location**: Supabase Dashboard → SQL Editor

**Policies to Add**:

```sql
-- Product reviews: Public read, authenticated write
CREATE POLICY "Anyone can read reviews"
ON product_reviews FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can write reviews"
ON product_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Wishlist: Users can only see/modify their own
CREATE POLICY "Users can read own wishlist"
ON wishlist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can modify own wishlist"
ON wishlist FOR INSERT, UPDATE, DELETE
WITH CHECK (auth.uid() = user_id);

-- Products: Anyone can read, sellers can modify own
CREATE POLICY "Anyone can read products"
ON products FOR SELECT
USING (true);

CREATE POLICY "Sellers can modify own products"
ON products FOR UPDATE, DELETE
USING (auth.uid() = seller_id);

-- Store profiles: Anyone can read, sellers can modify own
CREATE POLICY "Anyone can read store profiles"
ON store_profiles FOR SELECT
USING (true);

CREATE POLICY "Sellers can modify own store profile"
ON store_profiles FOR UPDATE, DELETE
USING (auth.uid() = user_id);
```

**Steps**:
1. Go to Supabase Dashboard
2. Select your project
3. Go to Authentication → Policies
4. Add each policy above
5. Test with different user roles

---

### Task 1.8: Comprehensive Testing
**Status**: ⏳ Pending
**Time Estimate**: 6 hours
**Files**: Create `__tests__/marketplace-schema.test.ts`

**Test Cases**:

```typescript
describe('Marketplace Schema & Services', () => {
  // Reviews tests
  test('getProductReviews should use product_reviews table', async () => {
    const reviews = await MarketplaceService.getProductReviews('product-123');
    expect(reviews).toBeDefined();
  });

  test('getReviews should delegate to getProductReviews', async () => {
    const reviews = await MarketplaceService.getReviews('product-123');
    expect(reviews).toBeDefined();
  });

  // Wishlist tests
  test('getWishlistItems should use wishlist table', async () => {
    const items = await WishlistService.getWishlistItems('user-123');
    expect(items).toBeDefined();
  });

  // Store profile tests
  test('getSellerProfile should use store_profiles', async () => {
    const profile = await MarketplaceService.getSellerProfile('seller-123');
    expect(profile).toBeDefined();
  });

  // RLS policy tests
  test('User cannot access other users wishlist', async () => {
    // Test with different auth contexts
    expect(accessOtherUserWishlist).toThrow();
  });
});
```

---

## Phase 1 Checklist

### Database Migration
- [ ] Create migration script `001_fix_schema_naming.sql`
- [ ] Test migration on staging database
- [ ] Backup production database
- [ ] Run migration on production
- [ ] Verify data integrity
- [ ] Document migration steps

### Service Updates
- [ ] Update MarketplaceService (4 hours)
- [ ] Update WishlistService (2 hours)
- [ ] Update ReviewService (1 hour)
- [ ] Update OrderService (2 hours)
- [ ] Search for all remaining references (2 hours)
- [ ] Test all services (4 hours)

### Security
- [ ] Add all RLS policies (4 hours)
- [ ] Test RLS policies (2 hours)
- [ ] Document security model

### Testing & Verification
- [ ] Write comprehensive tests (6 hours)
- [ ] Run all tests
- [ ] Verify no broken queries
- [ ] Test on all endpoints
- [ ] Check logs for errors

### Documentation
- [ ] Update schema documentation
- [ ] Create migration guide
- [ ] Document breaking changes (if any)
- [ ] Update API documentation

---

## Risk Mitigation

### Risk: Breaking Existing Queries
**Mitigation**:
- Create views that map old names to new names
- Run comprehensive test suite before migration
- Have rollback plan ready

### Risk: Data Loss During Migration
**Mitigation**:
- Backup database before migration
- Test migration on staging first
- Use transactions to ensure atomicity

### Risk: Incomplete Updates
**Mitigation**:
- Use grep to find all references: `grep -r "from('reviews')" src/`
- Use IDE find & replace
- Run tests after each file update

---

## Success Criteria

✅ **All tasks complete when**:
1. Database migration runs without errors
2. All service tests pass
3. No console errors on marketplace pages
4. All CRUD operations work
5. RLS policies prevent unauthorized access
6. No duplicate data in database
7. Documentation is updated

---

## Estimated Timeline

```
Day 1: Create migration script + test
Day 2: Update services (MarketplaceService, WishlistService, ReviewService)
Day 3: Update remaining services + search for references
Day 4: Add RLS policies
Day 5: Write & run tests
Day 6: Fix any issues found in tests
Day 7: Final verification & documentation
```

---

## Next Steps After Phase 1

Once this phase is complete:
1. ✅ Database is clean and consistent
2. ✅ Services use correct table names
3. ✅ RLS policies protect data
4. ✅ All tests pass

Then proceed to Phase 2: Core Features Enhancement

---

**Document Version**: 1.0
**Status**: Ready to Start Implementation
**Created**: 2024
