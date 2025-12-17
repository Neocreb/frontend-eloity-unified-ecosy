# Root Cause Analysis: New User Empty Feed Problem

## Problem Statement
When a new user registers on Eloity, they see no content, posts, or other users in their feed, even though:
- The `posts` table contains many posts from existing users
- The `profiles` table has up to 12 user profiles
- Search and explore endpoints should work

## Investigation Timeline

### Initial Hypothesis (INCORRECT)
"The profiles table is missing essential columns causing queries to fail"

**Result**: Created complex migrations and helper scripts, but this wasn't the real issue.

### Actual Root Cause (CORRECT)
**The feed query logic doesn't show public posts to new users.**

Location: `src/services/postService.ts` → `getFeedPosts()` method

**Problem Code:**
```typescript
// Get posts only from users the current user follows
const followingUserIds: string[] = [userId]; // Start with just current user
// Add users they follow...
// Query: SELECT * FROM posts WHERE user_id IN (validUserIds)
```

**For new users:**
- `validUserIds` = `[newUserId]` (only themselves)
- New users have 0 posts
- No following relationships
- Result: **Empty array returned** ❌

**Meanwhile:**
- `posts` table has content from 2 existing users
- But these posts are never shown because new users don't follow them
- The feed only shows posts from people you follow

## The Fix

Modified `PostService.getFeedPosts()` to implement smart fallback:

```typescript
if (hasFollowing && validUserIds.length > 0) {
  // User has followers - show personalized feed
  // Same logic as before
} else {
  // New user with no followers - show public discovery feed
  const result = await supabase
    .from("posts")
    .select("*")
    .eq("privacy", "public")  // Show ALL public posts
    .order("created_at", { ascending: false });
}
```

## Why This Solution Works

1. **New users immediately see content** - They see all public posts on registration
2. **No schema issues** - Uses existing `privacy` column in `posts` table
3. **Scalable** - Works for any number of users
4. **Maintainable** - Simple logical flow: personalized → fallback to discovery
5. **UX improvement** - New users get onboarded to content immediately

## Files Actually Changed

Only ONE file needed to be modified:
- `src/services/postService.ts` - lines 86-147 in `getFeedPosts()` method

## Files We Can Ignore

The following files created during initial investigation are **NOT needed** (the schema was fine):
- ❌ `supabase/migrations/20251220_fix_profiles_schema_completeness.sql`
- ❌ `scripts/database/fix-orphaned-auth-users.sql`
- ❌ `FIX_SCHEMA_MISMATCH.md`
- ❌ `DEBUG_REPORT_NEW_USER_VISIBILITY.md`

These can be deleted as they were based on an incorrect diagnosis.

## What Actually Exists

✅ **posts table** - Has `privacy` column (default: 'public')
✅ **profiles table** - Has all necessary columns for the schema
✅ **followers table** - Tracks following relationships
✅ **RLS policies** - Properly configured for read access

## Testing the Fix

### Test 1: New User Feed
1. Register new account
2. Go to /app/feed
3. **Expected**: See public posts from existing users
4. **Before**: Empty feed
5. **After**: Shows public posts ✅

### Test 2: User with Following
1. Register user who follows creators
2. Go to /app/feed  
3. **Expected**: See only posts from followed users
4. **Result**: Unchanged, still personalized ✅

### Test 3: Post Privacy
1. Create public post
2. View feed as different user
3. **Expected**: Post visible (if no following) or visible (if personalized)
4. **Result**: Post visible based on rule ✅

## Technical Details

The key insight is that **feed personalization** and **new user onboarding** have different requirements:

- **Personalized feed** (engaged users): Only followed content
- **Discovery feed** (new users): All public content

The original code only implemented personalized feed logic, which left new users with empty feeds.

The fix bridges this gap with a simple fallback: If a user has no following relationships, show them the discovery feed instead.

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| New user feed | Empty ❌ | Shows public posts ✅ |
| Engaged user feed | Personalized ✅ | Still personalized ✅ |
| Implementation | One query path | Two conditional paths |
| Complexity | 1 path | 2 paths |
| Performance | Same | Same (pagination applied) |

The fix is minimal, surgical, and solves the real problem: **New users need to see content to get engaged**.
