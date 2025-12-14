# Featured Crypto & Community Posts Setup Guide

This document guides you through the new crypto page implementation with real data fetching from multiple sources and optional admin management.

## Overview

The crypto page now includes:
- **Gainers/Losers Tabs**: Automatically calculated from live cryptocurrency prices
- **Community Tabs**: Real data from blog posts, courses, feed posts, events, and announcements
- **Admin Management**: Optional Supabase integration for manual content curation
- **Zero Setup Required**: Works immediately with live data sources

## Implementation Details

### 1. Updated Service
- **File**: `src/services/featuredCryptoService.ts`
- **Purpose**: Fetches real data from multiple sources with fallback to mock data
- **Key Methods**:
  - `getDiscoverPosts(limit)` - Fetches from blog posts and courses
  - `getCommunityPosts(limit)` - Fetches crypto-related feed posts
  - `getEventPosts(limit)` - Fetches upcoming crypto events
  - `getAnnouncementPosts(limit)` - Fetches tagged blog posts
- **Data Sources**:
  - Blog service for Discover tab
  - Course service for Discover tab
  - Posts table for Community tab
  - Events table for Event tab
  - Blog service with filters for Announcement tab

### 2. Updated Component
- **File**: `src/pages/ProfessionalCrypto.tsx`
- **Changes**:
  - Responsive action buttons (icon + small text on mobile)
  - Gainers tab (top 6 by positive price change)
  - Losers tab (top 6 by negative price change)
  - Real data fetching for all community sections
  - Automatic calculation of gainers/losers from price data
  - Proper fallback to mock data when sources unavailable

### 3. New Admin Page
- **File**: `src/pages/admin/AdminFeaturedCrypto.tsx`
- **Purpose**: Allows admins to manually manage featured content
- **Features**:
  - Add/edit/delete featured listings
  - Add/edit/delete community posts
  - Toggle featured/hidden status
  - Change display order
  - View all content in organized tabs

### 4. Optional Database Setup
Two migration files available for custom management:

#### `migrations/featured_crypto_listings.sql`
Creates optional tables:
- `featured_crypto_listings` - For manually curated listings
- `community_featured_posts` - For admin-managed posts
- `crypto_categories` - Category definitions
- Includes RLS policies and indexes

#### `migrations/sample_featured_data.sql`
Provides sample data for:
- Gainers and Losers listings
- Sample community posts across all categories

## Setup Instructions

### Step 1: Apply Database Migrations

1. Open Supabase Console for your project
2. Go to the SQL Editor
3. Copy and paste the contents of `migrations/featured_crypto_listings.sql`
4. Click "Run"
5. Wait for completion - you should see the tables created

### Step 2: Insert Sample Data (Optional)

1. In the same SQL Editor, paste the contents of `migrations/sample_featured_data.sql`
2. Click "Run"
3. Verify the data was inserted by checking the tables in the Supabase dashboard

### Step 3: Verify Setup

1. Go to Supabase > SQL Editor
2. Run this query to verify tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('featured_crypto_listings', 'community_featured_posts', 'crypto_categories');
```

3. Check RLS is enabled:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('featured_crypto_listings', 'community_featured_posts');
```

## Environment Variables

No new environment variables are required. The system uses existing Supabase client configuration.

## Testing

1. Navigate to `/app/crypto` in your application
2. You should see:
   - **Quick Access**: 6 cards in a 2-column grid on mobile
   - **Top Cryptocurrencies**: Tabs for Favorites, Trending, GemW, and New Listings
   - **Community**: Tabs for Discover, Community, Event, and Announcement with featured posts

### Testing Data Fallback

If you don't insert sample data, the system will display mock data automatically. This is useful for testing without database setup.

## Database Schema Reference

### featured_crypto_listings
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Primary key |
| symbol | TEXT | Crypto symbol (BTC, ETH, etc.) |
| name | TEXT | Full name |
| coingecko_id | TEXT | CoinGecko API ID for integration |
| image_url | TEXT | Cryptocurrency logo URL |
| current_price | DECIMAL | Current price |
| price_change_24h | DECIMAL | 24h change percentage |
| category | TEXT | gemw, new_listing, trending, hot |
| is_featured | BOOLEAN | Whether to show in UI |
| order_index | INTEGER | Display order within category |

### community_featured_posts
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Primary key |
| user_id | UUID | Creator user ID |
| username | TEXT | Display username |
| avatar_url | TEXT | User avatar |
| title | TEXT | Post title (optional) |
| content | TEXT | Main content |
| category | TEXT | discover, community, announcement, event |
| sentiment | TEXT | positive, negative, neutral |
| impact_percentage | DECIMAL | Market impact percentage |
| is_featured | BOOLEAN | Whether featured |
| order_index | INTEGER | Display order |
| engagement_count | INTEGER | Likes/interactions |

## Adding More Featured Content

To add new featured listings or posts, either:

### Via Supabase Dashboard
1. Go to featured_crypto_listings or community_featured_posts table
2. Click "Insert row"
3. Fill in the fields
4. Make sure `is_featured = true` to display in UI

### Via SQL
```sql
-- Add new featured listing
INSERT INTO featured_crypto_listings (symbol, name, coingecko_id, image_url, current_price, price_change_24h, category, is_featured, order_index)
VALUES ('XYZ', 'XYZ Token', 'xyz-token', 'https://...', 1.50, 25.00, 'gemw', true, 4);

-- Add new community post
INSERT INTO community_featured_posts (user_id, username, avatar_url, content, category, sentiment, impact_percentage, is_featured, order_index)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Username', 'https://...', 'Post content', 'discover', 'positive', 10.50, true, 2);
```

## Customization

### Changing Categories
Edit `migrations/featured_crypto_listings.sql` in the "Insert default categories" section:
```sql
INSERT INTO crypto_categories (name, slug, description) VALUES
  ('Your Category', 'your_category', 'Description'),
  ...
```

### Styling
All components use existing Tailwind and UI component styling. To customize:
1. Edit `src/pages/ProfessionalCrypto.tsx`
2. Modify className attributes
3. Update Badge colors and styles as needed

## Troubleshooting

### Data Not Showing
1. Check RLS policies are enabled (see Step 3 above)
2. Verify `is_featured = true` for your data
3. Check browser console for errors
4. Verify Supabase client is properly configured

### Migrations Failed
1. Ensure your Supabase user has DDL permissions
2. Check for duplicate table names
3. Review error messages in Supabase console
4. Try running migrations one table at a time

### Performance Issues
If you have many records, the indexes created in the migration should help. You can add additional indexes:
```sql
CREATE INDEX idx_featured_listings_category_featured ON featured_crypto_listings(category, is_featured);
CREATE INDEX idx_community_posts_category_featured ON community_featured_posts(category, is_featured);
```

## API Integration (Future)

To integrate with real CoinGecko data:
1. Create a backend endpoint `/api/crypto/featured`
2. Fetch from Supabase
3. Optionally enrich with CoinGecko data using `coingecko_id`
4. Update the service to call this endpoint

## Support

For issues or questions:
1. Check the Supabase logs
2. Review component console logs
3. Verify RLS policies allow your user
4. Check that environment variables are set correctly
