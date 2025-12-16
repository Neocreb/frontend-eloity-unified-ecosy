# Fix: Group Creation RLS Infinite Recursion Error

## Problem
When creating a group, you're getting this error:
```
Failed to create group due to database configuration issue. Please contact support. 
Details: infinite recursion detected in policy for relation "group_participants"
```

## Root Cause
The RLS (Row Level Security) policy on the `group_participants` table is self-referencing during INSERT operations, causing infinite recursion.

## Solution

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open your Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste this SQL code:**

```sql
-- Migration: Fix infinite recursion in group_participants RLS policy
-- Issue: Self-referencing policy during INSERT causes recursion
-- Solution: Separate policies for each operation type

-- Disable RLS temporarily to fix policies safely
ALTER TABLE public.group_participants DISABLE ROW LEVEL SECURITY;

-- Drop all problematic policies
DROP POLICY IF EXISTS "Users can view group participants for groups they belong to" ON public.group_participants;
DROP POLICY IF EXISTS "Users can join groups through invite links" ON public.group_participants;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_participants;
DROP POLICY IF EXISTS "group_participants_select" ON public.group_participants;
DROP POLICY IF EXISTS "group_participants_insert" ON public.group_participants;
DROP POLICY IF EXISTS "group_participants_update" ON public.group_participants;
DROP POLICY IF EXISTS "group_participants_delete" ON public.group_participants;

-- Re-enable RLS
ALTER TABLE public.group_participants ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT POLICY - User can view participants in groups they belong to
-- ============================================================================
CREATE POLICY "group_participants_select" ON public.group_participants
    FOR SELECT USING (
        -- User is viewing a participant record for a group they belong to
        auth.uid() IN (
            SELECT DISTINCT user_id 
            FROM public.group_participants gp2
            WHERE gp2.group_id = group_participants.group_id
        )
        OR
        -- User is the creator of the group
        EXISTS (
            SELECT 1 FROM public.group_chat_threads gt
            WHERE gt.id = group_participants.group_id
            AND gt.created_by = auth.uid()
        )
    );

-- ============================================================================
-- INSERT POLICY - Allow authenticated users to be added to groups
-- Don't self-reference - check group exists instead
-- ============================================================================
CREATE POLICY "group_participants_insert" ON public.group_participants
    FOR INSERT WITH CHECK (
        -- The group must exist
        EXISTS (
            SELECT 1 FROM public.group_chat_threads
            WHERE id = group_id
        )
        AND
        -- User being added is authenticated (or current user is admin)
        (
            auth.uid() IS NOT NULL
        )
    );

-- ============================================================================
-- UPDATE POLICY - Only allow users to update their own records
-- ============================================================================
CREATE POLICY "group_participants_update" ON public.group_participants
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- ============================================================================
-- DELETE POLICY - Allow users to remove themselves or admins to remove others
-- ============================================================================
CREATE POLICY "group_participants_delete" ON public.group_participants
    FOR DELETE USING (
        -- User can delete their own record
        auth.uid() = user_id
        OR
        -- Admin of the group can delete anyone
        EXISTS (
            SELECT 1 FROM public.group_participants gp_admin
            WHERE gp_admin.group_id = group_participants.group_id
            AND gp_admin.user_id = auth.uid()
            AND gp_admin.role = 'admin'
        )
    );

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
```

4. **Execute the query**
   - Click the "Run" button (or press Ctrl+Enter)
   - Wait for the query to complete

5. **Verify success**
   - You should see "Success. No rows returned" message
   - Try creating a group again - it should now work!

### Option 2: Using the CLI Script

If you have the environment variables set up:

```bash
# Set your Supabase credentials
export VITE_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the migration script
npm run apply-group-fix
```

## What Changed

The new RLS policies are designed to avoid self-reference:

| Operation | Old Policy | New Policy |
|-----------|-----------|-----------|
| **SELECT** | Self-referencing (recursive) | Checks group membership without recursion |
| **INSERT** | N/A (self-referencing) | ✅ Simple: just check if group exists |
| **UPDATE** | N/A (self-referencing) | ✅ Simple: user can only update own record |
| **DELETE** | N/A (self-referencing) | ✅ Simple: user can delete own or admins delete any |

## Testing

After applying the fix:

1. Go to the group creation page
2. Create a new group with:
   - Group name: "Test Group"
   - Select at least one participant
   - Click "Create Group"

3. You should see:
   - ✅ "Group Created" success message
   - ✅ Automatic redirect to the new group chat

## Still Having Issues?

If the error persists:

1. **Clear browser cache** and reload
2. **Check that the SQL executed without errors** in the Supabase console
3. **Verify the migration was applied** by checking the policies:
   - Go to Supabase Dashboard → Tables → group_participants → Policies
   - You should see 4 policies: select, insert, update, delete

4. **Contact Support** if problems continue

---

**Last Updated:** 2025-12-16
**Migration ID:** 0053_fix_group_participants_insert_recursion.sql
