# Managing Featured Crypto & Community Content

This guide helps you manage featured content on the crypto page. You have two options:
1. **Automatic Management**: Content fetches automatically from real sources (zero configuration)
2. **Manual Management**: Use admin interface to curate specific content

## Automatic Content Management (No Configuration)

The page automatically displays:
- **Gainers**: Top 6 cryptos by 24h positive change (updated with prices)
- **Losers**: Top 6 cryptos by 24h negative change (updated with prices)
- **Discover**: Latest blog posts and courses
- **Community**: Recent crypto-related feed posts
- **Events**: Upcoming crypto events
- **Announcements**: Latest tagged blog posts

No database configuration needed - content is live immediately.

## Manual Content Management (Optional)

For admin users who want to manually curate content:

### Accessing the Admin Interface

1. Navigate to `/admin/featured-crypto`
2. You'll see two tabs: "Featured Listings" and "Community Posts"
3. View, add, edit, and delete content as needed

### Add New Featured Crypto Listing

Via Admin Interface:
1. Click the "Add Listing" button
2. Fill in the form fields:
   - **Symbol**: Crypto symbol (BTC, ETH, etc.)
   - **Name**: Full name
   - **Image URL**: Logo URL
   - **Current Price**: Market price
   - **24h Change %**: Price change percentage
   - **Category**: gainers, losers, trending, hot
   - **Order Index**: Display order (1, 2, 3...)
3. Click "Add Listing"

Via Supabase Dashboard (Advanced):
1. Go to **Supabase Console** → Your Project
2. Click **Table Editor**
3. Select `featured_crypto_listings`
4. Click **Insert row**
5. Fill in fields and save

### Add Community Featured Post

Via Admin Interface:
1. Click the "Add Post" button
2. Fill in the form fields:
   - **Username**: Display name (e.g., "Crypto Guru")
   - **Title**: Optional post title
   - **Content**: Post content (required)
   - **Category**: discover, community, announcement, event
   - **Sentiment**: positive, neutral, negative
   - **Impact %**: Market impact percentage
   - **Order Index**: Display order (1, 2, 3...)
3. Click "Add Post"

Via Supabase Dashboard (Advanced):
1. Go to **Supabase Console** → Your Project
2. Click **Table Editor**
3. Select `community_featured_posts`
4. Click **Insert row**
5. Fill in fields and save

#### Example Values
```
username: Crypto Guru
title: Market Update
content: Bitcoin holding strong above resistance levels
category: announcement
sentiment: positive
impact_percentage: 2.30
is_featured: true
order_index: 1
engagement_count: 342
```

## Managing Content via SQL (Advanced)

### Add Featured Crypto

```sql
INSERT INTO featured_crypto_listings
(symbol, name, coingecko_id, image_url, current_price, price_change_24h, category, is_featured, order_index)
VALUES
('SOL', 'Solana', 'solana', 'https://assets.coingecko.com/coins/images/4128/large/solana.png', 245.50, 28.75, 'gainers', true, 1);
```

### Add Community Post

```sql
INSERT INTO community_featured_posts
(username, avatar_url, title, content, category, sentiment, impact_percentage, is_featured, order_index, engagement_count)
VALUES
('Crypto Analyst', 'https://api.dicebear.com/7.x/avataaars/svg?seed=analyst', 'Market Update', 'Bitcoin momentum continues on positive news', 'announcement', 'positive', 5.50, true, 1, 256);
```

### Update Featured Status

```sql
-- Hide a listing
UPDATE featured_crypto_listings 
SET is_featured = false 
WHERE symbol = 'BTC';

-- Change category
UPDATE featured_crypto_listings 
SET category = 'hot', order_index = 1 
WHERE symbol = 'ETH';
```

### Check Current Featured Content

```sql
-- Show all featured listings by category
SELECT symbol, name, category, price_change_24h, order_index 
FROM featured_crypto_listings 
WHERE is_featured = true 
ORDER BY category, order_index;

-- Show all featured posts
SELECT username, title, category, sentiment, engagement_count 
FROM community_featured_posts 
WHERE is_featured = true 
ORDER BY category, order_index;
```

### Delete Old Content

```sql
-- Hide a listing (recommended)
UPDATE featured_crypto_listings 
SET is_featured = false 
WHERE id = 'uuid-here';

-- Or permanently delete
DELETE FROM featured_crypto_listings 
WHERE id = 'uuid-here';
```

## Categories Explained

### Crypto Categories (for featured_crypto_listings)
- **gainers**: Top cryptocurrencies by positive 24h price change
- **losers**: Top cryptocurrencies by negative 24h price change
- **trending**: High volume, popular cryptocurrencies
- **hot**: Rapidly moving prices with high momentum
- **gemw**: Emerging/high-potential tokens (legacy)
- **new_listing**: Recently launched cryptocurrencies (legacy)

### Community Categories (for community_featured_posts)
- **discover**: New opportunities, articles, and courses
  - Displays learning content and educational resources
  - Shows engagement count (views/reads)
- **community**: User discussions and advice
  - Shows crypto-related posts from users
  - Displays engagement count (likes/shares)
- **announcement**: Official news and platform updates
  - Shows system announcements and news
  - Displayed with neutral sentiment
- **event**: Upcoming webinars and events
  - Shows upcoming crypto events
  - Displays attendee count

### Sentiments
- **positive** 🟢: Bullish content, price increases, good news
- **negative** 🔴: Bearish content, price decreases, warnings
- **neutral** ⚪: Informational content, announcements

## Ordering & Featured Status

### How It Works
1. `is_featured = true` → Shows on the page
2. `is_featured = false` → Hidden from the page
3. `order_index` → Display order (1, 2, 3, etc.)

### Examples

**Set display order:**
```sql
UPDATE featured_crypto_listings 
SET order_index = 1 
WHERE symbol = 'BTC';

UPDATE featured_crypto_listings 
SET order_index = 2 
WHERE symbol = 'ETH';
```

**Disable content temporarily:**
```sql
UPDATE community_featured_posts 
SET is_featured = false 
WHERE username = 'OldPost';
```

## Image URLs

### For Cryptocurrency Logos
Use CoinGecko images:
```
https://assets.coingecko.com/coins/images/{ID}/large/{name}.png

Examples:
- Bitcoin: https://assets.coingecko.com/coins/images/1/large/bitcoin.png
- Ethereum: https://assets.coingecko.com/coins/images/279/large/ethereum.png
- Solana: https://assets.coingecko.com/coins/images/4128/large/solana.png
```

### For User Avatars
Generate with Dicebear API:
```
https://api.dicebear.com/7.x/avataaars/svg?seed={username}

Examples:
https://api.dicebear.com/7.x/avataaars/svg?seed=john
https://api.dicebear.com/7.x/avataaars/svg?seed=crypto_guru
```

## Common Tasks

### Update Bitcoin Price
```sql
UPDATE featured_crypto_listings 
SET current_price = 45000, price_change_24h = 7.5 
WHERE symbol = 'BTC';
```

### Feature Top Performing Crypto
```sql
UPDATE featured_crypto_listings 
SET is_featured = true, order_index = 1, category = 'hot' 
WHERE symbol = 'SOL';
```

### Rotate Community Posts
```sql
-- Hide old post
UPDATE community_featured_posts 
SET is_featured = false 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Show new post and set order
UPDATE community_featured_posts 
SET is_featured = true, order_index = 1 
WHERE username = 'NewCreator';
```

### Clear All Featured Content
```sql
-- Temporarily hide everything
UPDATE featured_crypto_listings SET is_featured = false;
UPDATE community_featured_posts SET is_featured = false;

-- Or reset to defaults
DELETE FROM featured_crypto_listings;
DELETE FROM community_featured_posts;
INSERT INTO featured_crypto_listings ... -- re-insert defaults
```

## Best Practices

✅ **Do**:
- Check `is_featured` is TRUE before saving
- Use proper image URLs
- Keep order_index sequential (1, 2, 3...)
- Use realistic percentages (-100 to +500)
- Test changes in staging first
- Keep engagement_count up-to-date

❌ **Don't**:
- Leave fields empty (use NULL or 0)
- Use invalid image URLs
- Gap order_index values (1, 3, 5)
- Negative order_index values
- Use offensive content
- Forget to set is_featured to true

## Monitoring

### Check What's Currently Displayed

```sql
-- Featured cryptos by category
SELECT 
  category,
  symbol,
  name,
  price_change_24h,
  order_index
FROM featured_crypto_listings
WHERE is_featured = true
ORDER BY category, order_index;

-- Featured community posts
SELECT 
  category,
  username,
  title,
  sentiment,
  engagement_count
FROM community_featured_posts
WHERE is_featured = true
ORDER BY category, order_index;
```

### Check Total Count

```sql
SELECT COUNT(*) as featured_cryptos FROM featured_crypto_listings WHERE is_featured = true;
SELECT COUNT(*) as featured_posts FROM community_featured_posts WHERE is_featured = true;
```

## Troubleshooting

### Changes Not Showing?
1. Verify `is_featured = true`
2. Refresh the page (Cmd+R or Ctrl+R)
3. Check browser console for errors
4. Verify category spelling (case-sensitive)

### Wrong Order?
- Recheck `order_index` values
- Ensure they're sequential: 1, 2, 3, 4...
- Update existing rows if needed

### Missing Images?
- Verify URL is accessible
- Check HTTPS (not HTTP)
- Test URL in browser first
- Use CoinGecko URLs for crypto logos

## Automation Ideas

Schedule updates with:
- **Supabase Functions**: Auto-fetch prices from CoinGecko
- **Zapier/Make**: Sync posts from social media
- **Custom API**: Build admin endpoint for bulk updates
- **Webhooks**: Listen to price changes and auto-update

---

**Quick Command Reference:**
```sql
-- Show featured cryptos
SELECT * FROM featured_crypto_listings WHERE is_featured = true ORDER BY order_index;

-- Show featured posts
SELECT * FROM community_featured_posts WHERE is_featured = true ORDER BY order_index;

-- Hide everything
UPDATE featured_crypto_listings SET is_featured = false;
UPDATE community_featured_posts SET is_featured = false;

-- Reset featured_at timestamp
UPDATE featured_crypto_listings SET featured_at = NOW() WHERE id = 'uuid';
```

**Need Help?**
- Check `FEATURED_CRYPTO_SETUP.md` for detailed setup
- Review `CRYPTO_PAGE_REDESIGN_SUMMARY.md` for full documentation
- See `src/services/featuredCryptoService.ts` for code examples
