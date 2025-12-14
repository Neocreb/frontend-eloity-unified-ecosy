-- Create featured_crypto_listings table
CREATE TABLE IF NOT EXISTS featured_crypto_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  coingecko_id TEXT,
  image_url TEXT,
  current_price NUMERIC(20, 8),
  price_change_24h NUMERIC(10, 2),
  market_cap_rank INTEGER,
  category TEXT NOT NULL CHECK (category IN ('gemw', 'new_listing', 'trending', 'hot', 'gainers', 'losers')),
  is_featured BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  featured_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create community_featured_posts table
CREATE TABLE IF NOT EXISTS community_featured_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  title TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('discover', 'community', 'announcement', 'event')),
  sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  impact_percentage NUMERIC(10, 2) DEFAULT 0,
  is_featured BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  engagement_count INTEGER DEFAULT 0,
  featured_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create crypto_categories reference table
CREATE TABLE IF NOT EXISTS crypto_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_featured_listings_category ON featured_crypto_listings(category);
CREATE INDEX IF NOT EXISTS idx_featured_listings_is_featured ON featured_crypto_listings(is_featured);
CREATE INDEX IF NOT EXISTS idx_featured_listings_order ON featured_crypto_listings(category, order_index);
CREATE INDEX IF NOT EXISTS idx_featured_listings_featured_at ON featured_crypto_listings(featured_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_featured_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_featured ON community_featured_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_community_posts_order ON community_featured_posts(category, order_index);
CREATE INDEX IF NOT EXISTS idx_community_posts_featured_at ON community_featured_posts(featured_at DESC);

-- Enable Row Level Security
ALTER TABLE featured_crypto_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_featured_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for featured_crypto_listings (public read, admin write)
CREATE POLICY "featured_crypto_listings_read" ON featured_crypto_listings
  FOR SELECT USING (true);

CREATE POLICY "featured_crypto_listings_insert" ON featured_crypto_listings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "featured_crypto_listings_update" ON featured_crypto_listings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "featured_crypto_listings_delete" ON featured_crypto_listings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for community_featured_posts (public read, admin/author write)
CREATE POLICY "community_featured_posts_read" ON community_featured_posts
  FOR SELECT USING (true);

CREATE POLICY "community_featured_posts_insert" ON community_featured_posts
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "community_featured_posts_update" ON community_featured_posts
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "community_featured_posts_delete" ON community_featured_posts
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for crypto_categories (public read, admin write)
CREATE POLICY "crypto_categories_read" ON crypto_categories
  FOR SELECT USING (true);

CREATE POLICY "crypto_categories_write" ON crypto_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Insert default categories
INSERT INTO crypto_categories (name, slug, description, icon) VALUES
  ('Gainers', 'gainers', 'Top performing cryptocurrencies by 24h change', '📈'),
  ('Losers', 'losers', 'Worst performing cryptocurrencies by 24h change', '📉'),
  ('Trending', 'trending', 'High volume and popular cryptocurrencies', '🔥'),
  ('Hot', 'hot', 'Rapidly moving prices with high momentum', '⚡'),
  ('GemW', 'gemw', 'Emerging high-potential projects', '💎'),
  ('New Listing', 'new_listing', 'Recently launched cryptocurrencies', '✨')
ON CONFLICT (slug) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-update timestamps
CREATE TRIGGER update_featured_listings_updated_at
  BEFORE UPDATE ON featured_crypto_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_featured_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
