# Fix Landing Page API Errors

## Problem
The landing page is showing these errors:
- ❌ Error fetching use cases
- ❌ Error fetching FAQs  
- ❌ Error fetching testimonials
- ❌ Error fetching comparisons
- ❌ Error fetching stats

These errors occur because the required database tables haven't been created in Supabase yet.

## Root Cause
The backend routes exist and are properly configured at:
- `GET /api/landing/testimonials`
- `GET /api/landing/faqs`
- `GET /api/landing/use-cases`
- `GET /api/landing/social-proof-stats`
- `GET /api/landing/comparison-matrix`

However, they're trying to query these Supabase tables which don't exist yet:
- `landing_testimonials`
- `landing_faqs`
- `landing_use_cases`
- `landing_social_proof_stats`
- `landing_comparison_matrix`

## Solution: Apply the Migration

You have 3 options to fix this:

### Option 1: Manual via Supabase Dashboard (Easiest)

1. Go to your **Supabase Dashboard**: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire content from: `migrations/landing_page_schema.sql`
6. Paste it into the editor
7. Click the **Run** button

Wait for the query to complete (usually 5-30 seconds).

**That's it!** The tables will be created with sample data.

---

### Option 2: Using the Migration Script

If you have Node.js set up locally and your `.env.local` configured:

```bash
node scripts/apply-landing-migration.js
```

This script will:
1. ✅ Connect to your Supabase database
2. ✅ Apply the landing page schema
3. ✅ Verify all tables were created
4. ✅ Show success confirmation

---

### Option 3: PostgreSQL Command Line

If you have `psql` installed and your database connection string:

```bash
psql "postgresql://user:password@db.supabase.co:5432/postgres" < migrations/landing_page_schema.sql
```

---

## What Gets Created

When the migration runs successfully, it creates:

### 1. `landing_testimonials` table
- Stores customer testimonials with ratings, images, and metrics
- Includes sample testimonials
- Indexed for fast queries

### 2. `landing_faqs` table
- Stores frequently asked questions
- Organized by category
- Includes sample FAQs

### 3. `landing_use_cases` table
- Stores success stories and use cases
- Grouped by user type (creator, freelancer, trader, merchant)
- Includes sample use cases

### 4. `landing_social_proof_stats` table
- Stores platform statistics (user count, revenue, etc.)
- Used for social proof section
- Includes sample stats

### 5. `landing_comparison_matrix` table
- Stores feature comparisons vs competitors
- Indexed for performance
- Includes sample comparisons

---

## Verification

After applying the migration, verify the landing page now works by:

1. **Check the browser console** - errors should be gone
2. **Refresh the page** - sections should load with sample data
3. **Check Supabase** - Query the tables directly:

```sql
SELECT COUNT(*) FROM landing_testimonials;
SELECT COUNT(*) FROM landing_faqs;
SELECT COUNT(*) FROM landing_use_cases;
SELECT COUNT(*) FROM landing_social_proof_stats;
SELECT COUNT(*) FROM landing_comparison_matrix;
```

---

## Troubleshooting

### Still seeing errors after applying migration?

**Check 1: Supabase credentials in .env.local**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Check 2: Backend logs**
Look at the dev server output (terminal) for specific error messages:
```
Error fetching testimonials: [actual error message]
```

**Check 3: Supabase RLS policies**
If tables exist but queries fail, check if RLS (Row Level Security) is blocking access:
```sql
SELECT tablename FROM pg_tables 
WHERE tablename LIKE 'landing_%';
```

All landing tables should have RLS disabled (public read access).

**Check 4: Clear browser cache**
Sometimes browser cache prevents updates:
- Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
- Clear browser cache and cookies
- Refresh the page

### Migration shows "table already exists"?

This is fine! The migration uses `CREATE TABLE IF NOT EXISTS`, so it won't overwrite existing tables.

If you need to reset the tables:
```sql
DROP TABLE IF EXISTS landing_comparison_matrix;
DROP TABLE IF EXISTS landing_social_proof_stats;
DROP TABLE IF EXISTS landing_use_cases;
DROP TABLE IF EXISTS landing_faqs;
DROP TABLE IF EXISTS landing_testimonials;
```

Then re-run the migration.

---

## Sample Data

The migration includes sample data for all tables:

**Testimonials:**
- 3 sample customer testimonials
- With ratings, images, and metrics

**FAQs:**
- 8 frequently asked questions
- Organized in categories (general, features, pricing, support)

**Use Cases:**
- 2 success stories (Creators, Traders)
- With results and timeline metrics

**Stats:**
- 4 platform statistics (Active Users, Transactions, Revenue, Growth)
- For social proof section

**Comparisons:**
- 12 feature comparisons
- Across 5 categories (Features, Performance, Integration, Support, Pricing)

---

## Next Steps

Once the migration is applied:

1. ✅ The landing page sections will display with sample data
2. ✅ You can modify the sample data in Supabase Dashboard
3. ✅ Or create your own admin interface to manage the content
4. ✅ The `/api/admin/landing/*` endpoints are available for content management

---

## Support

If you encounter issues:

1. **Check the backend logs** in your terminal for specific errors
2. **Verify Supabase credentials** in `.env.local`
3. **Try the manual SQL Editor method** - it's the most reliable
4. **Check Supabase status page** - ensure your project is active

---

## File Reference

- **Migration file**: `migrations/landing_page_schema.sql`
- **Script**: `scripts/apply-landing-migration.js`
- **Frontend sections**: `src/home/*.tsx`
- **Backend routes**: `server/routes/landing.ts`
- **Backend services**: `server/services/landingService.ts`

