# 🚀 Marketplace Quick Start Guide

## 5-Minute Overview

The Eloity marketplace is a comprehensive e-commerce platform with:
- Product catalog with variants and detailed pages
- Shopping cart and checkout
- Order management and tracking
- Reviews and ratings system
- Seller dashboard and tools
- Promotional features and analytics

---

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Supabase account and project created
- [ ] Access to repository
- [ ] Database migrations applied (see MIGRATION_AND_SETUP_GUIDE.md)
- [ ] Environment variables configured
- [ ] TypeScript knowledge
- [ ] React/Vite experience

---

## Installation Steps (15 minutes)

### 1. Apply Database Migrations

```bash
# Option A: Via Supabase Dashboard
# 1. Go to supabase.co/dashboard
# 2. Select your project
# 3. Go to SQL Editor
# 4. Create new query
# 5. Paste scripts/migrations/marketplace-enhancements.sql
# 6. Run the query

# Option B: Via CLI
export PGHOST=your-db.supabase.co
export PGPORT=5432
export PGDATABASE=postgres
export PGUSER=postgres
export PGPASSWORD=your_password
psql < scripts/migrations/marketplace-enhancements.sql
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Create `.env.local`:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key

# Payment
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx

# API
VITE_API_URL=http://localhost:5000

# Optional
REPLICATE_API_KEY=your_key
BYBIT_API_KEY=your_key
COINGECKO_API_KEY=your_key
```

### 4. Update TypeScript Types

Copy content from this section to `src/types/marketplace.ts`:

```typescript
// Add these interfaces
export interface Product { /* ... */ }
export interface ProductVariant { /* ... */ }
export interface ProductAttribute { /* ... */ }
// etc.
```

### 5. Update Services

Add methods to `src/services/marketplaceService.ts`:

```typescript
// Add new methods for variants, images, Q&A, etc.
async getProductVariants(productId: string) { /* ... */ }
async getProductImages(productId: string) { /* ... */ }
// etc.
```

### 6. Verify Setup

```bash
npm run dev
# Open http://localhost:3000
# Check browser console for errors
```

---

## Create Your First Feature: Product Detail Page

### Step 1: Create Component Structure

```bash
mkdir -p src/pages/marketplace/components
touch src/pages/marketplace/ProductDetail.tsx
touch src/pages/marketplace/components/ProductGallery.tsx
touch src/pages/marketplace/components/ProductInfo.tsx
touch src/pages/marketplace/components/VariantSelector.tsx
```

### Step 2: Scaffold ProductDetail.tsx

```typescript
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ProductService } from '@/services/productService';
import ProductGallery from './components/ProductGallery';
import ProductInfo from './components/ProductInfo';
import ReviewSection from './components/ReviewSection';

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await ProductService.getProductById(productId!);
        setProduct(data);
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="product-detail-page">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ProductGallery product={product} />
          <ProductInfo product={product} />
        </div>
        <ReviewSection productId={productId!} />
      </div>
    </div>
  );
};

export default ProductDetail;
```

### Step 3: Add Route

Update `src/App.tsx`:

```typescript
import ProductDetail from '@/pages/marketplace/ProductDetail';

// In your routes:
<Route path="/app/marketplace/products/:productId" element={<ProductDetail />} />
```

### Step 4: Connect to Navigation

Update product cards to link:

```typescript
<Link to={`/app/marketplace/products/${product.id}`}>
  <ProductCard product={product} />
</Link>
```

---

## Key Files to Modify

### 1. Database Layer (`src/services/`)

```
marketplaceService.ts  - Main API layer
productService.ts       - Product-specific methods
orderService.ts         - Order management
reviewService.ts        - Review operations
```

### 2. Components (`src/components/marketplace/`)

```
EnhancedProductDetail.tsx     - Product page
ProductCard.tsx               - Reusable card
ProductGrid.tsx               - Product listing
EnhancedShoppingCart.tsx      - Cart UI
EnhancedCheckoutFlow.tsx      - Checkout
```

### 3. Pages (`src/pages/marketplace/`)

```
EnhancedMarketplaceHomepage.tsx
MarketplaceList.tsx
MarketplaceCart.tsx
MarketplaceCheckout.tsx
SellerDashboard.tsx
```

### 4. Types (`src/types/`)

```
marketplace.ts - All type definitions
```

---

## Common Tasks

### Task: Display Products on Homepage

```typescript
// In your homepage component
import { MarketplaceService } from '@/services/marketplaceService';

const [products, setProducts] = useState([]);

useEffect(() => {
  const loadProducts = async () => {
    const data = await MarketplaceService.getProducts({
      limit: 12,
      sortBy: 'recent'
    });
    setProducts(data);
  };
  loadProducts();
}, []);

return (
  <div className="grid grid-cols-4 gap-4">
    {products.map(product => (
      <ProductCard key={product.id} product={product} />
    ))}
  </div>
);
```

### Task: Add Product to Cart

```typescript
const handleAddToCart = (productId: string, quantity: number) => {
  useEnhancedMarketplace().addToCart(productId, quantity);
  toast.success('Added to cart!');
};
```

### Task: Create a Product Review

```typescript
const submitReview = async (productId: string, rating: number, content: string) => {
  const { data, error } = await supabase
    .from('product_reviews')
    .insert({
      product_id: productId,
      user_id: user.id,
      rating,
      content,
      verified_purchase: true,
      created_at: new Date()
    });
  
  if (error) throw error;
  return data;
};
```

### Task: Get Seller Information

```typescript
const getSeller = async (sellerId: string) => {
  const { data, error } = await supabase
    .from('store_profiles')
    .select('*')
    .eq('user_id', sellerId)
    .single();
  
  if (error) throw error;
  return data;
};
```

---

## Testing Your Implementation

### Unit Tests

```bash
npm run test

# Test specific component
npm run test -- ProductCard.test.tsx
```

### E2E Tests

```bash
npm run test:e2e
```

### Manual Testing Checklist

- [ ] Product displays correctly
- [ ] Images load properly
- [ ] Add to cart works
- [ ] Cart updates correctly
- [ ] Checkout flow completes
- [ ] Order confirmation appears
- [ ] Mobile view is responsive
- [ ] Dark mode works
- [ ] Accessibility passes (axe check)

---

## Debugging Tips

### Common Issues & Solutions

**Issue**: Products not loading
```typescript
// Check:
1. Database connection in useEffect
2. Product IDs are valid UUIDs
3. RLS policies allow SELECT
// Debug:
console.log('Fetching products...');
const { data, error } = await supabase...
if (error) console.error('Error:', error.message);
```

**Issue**: Images not displaying
```typescript
// Check:
1. Image URLs are valid
2. Storage bucket is public
3. CORS is configured
// Use:
<Image src={product.image} alt={product.name} />
```

**Issue**: Cart not updating
```typescript
// Check:
1. Context provider is mounted
2. State is updating in React DevTools
3. localStorage is enabled
// Debug:
const { cart } = useEnhancedMarketplace();
console.log('Current cart:', cart);
```

---

## Performance Optimization

### Quick Wins

```typescript
// 1. Image optimization
<Image
  src={product.image}
  alt={product.name}
  quality={85}
  placeholder="blur"
/>

// 2. Lazy loading
const ProductDetails = React.lazy(() => import('./ProductDetails'));

// 3. Memoization
const ProductCard = React.memo(({ product }) => (
  // Component
));

// 4. Virtual scrolling for long lists
import { FixedSizeList } from 'react-window';
```

### Database Query Optimization

```sql
-- Good: Use indexes
SELECT * FROM products WHERE category = 'electronics'
-- Bad: Full table scan
SELECT * FROM products WHERE lower(title) LIKE '%phone%'

-- Good: Limit results
SELECT * FROM products LIMIT 20
-- Bad: Fetch all
SELECT * FROM products
```

---

## Deployment Checklist

- [ ] Environment variables set correctly
- [ ] Database migrations applied
- [ ] API endpoints tested
- [ ] Payment processing verified
- [ ] Images optimized
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors
- [ ] Mobile responsive verified
- [ ] Accessibility checked
- [ ] Performance metrics acceptable
- [ ] Security audit passed

---

## Documentation References

1. **Full Implementation Plan**: `MARKETPLACE_IMPLEMENTATION_PLAN.md`
2. **Feature Details**: `MARKETPLACE_FEATURE_IMPLEMENTATION_GUIDE.md`
3. **Database Setup**: `MIGRATION_AND_SETUP_GUIDE.md`
4. **Design Guide**: `MARKETPLACE_UI_UX_DESIGN_GUIDE.md`
5. **Supabase Docs**: https://supabase.com/docs
6. **React Docs**: https://react.dev
7. **Tailwind Docs**: https://tailwindcss.com/docs

---

## Support & Resources

### When You Get Stuck

1. **Check existing components**: Look at `src/components/marketplace/` for patterns
2. **Review services**: See `src/services/marketplaceService.ts` for API methods
3. **Check types**: See `src/types/marketplace.ts` for data structures
4. **Search codebase**: Look for similar implementations
5. **Read docs**: Check the documentation files above
6. **Ask team**: Discuss with other developers

### Helpful Commands

```bash
# Run development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Check types
npm run type-check

# Format code
npm run format

# Lint code
npm run lint
```

---

## Next Steps After Setup

1. ✅ Complete database migrations
2. ✅ Update TypeScript types
3. ✅ Update services with new methods
4. ✅ Create product detail page
5. ⏭️ Implement shopping cart improvements
6. ⏭️ Build checkout flow
7. ⏭️ Add reviews system
8. ⏭️ Create seller dashboard
9. ⏭️ Add promotions features
10. ⏭️ Optimize and deploy

---

## Quick Reference: Key Endpoints

```
GET    /api/marketplace/products              - List products
GET    /api/marketplace/products/:id          - Get product
POST   /api/marketplace/products              - Create product (seller)
PUT    /api/marketplace/products/:id          - Update product (seller)
DELETE /api/marketplace/products/:id          - Delete product (seller)

GET    /api/marketplace/products/:id/reviews  - Get reviews
POST   /api/marketplace/products/:id/reviews  - Post review

GET    /api/marketplace/sellers/:id           - Get seller info
GET    /api/marketplace/sellers/:id/products  - Get seller products

POST   /api/cart/items                        - Add to cart
GET    /api/cart                              - Get cart
PUT    /api/cart/items/:id                    - Update cart item
DELETE /api/cart/items/:id                    - Remove from cart

POST   /api/orders                            - Create order
GET    /api/orders                            - Get user orders
GET    /api/orders/:id                        - Get order details
```

---

## Estimated Timeline

- **Week 1**: Database setup + Product detail page (16 hours)
- **Week 2**: Product listing + filters (16 hours)
- **Week 3**: Cart + Checkout (20 hours)
- **Week 4**: Orders + Tracking (16 hours)
- **Week 5**: Reviews + Ratings (12 hours)
- **Week 6**: Seller dashboard (20 hours)
- **Week 7**: Promotions + Advanced features (20 hours)
- **Week 8**: Testing + Optimization + Deploy (20 hours)

**Total Estimated Time**: 140 hours (3-4 developers for 2 months)

---

## Success Criteria

✅ All products display with real data
✅ Users can search and filter products
✅ Shopping cart fully functional
✅ Checkout completes successfully
✅ Orders tracked accurately
✅ Reviews display properly
✅ Mobile responsive on all screens
✅ Page load time under 3 seconds
✅ Zero critical accessibility issues
✅ Seller dashboard operational

---

**Quick Start Version**: 1.0
**Last Updated**: 2024
**Status**: Ready to Implement

Good luck building! 🚀
