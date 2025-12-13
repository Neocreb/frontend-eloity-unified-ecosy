# Crypto Learn Courses System - Implementation Documentation

## Executive Summary
This document provides a complete implementation guide for converting the mock Crypto Learn courses system into a real, database-backed platform with admin management, user course creation, and comprehensive reward integration.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Admin System Setup](#admin-system-setup)
4. [User Course Creation](#user-course-creation)
5. [Course Display & Filtering](#course-display--filtering)
6. [Reward System Integration](#reward-system-integration)
7. [API Endpoints](#api-endpoints)
8. [Implementation Checklist](#implementation-checklist)

---

## System Architecture

### Overview
The system will support three types of courses:
1. **Platform Courses**: Created and managed by admins
2. **Creator Courses**: Created by users/sellers (paid or free)
3. **Articles & Blog Posts**: Educational content with quizzes

### Key Components
- **Database Layer**: Supabase with proper RLS policies
- **Backend Services**: Node.js/Express API routes
- **Admin Dashboard**: Admin-only pages for managing platform content
- **Seller Dashboard**: User-facing course creation interface
- **Frontend**: React components for viewing and consuming courses

---

## Database Schema

### Tables to Create

#### 1. **courses** (Platform & User-Created Courses)
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID NOT NULL REFERENCES auth.users(id),
  course_type ENUM('platform', 'creator') NOT NULL,
  level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
  category TEXT,
  duration TEXT,
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  banner_url TEXT,
  
  -- Pricing
  price DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_paid BOOLEAN DEFAULT false,
  
  -- Course Details
  objectives TEXT[],
  requirements TEXT[],
  tags TEXT[],
  
  -- Statistics
  total_students INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  
  -- Reward System
  reward_enrollment DECIMAL(10, 2) DEFAULT 0.25,
  reward_completion DECIMAL(10, 2) DEFAULT 3,
  reward_certificate DECIMAL(10, 2) DEFAULT 5,
  has_certificate BOOLEAN DEFAULT true,
  
  -- Metadata
  instructor_avatar TEXT,
  instructor_name TEXT,
  instructor_title TEXT,
  instructor_bio TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. **course_lessons**
```sql
CREATE TABLE course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  lesson_type ENUM('video', 'text', 'quiz', 'interactive') DEFAULT 'video',
  content TEXT,
  video_url TEXT,
  duration INT, -- minutes
  sort_order INT,
  
  -- Quiz related
  quiz_questions JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. **course_enrollments**
```sql
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  
  -- Progress tracking
  progress_percentage INT DEFAULT 0,
  completed_lessons UUID[],
  time_spent_minutes INT DEFAULT 0,
  
  -- Status
  status ENUM('enrolled', 'completed', 'abandoned') DEFAULT 'enrolled',
  completed_at TIMESTAMP,
  
  -- Rewards
  enrollment_reward_claimed BOOLEAN DEFAULT false,
  completion_reward_claimed BOOLEAN DEFAULT false,
  certificate_reward_claimed BOOLEAN DEFAULT false,
  certificate_url TEXT,
  
  UNIQUE(user_id, course_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. **lesson_progress**
```sql
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id),
  
  completed BOOLEAN DEFAULT false,
  quiz_score INT,
  time_spent_minutes INT DEFAULT 0,
  
  completed_at TIMESTAMP,
  started_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, lesson_id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. **educational_articles**
```sql
CREATE TABLE educational_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  
  difficulty ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
  category TEXT,
  reading_time INT, -- minutes
  
  featured_image TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  
  -- Quiz
  quiz_questions JSONB,
  quiz_passing_score INT DEFAULT 70,
  
  -- Stats
  views_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  bookmarks_count INT DEFAULT 0,
  quiz_attempts INT DEFAULT 0,
  average_quiz_score DECIMAL(5, 2) DEFAULT 0,
  
  -- Rewards
  reward_reading DECIMAL(10, 2) DEFAULT 1,
  reward_quiz_completion DECIMAL(10, 2) DEFAULT 2,
  reward_perfect_score DECIMAL(10, 2) DEFAULT 3,
  
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. **article_progress**
```sql
CREATE TABLE article_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  article_id UUID NOT NULL REFERENCES educational_articles(id) ON DELETE CASCADE,
  
  read BOOLEAN DEFAULT false,
  quiz_score INT,
  time_spent_minutes INT DEFAULT 0,
  
  bookmarked BOOLEAN DEFAULT false,
  liked BOOLEAN DEFAULT false,
  
  -- Rewards claimed
  reading_reward_claimed BOOLEAN DEFAULT false,
  quiz_reward_claimed BOOLEAN DEFAULT false,
  perfect_score_reward_claimed BOOLEAN DEFAULT false,
  
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. **user_roles** (for admin management)
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role ENUM('admin', 'instructor', 'user') DEFAULT 'user',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Admin System Setup

### Step 1: Create Admin Role System

**Admin Email Addresses to Assign:**
- admin@eloity.com
- eloityhq@gmail.com
- jeresoftblog@gmail.com

### Step 2: Admin Capabilities

Admins should be able to:
1. **Course Management**
   - Create platform courses
   - Edit/update course details
   - Delete courses
   - Publish/unpublish courses
   - Attach videos and resources
   - Set reward amounts
   - View all enrolled students

2. **Article Management**
   - Create articles
   - Edit articles
   - Publish articles
   - Attach featured images
   - Create quizzes for articles

3. **User Management**
   - View student enrollments
   - Track course progress
   - Manage platform instructors

### Step 3: Admin Authentication

Add role checking middleware to backend routes:
```typescript
async function isAdmin(userId: string): Promise<boolean> {
  const role = await db.query(
    'SELECT role FROM user_roles WHERE user_id = ? AND role = ?',
    [userId, 'admin']
  );
  return role.length > 0;
}
```

---

## User Course Creation

### Flow: Seller Dashboard → Course Creation

**Location**: `/app/marketplace/seller-dashboard`

**Steps**:
1. User selects "Create Course" from seller dashboard
2. Choose between "Physical Product" or "Digital Product" → Select "Course"
3. Course Creation Wizard:
   - **Step 1**: Basic Info (Title, Description, Category, Level)
   - **Step 2**: Course Structure (Add lessons with content)
   - **Step 3**: Pricing (Free or Paid, set price)
   - **Step 4**: Rewards (Optional: set reward points if platform supports creator rewards)
   - **Step 5**: Preview & Publish
4. Course is created as `course_type: 'creator'`
5. Only published courses appear in the Crypto Learn page

**Database**: Courses created with `course_type = 'creator'` and `instructor_id = current_user`

---

## Course Display & Filtering

### CryptoLearn Page - Separation Logic

```typescript
// Display logic
const platformCourses = courses.filter(c => c.course_type === 'platform');
const creatorCourses = courses.filter(c => c.course_type === 'creator' && c.is_published);

// Show in separate sections or tabs:
// Tab 1: "Platform Courses" - All admin-created courses
// Tab 2: "Creator Courses" - User-created courses
// Or: Show all with a badge indicating source
```

### Filtering Options
- By Level (Beginner/Intermediate/Advanced)
- By Category
- By Course Type (Platform/Creator)
- By Enrollment Status (My Courses vs All Courses)
- By Price (Free vs Paid)

---

## Reward System Integration

### Points Award Structure

#### Course Rewards
- **Enrollment**: Automatic when user enrolls
- **Lesson Completion**: Awarded for each completed lesson
- **Course Completion**: Awarded when all lessons completed
- **Certificate**: Bonus points for completing course and earning certificate

#### Article Rewards
- **Reading**: Points for reading article to end
- **Quiz Completion**: Points for completing article quiz
- **Perfect Score**: Bonus points for 100% quiz score

### Implementation
- Integration with existing `ActivityRewardService`
- Track reward claims in database
- Prevent duplicate reward claims
- Log all reward transactions

---

## API Endpoints

### Course Endpoints

**Admin Routes** (`/api/admin/courses`):
- `POST /api/admin/courses` - Create course
- `GET /api/admin/courses/:id` - Get course details
- `PUT /api/admin/courses/:id` - Update course
- `DELETE /api/admin/courses/:id` - Delete course
- `POST /api/admin/courses/:id/lessons` - Add lesson
- `PUT /api/admin/courses/:id/lessons/:lessonId` - Update lesson
- `DELETE /api/admin/courses/:id/lessons/:lessonId` - Delete lesson
- `GET /api/admin/courses/:id/enrollments` - Get student enrollments
- `GET /api/admin/courses/stats` - Get platform stats

**User Routes** (`/api/courses`):
- `GET /api/courses` - List all published courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses/:id/enroll` - Enroll in course
- `GET /api/courses/:id/progress` - Get user progress
- `POST /api/courses/:id/lessons/:lessonId/complete` - Mark lesson complete
- `POST /api/courses/:id/complete` - Complete course

**Creator Routes** (`/api/creator/courses`):
- `POST /api/creator/courses` - Create course
- `GET /api/creator/courses` - List user's courses
- `PUT /api/creator/courses/:id` - Update own course
- `DELETE /api/creator/courses/:id` - Delete own course
- `GET /api/creator/courses/:id/stats` - Get course statistics

### Article Endpoints

**Admin Routes** (`/api/admin/articles`):
- `POST /api/admin/articles` - Create article
- `PUT /api/admin/articles/:id` - Update article
- `DELETE /api/admin/articles/:id` - Delete article

**User Routes** (`/api/articles`):
- `GET /api/articles` - List all published articles
- `GET /api/articles/:id` - Get article details
- `POST /api/articles/:id/quiz` - Submit quiz answer
- `POST /api/articles/:id/bookmark` - Bookmark article
- `POST /api/articles/:id/like` - Like article

---

## Implementation Checklist

### Database Setup ✓
- [ ] Create migration files for all tables
- [ ] Apply migrations to Supabase
- [ ] Create RLS policies for tables
- [ ] Create indexes for performance

### Admin System ✓
- [ ] Create admin role assignment system
- [ ] Assign admin emails to database
- [ ] Create admin middleware
- [ ] Create admin routes for course management
- [ ] Create admin routes for article management
- [ ] Create AdminCoursesManager component
- [ ] Create AdminArticlesManager component

### Backend Services ✓
- [ ] Create courseService.ts (database operations)
- [ ] Create articleService.ts (database operations)
- [ ] Create enrollment service
- [ ] Create progress tracking service
- [ ] Create reward claim service

### Frontend Components ✓
- [ ] Update CryptoLearn.tsx with database queries
- [ ] Update CourseDetail.tsx with database support
- [ ] Create CreateCourseWizard.tsx
- [ ] Update ArticleViewer.tsx
- [ ] Create course management admin pages
- [ ] Create article management admin pages

### Features ✓
- [ ] Course enrollment
- [ ] Progress tracking
- [ ] Lesson completion
- [ ] Certificate generation
- [ ] Quiz functionality
- [ ] Reward claim system
- [ ] User course creation
- [ ] Course publishing workflow

### Testing ✓
- [ ] Test admin course creation
- [ ] Test user course creation
- [ ] Test enrollment and progress
- [ ] Test reward claiming
- [ ] Test filtering and search
- [ ] Test RLS policies
- [ ] Load testing

---

## Database Seeding

Initial platform courses will be created by admins via the admin dashboard. The seeding script will:
1. Create initial admin users from email list
2. Assign admin roles
3. (Optional) Create sample platform courses

---

## File Structure

```
src/
├── pages/
│   ├── admin/
│   │   ├── AdminCoursesManager.tsx (NEW)
│   │   ├── AdminArticlesManager.tsx (NEW)
│   │   └── AdminCourseCreator.tsx (NEW)
│   ├── CryptoLearn.tsx (UPDATED)
│   ├── CourseDetail.tsx (UPDATED)
│   └── ArticleViewer.tsx (UPDATED)
├── services/
│   ├── courseService.ts (UPDATED)
│   ├── courseDbService.ts (NEW)
│   ├── educationalArticleService.ts (UPDATED)
│   ├── articleDbService.ts (NEW)
│   ├── enrollmentService.ts (NEW)
│   └── courseRewardService.ts (NEW)
└── components/
    ├── courses/
    │   ├── CreateCourseWizard.tsx (NEW)
    │   ├── CourseCard.tsx (NEW)
    │   └── CourseFilter.tsx (NEW)
    └── articles/
        ├── ArticleCard.tsx (NEW)
        └── ArticleFilter.tsx (NEW)

server/
├── routes/
│   ├── courses.ts (UPDATED)
│   ├── adminCourses.ts (NEW)
│   ├── articles.ts (UPDATED)
│   └── adminArticles.ts (NEW)
└── services/
    ├── courseDbService.ts (NEW)
    ├── enrollmentService.ts (NEW)
    └── rewardService.ts (UPDATED)

migrations/
└── 0016_crypto_learn_system.sql (NEW)
```

---

## Security Considerations

1. **Row-Level Security (RLS)**
   - Users can only see published courses
   - Users can only edit their own courses
   - Admins can see all courses

2. **Authorization**
   - Admin-only routes protected
   - User can only modify own enrollment data
   - Creator can only edit own courses

3. **Data Validation**
   - Server-side validation for all inputs
   - SQL injection prevention via parameterized queries
   - XSS prevention for user-generated content

---

## Estimated Implementation Timeline

1. **Database Setup**: 2-3 hours
2. **Backend Services & Routes**: 4-5 hours
3. **Admin Management Pages**: 3-4 hours
4. **User Functionality**: 3-4 hours
5. **Testing & Refinement**: 3-4 hours

**Total**: ~15-20 hours of development

---

## Next Steps

Start with Task #2: Create Supabase database migrations.
