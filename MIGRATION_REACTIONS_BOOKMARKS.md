# Running Database Migrations for Reactions and Bookmarks

This guide explains how to run the migration scripts to create the necessary tables for post reactions and bookmarked/saved posts.

## What Gets Created

This migration creates two tables that are essential for post interactions:

1. **`post_reactions`** - Stores user reactions on posts (like, love, haha, etc.)
   - Fields: id, post_id, user_id, reaction_type, created_at
   - Allows one reaction per user per post (UNIQUE constraint)

2. **`user_saved_posts`** - Stores bookmarked/saved posts
   - Fields: id, post_id, user_id, created_at
   - Allows one save per user per post (UNIQUE constraint)

Both tables include:
- Indexes for optimal query performance
- Row Level Security (RLS) policies to protect user data
- Foreign key constraints to automatically delete records when posts or users are deleted

## How to Run the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project at https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Click the **New Query** button
5. Copy the entire contents of `scripts/migrations/create_reactions_and_bookmarks_tables.sql`
6. Paste it into the SQL editor
7. Click the **Run** button (or press Ctrl+Enter / Cmd+Enter)
8. Wait for the query to complete successfully

### Option 2: Using Individual Migration Files

If you prefer to run migrations one at a time:

1. First, run `scripts/migrations/post_reactions_migration.sql`
2. Then, run `scripts/migrations/user_saved_posts_migration.sql`

Follow the same steps as Option 1 for each file.

## Verification

After running the migration, verify the tables were created:

1. In Supabase Dashboard, go to **Table Editor**
2. You should see two new tables:
   - `post_reactions`
   - `user_saved_posts`

Alternatively, you can run these verification queries in the SQL Editor:

```sql
SELECT * FROM public.post_reactions LIMIT 10;
SELECT * FROM public.user_saved_posts LIMIT 10;
```

## Troubleshooting

### Error: "Already exists"
This is normal! The migration script uses `IF NOT EXISTS` to avoid errors if the tables already exist. You can safely re-run the migration.

### Error: "Permission denied"
Make sure you're logged in as a user with admin or database admin privileges. Go to Supabase Dashboard → Authentication → Users to verify your user role.

### Error: "Reference integrity violation"
This typically means the `posts` table doesn't exist. Make sure all other migrations have been run first.

## What Happens Next

Once the tables are created:
1. Users can react to posts with different reaction types
2. Users can save/bookmark posts for later viewing
3. Saved posts appear in the "Saved" tab in the user's profile
4. Reactions are displayed on posts in real-time
5. All data is protected with RLS policies

## Rollback (If Needed)

If you need to remove these tables, run:

```sql
DROP TABLE IF EXISTS public.post_reactions CASCADE;
DROP TABLE IF EXISTS public.user_saved_posts CASCADE;
```

⚠️ **WARNING**: This will delete all reaction and save data. Use only if necessary.
