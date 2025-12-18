# 🎨 Marketplace UI/UX Design Guide

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Color Scheme](#color-scheme)
3. [Typography](#typography)
4. [Component Design](#component-design)
5. [Layout Patterns](#layout-patterns)
6. [Interactions & Animations](#interactions--animations)
7. [Mobile-First Design](#mobile-first-design)
8. [Accessibility](#accessibility)
9. [Dark Mode](#dark-mode)
10. [Performance Considerations](#performance-considerations)

---

## Design Philosophy

### Core Principles

1. **Trust & Safety First**
   - Clear seller information
   - Verification badges prominent
   - Transparent pricing (no hidden fees)
   - Easy returns/refund process

2. **Simplicity & Clarity**
   - Minimal cognitive load
   - Clear call-to-actions
   - Obvious navigation paths
   - Consistent patterns throughout

3. **Performance Focus**
   - Fast page loads
   - Smooth interactions
   - Optimized images
   - Quick checkout process

4. **Conversion Optimization**
   - Strategic use of whitespace
   - Eye-catching CTAs
   - Social proof (ratings, reviews)
   - Limited friction in checkout

5. **Inclusive Design**
   - WCAG 2.1 AA compliant
   - Screen reader friendly
   - Keyboard navigable
   - Color contrast safe

---

## Color Scheme

### Primary Palette (Eloity Brand)

```
Primary: #2563EB (Blue)
  - Used for: CTAs, active states, primary actions
  - RGB: 37, 99, 235
  - Usage: Add to cart, Buy now, Primary buttons

Secondary: #7C3AED (Purple)
  - Used for: Premium features, secondary CTAs
  - RGB: 124, 58, 237
  - Usage: Premium badges, secondary buttons

Accent: #F59E0B (Amber)
  - Used for: Warnings, limited-time offers, badges
  - RGB: 245, 158, 11
  - Usage: Flash sale badges, discount labels

Success: #10B981 (Green)
  - Used for: Confirmations, positive actions
  - RGB: 16, 185, 129
  - Usage: Order confirmed, In stock indicator

Warning: #EF4444 (Red)
  - Used for: Errors, critical actions
  - RGB: 239, 68, 68
  - Usage: Out of stock, Errors, Urgent warnings

Neutral: #6B7280 (Gray)
  - Used for: Secondary text, disabled states
  - RGB: 107, 114, 128
  - Usage: Descriptions, Helper text
```

### Semantic Color Usage

```
Background: #FFFFFF (Light) / #1F2937 (Dark)
Surface: #F9FAFB (Light) / #111827 (Dark)
Border: #E5E7EB (Light) / #374151 (Dark)
Text Primary: #111827 (Light) / #F9FAFB (Dark)
Text Secondary: #6B7280 (Light) / #D1D5DB (Dark)
```

### For Different Product Categories

```
Electronics: #3B82F6 (Cool Blue)
Fashion: #EC4899 (Pink)
Home & Garden: #10B981 (Green)
Food & Beverages: #F59E0B (Amber)
Books: #8B5CF6 (Violet)
Sports: #EF4444 (Red)
```

---

## Typography

### Font Family

```css
/* Primary Font - Modern, Clean, Professional */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Headings - For emphasis */
font-family: 'Poppins', 'Inter', sans-serif;

/* Monospace - For codes, prices */
font-family: 'IBM Plex Mono', 'Courier New', monospace;
```

### Font Sizes & Weights

```
H1: 36px / 44px, Weight: 700 (Bold)
  Usage: Page titles, main headings

H2: 28px / 36px, Weight: 600 (SemiBold)
  Usage: Section headings, category titles

H3: 20px / 28px, Weight: 600 (SemiBold)
  Usage: Product card titles, subsection headers

H4: 18px / 24px, Weight: 600 (SemiBold)
  Usage: Form labels, smaller section headers

Body Large: 16px / 24px, Weight: 400 (Regular)
  Usage: Product descriptions, body text

Body: 14px / 21px, Weight: 400 (Regular)
  Usage: General text, card content

Body Small: 12px / 18px, Weight: 400 (Regular)
  Usage: Helper text, labels, meta information

Caption: 11px / 16px, Weight: 500 (Medium)
  Usage: Timestamps, secondary labels
```

### Line Heights

- Headings: 1.2
- Body: 1.5
- Lists: 1.6
- Code: 1.4

### Letter Spacing

- Headings: -0.02em
- Body: 0
- Labels: 0.05em

---

## Component Design

### Product Card

```typescript
// Structure
<Card>
  <CardImage /> (Product image with hover effects)
  <CardBadges /> (New, Sale, Limited, etc.)
  <CardTitle /> (Product name)
  <CardRating /> (Stars + review count)
  <CardPrice /> (Original + current + discount %)
  <CardStock /> (Stock status)
  <CardActions /> (Add to cart, Wishlist, Quick view)
</Card>

// Visual Specs
- Width: Responsive (100%, 50%, 33.33%, 25%)
- Height: Auto aspect ratio 1:1
- Border Radius: 12px
- Box Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Hover: Elevate (0 10px 25px rgba(0,0,0,0.1))
- Transition: 200ms ease-out
```

### Price Display

```
Original Price: $99.99 (line-through, gray)
Current Price: $49.99 (bold, primary color)
Discount: -50% (red badge with white text)
Per Unit: $10.00 (if quantity purchase)
Shipping: + $5.00 (with icon)
Total: $54.99 (bold, highlighted)
```

### Rating Display

```
Overall Rating: ★★★★☆ 4.2 (456 reviews)
  - 5★ (████████░░) 60% (272 reviews)
  - 4★ (██░░░░░░░░) 14% (64 reviews)
  - 3★ (░░░░░░░░░░) 5% (23 reviews)
  - 2★ (░░░░░░░░░░) 0% (0 reviews)
  - 1★ (░░░░░░░░░░) 0% (0 reviews)
  
Seller Rating: ★★★★★ 4.8 (12,345 reviews)
```

### Badge Design

```
New Badge: Green background, white text, "NEW"
Sale Badge: Red background, white text, "SALE"
Limited Badge: Orange background, white text, "LIMITED"
Featured Badge: Gold background, dark text, "FEATURED"
Verified Badge: Blue background, white text, with checkmark
Bestseller Badge: Purple background, white text, "BESTSELLER"
```

### Button Styles

```
Primary Button:
  Background: #2563EB
  Text: White, 600 weight
  Padding: 12px 24px
  Border Radius: 8px
  Hover: #1D4ED8
  Active: #1E40AF
  Disabled: #D1D5DB with opacity 50%

Secondary Button:
  Background: #F3F4F6
  Text: #111827, 600 weight
  Padding: 12px 24px
  Border: 1px solid #E5E7EB
  Hover: #E5E7EB
  Active: #D1D5DB

Ghost Button:
  Background: Transparent
  Text: #2563EB, 600 weight
  Padding: 12px 24px
  Border: None
  Hover: #E0E7FF (light blue background)

Disabled State:
  Opacity: 50%
  Cursor: Not-allowed
  No hover effects
```

### Input Fields

```
Base Style:
  Border: 1px solid #E5E7EB
  Padding: 12px 16px
  Font: 14px, 400 weight
  Border Radius: 8px
  Transition: border-color 200ms

States:
  Default: Border #E5E7EB
  Hover: Border #D1D5DB
  Focus: Border #2563EB, box-shadow: 0 0 0 3px rgba(37,99,235,0.1)
  Error: Border #EF4444, background: #FEE2E2
  Disabled: Background #F9FAFB, opacity 50%, cursor not-allowed
```

### Modals & Dialogs

```
Overlay: Black with 50% opacity
Modal:
  Background: White (light) / #1F2937 (dark)
  Border Radius: 16px
  Box Shadow: 0 25px 50px -12px rgba(0,0,0,0.25)
  Max Width: 90vw or 600px
  Padding: 32px
  Animate: Fade in + slide up (300ms)
```

---

## Layout Patterns

### Homepage Layout

```
Header (Fixed/Sticky)
├── Logo
├── Search Bar
├── Navigation (Feed, Explore, Market, etc.)
└── User Menu

Hero Section
├── Large banner with CTA
└── Category pills

Featured/Flash Sales Section
├── Countdown timer
└── Product carousel

Product Grid Section (3-6 columns responsive)
├── Filters Sidebar (Desktop)
├── Product cards grid
└── Load more / Pagination

Footer
├── Links (About, Help, Policies)
├── Newsletter signup
└── Social media
```

### Product Detail Layout

```
Header (Sticky on mobile)

Main Content (2-3 columns on desktop, single on mobile)
├── Left Column (60%):
│   ├── Image gallery
│   └── Zoom viewer
├── Right Column (40%):
│   ├── Product title
│   ├── Rating & reviews count
│   ├── Price section
│   ├── Variant selectors
│   ├── Quantity selector
│   ├── Add to cart / Buy now buttons
│   ├── Wishlist / Compare buttons
│   └── Seller card
├── Trust section
│   ├── Delivery info
│   ├── Return policy
│   ├── Seller verification
│   └── Safe payment badge

Below the fold:
├── Product description
├── Specifications table
├── Reviews section
├── Q&A section
├── Related products carousel
└── Seller store information
```

### Shopping Cart Layout

```
Header

Main Content (Desktop: 70% cart, 30% summary)
├── Cart items list
│   ├── Item cards with images
│   ├── Price breakdown
│   ├── Quantity controls
│   └── Remove/Save for later buttons
└── Right Sidebar (Sticky):
    ├── Subtotal
    ├── Discount input
    ├── Shipping selector
    ├── Tax (if applicable)
    ├── Total
    └── Checkout button

Below:
├── Recommended products
├── Frequently bought together
└── Related products
```

---

## Interactions & Animations

### Page Transitions

```
Between pages: Fade (200ms) + optional scale
- Enter: opacity: 0 → 1
- Exit: opacity: 1 → 0
- Easing: ease-out

Example:
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Loading States

```
Skeleton screens: Show layout structure with shimmer effect
Progress bars: For multi-step processes
Spinners: For async operations
Toast notifications: For status updates
```

### Hover Effects

```
Product Cards:
  - Image zoom (103%)
  - Shadow elevation
  - Quick view button appears

Buttons:
  - Background color shift
  - Slight scale (101%)
  - Cursor pointer

Links:
  - Underline appears
  - Color change
  - Cursor pointer
```

### Click Feedback

```
Button click:
  - Brief scale down (98%)
  - Background color change
  - Duration: 100ms

Input focus:
  - Border color change
  - Shadow addition
  - Cursor blink

Checkbox/Radio:
  - Animation of check mark
  - Color change
  - Duration: 150ms
```

---

## Mobile-First Design

### Breakpoints

```
xs: 320px (Small phones)
sm: 480px (Standard phones)
md: 768px (Tablets)
lg: 1024px (Desktops)
xl: 1280px (Large desktops)
2xl: 1536px (Extra large)
```

### Mobile Navigation

```
Bottom Navigation Bar:
  ├── Home
  ├── Explore
  ├── Cart (with badge)
  ├── Messages (with badge)
  └── Profile

Mobile Menu (Hamburger):
  ├── User profile section
  ├── Account settings
  ├── My orders
  ├── Wishlist
  ├── Become a seller
  ├── Help & support
  └── Settings
```

### Mobile Product Card

```
Full width with margin
Image: Aspect ratio 1:1
Content below image:
  ├── Product name (2 lines max)
  ├── Rating stars + count
  ├── Price (large)
  ├── Stock status
  └── "Add to cart" button (full width)
```

### Mobile Filters

```
Collapsible Accordion Style:
  ├── Price Range (Slider)
  ├── Categories (Expandable)
  ├── Brands (Expandable)
  ├── Ratings (Expandable)
  ├── Condition (Expandable)
  └── Apply / Reset buttons

Sticky header with "Filters" button that opens drawer
```

### Touch-Friendly Design

```
Minimum touch target: 48px × 48px (not 44px)
Spacing between targets: 8px minimum
Large text for legibility
Avoid hover-only controls
Optimize for thumb accessibility
Support swipe gestures
```

---

## Accessibility

### WCAG 2.1 AA Compliance

#### Color Contrast

```
- Text on background: 4.5:1 (normal text)
- Text on background: 3:1 (large text 18px+)
- UI components: 3:1
- Graphical elements: 3:1
```

#### Focus Management

```
- Visible focus indicators
- Focus ring: 2-3px with high contrast color
- Logical tab order
- Focus trap in modals
```

#### ARIA Labels

```html
<!-- Images -->
<img alt="Clear, descriptive text" />

<!-- Buttons without text -->
<button aria-label="Close dialog"><Icon /></button>

<!-- Icons with meaning -->
<span aria-hidden="true">★</span>
<span className="sr-only">4 out of 5 stars</span>

<!-- Form labels -->
<label htmlFor="email">Email address</label>
<input id="email" type="email" />

<!-- Dynamic updates -->
<div role="status" aria-live="polite" aria-atomic="true">
  Item added to cart
</div>
```

#### Screen Reader Text

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

#### Keyboard Navigation

```
Tab: Next focusable element
Shift+Tab: Previous focusable element
Enter/Space: Activate button
Arrow keys: Navigate lists/options
Escape: Close modals/dropdowns
```

---

## Dark Mode

### Color Mapping

```
Light Mode → Dark Mode

Background: #FFFFFF → #0F172A
Surface: #F9FAFB → #1E293B
Border: #E5E7EB → #334155
Text Primary: #111827 → #F1F5F9
Text Secondary: #6B7280 → #94A3B8

Primary Colors: Keep the same (#2563EB)
Status Colors: Adjust for visibility
```

### Implementation

```tsx
// Using next-themes
import { useTheme } from 'next-themes'

export function Component() {
  const { theme } = useTheme()
  return (
    <div className={theme === 'dark' ? 'bg-slate-900' : 'bg-white'}>
      {/* Content */}
    </div>
  )
}
```

---

## Performance Considerations

### Image Optimization

```html
<!-- Use Next.js Image component -->
<Image
  src="/product.jpg"
  alt="Product name"
  width={500}
  height={500}
  quality={85}
  placeholder="blur"
/>

<!-- WebP with fallback -->
<picture>
  <source srcSet="/image.webp" type="image/webp" />
  <img src="/image.jpg" alt="Description" />
</picture>

<!-- Lazy loading for below-the-fold images -->
<img loading="lazy" src="/image.jpg" alt="Description" />
```

### CSS Optimization

```css
/* Use native CSS variables for theming */
:root {
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
}

[data-theme="dark"] {
  --primary-color: #60a5fa;
  --primary-hover: #3b82f6;
}
```

### JavaScript Optimization

```
- Code splitting per route
- Dynamic imports for heavy components
- Defer non-critical JS
- Remove unused dependencies
- Minimize bundle size
```

---

## Component Examples

### Product Card Component Structure

```tsx
<div className="product-card">
  <div className="product-image-container">
    <img src="image.jpg" alt="Product" />
    <div className="product-badges">
      <span className="badge-new">New</span>
      <span className="badge-sale">-20%</span>
    </div>
    <button className="quick-view">Quick View</button>
  </div>
  
  <div className="product-info">
    <h3 className="product-title">Product Name</h3>
    
    <div className="product-rating">
      <div className="stars">★★★★☆</div>
      <span className="review-count">(456)</span>
    </div>
    
    <div className="product-price">
      <span className="original-price">$99.99</span>
      <span className="current-price">$49.99</span>
      <span className="discount">-50%</span>
    </div>
    
    <div className="product-stock">
      <span className="stock-status">In stock</span>
    </div>
    
    <div className="product-actions">
      <button className="btn-add-to-cart">Add to Cart</button>
      <button className="btn-wishlist" aria-label="Add to wishlist">
        ♡
      </button>
    </div>
  </div>
</div>
```

---

## Best Practices Summary

1. **Trust Indicators First**: Reviews, seller info, guarantees visible
2. **Clear Pricing**: No hidden costs, transparent fees
3. **Quick Checkout**: Minimal steps, guest option available
4. **Mobile Responsive**: Optimized for all screen sizes
5. **Fast Loading**: Optimized images and code
6. **Accessibility**: WCAG 2.1 AA compliant throughout
7. **Consistent Design**: Patterns repeated throughout
8. **User Feedback**: Clear messaging on actions
9. **Security Visible**: HTTPS, payment badges, privacy
10. **Easy Returns**: Clear return process displayed

---

**Design Guide Version**: 1.0
**Last Updated**: 2024
**Status**: Ready for Implementation
