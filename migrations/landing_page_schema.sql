-- Landing Page Enhancement Schema Migration
-- This migration adds all necessary tables for landing page features:
-- - Testimonials
-- - FAQs
-- - Use Cases
-- - Social Proof Stats
-- - Comparison Matrix
-- - Waitlist Leads

-- ============================================================================
-- Testimonials Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS landing_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  quote TEXT NOT NULL,
  image_url TEXT,
  metrics JSONB,
  category TEXT NOT NULL DEFAULT 'general',
  rating INTEGER DEFAULT 5,
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT TRUE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for testimonials
CREATE INDEX IF NOT EXISTS landing_testimonials_category_idx ON landing_testimonials(category);
CREATE INDEX IF NOT EXISTS landing_testimonials_featured_idx ON landing_testimonials(is_featured);
CREATE INDEX IF NOT EXISTS landing_testimonials_order_idx ON landing_testimonials("order");
CREATE INDEX IF NOT EXISTS landing_testimonials_user_id_idx ON landing_testimonials(user_id);

-- ============================================================================
-- FAQs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS landing_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for FAQs
CREATE INDEX IF NOT EXISTS landing_faqs_category_idx ON landing_faqs(category);
CREATE INDEX IF NOT EXISTS landing_faqs_active_idx ON landing_faqs(is_active);
CREATE INDEX IF NOT EXISTS landing_faqs_order_idx ON landing_faqs("order");

-- ============================================================================
-- Use Cases Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS landing_use_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  avatar_url TEXT,
  results JSONB,
  timeline_weeks INTEGER,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT TRUE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for use cases
CREATE INDEX IF NOT EXISTS landing_use_cases_user_type_idx ON landing_use_cases(user_type);
CREATE INDEX IF NOT EXISTS landing_use_cases_featured_idx ON landing_use_cases(is_featured);
CREATE INDEX IF NOT EXISTS landing_use_cases_order_idx ON landing_use_cases("order");

-- ============================================================================
-- Social Proof Stats Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS landing_social_proof_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL UNIQUE,
  current_value NUMERIC(20, 0) NOT NULL,
  unit TEXT NOT NULL,
  display_format TEXT DEFAULT 'number',
  label TEXT NOT NULL,
  icon TEXT,
  "order" INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for stats
CREATE INDEX IF NOT EXISTS landing_stats_metric_name_idx ON landing_social_proof_stats(metric_name);

-- ============================================================================
-- Comparison Matrix Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS landing_comparison_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL,
  category TEXT NOT NULL,
  eloity_has BOOLEAN DEFAULT TRUE,
  feature_description TEXT,
  competitors JSONB,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for comparison
CREATE INDEX IF NOT EXISTS landing_comparison_category_idx ON landing_comparison_matrix(category);
CREATE INDEX IF NOT EXISTS landing_comparison_active_idx ON landing_comparison_matrix(is_active);
CREATE INDEX IF NOT EXISTS landing_comparison_order_idx ON landing_comparison_matrix("order");

-- ============================================================================
-- Waitlist Leads Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS landing_waitlist_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  user_type_interested TEXT DEFAULT 'not_sure',
  country TEXT,
  phone TEXT,
  message TEXT,
  source TEXT DEFAULT 'homepage',
  lead_score INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  conversion_status TEXT DEFAULT 'waitlist',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for waitlist
CREATE INDEX IF NOT EXISTS landing_waitlist_email_idx ON landing_waitlist_leads(email);
CREATE INDEX IF NOT EXISTS landing_waitlist_status_idx ON landing_waitlist_leads(conversion_status);
CREATE INDEX IF NOT EXISTS landing_waitlist_score_idx ON landing_waitlist_leads(lead_score);
CREATE INDEX IF NOT EXISTS landing_waitlist_created_idx ON landing_waitlist_leads(created_at);
CREATE INDEX IF NOT EXISTS landing_waitlist_type_interested_idx ON landing_waitlist_leads(user_type_interested);

-- ============================================================================
-- INSERT SAMPLE DATA
-- ============================================================================

-- Insert sample testimonials
INSERT INTO landing_testimonials (name, title, quote, category, rating, is_featured, metrics, "order") VALUES
(
  'Sarah Chen',
  'Indie Creator',
  'Eloity helped me reach 50K followers in just 3 months with AI recommendations. The analytics are unmatched!',
  'creator',
  5,
  TRUE,
  '{"earnings_increased":"450%","followers_gained":"50000","engagement_boost":"320%"}',
  1
),
(
  'Marcus Thompson',
  'Freelance Developer',
  'The crypto escrow system gives me peace of mind. I''ve completed 150+ projects with zero disputes thanks to Eloity''s secure payments.',
  'freelancer',
  5,
  TRUE,
  '{"projects_completed":"150","total_earnings":"$87500","repeat_clients":"34"}',
  2
),
(
  'Amina Hassan',
  'Crypto Trader',
  'The AI price predictions helped me increase my trading returns by 280%. Best trading platform for emerging markets.',
  'trader',
  5,
  TRUE,
  '{"trading_returns":"280%","portfolio_value":"$425000","win_rate":"67%"}',
  3
),
(
  'James Rodriguez',
  'E-commerce Seller',
  'Went from 0 to $50K monthly revenue in 8 months. Eloity''s marketplace tools are incredible for sellers in Africa.',
  'merchant',
  5,
  TRUE,
  '{"monthly_revenue":"$50000","orders_monthly":"1200","return_customers":"68%"}',
  4
);

-- Insert sample FAQs
INSERT INTO landing_faqs (question, answer, category, is_active, "order") VALUES
(
  'Is my crypto secure on Eloity?',
  'Yes. We use industry-standard encryption (AES-256) and multi-signature wallets. All P2P trades are protected by our crypto escrow system - funds are held until both parties confirm. We''re also undergoing SOC 2 Type II certification.',
  'security',
  TRUE,
  1
),
(
  'What payment methods are supported?',
  'We support 50+ payment methods including bank transfers, mobile money (M-Pesa, Airtel, MTN), crypto wallets, and card payments. Coverage varies by country.',
  'platform',
  TRUE,
  2
),
(
  'How much does Eloity cost?',
  'Eloity is free to use. We make money through optional premium features (Creator Fund Boost, advanced analytics) and minimal transaction fees (1-2% on marketplace sales). No hidden costs.',
  'pricing',
  TRUE,
  3
),
(
  'Can I withdraw my earnings?',
  'Yes! You can withdraw to your bank account, mobile wallet, or crypto wallet. Withdrawals process within 24-48 hours. Minimum withdrawal is $5 or equivalent in your currency.',
  'platform',
  TRUE,
  4
),
(
  'Is the platform available in my country?',
  'Eloity is available in 85+ countries in Africa, Asia, and Latin America. Check our coverage at eloity.com/coverage. We''re expanding to new countries monthly.',
  'technical',
  TRUE,
  5
),
(
  'How does the referral program work?',
  'Invite friends and earn 10% commission on their first transaction. Unlimited referrals = unlimited earnings. No limits on how much you can earn.',
  'platform',
  TRUE,
  6
);

-- Insert sample use cases
INSERT INTO landing_use_cases (user_type, title, description, results, timeline_weeks, "order", is_featured) VALUES
(
  'creator',
  'How Sarah Grew to 50K Followers in 3 Months',
  'Sarah started as a micro-influencer with 2K followers. Using Eloity''s AI recommendations and advanced analytics, she created targeted content that went viral. The platform helped her understand audience preferences at scale.',
  '{"followers":"50000","engagement_rate":"8.5%","monthly_revenue":"$12000","brand_deals":"15"}',
  12,
  1,
  TRUE
),
(
  'freelancer',
  'How Marcus Scaled to $87.5K in Annual Earnings',
  'Marcus was an underemployed developer making $15K/year. Eloity''s AI job matching connected him with high-paying projects. The secure escrow system meant he could confidently take bigger projects.',
  '{"annual_earnings":"$87500","monthly_earnings":"$7300","projects_completed":"150","avg_project_value":"$583"}',
  24,
  2,
  TRUE
),
(
  'trader',
  'How Amina Turned $5K Into $425K Portfolio',
  'Amina wanted to learn crypto trading but was intimidated. Eloity''s AI predictions, educational courses, and copy-trading features made her profitable within months.',
  '{"initial_capital":"$5000","final_portfolio":"$425000","roi":"8400%","trades_executed":"450"}',
  18,
  3,
  TRUE
),
(
  'merchant',
  'How James Built a $50K/Month Business',
  'James started with 5 products on Eloity''s marketplace. Using our analytics to optimize listings and the marketplace''s reach, he scaled to 1,200+ monthly orders.',
  '{"monthly_revenue":"$50000","total_orders":"8400","avg_order_value":"$38","customer_reviews":"4.8/5"}',
  30,
  4,
  TRUE
);

-- Insert sample social proof stats
INSERT INTO landing_social_proof_stats (metric_name, current_value, unit, display_format, label, icon, "order") VALUES
('active_users', '2500000', 'users', 'number', 'Active Users', '👥', 1),
('total_earnings_distributed', '185000000', 'USD', 'currency', 'Earnings Distributed', '💰', 2),
('trades_completed', '8500000', 'transactions', 'number', 'Trades Completed', '📊', 3),
('countries_supported', '85', 'countries', 'number', 'Countries', '🌍', 4);

-- Insert sample comparison matrix
INSERT INTO landing_comparison_matrix (feature_name, category, eloity_has, feature_description, competitors, "order", is_active) VALUES
(
  'AI Content Recommendations',
  'social',
  TRUE,
  'Smart feed curation with AI-powered recommendations',
  '{"TikTok":true,"Instagram":true,"Twitter":false,"Threads":false}',
  1,
  TRUE
),
(
  'Crypto Trading & P2P',
  'crypto',
  TRUE,
  'Built-in crypto trading with secure P2P escrow',
  '{"Binance":true,"Kraken":true,"Instagram":false,"TikTok":false}',
  2,
  TRUE
),
(
  'Freelance Marketplace',
  'freelance',
  TRUE,
  'Freelancer jobs with crypto escrow protection',
  '{"Fiverr":true,"Upwork":true,"TikTok":false,"Instagram":false}',
  3,
  TRUE
),
(
  'E-commerce Marketplace',
  'commerce',
  TRUE,
  'Full e-commerce platform for merchants',
  '{"Shopify":true,"Amazon":true,"Fiverr":false,"Upwork":false}',
  4,
  TRUE
),
(
  'Full Accessibility (WCAG)',
  'social',
  TRUE,
  'Complete accessibility support for all users',
  '{"TikTok":false,"Instagram":false,"Twitter":true,"Threads":false}',
  5,
  TRUE
),
(
  'Creator Fund with AI Boost',
  'social',
  TRUE,
  'Monetization with AI-powered boost recommendations',
  '{"TikTok":true,"YouTube":true,"Instagram":true,"Threads":false}',
  6,
  TRUE
),
(
  'Real-time Analytics Dashboard',
  'social',
  TRUE,
  'Professional-grade analytics for growth tracking',
  '{"TikTok":false,"Instagram":true,"YouTube":true,"Threads":false}',
  7,
  TRUE
),
(
  'Multi-country Payments',
  'commerce',
  TRUE,
  'Support for 50+ payment methods across 85+ countries',
  '{"Shopify":false,"Stripe":false,"Fiverr":true,"Upwork":true}',
  8,
  TRUE
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (Optional but recommended)
-- ============================================================================

-- Uncomment the following if you want to enable RLS for public tables
-- ALTER TABLE landing_testimonials ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE landing_faqs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE landing_use_cases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE landing_social_proof_stats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE landing_comparison_matrix ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE landing_waitlist_leads ENABLE ROW LEVEL SECURITY;

-- Public read access for landing content
-- CREATE POLICY "landing_testimonials_public_read" ON landing_testimonials
--   FOR SELECT USING (is_featured = true);

-- CREATE POLICY "landing_faqs_public_read" ON landing_faqs
--   FOR SELECT USING (is_active = true);

-- CREATE POLICY "landing_use_cases_public_read" ON landing_use_cases
--   FOR SELECT USING (is_featured = true);

-- CREATE POLICY "landing_stats_public_read" ON landing_social_proof_stats
--   FOR SELECT USING (true);

-- CREATE POLICY "landing_comparison_public_read" ON landing_comparison_matrix
--   FOR SELECT USING (is_active = true);

-- CREATE POLICY "landing_waitlist_insert" ON landing_waitlist_leads
--   FOR INSERT WITH CHECK (true);

-- ============================================================================
-- Migration complete
-- ============================================================================
