# Registration Error Fix

## Problem
Registration was failing with the error:
```
AuthApiError: Database error saving new user
```

## Root Causes
1. **Missing Database Trigger**: The database trigger that automatically creates a profile when a user signs up was either not set up or was using incorrect logic
2. **Null Constraint Violations**: The Edge Function and old trigger logic were trying to insert null values for required fields (`username` and `email`)
3. **Schema Mismatch**: The deployed database schema didn't have an `email` column in the profiles table, but the Drizzle schema expected it
4. **Missing User Metadata**: The signup form wasn't properly passing username in the user metadata to Supabase auth

## Solution Applied

### 1. New Migration (0016_fix_profiles_registration_error.sql)
This migration:
- ✅ Adds the `email` column to profiles table if missing
- ✅ Sets NOT NULL constraints on `username` and `email` fields
- ✅ Makes `user_id` the primary key
- ✅ Creates the correct `handle_new_user()` trigger function that:
  - Automatically creates a profile when a new user signs up
  - Derives username from metadata or email (part before @)
  - Derives full_name from metadata or email
  - Sets a default avatar URL from dicebear
- ✅ Creates proper RLS (Row Level Security) policies
- ✅ Backfills existing auth users into the profiles table
- ✅ Grants appropriate permissions to authenticated and service_role users

### 2. Updated Supabase Edge Function (supabase/functions/handle-new-user/index.ts)
The function now:
- ✅ Uses the same derivation logic as the database trigger
- ✅ Properly derives username from email if not provided
- ✅ Uses UPSERT instead of INSERT to avoid conflicts
- ✅ Includes proper error handling and logging
- ✅ Works as a defensive backup if the trigger fails

### 3. Updated AuthContext (src/contexts/AuthContext.tsx)
The signup function now:
- ✅ Derives a proper username from the user's name or email
- ✅ Passes the username in user metadata to Supabase
- ✅ Waits for the database trigger to execute before verifying profile
- ✅ Includes a fallback profile creation if the trigger didn't work
- ✅ Better error logging for debugging

### 4. Improved ensureProfileExists
This function:
- ✅ Now works as a safety mechanism, not the primary creation method
- ✅ Properly derives username and email for fallback scenarios
- ✅ Includes better error handling

## How It Works Now

1. **User Registration**: When a user signs up via the form:
   ```
   User Signs Up (name, email, password)
   ↓
   Supabase Auth stores user (with derived username in metadata)
   ↓
   Database trigger (handle_new_user) fires automatically
   ↓
   Profile created with proper values (email, username derived from email or metadata)
   ↓
   Optional: Edge Function acts as backup (upserts profile)
   ↓
   AuthContext verifies profile was created
   ↓
   Fallback: Manual profile creation if both above failed
   ```

2. **Profile Creation**: Ensures the profile has:
   - `user_id`: UUID from auth.users
   - `email`: User's email
   - `username`: Derived from user metadata or email
   - `full_name`: User's name
   - `avatar_url`: Default avatar from dicebear
   - Other fields with proper defaults

## What You Need To Do

### Step 1: Apply the Migration
The migration file `migrations/0016_fix_profiles_registration_error.sql` needs to be applied to your Supabase database.

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the entire content of `migrations/0016_fix_profiles_registration_error.sql`
5. Run the query
6. Wait for completion (should take a few seconds)

**Option B: Using Supabase CLI** (if configured)
```bash
supabase migration up
```

**Option C: Using a migration tool**
Apply the SQL migration through your deployment process

### Step 2: Test Registration
After applying the migration:
1. Go to the registration page
2. Try registering with a test account
3. You should see:
   - ✅ Successful registration
   - ✅ Redirect to the feed
   - ✅ User profile created automatically

### Step 3: Verify Existing Users (Optional)
If you have existing auth users without profiles:
1. The migration includes a backfill that should create profiles for them
2. You can verify by checking the profiles table for any null usernames/emails
3. If found, the migration's backfill logic should have created them with proper values

## Testing Checklist

After applying the fix:

- [ ] Registration works without errors
- [ ] New user is automatically logged in after signup
- [ ] User is redirected to feed page
- [ ] User profile appears in the database with all required fields
- [ ] Existing users still work (if any)
- [ ] Referral code works if provided
- [ ] Login works for newly registered users

## Troubleshooting

### If Registration Still Fails
1. Check Supabase logs for trigger errors
2. Verify the migration was applied successfully:
   ```sql
   -- Check if trigger exists
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   
   -- Check profiles table schema
   \d public.profiles
   ```
3. Check if RLS policies are blocking the insert:
   ```sql
   SELECT * FROM information_schema.role_table_grants 
   WHERE table_name = 'profiles';
   ```

### If Username Collision Error
The migration handles duplicate usernames by appending a random suffix. If you still see this:
1. Check if a user already exists with that username
2. The system will automatically generate a unique username

## Files Modified
- ✅ `migrations/0016_fix_profiles_registration_error.sql` - New migration
- ✅ `supabase/functions/handle-new-user/index.ts` - Updated Edge Function
- ✅ `src/contexts/AuthContext.tsx` - Updated signup flow

## Impact
- ✅ No breaking changes to existing code
- ✅ No data loss
- ✅ Backward compatible
- ✅ Improves reliability with defensive mechanisms

## Additional Notes
- The trigger on `auth.users` is the primary mechanism for profile creation
- The Edge Function serves as a backup/defensive mechanism
- The AuthContext has a fallback profile creation method as last resort
- Username is now always derived from metadata or email, never null
- Email is now a required field in profiles matching the Drizzle schema
