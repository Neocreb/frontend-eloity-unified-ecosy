-- Sample Featured Crypto Listings (Gainers)
INSERT INTO featured_crypto_listings (symbol, name, coingecko_id, image_url, current_price, price_change_24h, market_cap_rank, category, is_featured, order_index)
VALUES
  ('SOL', 'Solana', 'solana', 'https://assets.coingecko.com/coins/images/4128/large/solana.png', 245.50, 28.75, 4, 'gainers', true, 1),
  ('AVAX', 'Avalanche', 'avalanche-2', 'https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png', 45.80, 18.35, 8, 'gainers', true, 2),
  ('ARB', 'Arbitrum', 'arbitrum', 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg', 1.25, 15.22, 18, 'gainers', true, 3),
  ('OP', 'Optimism', 'optimism', 'https://assets.coingecko.com/coins/images/25244/large/optimism.png', 2.85, 12.45, 22, 'gainers', true, 4),
  ('DOGE', 'Dogecoin', 'dogecoin', 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', 0.38, 11.62, 10, 'gainers', true, 5),
  ('XRP', 'XRP', 'ripple', 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', 2.15, 9.87, 6, 'gainers', true, 6)
ON CONFLICT (symbol) DO UPDATE SET 
  current_price = EXCLUDED.current_price,
  price_change_24h = EXCLUDED.price_change_24h,
  updated_at = NOW();

-- Sample Featured Crypto Listings (Losers)
INSERT INTO featured_crypto_listings (symbol, name, coingecko_id, image_url, current_price, price_change_24h, market_cap_rank, category, is_featured, order_index)
VALUES
  ('LTC', 'Litecoin', 'litecoin', 'https://assets.coingecko.com/coins/images/2/large/litecoin.png', 125.30, -8.45, 12, 'losers', true, 1),
  ('BCH', 'Bitcoin Cash', 'bitcoin-cash', 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-square.png', 485.20, -7.23, 25, 'losers', true, 2),
  ('ETC', 'Ethereum Classic', 'ethereum-classic', 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png', 28.75, -6.54, 38, 'losers', true, 3),
  ('DOGE', 'Dogecoin', 'dogecoin', 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', 0.37, -5.22, 10, 'losers', true, 4),
  ('VET', 'VeChain', 'vechain', 'https://assets.coingecko.com/coins/images/1167/large/VET_token_logo.png', 0.041, -4.89, 44, 'losers', true, 5),
  ('LINK', 'Chainlink', 'chainlink', 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png', 22.85, -3.76, 16, 'losers', true, 6)
ON CONFLICT (symbol) DO UPDATE SET 
  current_price = EXCLUDED.current_price,
  price_change_24h = EXCLUDED.price_change_24h,
  updated_at = NOW();

-- Sample Community Posts (Discover)
INSERT INTO community_featured_posts (username, avatar_url, title, content, category, sentiment, impact_percentage, is_featured, order_index)
VALUES
  ('Eloity Learn', 'https://api.dicebear.com/7.x/avataaars/svg?seed=eloity-learn', 'Top 5 Crypto Trading Strategies', 'Learn the most effective trading strategies used by professional traders. From swing trading to scalping, we cover it all.', 'discover', 'positive', 8.5, true, 1),
  ('Crypto Academy', 'https://api.dicebear.com/7.x/avataaars/svg?seed=crypto-academy', 'Understanding Bitcoin Halving', 'Deep dive into how Bitcoin halving affects supply, demand, and price movements in the market.', 'discover', 'positive', 6.2, true, 2),
  ('DeFi Expert', 'https://api.dicebear.com/7.x/avataaars/svg?seed=defi-expert', 'Yield Farming Guide 2025', 'Complete guide to yield farming with risk management and best practices to maximize returns.', 'discover', 'positive', 5.8, true, 3)
ON CONFLICT DO NOTHING;

-- Sample Community Posts (Community)
INSERT INTO community_featured_posts (username, avatar_url, content, category, sentiment, impact_percentage, is_featured, order_index)
VALUES
  ('Trader Mike', 'https://api.dicebear.com/7.x/avataaars/svg?seed=trader-mike', 'Just started my trading journal! Excited to track my progress in the crypto markets. Any tips for beginners?', 'community', 'positive', 0, true, 1),
  ('Sarah Crypto', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', 'Anyone else holding their ETH for the long term? The fundamentals are getting stronger every quarter.', 'community', 'positive', 0, true, 2),
  ('Dev Jordan', 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev-jordan', 'Built a portfolio tracker for the community. Check it out and let me know what features you\'d like!', 'community', 'positive', 0, true, 3)
ON CONFLICT DO NOTHING;

-- Sample Community Posts (Announcements)
INSERT INTO community_featured_posts (username, avatar_url, title, content, category, sentiment, impact_percentage, is_featured, order_index)
VALUES
  ('Eloity Announcements', 'https://api.dicebear.com/7.x/avataaars/svg?seed=eloity-announce', 'Platform Update: Enhanced Security Features', 'We\'ve rolled out enhanced 2FA and biometric authentication options. Update your security settings today.', 'announcement', 'neutral', 0, true, 1),
  ('Eloity Announcements', 'https://api.dicebear.com/7.x/avataaars/svg?seed=eloity-announce', 'New Trading Pair: SOL/USDT Available Now', 'Solana trading pairs are now live on the platform with zero fees for the first 7 days!', 'announcement', 'positive', 2.5, true, 2),
  ('Eloity Announcements', 'https://api.dicebear.com/7.x/avataaars/svg?seed=eloity-announce', 'Scheduled Maintenance on December 15', 'Platform will be under maintenance for 4 hours. Plan your trades accordingly. Trading will resume at 10 PM UTC.', 'announcement', 'neutral', 0, true, 3)
ON CONFLICT DO NOTHING;

-- Sample Community Posts (Events)
INSERT INTO community_featured_posts (username, avatar_url, title, content, category, sentiment, impact_percentage, is_featured, order_index)
VALUES
  ('Eloity Events', 'https://api.dicebear.com/7.x/avataaars/svg?seed=eloity-events', 'Crypto Trading Masterclass Live', 'Join us Dec 16 at 8 PM UTC for an exclusive live masterclass on advanced trading strategies with industry veterans.', 'event', 'positive', 0, true, 1),
  ('Eloity Events', 'https://api.dicebear.com/7.x/avataaars/svg?seed=eloity-events', 'DeFi Security Workshop', 'Learn how to keep your funds safe on DeFi platforms. Covering smart contract audits and security best practices.', 'event', 'positive', 0, true, 2),
  ('Eloity Events', 'https://api.dicebear.com/7.x/avataaars/svg?seed=eloity-events', 'Monthly Community Meetup', 'Network with other traders and enthusiasts. Share experiences, learn new strategies, and connect with the community.', 'event', 'positive', 0, true, 3)
ON CONFLICT DO NOTHING;
