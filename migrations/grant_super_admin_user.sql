-- Migration: Grant super admin privileges to jeresoftblog@gmail.com
-- User ID: 293caea5-0e82-4b2d-9642-67f3cdbd95fb
-- This migration adds the user to admin_users table with full super_admin permissions

-- Check if the user exists in auth.users (optional, for verification)
-- SELECT id, email FROM auth.users WHERE id = '293caea5-0e82-4b2d-9642-67f3cdbd95fb';

-- Insert or update admin user record
INSERT INTO public.admin_users (
    user_id,
    email,
    name,
    roles,
    permissions,
    is_active,
    created_at,
    updated_at
)
VALUES (
    '293caea5-0e82-4b2d-9642-67f3cdbd95fb',
    'jeresoftblog@gmail.com',
    'Super Admin',
    ARRAY['super_admin'],
    ARRAY[
        'admin.all',
        'users.all',
        'content.all',
        'marketplace.all',
        'crypto.all',
        'freelance.all',
        'financial.all',
        'settings.all',
        'moderation.all',
        'analytics.all',
        'system.all'
    ],
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    roles = ARRAY['super_admin'],
    permissions = ARRAY[
        'admin.all',
        'users.all',
        'content.all',
        'marketplace.all',
        'crypto.all',
        'freelance.all',
        'financial.all',
        'settings.all',
        'moderation.all',
        'analytics.all',
        'system.all'
    ],
    is_active = true,
    updated_at = NOW();

-- Verify the user was added
SELECT 
    user_id,
    email,
    name,
    roles,
    array_length(permissions, 1) as permission_count,
    is_active,
    created_at
FROM public.admin_users
WHERE user_id = '293caea5-0e82-4b2d-9642-67f3cdbd95fb'
   OR email = 'jeresoftblog@gmail.com';
