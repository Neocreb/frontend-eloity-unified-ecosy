-- This script creates public.users entries for any auth.users that don't have them
-- This fixes the foreign key constraint issue between profiles and users tables

-- 1. Create public.users entries for orphaned auth.users
-- These are users in auth.users that don't have corresponding entries in public.users
-- NOTE: public.users only has these columns: id, email, password, email_confirmed, created_at, updated_at
-- All profile details go into public.profiles table instead
-- For password, we use a placeholder since auth.users has encrypted_password in a different format
INSERT INTO public.users (
  id,
  email,
  password,
  email_confirmed,
  created_at,
  updated_at
)
SELECT
  au.id,
  au.email,
  '',  -- Password is managed by auth.users, not public.users
  COALESCE(au.email_confirmed_at IS NOT NULL, false),
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- 2. Now create profiles for any users that have public.users but no profiles
INSERT INTO public.profiles (
  user_id,
  email,
  username,
  full_name,
  avatar_url,
  is_verified,
  points,
  level,
  role,
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
)
SELECT
  u.id,
  u.email,
  NULL,  -- username will be set when user completes profile
  NULL,  -- full_name will be set when user completes profile
  'https://api.dicebear.com/7.x/avataaars/svg?seed=' || u.id,  -- Default avatar
  false,
  0,
  'bronze',
  'user',
  0,
  0,
  0,
  0,
  0,
  false,
  'public',
  true,
  true,
  'USDT',
  'tier_1',
  u.created_at,
  NOW()
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Verify the fix
SELECT 
  'Orphaned auth.users (no public.users)' as issue_type,
  COUNT(*) as count
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
UNION ALL
SELECT 
  'Users without profiles',
  COUNT(*)
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);
