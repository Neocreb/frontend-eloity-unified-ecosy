-- Insert sample GemW listings
INSERT INTO featured_crypto_listings (symbol, name, coingecko_id, image_url, current_price, price_change_24h, market_cap_rank, category, is_featured, order_index) VALUES
  ('GemW', 'GemW Onchain', 'gemw-onchain', 'https://api.dicebear.com/7.x/identicon/svg?seed=gemw', 0.000045, 125.50, NULL, 'gemw', true, 1),
  ('RAI', 'Raion Protocol', 'raion-protocol', 'https://api.dicebear.com/7.x/identicon/svg?seed=rai', 0.0000125, 89.30, NULL, 'gemw', true, 2),
  ('LUNA2', 'Luna 2.0', 'terra-2', 'https://api.dicebear.com/7.x/identicon/svg?seed=luna', 0.58, 45.20, NULL, 'gemw', true, 3)
ON CONFLICT DO NOTHING;

-- Insert sample New Listings
INSERT INTO featured_crypto_listings (symbol, name, coingecko_id, image_url, current_price, price_change_24h, market_cap_rank, category, is_featured, order_index) VALUES
  ('FUTR', 'Futures Trading Platform', 'futures-trading', 'https://api.dicebear.com/7.x/identicon/svg?seed=futr', 2.50, 45.30, 5000, 'new_listing', true, 1),
  ('PROTO', 'Protocol Labs', 'protocol-labs', 'https://api.dicebear.com/7.x/identicon/svg?seed=proto', 0.75, 28.15, 3500, 'new_listing', true, 2),
  ('NEXUS', 'Nexus Protocol', 'nexus-protocol', 'https://api.dicebear.com/7.x/identicon/svg?seed=nexus', 1.20, 12.50, 4200, 'new_listing', true, 3)
ON CONFLICT DO NOTHING;

-- Insert sample community featured posts
INSERT INTO community_featured_posts (user_id, username, avatar_url, title, content, category, sentiment, impact_percentage, is_featured, order_index, engagement_count) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'CoinW Community', 'https://api.dicebear.com/7.x/avataaars/svg?seed=coinw', 'Spot the next big thing in crypto?', '$STABLE is going to be listed on CoinW — and it''s more than just a token. This is a game-changer.', 'discover', 'positive', 11.10, true, 1, 342),
  ('550e8400-e29b-41d4-a716-446655440001', 'Crypto Enthusiast', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2', 'New opportunities unlocked', 'New DeFi opportunities unlocked this week. Don''t miss the potential gains!', 'community', 'positive', 8.50, true, 1, 256),
  ('550e8400-e29b-41d4-a716-446655440002', 'Trading Master', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3', 'Market Update', 'Bitcoin holding strong above resistance levels. Market sentiment remains bullish with strong institutional interest.', 'announcement', 'positive', 2.30, true, 1, 128),
  ('550e8400-e29b-41d4-a716-446655440003', 'DeFi Analytics', 'https://api.dicebear.com/7.x/avataaars/svg?seed=defi', 'Yield Farming Guide', 'Best practices for safe yield farming and risk management in DeFi protocols.', 'community', 'positive', 5.75, true, 2, 195)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance if not exists
CREATE INDEX IF NOT EXISTS idx_featured_listings_featured_at ON featured_crypto_listings(featured_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_featured_at ON community_featured_posts(featured_at DESC);
