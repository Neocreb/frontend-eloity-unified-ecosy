-- Create table for featured crypto listings (GemW, New Listings, etc.)
CREATE TABLE IF NOT EXISTS featured_crypto_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  coingecko_id TEXT,
  image_url TEXT,
  current_price DECIMAL(20, 8),
  price_change_24h DECIMAL(10, 2),
  market_cap_rank INTEGER,
  category TEXT, -- 'gemw', 'new_listing', 'trending', 'hot'
  is_featured BOOLEAN DEFAULT false,
  featured_at TIMESTAMPTZ DEFAULT NOW(),
  featured_until TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for community featured posts
CREATE TABLE IF NOT EXISTS community_featured_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  title TEXT,
  content TEXT NOT NULL,
  category TEXT, -- 'discover', 'community', 'announcement'
  sentiment TEXT, -- 'positive', 'negative', 'neutral'
  impact_percentage DECIMAL(10, 2),
  is_featured BOOLEAN DEFAULT false,
  featured_at TIMESTAMPTZ DEFAULT NOW(),
  featured_until TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  engagement_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for crypto category tags
CREATE TABLE IF NOT EXISTS crypto_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_featured_listings_category ON featured_crypto_listings(category);
CREATE INDEX IF NOT EXISTS idx_featured_listings_is_featured ON featured_crypto_listings(is_featured);
CREATE INDEX IF NOT EXISTS idx_featured_listings_symbol ON featured_crypto_listings(symbol);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_featured_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_featured ON community_featured_posts(is_featured);

-- Enable RLS (Row Level Security)
ALTER TABLE featured_crypto_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_featured_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for featured_crypto_listings (public read)
CREATE POLICY "featured_listings_read_public" ON featured_crypto_listings
  FOR SELECT USING (true);

CREATE POLICY "featured_listings_insert_admin" ON featured_crypto_listings
  FOR INSERT WITH CHECK (
    auth.jwt() -> 'user_metadata' -> 'role' = '"admin"'
  );

CREATE POLICY "featured_listings_update_admin" ON featured_crypto_listings
  FOR UPDATE USING (
    auth.jwt() -> 'user_metadata' -> 'role' = '"admin"'
  );

-- Create RLS policies for community_featured_posts (public read)
CREATE POLICY "community_posts_read_public" ON community_featured_posts
  FOR SELECT USING (true);

CREATE POLICY "community_posts_insert_authenticated" ON community_featured_posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "community_posts_update_own" ON community_featured_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for crypto_categories (public read)
CREATE POLICY "categories_read_public" ON crypto_categories
  FOR SELECT USING (true);

-- Insert default categories
INSERT INTO crypto_categories (name, slug, description) VALUES
  ('GemW', 'gemw', 'Emerging and high-potential cryptocurrency projects'),
  ('New Listing', 'new_listing', 'Recently listed cryptocurrencies'),
  ('Hot', 'hot', 'Trending cryptocurrencies with high momentum'),
  ('Top Performers', 'top_performers', 'Best performing assets in 24h'),
  ('DeFi', 'defi', 'Decentralized Finance tokens'),
  ('Layer 2', 'layer_2', 'Layer 2 scaling solutions')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT ON featured_crypto_listings TO anon;
GRANT SELECT ON featured_crypto_listings TO authenticated;
GRANT INSERT, UPDATE ON featured_crypto_listings TO authenticated;
GRANT SELECT ON community_featured_posts TO anon;
GRANT SELECT ON community_featured_posts TO authenticated;
GRANT INSERT, UPDATE ON community_featured_posts TO authenticated;
GRANT SELECT ON crypto_categories TO anon;
GRANT SELECT ON crypto_categories TO authenticated;
