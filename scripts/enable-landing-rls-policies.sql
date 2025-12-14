-- ============================================================================
-- ENABLE ROW LEVEL SECURITY FOR LANDING PAGE TABLES
-- Run this in Supabase SQL Editor to fix the landing page API errors
-- ============================================================================

-- Enable RLS on all landing tables
ALTER TABLE landing_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_use_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_social_proof_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_comparison_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_waitlist_leads ENABLE ROW LEVEL SECURITY;

-- Create public read policies for testimonials
CREATE POLICY "landing_testimonials_public_read" ON landing_testimonials
  FOR SELECT USING (is_featured = true);

-- Create public read policies for FAQs
CREATE POLICY "landing_faqs_public_read" ON landing_faqs
  FOR SELECT USING (is_active = true);

-- Create public read policies for use cases
CREATE POLICY "landing_use_cases_public_read" ON landing_use_cases
  FOR SELECT USING (is_featured = true);

-- Create public read policies for social proof stats
CREATE POLICY "landing_stats_public_read" ON landing_social_proof_stats
  FOR SELECT USING (true);

-- Create public read policies for comparison matrix
CREATE POLICY "landing_comparison_public_read" ON landing_comparison_matrix
  FOR SELECT USING (is_active = true);

-- Create insert policy for waitlist leads (allow anyone to insert)
CREATE POLICY "landing_waitlist_insert" ON landing_waitlist_leads
  FOR INSERT WITH CHECK (true);

-- Create select policy for waitlist (admin only - for future admin panel)
CREATE POLICY "landing_waitlist_select_admin" ON landing_waitlist_leads
  FOR SELECT USING (false);

-- ============================================================================
-- Verify policies are created
-- ============================================================================
-- Run this to verify:
-- SELECT tablename, policyname, qual, with_check FROM pg_policies 
-- WHERE tablename LIKE 'landing_%' ORDER BY tablename;
