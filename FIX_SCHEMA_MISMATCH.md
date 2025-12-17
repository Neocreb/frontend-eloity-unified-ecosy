# Schema Mismatch Fix - Column Issues Resolved

## Problem
The migration scripts were trying to insert columns into the `public.users` table that don't exist. The `public.users` table has a minimal schema:

**public.users columns:**
- id (UUID, Primary Key)
- email (TEXT)
- password (TEXT)
- email_confirmed (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

All other user profile data (full_name, avatar_url, reputation, tier_level, etc.) belong in the `public.profiles` table.

## What Was Fixed

### 1. Helper Script: `scripts/database/fix-orphaned-auth-users.sql`
- ✅ Now only inserts columns that exist in `public.users`
- ✅ Uses empty string for password (auth is managed by auth.users)
- ✅ Creates minimal user entry with just id, email, password, email_confirmed, created_at, updated_at
- ✅ Second part creates complete profiles in `public.profiles` with all the profile-related fields

### 2. Main Migration: `supabase/migrations/20251220_fix_profiles_schema_completeness.sql`
- ✅ Fixed backfill query to not reference non-existent columns in public.users
- ✅ Now generates default username from email (SPLIT_PART)
- ✅ Now generates default full_name from email
- ✅ Generates default avatar URL using DiceBear API

## Correct Approach

The architecture is now correct:
- **public.users**: Authentication and basic identity (minimal schema)
- **public.profiles**: Rich profile data (30+ columns)
- **auth.users**: Supabase Auth managed table (separate from public.users)

## How to Apply the Fixed Scripts

### Step 1: Run Helper Script First
In Supabase SQL Editor, run:
```sql
-- Copy and paste contents of: scripts/database/fix-orphaned-auth-users.sql
```

This will:
1. Create missing `public.users` entries from `auth.users`
2. Create complete `public.profiles` entries for all users
3. Show verification of how many issues were fixed

### Step 2: Apply Main Migration
```sql
-- Copy and paste contents of: supabase/migrations/20251220_fix_profiles_schema_completeness.sql
```

This will:
1. Add all missing columns to `public.profiles`
2. Fix the user provisioning trigger for new registrations
3. Create performance indexes

## Expected Success

After both scripts run successfully, you should see:
- ✅ No foreign key constraint errors
- ✅ All existing users have profiles with required columns
- ✅ New user registration creates complete profiles
- ✅ Explore endpoint returns users
- ✅ Feed shows public posts

## Testing

### Verify Tables Have Data
```sql
-- Should show all users
SELECT COUNT(*) FROM public.users;

-- Should show all users with complete profiles
SELECT COUNT(*) FROM public.profiles;

-- Should be 0 (no orphaned users)
SELECT COUNT(*) FROM auth.users au 
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id);
```

### Verify Profile Columns
```sql
-- Should show all 30+ columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

### Test Explore Endpoint
```bash
curl http://localhost:5000/api/explore/users?limit=10
```

Should return users with:
- id, username, full_name, avatar_url, bio, is_verified, reputation, followers_count

## Files Modified

1. **scripts/database/fix-orphaned-auth-users.sql** - Fixed column references
2. **supabase/migrations/20251220_fix_profiles_schema_completeness.sql** - Fixed column references

Both files are now ready to apply without schema errors.
