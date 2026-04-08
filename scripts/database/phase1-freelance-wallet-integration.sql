-- ============================================================================
-- PHASE 1: DATABASE SCHEMA ENHANCEMENT FOR UNIFIED WALLET INTEGRATION
-- ============================================================================
-- This migration extends existing tables instead of creating duplicates
-- Goal: Add freelance support to invoices and withdrawals tables
-- Timeline: 15 minutes to apply
-- ============================================================================

-- ============================================================================
-- STEP 1: EXTEND INVOICES TABLE
-- ============================================================================
-- Add fields to categorize invoices by type and link to freelance projects

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general' 
  CHECK (type IN ('general', 'freelance', 'marketplace', 'service')),
ADD COLUMN IF NOT EXISTS source_type TEXT 
  CHECK (source_type IS NULL OR source_type IN ('direct', 'freelance_project', 'marketplace_order', 'payment_link')),
ADD COLUMN IF NOT EXISTS project_id UUID,
ADD COLUMN IF NOT EXISTS freelancer_id UUID,
ADD COLUMN IF NOT EXISTS client_id UUID;

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);
CREATE INDEX IF NOT EXISTS idx_invoices_type_freelancer ON invoices(type, freelancer_id) WHERE type = 'freelance';
CREATE INDEX IF NOT EXISTS idx_invoices_type_project ON invoices(type, project_id) WHERE type = 'freelance';
CREATE INDEX IF NOT EXISTS idx_invoices_freelance_lookup ON invoices(freelancer_id, type) WHERE type = 'freelance';

-- Add comment for documentation
COMMENT ON COLUMN invoices.type IS 'Invoice type: general (wallet), freelance (freelance projects), marketplace (marketplace orders), service (other services)';
COMMENT ON COLUMN invoices.source_type IS 'Source of invoice: direct (manually created), freelance_project (from freelance work), marketplace_order (from marketplace), payment_link (from payment link)';
COMMENT ON COLUMN invoices.project_id IS 'Reference to freelance project if type = freelance';
COMMENT ON COLUMN invoices.freelancer_id IS 'Freelancer ID if type = freelance';
COMMENT ON COLUMN invoices.client_id IS 'Client ID if type = freelance';

-- ============================================================================
-- STEP 2: EXTEND WITHDRAWALS TABLE
-- ============================================================================
-- Add field to categorize withdrawals and link to freelance earnings

ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS withdrawal_type TEXT DEFAULT 'general'
  CHECK (withdrawal_type IN ('general', 'freelance_earnings', 'rewards', 'marketplace')),
ADD COLUMN IF NOT EXISTS freelance_project_id UUID,
ADD COLUMN IF NOT EXISTS freelance_contract_id UUID;

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_withdrawals_type ON withdrawals(withdrawal_type);
CREATE INDEX IF NOT EXISTS idx_withdrawals_freelance_lookup ON withdrawals(user_id, withdrawal_type) WHERE withdrawal_type = 'freelance_earnings';

-- Add comment for documentation
COMMENT ON COLUMN withdrawals.withdrawal_type IS 'Type of withdrawal: general (wallet), freelance_earnings (from freelance projects), rewards (from creator rewards), marketplace (from marketplace sales)';
COMMENT ON COLUMN withdrawals.freelance_project_id IS 'Reference to freelance project if withdrawal_type = freelance_earnings';
COMMENT ON COLUMN withdrawals.freelance_contract_id IS 'Reference to freelance contract if withdrawal_type = freelance_earnings';

-- ============================================================================
-- STEP 3: CREATE OPTIONAL FREELANCE_INVOICE_MAPPINGS TABLE
-- ============================================================================
-- Optional: More detailed mapping between invoices and freelance projects
-- Can be useful for tracking invoice relationships to specific milestones

CREATE TABLE IF NOT EXISTS freelance_invoice_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES freelance_projects(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES freelance_proposals(id) ON DELETE SET NULL,
  milestone_id UUID,
  invoice_type TEXT CHECK (invoice_type IN ('project_invoice', 'milestone_payment', 'final_payment')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_freelance_invoice_mappings_invoice ON freelance_invoice_mappings(invoice_id);
CREATE INDEX IF NOT EXISTS idx_freelance_invoice_mappings_project ON freelance_invoice_mappings(project_id);
CREATE INDEX IF NOT EXISTS idx_freelance_invoice_mappings_proposal ON freelance_invoice_mappings(proposal_id);
CREATE INDEX IF NOT EXISTS idx_freelance_invoice_mappings_milestone ON freelance_invoice_mappings(milestone_id);

-- ============================================================================
-- STEP 4: VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify the changes were applied correctly

-- Check invoices table columns
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'invoices' AND column_name IN ('type', 'source_type', 'project_id', 'freelancer_id', 'client_id')
-- ORDER BY ordinal_position;

-- Check withdrawals table columns
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'withdrawals' AND column_name IN ('withdrawal_type', 'freelance_project_id', 'freelance_contract_id')
-- ORDER BY ordinal_position;

-- Check freelance_invoice_mappings table exists
-- SELECT EXISTS (
--   SELECT FROM information_schema.tables 
--   WHERE table_name = 'freelance_invoice_mappings'
-- ) AS table_exists;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Changes Made:
-- ✅ invoices table: Added type, source_type, project_id, freelancer_id, client_id
-- ✅ withdrawals table: Added withdrawal_type, freelance_project_id, freelance_contract_id
-- ✅ Created freelance_invoice_mappings table (optional, for detailed tracking)
-- ✅ Added indexes for fast queries
-- ✅ Added helpful comments
--
-- Impact:
-- ✅ No duplicate tables created
-- ✅ Existing invoice and withdrawal systems extended
-- ✅ Freelance transactions tracked in unified system
-- ✅ Better performance with indexes
--
-- Next Step:
-- Run Phase 2: Create integration services to use these new fields
-- ============================================================================
