# Crypto Learn System - Complete Implementation Guide

## Overview
This guide walks you through setting up the entire Crypto Learn course and article management system, from database migration to testing all functionality.

## Table of Contents
1. [Database Setup](#database-setup)
2. [Backend API Setup](#backend-api-setup)
3. [Admin Role Setup](#admin-role-setup)
4. [Frontend Integration](#frontend-integration)
5. [Testing Checklist](#testing-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Database Setup

### Step 1: Apply Migrations

1. **Open your Supabase console** at https://app.supabase.com
2. **Navigate to SQL Editor**
3. **Copy the entire content** of `migrations/0016_crypto_learn_system.sql`
4. **Paste and execute** the migration
5. **Verify success** - You should see all tables created without errors

**Tables created:**
- `user_roles` - For admin/instructor role management
- `courses` - Main course table for platform and creator courses
- `course_lessons` - Individual lessons within courses
- `course_enrollments` - Track user enrollments
- `lesson_progress` - Track lesson completion
- `educational_articles` - Educational articles with quizzes
- `article_progress` - Track article reading and quiz attempts
- `course_reward_claims` - Track course reward claims
- `article_reward_claims` - Track article reward claims

### Step 2: Enable RLS (Row Level Security)

All tables have RLS enabled with appropriate policies:
- Users can only see published courses
- Users can only edit their own data
- Admins can see and manage all courses
- Authors can only edit their own articles

This is automatically configured by the migration.

---

## Backend API Setup

### Step 1: Update Backend Routes

The following files have been created:

**File: `server/routes/courses.ts`**
- Public course endpoints
- User enrollment management
- Progress tracking
- Reward claiming

**File: `server/routes/adminCourses.ts`**
- Admin course creation and management
- Course publishing
- Student enrollment viewing
- Lesson management

**File: `server/routes/articles.ts`**
- Public article endpoints
- Quiz submission
- Bookmarking and liking
- Progress tracking

**File: `server/routes/adminArticles.ts`**
- Admin article management
- Publishing articles
- Statistics tracking

### Step 2: Register Routes in Enhanced-Index

Update `server/enhanced-index.ts` to include the new routes:

```typescript
// Add these imports at the top
import coursesRouter from './routes/courses';
import adminCoursesRouter from './routes/adminCourses';
import articlesRouter from './routes/articles';
import adminArticlesRouter from './routes/adminArticles';

// Add these route registrations (after other routes)
app.use('/api/courses', coursesRouter);
app.use('/api/admin/courses', adminCoursesRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/admin/articles', adminArticlesRouter);
```

### Step 3: Backend Services

The following services have been created:

**File: `server/services/courseDbService.ts`**
- Database operations for courses
- Lesson management
- Enrollment handling
- Reward claims

**File: `server/services/articleDbService.ts`**
- Article CRUD operations
- Quiz and progress tracking
- Bookmark and like functionality

---

## Admin Role Setup

### Step 1: Create Admin Users

1. **Sign up with admin email addresses:**
   - admin@eloity.com
   - eloityhq@gmail.com
   - jeresoftblog@gmail.com

2. **Run the setup script:**
   ```bash
   npm run setup:admin-roles
   ```

   This script will:
   - Find users with admin emails
   - Assign them the 'admin' role in the user_roles table

### Step 2: Verify Admin Access

1. Sign in with an admin email
2. Navigate to `/app/admin` (ensure admin route is set up)
3. You should see admin pages for courses and articles management

---

## Frontend Integration

### Step 1: Updated Components

The following pages have been created/updated to use the database:

**File: `src/pages/CryptoLearn.tsx`**
- Loads all published courses from database
- Separates platform and creator courses
- Filtering by level and category
- Search functionality

**File: `src/pages/CourseDetail.tsx`**
- Displays course from database
- Shows lessons
- Enrollment and progress tracking
- Reward display

**File: `src/pages/ArticleViewer.tsx`**
- Loads articles from database
- Quiz functionality
- Reading rewards
- Bookmarking and liking

### Step 2: Admin Pages

Create/navigate to admin management pages:

**File: `src/pages/admin/AdminCoursesManager.tsx`**
- Admin course creation interface
- Course publishing
- Student enrollment viewing
- Course deletion

**File: `src/pages/admin/AdminArticlesManager.tsx`**
- Create and edit articles
- Publish articles
- View article statistics

### Step 3: Course Creation Wizard

Users can create their own courses via:

**File: `src/components/courses/CreateCourseWizard.tsx`**
- 5-step course creation process
- Basic info, details, pricing, objectives, review
- Automatic integration with seller dashboard

### Step 4: Reward Service

**File: `src/services/courseRewardService.ts`**
- Course reward claim handling
- Article reward claim handling
- Integration with user balance

---

## Testing Checklist

### Admin Functionality

- [ ] Admin can access course management page
- [ ] Admin can create platform courses
- [ ] Admin can edit existing courses
- [ ] Admin can delete courses
- [ ] Admin can publish/unpublish courses
- [ ] Admin can view course enrollments
- [ ] Admin can create articles
- [ ] Admin can edit articles
- [ ] Admin can publish/unpublish articles

### User Course Functionality

- [ ] User can view all published courses
- [ ] User can filter courses by level
- [ ] User can filter courses by category
- [ ] User can search for courses
- [ ] User can enroll in a course
- [ ] User can view course lessons
- [ ] User can start a lesson (if enrolled)
- [ ] User can mark lesson as complete
- [ ] User receives enrollment reward
- [ ] User receives completion reward
- [ ] User can download certificate (if completed and certificate enabled)

### Creator Course Functionality

- [ ] User can create new course via wizard
- [ ] Course is created as "creator" type
- [ ] Course appears as draft (not published)
- [ ] Creator can edit their own courses
- [ ] Creator can add lessons to their course
- [ ] Creator can set course price
- [ ] Creator can set reward amounts
- [ ] Creator can publish course
- [ ] Creator course appears in "Community Courses" section

### Article Functionality

- [ ] User can view all published articles
- [ ] User can read article
- [ ] Reading reward is claimed
- [ ] User can take article quiz
- [ ] User receives quiz reward
- [ ] User receives perfect score bonus if 100%
- [ ] User can bookmark articles
- [ ] User can like articles
- [ ] User can view bookmarked articles

### Reward System

- [ ] Course enrollment reward is claimed
- [ ] Course completion reward is claimed
- [ ] Certificate reward is claimed
- [ ] Article reading reward is claimed
- [ ] Article quiz reward is claimed
- [ ] Perfect score reward is claimed
- [ ] Rewards are not claimed twice
- [ ] User balance is updated with rewards

### Platform vs Creator Courses

- [ ] Platform courses show in separate section
- [ ] Creator courses show in separate section
- [ ] Both sections display correctly
- [ ] Courses can be filtered across both types
- [ ] Search works for both types

---

## Implementation Steps Summary

### Phase 1: Database & Backend (Already Complete)
1. ✅ Create database migrations
2. ✅ Create backend services
3. ✅ Create backend API routes
4. ✅ Create admin role system

### Phase 2: Frontend (Already Complete)
1. ✅ Update CryptoLearn page
2. ✅ Update CourseDetail page
3. ✅ Update ArticleViewer page
4. ✅ Create admin pages
5. ✅ Create course creation wizard
6. ✅ Create reward service

### Phase 3: Integration & Testing
1. Ensure all routes are registered in enhanced-index.ts
2. Test database connections
3. Test admin role assignment
4. Test all user flows
5. Test reward claiming
6. Test filtering and search
7. Verify RLS policies

### Phase 4: Admin User Setup
1. Create admin users with designated emails
2. Assign admin roles
3. Create initial platform courses
4. Create sample articles

---

## Configuration

### Admin Emails

The following emails are designated as administrators:
- `admin@eloity.com`
- `eloityhq@gmail.com`
- `jeresoftblog@gmail.com`

### Reward Defaults

Default reward amounts (can be customized per course/article):

**Courses:**
- Enrollment: 0.25 points
- Completion: 3 points
- Certificate: 5 points

**Articles:**
- Reading: 1 point
- Quiz Completion: 2 points
- Perfect Score: 3 points

---

## API Endpoints Reference

### Courses (Public)
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `GET /api/courses/:id/lessons` - Get course lessons
- `POST /api/courses/:id/enroll` - Enroll in course
- `GET /api/courses/:id/progress` - Get enrollment progress
- `POST /api/courses/:id/lessons/:lessonId/complete` - Mark lesson complete
- `POST /api/courses/:id/complete` - Complete course
- `GET /api/courses/user/my-courses` - Get user's enrolled courses

### Courses (Admin)
- `POST /api/admin/courses` - Create course
- `GET /api/admin/courses` - List all courses (admin view)
- `GET /api/admin/courses/:id` - Get course details
- `PUT /api/admin/courses/:id` - Update course
- `DELETE /api/admin/courses/:id` - Delete course
- `POST /api/admin/courses/:id/lessons` - Add lesson
- `PUT /api/admin/courses/:id/lessons/:lessonId` - Update lesson
- `DELETE /api/admin/courses/:id/lessons/:lessonId` - Delete lesson
- `GET /api/admin/courses/:id/enrollments` - Get course enrollments
- `POST /api/admin/courses/:id/publish` - Publish course
- `POST /api/admin/courses/:id/unpublish` - Unpublish course

### Articles (Public)
- `GET /api/articles` - List all articles
- `GET /api/articles/:id` - Get article details
- `POST /api/articles/:id/read` - Mark article as read
- `POST /api/articles/:id/quiz` - Submit quiz
- `POST /api/articles/:id/bookmark` - Bookmark article
- `POST /api/articles/:id/like` - Like article
- `GET /api/articles/:id/progress` - Get article progress
- `GET /api/articles/user/bookmarked` - Get bookmarked articles

### Articles (Admin)
- `POST /api/admin/articles` - Create article
- `GET /api/admin/articles` - List all articles
- `GET /api/admin/articles/:id` - Get article details
- `PUT /api/admin/articles/:id` - Update article
- `DELETE /api/admin/articles/:id` - Delete article
- `POST /api/admin/articles/:id/publish` - Publish article
- `GET /api/admin/articles/:id/stats` - Get article statistics

---

## Troubleshooting

### Issue: Routes not found (404)

**Solution:**
1. Check that routes are registered in `enhanced-index.ts`
2. Ensure middleware is properly configured
3. Verify routes are imported

### Issue: Database connection errors

**Solution:**
1. Check Supabase URL and keys in `.env`
2. Verify migrations were applied successfully
3. Check RLS policies are enabled

### Issue: Admin access denied

**Solution:**
1. Verify user email is in admin list
2. Run setup script: `npm run setup:admin-roles`
3. Check user_roles table for role assignment
4. Clear browser cache and re-login

### Issue: Rewards not being claimed

**Solution:**
1. Check user_rewards table exists
2. Verify reward amounts are set on courses/articles
3. Check course/article_reward_claims tables for duplicates
4. Verify RLS policies allow user to insert records

### Issue: Articles not showing

**Solution:**
1. Verify articles are published (is_published = true)
2. Check featured_image URL is accessible
3. Verify quiz_questions JSON format is correct
4. Check article_progress table for user progress

---

## Next Steps

1. **Apply the database migration** - Start here!
2. **Register backend routes** - Update enhanced-index.ts
3. **Create admin users** - Run setup script
4. **Test all functionality** - Follow testing checklist
5. **Create sample courses** - Add platform courses via admin
6. **Monitor and optimize** - Track usage and performance

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the comprehensive implementation documentation
3. Check database schema in Supabase console
4. Review server logs for errors

