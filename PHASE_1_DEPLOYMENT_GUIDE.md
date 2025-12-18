# 📦 Phase 1 Deployment Guide - Database Setup

**Status**: Ready for Supabase Deployment  
**Created**: 2024-12-18  
**Total Migration Files**: 3 SQL scripts  
**Estimated Execution Time**: 5-10 minutes  

---

## 📋 Overview

Phase 1 consists of three SQL migration files that must be executed in order:

| File | Purpose | Lines | Duration |
|------|---------|-------|----------|
| `0016_create_rewards_tables.sql` | Create 10 core tables | 452 | 2-3 min |
| `0017_setup_rewards_rls.sql` | Configure security policies | 256 | 1-2 min |
| `0018_seed_reward_rules.sql` | Seed default reward rules | 356 | 1-2 min |

---

## 🚀 Deployment Steps

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"** button

### Step 2: Execute Migration 0016 (Tables)

1. Open `scripts/database/0016_create_rewards_tables.sql`
2. Copy all content
3. Paste into Supabase SQL Editor
4. Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`)
5. Verify success: No red errors appear

**What happens:**
- ✅ Creates 10 new tables
- ✅ Adds performance indexes
- ✅ Configures auto-update triggers
- ✅ Sets up relationships

**Verification:**
```sql
-- Run in a new query to verify
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%activity_transactions%' 
  OR tablename LIKE '%reward%' 
  OR tablename LIKE '%referral%';
```

Expected output: 10 rows with table names

### Step 3: Execute Migration 0017 (RLS)

1. Open `scripts/database/0017_setup_rewards_rls.sql`
2. Copy all content
3. Paste into a new SQL query
4. Click **Run**
5. Verify success

**What happens:**
- ✅ Enables Row Level Security on all tables
- ✅ Creates user privacy policies
- ✅ Sets up admin access policies
- ✅ Enables Real-time subscriptions

**Verification:**
```sql
-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND (tablename LIKE '%reward%' OR tablename LIKE '%activity%')
AND rowsecurity = true
ORDER BY tablename;
```

Expected output: All 10 reward tables with `rowsecurity = true`

### Step 4: Execute Migration 0018 (Seed Data)

1. Open `scripts/database/0018_seed_reward_rules.sql`
2. Copy all content
3. Paste into a new SQL query
4. Click **Run**
5. Verify success

**What happens:**
- ✅ Creates 20+ default reward rules
- ✅ Configures all activity types
- ✅ Sets up decay/limit parameters
- ✅ Verifies data loading

**Verification:**
```sql
-- Verify reward rules are created
SELECT COUNT(*) as total_rules, 
       COUNT(CASE WHEN is_active THEN 1 END) as active_rules
FROM public.reward_rules;
```

Expected output:
- `total_rules`: 20+
- `active_rules`: 20+

---

## ✅ Post-Deployment Verification Checklist

Run these queries to verify everything is properly deployed:

### 1. Table Creation Check
```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'activity_transactions', 'user_rewards_summary', 'user_challenges',
  'referral_tracking', 'user_daily_stats', 'reward_rules',
  'reward_transactions', 'trust_history', 'daily_action_counts',
  'spam_detection'
);
```
**Expected**: `table_count = 10`

### 2. RLS Security Check
```sql
SELECT COUNT(*) as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'activity_transactions', 'user_rewards_summary', 'user_challenges',
  'referral_tracking', 'user_daily_stats', 'reward_rules',
  'reward_transactions', 'trust_history', 'daily_action_counts',
  'spam_detection'
)
AND rowsecurity = true;
```
**Expected**: `rls_enabled = 10`

### 3. Index Check
```sql
SELECT COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'activity_transactions', 'user_rewards_summary', 'user_challenges',
  'referral_tracking', 'user_daily_stats', 'reward_rules'
);
```
**Expected**: `index_count >= 15` (one per critical table)

### 4. Reward Rules Check
```sql
SELECT COUNT(*) as total_rules,
       COUNT(CASE WHEN is_active THEN 1 END) as active_rules,
       COUNT(CASE WHEN decay_enabled THEN 1 END) as decay_rules
FROM public.reward_rules;
```
**Expected**:
- `total_rules >= 20`
- `active_rules = total_rules`
- `decay_rules >= 10`

### 5. Trigger Check
```sql
SELECT COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%updated_at%';
```
**Expected**: `trigger_count = 6` (one per table with updated_at)

### 6. Real-time Publications Check
```sql
SELECT COUNT(*) as realtime_tables
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND schemaname = 'public'
AND tablename IN (
  'activity_transactions', 'user_rewards_summary', 'user_challenges',
  'referral_tracking', 'user_daily_stats', 'reward_transactions',
  'trust_history'
);
```
**Expected**: `realtime_tables = 7`

---

## 🔍 Troubleshooting

### Issue: "Table already exists" error

**Cause**: Tables from a previous deployment exist  
**Solution**:
1. Option A: Drop old tables and re-run migrations
   ```sql
   DROP TABLE IF EXISTS public.activity_transactions CASCADE;
   DROP TABLE IF EXISTS public.user_rewards_summary CASCADE;
   -- ... repeat for all tables
   ```
2. Option B: Run migrations with `IF NOT EXISTS` (already in scripts)

### Issue: RLS Policies not applying

**Cause**: Supabase didn't enable RLS properly  
**Solution**:
1. Go to **SQL Editor**
2. Run this query:
   ```sql
   SELECT * FROM pg_tables 
   WHERE tablename = 'activity_transactions' 
   AND schemaname = 'public';
   ```
3. Check if `rowsecurity` column is `true`
4. If false, re-run migration 0017

### Issue: Seed data not inserting

**Cause**: Foreign key or constraint violation  
**Solution**:
1. Check if reward_rules table exists
2. Verify no conflicts: `SELECT COUNT(*) FROM public.reward_rules;`
3. Re-run migration 0018

### Issue: Realtime subscriptions not working

**Cause**: Tables not published to Supabase realtime  
**Solution**:
1. Go to **Database** → **Replication**
2. Check if `supabase_realtime` is enabled
3. Verify tables are listed under Source Tables
4. If not, re-run the `ALTER PUBLICATION` statements from migration 0017

---

## 📊 Database Statistics After Deployment

Run this for a summary:

```sql
WITH table_stats AS (
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    (SELECT COUNT(*) FROM pg_indexes 
     WHERE pg_indexes.tablename = t.tablename) as index_count,
    (SELECT rowsecurity FROM pg_tables 
     WHERE pg_tables.tablename = t.tablename) as has_rls
  FROM pg_tables t
  WHERE schemaname = 'public'
  AND tablename IN (
    'activity_transactions', 'user_rewards_summary', 'user_challenges',
    'referral_tracking', 'user_daily_stats', 'reward_rules',
    'reward_transactions', 'trust_history', 'daily_action_counts', 'spam_detection'
  )
)
SELECT 
  tablename,
  size,
  index_count,
  has_rls,
  CASE WHEN has_rls THEN '✅' ELSE '❌' END as rls_status
FROM table_stats
ORDER BY tablename;
```

---

## 🔐 Security Verification

After deployment, verify RLS works correctly:

### Test 1: User can only see own data

```sql
-- Simulate user query (with auth.uid() set to a specific user)
-- This should PASS RLS check:
SELECT * FROM public.activity_transactions
WHERE user_id = auth.uid();

-- This should FAIL RLS check (blocked by policy):
SELECT * FROM public.activity_transactions
WHERE user_id != auth.uid();
```

### Test 2: Admin can read reward rules

```sql
-- Anyone (including anon) can read active rules:
SELECT * FROM public.reward_rules
WHERE is_active = true;

-- But cannot modify unless admin:
-- INSERT INTO reward_rules ... (will fail unless admin)
```

---

## 📝 Next Steps

### After verification passes (✅):

1. **Phase 2**: Complete service implementations
   - Finalize `activityTransactionService.ts`
   - Finalize `userRewardsSummaryService.ts`
   - Finalize `referralTrackingService.ts`
   
2. **Phase 3**: Enhance React hooks
   - Wire Supabase subscriptions
   - Add real-time listeners
   - Implement cache management

3. **Phase 4**: Create API routes
   - `server/routes/rewards.ts`
   - User endpoints
   - Admin endpoints

---

## 📞 Support

If you encounter issues during deployment:

1. **Check Supabase Status**: https://status.supabase.com/
2. **Review error message** in SQL Editor output
3. **Try running verification queries** above
4. **Check RLS policies** in **Authentication** → **Policies** tab
5. **Review migration files** for syntax issues

---

## ✨ Success Indicators

After completing Phase 1, you should see:

✅ All 10 tables created and visible  
✅ All RLS policies enabled (10 tables with rowsecurity=true)  
✅ All indexes created for performance  
✅ 20+ reward rules seeded  
✅ Real-time publication enabled  
✅ Auto-update triggers configured  

**Estimated Database Size**: < 1 MB (empty, grows with data)  
**Ready for Production**: Yes, fully secure  

---

## 🎯 What's Next?

Once Phase 1 is complete, proceed to:

**→ Phase 2: Services Enhancement** (2-3 hours)
- Implement complete service methods
- Add real-time subscriptions
- Configure error handling

See `REWARDS_CREATOR_ECONOMY_IMPLEMENTATION_PLAN.md` for complete roadmap.

---

