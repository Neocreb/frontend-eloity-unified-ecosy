# Crypto Learn Courses System - Setup & Deployment Guide

## Overview

The Crypto Learn Courses system is a comprehensive educational platform supporting both admin-managed platform courses and user-created creator courses. This guide walks through the complete setup process.

## Quick Start Checklist

- [ ] Database tables created (migrations/crypto-learn-schema.ts)
- [ ] RLS policies applied (migrations/rls-policies-crypto-learn.sql)
- [ ] Admin roles assigned (scripts/setup-admin-roles.ts)
- [ ] Backend services implemented
- [ ] API routes registered
- [ ] Frontend components integrated
- [ ] Endpoints tested

## Prerequisites

- Supabase project set up with authentication enabled
- Environment variables configured (.env file):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Step 1: Create Database Tables

### Option A: Using Drizzle Schema (Recommended)

The Drizzle ORM schema for the Crypto Learn system is located at:
```
shared/crypto-learn-schema.ts
```

This schema defines:
- `courses` - Platform and creator-created courses
- `course_lessons` - Individual lessons within courses
- `course_enrollments` - User enrollment tracking
- `lesson_progress` - User progress on individual lessons
- `educational_articles` - Blog-style educational content
- `article_progress` - User progress on articles
- `user_roles` - Admin/instructor role management
- `course_reward_claims` - Reward tracking

To apply the migration:
```bash
npm run db:push
```

### Option B: Manual SQL Setup

If not using Drizzle, run the SQL directly in Supabase:

1. Go to Supabase Dashboard → SQL Editor
2. Run the schema creation SQL from the Drizzle schema file
3. Verify tables are created

## Step 2: Apply Row-Level Security (RLS) Policies

RLS policies ensure data security and proper access control.

### Apply RLS Policies

1. Go to Supabase Dashboard → SQL Editor
2. Copy and run the contents of `migrations/rls-policies-crypto-learn.sql`
3. This will:
   - Enable RLS on all tables
   - Create 30+ security policies
   - Create performance indexes

### Policy Summary

**Courses:**
- Published courses visible to all
- Instructors see their own courses
- Admins see all courses
- Only creators/admins can create/edit/delete

**Enrollments:**
- Users only see their own enrollments
- Instructors see enrollments in their courses
- Admins see all enrollments

**Articles:**
- Published articles visible to all
- Authors see their own articles
- Admins see all articles

**User Roles:**
- Users see their own role
- Only admins can create/modify roles

## Step 3: Assign Admin Roles

Admin roles enable users to create platform courses and articles.

### Admin Email List

Default admin emails (update as needed):
- `admin@eloity.com`
- `eloityhq@gmail.com`
- `jeresoftblog@gmail.com`
- `elo@eloibbbty.com`

### Setup Admin Roles

```bash
npm run setup:admin-roles
```

Or manually in Supabase:

1. Create auth users for admin emails
2. Insert into `user_roles` table:

```sql
INSERT INTO user_roles (user_id, role, created_at) VALUES
  ('user-id-here', 'admin', NOW());
```

Verify:
```sql
SELECT * FROM user_roles WHERE role = 'admin';
```

## Step 4: Backend API Routes

The following routes are now available:

### Admin Routes

**Courses:**
- `POST /api/admin/courses` - Create course
- `GET /api/admin/courses` - List all courses
- `GET /api/admin/courses/:id` - Get course details
- `PUT /api/admin/courses/:id` - Update course
- `DELETE /api/admin/courses/:id` - Delete course
- `POST /api/admin/courses/:id/lessons` - Add lesson
- `PUT /api/admin/courses/:id/lessons/:lessonId` - Update lesson
- `DELETE /api/admin/courses/:id/lessons/:lessonId` - Delete lesson
- `POST /api/admin/courses/:id/publish` - Publish course
- `POST /api/admin/courses/:id/unpublish` - Unpublish course
- `GET /api/admin/courses/:id/enrollments` - View enrollments

**Articles:**
- `POST /api/admin/articles` - Create article
- `GET /api/admin/articles` - List all articles
- `GET /api/admin/articles/:id` - Get article details
- `PUT /api/admin/articles/:id` - Update article
- `DELETE /api/admin/articles/:id` - Delete article
- `POST /api/admin/articles/:id/publish` - Publish article
- `POST /api/admin/articles/:id/unpublish` - Unpublish article

### User Routes

**Courses:**
- `GET /api/courses` - List published courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses/:id/enroll` - Enroll in course
- `GET /api/courses/:id/enrollment` - Check enrollment status
- `GET /api/courses/:id/progress` - Get progress
- `POST /api/courses/:id/lessons/:lessonId/complete` - Mark lesson complete
- `POST /api/courses/:id/complete` - Complete course
- `GET /api/courses/user/enrollments` - List user's courses
- `GET /api/courses/user/stats` - Get statistics

**Articles:**
- `GET /api/articles` - List published articles
- `GET /api/articles/:id` - Get article
- `POST /api/articles/:id/read` - Mark article read
- `POST /api/articles/:id/quiz` - Submit quiz answer
- `POST /api/articles/:id/bookmark` - Bookmark article
- `POST /api/articles/:id/like` - Like article
- `GET /api/articles/:id/progress` - Get article progress
- `GET /api/articles/user/progress` - Get user's article progress

### Creator Routes

**Creator Courses:**
- `POST /api/creator/courses` - Create course
- `GET /api/creator/courses` - List user's courses
- `GET /api/creator/courses/:id` - Get course details
- `PUT /api/creator/courses/:id` - Update course
- `DELETE /api/creator/courses/:id` - Delete course
- `POST /api/creator/courses/:id/lessons` - Add lesson
- `PUT /api/creator/courses/:id/lessons/:lessonId` - Update lesson
- `DELETE /api/creator/courses/:id/lessons/:lessonId` - Delete lesson
- `POST /api/creator/courses/:id/publish` - Publish course
- `GET /api/creator/courses/:id/stats` - Get course statistics

## Step 5: Frontend Components

All frontend components are already implemented:

### Pages
- **CryptoLearn.tsx** (`/app/learn`) - Main learning hub
  - Browse all published courses and articles
  - Filter by level, category
  - View enrollment status
  - Track learning progress

- **CourseDetail.tsx** (`/app/course/:courseId`) - Course detail page
  - View course info, lessons, objectives
  - Enroll in course
  - Track and complete lessons
  - Earn rewards

- **ArticleViewer.tsx** - Read articles
  - View article content
  - Take quizzes
  - Bookmark/like articles
  - Earn reading rewards

### Components
- **CreateCourseWizard.tsx** - Multi-step course creation
- **AdminCoursesManager.tsx** - Admin course management
- **AdminArticlesManager.tsx** - Admin article management
- **LearningProgressDashboard.tsx** - Progress tracking

## Step 6: Services

Three main backend services handle database operations:

### courseDbService.ts
Methods for course CRUD operations, lessons, enrollments

### articleDbService.ts
Methods for article CRUD, reading tracking, quizzes

### enrollmentService.ts
Enrollment management, progress tracking, reward distribution

## Step 7: Test the Implementation

### 1. Verify Database Setup

```bash
# Check tables exist
curl http://localhost:5000/api/health

# Verify with Supabase dashboard
SELECT COUNT(*) FROM courses;
SELECT COUNT(*) FROM educational_articles;
```

### 2. Test Admin Operations

```bash
# Create course (must be authenticated as admin)
curl -X POST http://localhost:5000/api/admin/courses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Course",
    "description": "A test course",
    "level": "Beginner",
    "category": "Trading"
  }'
```

### 3. Test User Operations

```bash
# Get published courses
curl http://localhost:5000/api/courses

# Enroll in course
curl -X POST http://localhost:5000/api/courses/{courseId}/enroll \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Test Creator Routes

```bash
# Create a creator course
curl -X POST http://localhost:5000/api/creator/courses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Course",
    "description": "My first course",
    "level": "Intermediate"
  }'
```

## Step 8: Reward Integration

The system integrates with ActivityRewardService to award points for:

### Course Rewards
- **Enrollment** - Automatic upon course enrollment
- **Lesson Completion** - For each completed lesson
- **Course Completion** - Bonus upon full completion
- **Certificate** - Additional bonus for earning certificate

### Article Rewards
- **Reading** - For reading articles to end
- **Quiz Completion** - For completing article quizzes
- **Perfect Score** - Bonus for 100% quiz score

Reward amounts are configurable per course/article in admin panel.

## Troubleshooting

### RLS Policy Errors

If you see "new row violates row-level security policy":

1. Check user is authenticated
2. Verify user has appropriate role
3. Check policy conditions in Supabase

### Database Connection Issues

```bash
# Verify environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Check Supabase project is active
# Verify database is not paused
```

### Admin Access Denied

```sql
-- Check admin role exists
SELECT * FROM user_roles WHERE user_id = 'YOUR_USER_ID';

-- Grant admin role manually
INSERT INTO user_roles (user_id, role) VALUES ('YOUR_USER_ID', 'admin');
```

## Security Best Practices

1. **Always use RLS** - Enable on all user data tables
2. **Validate inputs** - Server-side validation on all endpoints
3. **Check auth** - All protected routes verify authentication
4. **Audit changes** - Log all admin actions
5. **Review policies** - Regularly audit RLS policies

## Performance Optimization

1. **Indexes created** - On all common filter/join columns
2. **Pagination** - Implement in list endpoints
3. **Caching** - Use React Query for client-side caching
4. **Lazy loading** - Load lessons and articles on demand

## Future Enhancements

- [ ] Course search with full-text search
- [ ] User certificate generation (PDF)
- [ ] Course reviews and ratings
- [ ] Peer-to-peer help in forums
- [ ] Video upload integration
- [ ] Interactive code sandbox for courses
- [ ] Course analytics dashboard
- [ ] Email notifications for progress
- [ ] Course recommendations
- [ ] Leaderboards

## Support

For issues or questions:
1. Check Supabase dashboard logs
2. Review application error logs
3. Check RLS policies with test user
4. Verify API routes are registered in server

## Environment Checklist

```
□ VITE_SUPABASE_URL=your_url
□ VITE_SUPABASE_ANON_KEY=your_key
□ SUPABASE_SERVICE_ROLE_KEY=your_key
□ Database tables created
□ RLS policies applied
□ Admin roles assigned
□ Server restarted
□ Routes tested
```

---

**Last Updated:** December 2024
**Implementation Status:** Complete
**Ready for Production:** Yes (after testing)
