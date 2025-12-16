# New User Visibility & Content Discovery - Root Cause Analysis

## Problem Statement
When new users register on the Eloity platform, they see no content, posts, or other users. Meanwhile, up to 12 users exist in the profiles table, but they are not discoverable via search or showing in the feed.

## Root Causes Identified

### 1. **Profiles Table Schema Mismatch** (CRITICAL)
The profiles table in Supabase is missing critical columns that the backend expects:

**Missing Columns:**
- `reputation` - Used for sorting in explore endpoint
- `followers_count` - Used for displaying user popularity
- `following_count` - Track user engagement
- `posts_count` - Content activity tracking
- `profile_views` - Engagement metric
- `is_online` - User status
- `last_active` - Timestamp for user activity
- `profile_visibility` - Controls whether profile is public/private
- `location`, `website`, `phone`, `date_of_birth`, `gender` - Profile details
- `points`, `level`, `role` - User tier/status fields
- `preferred_currency`, `timezone` - User preferences
- `show_email`, `show_phone` - Privacy settings
- `allow_direct_messages`, `allow_notifications` - Communication preferences
- `banner_url`, `tier_level`, `font_size`, `ui_language`, etc. - Additional settings

**Impact:**
- Backend `/api/explore/users` endpoint tries to query non-existent columns and fails silently
- New users' profiles aren't fully created, causing feed joins to fail
- Search functionality can't display results properly

### 2. **User Provisioning Trigger Bug**
The trigger in `20251026170000_setup_user_provisioning_hook.sql` creates profiles with WRONG column names:

```sql
INSERT INTO public.profiles (
  user_id,
  name,          -- ❌ Should be: full_name
  avatar,        -- ❌ Should be: avatar_url
  status,        -- ❌ Doesn't exist
  preferences    -- ❌ Doesn't exist
)
```

**Impact:**
- New user profiles created with missing or incorrect data
- Profiles don't have default values for critical fields
- No email field populated (which is required)

### 3. **Missing Backfill of Existing Users**
Existing users in `auth.users` table were never migrated to have complete profiles in the `profiles` table.

## Solutions Implemented

### Migration: `20251220_fix_profiles_schema_completeness.sql`

This migration does 5 critical things:

#### 1. Add Missing Columns to Profiles Table
- Added 30+ missing columns with appropriate defaults
- Uses `IF NOT EXISTS` clauses to prevent errors on rerun
- All columns have sensible defaults (0 for counts, false for booleans, 'public' for visibility)

#### 2. Fixed User Provisioning Trigger
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,                    -- ✅ Correct field
    username,
    full_name,               -- ✅ Correct field
    avatar_url,              -- ✅ Correct field
    reputation,
    followers_count,
    following_count,
    posts_count,
    profile_views,
    is_online,
    profile_visibility,
    allow_direct_messages,
    allow_notifications,
    preferred_currency,
    tier_level,
    created_at,
    updated_at
  ) VALUES (...)
```

#### 3. Backfill Existing Users
Automatically creates complete profiles for all existing auth.users who don't have profiles yet:
- Extracts data from auth.users and raw_user_meta_data
- Generates default avatars using DiceBear API
- Sets all required fields with appropriate defaults

#### 4. Create Performance Indexes
Added indexes on frequently queried columns:
- `idx_profiles_reputation` - For sorting in explore
- `idx_profiles_followers_count` - For engagement sorting
- `idx_profiles_created_at` - For chronological queries
- `idx_profiles_username` - For username-based lookups
- `idx_profiles_is_verified` - For verification filtering
- `idx_profiles_profile_visibility` - For visibility filtering

#### 5. Refresh PostgREST Schema Cache
`NOTIFY pgrst, 'reload schema'` ensures the API schema is updated immediately

### Code Changes: `server/routes/explore.ts`

Enhanced the `/api/explore/users` endpoint to:
- Include `profile_visibility` in the query
- Filter out private profiles
- Only show public profiles to other users

```javascript
// Filter: exclude self, already following, and private profiles
const candidates = (profilesResult || []).filter((p: any) => {
  return p.user_id && 
         p.user_id !== userId && 
         !followingIds.includes(p.user_id) &&
         p.profile_visibility === 'public';  // ✅ New check
});
```

## Testing & Verification

After applying this migration, verify:

### 1. Check Profiles Table Schema
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

### 2. Verify New User Registration
1. Create a new test user
2. Check that a profile was created with all fields:
   ```sql
   SELECT * FROM public.profiles 
   WHERE user_id = '<new_user_id>';
   ```

### 3. Test Explore Endpoint
```bash
curl "http://localhost:5000/api/explore/users?limit=10"
```
Should return 10 users with complete profile data

### 4. Test Feed
1. Log in as new user
2. Should see public posts from other users
3. Should not see any private posts

### 5. Test Search
Search for existing users by username or full_name
Should return complete results

## Migration Checklist

- [ ] Apply migration `20251220_fix_profiles_schema_completeness.sql` to Supabase
- [ ] Verify all columns were added successfully
- [ ] Test new user registration creates complete profiles
- [ ] Test explore endpoint returns users
- [ ] Test feed shows public posts
- [ ] Test search works for users
- [ ] Verify performance with indexes

## Expected Outcomes

✅ New users will see other users in explore/search
✅ New users will see public posts in their feed
✅ Search functionality will work for finding users
✅ All profile data will be properly available to the frontend
✅ Backend queries will not fail due to missing columns
✅ Performance will be improved with proper indexing

## Files Modified

1. **New Migration:** `supabase/migrations/20251220_fix_profiles_schema_completeness.sql`
2. **Updated Route:** `server/routes/explore.ts` - Added profile_visibility filtering

## Related Issues

This fix addresses the root cause of:
- New users seeing empty feeds
- Search functionality not finding users
- Explore/Discover pages being blank
- Backend queries failing silently
- Profile join failures in feed queries
