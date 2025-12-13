# Grant Super Admin Privileges

This document explains how to grant super admin privileges to a user so they can access the admin dashboard.

## User Details
- **Email**: jeresoftblog@gmail.com
- **User ID**: 293caea5-0e82-4b2d-9642-67f3cdbd95fb

## Prerequisites

Before running any script, ensure you have the following environment variables set in `.env.local`:

```
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> **⚠️ Important**: The `SUPABASE_SERVICE_ROLE_KEY` is a secret key. Never commit it to version control or share it publicly.

## Option 1: Using TypeScript Script (Recommended)

This is the safest option as it includes validation and step-by-step verification.

### Run the script:

```bash
npx tsx scripts/grant-admin-to-user.ts 293caea5-0e82-4b2d-9642-67f3cdbd95fb jeresoftblog@gmail.com
```

Or with default parameters (no arguments needed):

```bash
npx tsx scripts/grant-admin-to-user.ts
```

The script will:
1. ✅ Verify the user exists in auth.users
2. ✅ Check if the user exists in public.users
3. ✅ Create or update the admin_users record
4. ✅ Grant all super admin permissions
5. ✅ Verify the setup was successful

---

## Option 2: Using Node.js Script

If you prefer not to use TypeScript or have issues with tsx:

```bash
node scripts/grant-admin-to-user.js 293caea5-0e82-4b2d-9642-67f3cdbd95fb jeresoftblog@gmail.com
```

Or with default parameters:

```bash
node scripts/grant-admin-to-user.js
```

---

## Option 3: Using SQL Migration

If you prefer to run the SQL directly via Supabase Dashboard:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query and copy the contents of `migrations/grant_super_admin_user.sql`
4. Execute the query

Or you can apply it via command line:

```bash
psql "your_database_connection_string" < migrations/grant_super_admin_user.sql
```

---

## What Gets Granted

When the script runs successfully, the user will have:

- **Role**: super_admin
- **Permissions**: All of the following
  - admin.all
  - users.all
  - content.all
  - marketplace.all
  - crypto.all
  - freelance.all
  - financial.all
  - settings.all
  - moderation.all
  - analytics.all
  - system.all
- **Status**: is_active = true

---

## Logging In

After the script completes successfully, the user can login to the admin dashboard with:

- **URL**: `/admin/login`
- **Email**: jeresoftblog@gmail.com
- **Password**: Their existing password (no password change required)

---

## Verifying the Setup

To verify the user has admin access, you can check the `admin_users` table in Supabase:

```sql
SELECT 
    user_id,
    email,
    name,
    roles,
    permissions,
    is_active,
    created_at
FROM public.admin_users
WHERE email = 'jeresoftblog@gmail.com'
   OR user_id = '293caea5-0e82-4b2d-9642-67f3cdbd95fb';
```

Expected output should show:
- `roles`: ['super_admin']
- `is_active`: true
- `permissions`: Array with 11 permissions

---

## Troubleshooting

### "Supabase URL and Service Role Key are required"

Make sure your `.env.local` file contains:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### "User not found"

Verify that:
1. The user ID `293caea5-0e82-4b2d-9642-67f3cdbd95fb` exists in your Supabase auth
2. The email `jeresoftblog@gmail.com` is correct
3. Check the Supabase Auth dashboard for the user

### "Email already exists in admin_users"

This means the user already has an admin record. The script will update it to ensure it has the super_admin role.

### Database connection issues

If you're running the script and getting database errors:
1. Ensure your Supabase project is active and accessible
2. Check that the `SUPABASE_SERVICE_ROLE_KEY` has sufficient permissions
3. Verify there are no Row Level Security (RLS) policies blocking admin_users table access

---

## Security Notes

- ✅ The script uses the Service Role Key which bypasses RLS for setup
- ✅ Regular user login credentials are unchanged
- ✅ The user maintains all their regular account privileges
- ✅ Admin activity is logged in the `admin_activity_logs` table
- ✅ Keep the Service Role Key secure and never expose it in client code

---

## Reverting Admin Access

If you need to remove admin privileges, you can:

1. **Disable the admin account**:
```sql
UPDATE public.admin_users
SET is_active = false
WHERE email = 'jeresoftblog@gmail.com';
```

2. **Remove the admin record entirely**:
```sql
DELETE FROM public.admin_users
WHERE email = 'jeresoftblog@gmail.com';
```

---

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the script output for error messages
3. Verify the Supabase dashboard to ensure tables exist
4. Check admin_users table structure matches the schema

