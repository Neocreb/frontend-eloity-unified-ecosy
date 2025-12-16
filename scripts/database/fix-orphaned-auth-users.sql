-- This script creates public.users entries for any auth.users that don't have them
-- This fixes the foreign key constraint issue between profiles and users tables

-- 1. Create public.users entries for orphaned auth.users
-- These are users in auth.users that don't have corresponding entries in public.users
INSERT INTO public.users (
  id,
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
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'username',
    SPLIT_PART(au.email, '@', 1)
  ),
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    SPLIT_PART(au.email, '@', 1)
  ),
  COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || au.id
  ),
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
  u.username,
  u.full_name,
  u.avatar_url,
  u.is_verified,
  u.points,
  u.level,
  u.role,
  u.reputation,
  u.followers_count,
  u.following_count,
  u.posts_count,
  u.profile_views,
  u.is_online,
  u.profile_visibility,
  u.allow_direct_messages,
  u.allow_notifications,
  u.preferred_currency,
  u.tier_level,
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
