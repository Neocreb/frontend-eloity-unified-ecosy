-- ============================================================
-- Crypto Learn System - Database Schema Migration
-- Description: Complete database schema for courses, articles,
--              enrollments, and progress tracking
-- ============================================================

-- Create course type enum
CREATE TYPE course_type_enum AS ENUM ('platform', 'creator');
CREATE TYPE course_level_enum AS ENUM ('Beginner', 'Intermediate', 'Advanced');
CREATE TYPE lesson_type_enum AS ENUM ('video', 'text', 'quiz', 'interactive');
CREATE TYPE enrollment_status_enum AS ENUM ('enrolled', 'completed', 'abandoned');
CREATE TYPE user_role_enum AS ENUM ('admin', 'instructor', 'user');
CREATE TYPE difficulty_enum AS ENUM ('Beginner', 'Intermediate', 'Advanced');

-- ============================================================
-- 1. USER ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_enum DEFAULT 'user',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- ============================================================
-- 2. COURSES TABLE (Platform & Creator Courses)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_type course_type_enum NOT NULL DEFAULT 'creator',
  level course_level_enum DEFAULT 'Beginner',
  category TEXT,
  duration TEXT,
  
  -- Publication & Status
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Media
  thumbnail_url TEXT,
  banner_url TEXT,
  
  -- Pricing
  price NUMERIC(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_paid BOOLEAN DEFAULT false,
  
  -- Course Details
  objectives TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Statistics
  total_students INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  
  -- Reward System
  reward_enrollment NUMERIC(10, 2) DEFAULT 0.25,
  reward_completion NUMERIC(10, 2) DEFAULT 3,
  reward_certificate NUMERIC(10, 2) DEFAULT 5,
  has_certificate BOOLEAN DEFAULT true,
  
  -- Instructor Metadata
  instructor_avatar TEXT,
  instructor_name TEXT,
  instructor_title TEXT,
  instructor_bio TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_courses_instructor_id ON public.courses(instructor_id);
CREATE INDEX idx_courses_course_type ON public.courses(course_type);
CREATE INDEX idx_courses_is_published ON public.courses(is_published);
CREATE INDEX idx_courses_is_active ON public.courses(is_active);
CREATE INDEX idx_courses_category ON public.courses(category);

-- ============================================================
-- 3. COURSE LESSONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  lesson_type lesson_type_enum DEFAULT 'video',
  content TEXT,
  video_url TEXT,
  duration INTEGER, -- minutes
  sort_order INTEGER DEFAULT 0,
  
  -- Quiz related
  quiz_questions JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX idx_course_lessons_sort_order ON public.course_lessons(sort_order);

-- ============================================================
-- 4. COURSE ENROLLMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Progress tracking
  progress_percentage INTEGER DEFAULT 0,
  completed_lessons UUID[] DEFAULT '{}',
  time_spent_minutes INTEGER DEFAULT 0,
  
  -- Status
  status enrollment_status_enum DEFAULT 'enrolled',
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Rewards
  enrollment_reward_claimed BOOLEAN DEFAULT false,
  completion_reward_claimed BOOLEAN DEFAULT false,
  certificate_reward_claimed BOOLEAN DEFAULT false,
  certificate_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_course_enrollments_user_id ON public.course_enrollments(user_id);
CREATE INDEX idx_course_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_status ON public.course_enrollments(status);

-- ============================================================
-- 5. LESSON PROGRESS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  
  completed BOOLEAN DEFAULT false,
  quiz_score INTEGER,
  time_spent_minutes INTEGER DEFAULT 0,
  
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_user_id ON public.lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_course_id ON public.lesson_progress(course_id);
CREATE INDEX idx_lesson_progress_completed ON public.lesson_progress(completed);

-- ============================================================
-- 6. EDUCATIONAL ARTICLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.educational_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  difficulty difficulty_enum DEFAULT 'Beginner',
  category TEXT,
  reading_time INTEGER, -- minutes
  
  featured_image TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Quiz
  quiz_questions JSONB,
  quiz_passing_score INTEGER DEFAULT 70,
  
  -- Stats
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  bookmarks_count INTEGER DEFAULT 0,
  quiz_attempts INTEGER DEFAULT 0,
  average_quiz_score NUMERIC(5, 2) DEFAULT 0,
  
  -- Rewards
  reward_reading NUMERIC(10, 2) DEFAULT 1,
  reward_quiz_completion NUMERIC(10, 2) DEFAULT 2,
  reward_perfect_score NUMERIC(10, 2) DEFAULT 3,
  
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_educational_articles_author_id ON public.educational_articles(author_id);
CREATE INDEX idx_educational_articles_is_published ON public.educational_articles(is_published);
CREATE INDEX idx_educational_articles_category ON public.educational_articles(category);

-- ============================================================
-- 7. ARTICLE PROGRESS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.article_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.educational_articles(id) ON DELETE CASCADE,
  
  read BOOLEAN DEFAULT false,
  quiz_score INTEGER,
  time_spent_minutes INTEGER DEFAULT 0,
  
  bookmarked BOOLEAN DEFAULT false,
  liked BOOLEAN DEFAULT false,
  
  -- Rewards claimed
  reading_reward_claimed BOOLEAN DEFAULT false,
  quiz_reward_claimed BOOLEAN DEFAULT false,
  perfect_score_reward_claimed BOOLEAN DEFAULT false,
  
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, article_id)
);

CREATE INDEX idx_article_progress_user_id ON public.article_progress(user_id);
CREATE INDEX idx_article_progress_article_id ON public.article_progress(article_id);
CREATE INDEX idx_article_progress_read ON public.article_progress(read);

-- ============================================================
-- 8. COURSE REWARDS TRACKING
-- ============================================================
CREATE TABLE IF NOT EXISTS public.course_reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL, -- 'enrollment', 'completion', 'certificate'
  amount NUMERIC(10, 2) NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, course_id, reward_type)
);

CREATE INDEX idx_course_reward_claims_user_id ON public.course_reward_claims(user_id);
CREATE INDEX idx_course_reward_claims_course_id ON public.course_reward_claims(course_id);

-- ============================================================
-- 9. ARTICLE REWARDS TRACKING
-- ============================================================
CREATE TABLE IF NOT EXISTS public.article_reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.educational_articles(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL, -- 'reading', 'quiz_completion', 'perfect_score'
  amount NUMERIC(10, 2) NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, article_id, reward_type)
);

CREATE INDEX idx_article_reward_claims_user_id ON public.article_reward_claims(user_id);
CREATE INDEX idx_article_reward_claims_article_id ON public.article_reward_claims(article_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_reward_claims ENABLE ROW LEVEL SECURITY;

-- USER_ROLES RLS
CREATE POLICY "users_view_user_roles" ON public.user_roles
  FOR SELECT USING (
    auth.uid() = user_id OR
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
  );

CREATE POLICY "admins_manage_user_roles" ON public.user_roles
  FOR ALL USING (
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
  );

-- COURSES RLS
CREATE POLICY "users_view_published_courses" ON public.courses
  FOR SELECT USING (
    is_published = true OR
    instructor_id = auth.uid() OR
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
  );

CREATE POLICY "instructors_manage_own_courses" ON public.courses
  FOR ALL USING (
    instructor_id = auth.uid() OR
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
  );

-- COURSE_LESSONS RLS
CREATE POLICY "users_view_lesson_content" ON public.course_lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_lessons.course_id
      AND (is_published = true OR instructor_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.course_enrollments
      WHERE course_id = course_lessons.course_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "instructors_manage_lessons" ON public.course_lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_lessons.course_id
      AND (instructor_id = auth.uid() OR
           (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin')
    )
  );

-- COURSE_ENROLLMENTS RLS
CREATE POLICY "users_view_own_enrollments" ON public.course_enrollments
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_enrollments.course_id
      AND instructor_id = auth.uid()
    ) OR
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
  );

CREATE POLICY "users_manage_own_enrollments" ON public.course_enrollments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_enrollment_progress" ON public.course_enrollments
  FOR UPDATE USING (user_id = auth.uid());

-- LESSON_PROGRESS RLS
CREATE POLICY "users_manage_own_progress" ON public.lesson_progress
  FOR ALL USING (user_id = auth.uid());

-- EDUCATIONAL_ARTICLES RLS
CREATE POLICY "users_view_published_articles" ON public.educational_articles
  FOR SELECT USING (
    is_published = true OR
    author_id = auth.uid() OR
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
  );

CREATE POLICY "authors_manage_articles" ON public.educational_articles
  FOR ALL USING (
    author_id = auth.uid() OR
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
  );

-- ARTICLE_PROGRESS RLS
CREATE POLICY "users_manage_own_article_progress" ON public.article_progress
  FOR ALL USING (user_id = auth.uid());

-- REWARD CLAIMS RLS
CREATE POLICY "users_view_own_reward_claims" ON public.course_reward_claims
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_claim_course_rewards" ON public.course_reward_claims
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_view_own_article_reward_claims" ON public.article_reward_claims
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_claim_article_rewards" ON public.article_reward_claims
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to update course_enrollments updated_at
CREATE OR REPLACE FUNCTION update_course_enrollments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_enrollments_updated_at_trigger
BEFORE UPDATE ON public.course_enrollments
FOR EACH ROW
EXECUTE FUNCTION update_course_enrollments_updated_at();

-- Function to update lesson_progress updated_at
CREATE OR REPLACE FUNCTION update_lesson_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lesson_progress_updated_at_trigger
BEFORE UPDATE ON public.lesson_progress
FOR EACH ROW
EXECUTE FUNCTION update_lesson_progress_updated_at();

-- Function to update courses updated_at
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER courses_updated_at_trigger
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION update_courses_updated_at();

-- Function to update educational_articles updated_at
CREATE OR REPLACE FUNCTION update_educational_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER educational_articles_updated_at_trigger
BEFORE UPDATE ON public.educational_articles
FOR EACH ROW
EXECUTE FUNCTION update_educational_articles_updated_at();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to calculate course progress
CREATE OR REPLACE FUNCTION calculate_course_progress(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_total_lessons INTEGER;
  v_completed_lessons INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_lessons
  FROM public.course_lessons
  WHERE course_id = p_course_id;
  
  IF v_total_lessons = 0 THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO v_completed_lessons
  FROM public.lesson_progress
  WHERE user_id = p_user_id
  AND course_id = p_course_id
  AND completed = true;
  
  RETURN ROUND((v_completed_lessons::NUMERIC / v_total_lessons::NUMERIC) * 100)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::TEXT INTO v_role
  FROM public.user_roles
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_role, 'user');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- INITIALIZATION DATA
-- ============================================================

-- Insert admin users (these will be assigned roles after their first login)
-- They need to exist in auth.users first, so we'll just create the role records
-- This script assumes the users already exist in auth.users

-- You can run this separately after users sign up:
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id FROM auth.users WHERE email IN ('admin@eloity.com', 'eloityhq@gmail.com', 'jeresoftblog@gmail.com')
-- ON CONFLICT DO NOTHING;
