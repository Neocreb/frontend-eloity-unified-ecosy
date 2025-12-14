# Managing Featured Crypto & Community Content

This guide helps you add, update, and manage featured content on the Professional Crypto page.

## Quick Access via Supabase Dashboard

### Add New Featured Crypto Listing

1. Go to **Supabase Console** → Your Project
2. Click **Table Editor** (left sidebar)
3. Select `featured_crypto_listings`
4. Click **Insert row**
5. Fill in the fields:

| Field | Example | Notes |
|-------|---------|-------|
| symbol | BTC | Cryptocurrency symbol |
| name | Bitcoin | Full name |
| coingecko_id | bitcoin | For future API integration |
| image_url | https://... | PNG/JPG URL |
| current_price | 43250.50 | Current market price |
| price_change_24h | 8.75 | Percentage change |
| market_cap_rank | 1 | Optional ranking |
| category | gemw | Choose: gemw, new_listing, trending, hot |
| is_featured | true | Check to display on page |
| order_index | 1 | Display order (1, 2, 3...) |

6. Click **Save**
7. Changes appear on page within seconds

### Add Community Featured Post

1. Go to **Supabase Console** → Your Project
2. Click **Table Editor**
3. Select `community_featured_posts`
4. Click **Insert row**
5. Fill in the fields:

| Field | Example | Notes |
|-------|---------|-------|
| user_id | 550e8400... | Leave as NULL for system posts |
| username | Crypto Guru | Display name |
| avatar_url | https://... | Profile picture URL |
| title | Market Update | Optional post title |
| content | Bitcoin at new ATH! | Main post content |
| category | discover | Choose: discover, community, announcement, event |
| sentiment | positive | Choose: positive, negative, neutral |
| impact_percentage | 12.50 | Market impact percentage |
| is_featured | true | Check to display |
| order_index | 1 | Display order |
| engagement_count | 342 | Number of likes/interactions |

6. Click **Save**

## Via SQL Commands

### Add Featured Crypto

```sql
INSERT INTO featured_crypto_listings 
(symbol, name, coingecko_id, image_url, current_price, price_change_24h, category, is_featured, order_index)
VALUES 
('ETH', 'Ethereum', 'ethereum', 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', 2350.00, 5.42, 'trending', true, 2);
```

### Add Community Post

```sql
INSERT INTO community_featured_posts 
(username, avatar_url, title, content, category, sentiment, impact_percentage, is_featured, order_index, engagement_count)
VALUES 
('Blockchain Expert', 'https://api.dicebear.com/7.x/avataaars/svg?seed=expert', 'DeFi Opportunities', 'New yield farming strategies in 2025', 'community', 'positive', 15.50, true, 1, 256);
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

### Crypto Categories
- **gemw**: Emerging/high-potential tokens (shows "Hot" badge)
- **new_listing**: Recently launched cryptocurrencies (shows "New" badge)
- **trending**: High volume, popular cryptocurrencies
- **hot**: Rapidly moving prices or high momentum

### Community Categories
- **discover**: New opportunities and insights (featured on Discover tab)
- **community**: User discussions and advice (featured on Community tab)
- **announcement**: Official news and updates
- **event**: Upcoming webinars and events

### Sentiments
- **positive** 🟢: Bullish content, price increases
- **negative** 🔴: Bearish content, price decreases
- **neutral** ⚪: Informational content

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
