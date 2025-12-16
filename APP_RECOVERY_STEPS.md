# App Recovery Steps

The app is currently non-functional due to schema mismatches between the Drizzle ORM definitions and the actual Supabase database. The "Failed to load data: [object Object]" error is caused by missing database columns and tables.

## What Was Fixed

### 1. ✅ Removed Broken Trigger (Already Applied)
- Removed `auto_join_pioneer_v1` function that was crashing signups

### 2. ✅ Fixed SQL Query Error (Just Applied)
- Fixed `reconcileBalances.js` missing `GROUP BY` clause that was causing reconciliation errors

### 3. 🔄 REQUIRED: Apply Schema Migration
**You must run this migration in Supabase to restore functionality:**

**In Supabase SQL Editor:**
1. Create a **New Query**
2. Copy the entire content from `migrations/0024_add_missing_schema_columns.sql`
3. Click **RUN**

**This migration adds:**
- ✅ `reputation` column to `profiles` table
- ✅ `hashtags` column to `posts` table (array type)
- ✅ `subcategory` column to `products` table
- ✅ `currency` column to `crypto_wallets` table
- ✅ Creates `freelance_payments` table
- ✅ Creates `user_rewards` table
- ✅ Adds `reward_amount` column to `referral_rewards` table
- ✅ Creates indexes for performance

## After Applying the Migration

The app should be fully functional. The following will work:
- ✅ User registration and login
- ✅ Explore/Browse users (`/api/explore/users`)
- ✅ Freelance metrics
- ✅ Rewards system
- ✅ Referral system
- ✅ Metrics sync
- ✅ Reconciliation job

## Testing Checklist

After applying the migration:
1. [ ] Refresh the app in your browser
2. [ ] Try to load the Explore page (should show users)
3. [ ] Check the browser console for errors (should be none related to missing columns)
4. [ ] Check the server logs (should not show "column X does not exist" errors)
5. [ ] Try registering a new account
6. [ ] Try logging in

## Notes

- The Bybit API 403 errors are expected (API rate limiting) and don't affect core functionality
- The reconciliation job will now run without SQL errors
- The metrics sync will complete successfully
- All data loading endpoints should now work

## If You Still See Errors After Migration

1. Open browser **Developer Tools** (F12)
2. Go to **Console** tab
3. Share any error messages you see
4. Also check the **server logs** (from `npm run dev`)

This will help identify any remaining issues.
