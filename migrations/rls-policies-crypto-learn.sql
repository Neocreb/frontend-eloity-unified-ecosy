-- =============================================================================
-- Row-Level Security (RLS) Policies for Crypto Learn System
-- =============================================================================

-- Enable RLS on all course and article tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reward_claims ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- COURSES TABLE POLICIES
-- =============================================================================

-- Policy: Published courses are viewable by everyone
CREATE POLICY "Published courses are viewable by everyone" ON courses
  FOR SELECT
  USING (is_published = true AND is_active = true);

-- Policy: Instructors can see their own courses (published or not)
CREATE POLICY "Instructors can view their own courses" ON courses
  FOR SELECT
  USING (instructor_id = auth.uid());

-- Policy: Admins can see all courses
CREATE POLICY "Admins can view all courses" ON courses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Instructors can create courses
CREATE POLICY "Instructors can create courses" ON courses
  FOR INSERT
  WITH CHECK (
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- Policy: Instructors can update their own courses
CREATE POLICY "Instructors can update their own courses" ON courses
  FOR UPDATE
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

-- Policy: Admins can update any course
CREATE POLICY "Admins can update any course" ON courses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Instructors can delete their own courses
CREATE POLICY "Instructors can delete their own courses" ON courses
  FOR DELETE
  USING (instructor_id = auth.uid());

-- Policy: Admins can delete any course
CREATE POLICY "Admins can delete any course" ON courses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- COURSE LESSONS TABLE POLICIES
-- =============================================================================

-- Policy: Lessons from published courses are viewable by everyone
CREATE POLICY "Lessons from published courses are viewable" ON course_lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_lessons.course_id
      AND courses.is_published = true
      AND courses.is_active = true
    )
  );

-- Policy: Instructors can view lessons of their own courses
CREATE POLICY "Instructors can view lessons of their courses" ON course_lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_lessons.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Policy: Instructors can create lessons in their courses
CREATE POLICY "Instructors can create lessons in their courses" ON course_lessons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_lessons.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Policy: Instructors can update lessons in their courses
CREATE POLICY "Instructors can update lessons in their courses" ON course_lessons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_lessons.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Policy: Instructors can delete lessons in their courses
CREATE POLICY "Instructors can delete lessons in their courses" ON course_lessons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_lessons.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- =============================================================================
-- COURSE ENROLLMENTS TABLE POLICIES
-- =============================================================================

-- Policy: Users can view their own enrollments
CREATE POLICY "Users can view their own enrollments" ON course_enrollments
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Instructors can view enrollments in their courses
CREATE POLICY "Instructors can view enrollments in their courses" ON course_enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_enrollments.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Policy: Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments" ON course_enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Users can create their own enrollments
CREATE POLICY "Users can enroll in courses" ON course_enrollments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own enrollments
CREATE POLICY "Users can update their own enrollments" ON course_enrollments
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- LESSON PROGRESS TABLE POLICIES
-- =============================================================================

-- Policy: Users can view their own lesson progress
CREATE POLICY "Users can view their own lesson progress" ON lesson_progress
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Instructors can view progress in their course lessons
CREATE POLICY "Instructors can view progress in their courses" ON lesson_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_lessons
      JOIN courses ON courses.id = course_lessons.course_id
      WHERE course_lessons.id = lesson_progress.lesson_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Policy: Users can create/update their own progress
CREATE POLICY "Users can create their own lesson progress" ON lesson_progress
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own lesson progress" ON lesson_progress
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- EDUCATIONAL ARTICLES TABLE POLICIES
-- =============================================================================

-- Policy: Published articles are viewable by everyone
CREATE POLICY "Published articles are viewable by everyone" ON educational_articles
  FOR SELECT
  USING (is_published = true);

-- Policy: Authors can view their own articles
CREATE POLICY "Authors can view their own articles" ON educational_articles
  FOR SELECT
  USING (author_id = auth.uid());

-- Policy: Admins can view all articles
CREATE POLICY "Admins can view all articles" ON educational_articles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Authors can create articles
CREATE POLICY "Authors can create articles" ON educational_articles
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- Policy: Authors can update their own articles
CREATE POLICY "Authors can update their own articles" ON educational_articles
  FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Policy: Admins can update any article
CREATE POLICY "Admins can update any article" ON educational_articles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Authors can delete their own articles
CREATE POLICY "Authors can delete their own articles" ON educational_articles
  FOR DELETE
  USING (author_id = auth.uid());

-- Policy: Admins can delete any article
CREATE POLICY "Admins can delete any article" ON educational_articles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- ARTICLE PROGRESS TABLE POLICIES
-- =============================================================================

-- Policy: Users can view their own article progress
CREATE POLICY "Users can view their own article progress" ON article_progress
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Authors can view progress on their articles
CREATE POLICY "Authors can view progress on their articles" ON article_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM educational_articles
      WHERE educational_articles.id = article_progress.article_id
      AND educational_articles.author_id = auth.uid()
    )
  );

-- Policy: Users can create/update their own progress
CREATE POLICY "Users can create their own article progress" ON article_progress
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own article progress" ON article_progress
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- USER ROLES TABLE POLICIES
-- =============================================================================

-- Policy: Users can view their own role
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Admins can view all roles
CREATE POLICY "Admins can view all roles" ON user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Policy: Only admins can create/update roles
CREATE POLICY "Admins can create roles" ON user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update roles" ON user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- =============================================================================
-- COURSE REWARD CLAIMS TABLE POLICIES
-- =============================================================================

-- Policy: Users can view their own reward claims
CREATE POLICY "Users can view their own reward claims" ON course_reward_claims
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can create reward claims
CREATE POLICY "Users can create reward claims" ON course_reward_claims
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Admins can view all reward claims
CREATE POLICY "Admins can view all reward claims" ON course_reward_claims
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_course_type ON courses(course_type);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);

CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_sort_order ON course_lessons(sort_order);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON course_enrollments(status);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_id ON lesson_progress(course_id);

CREATE INDEX IF NOT EXISTS idx_educational_articles_author_id ON educational_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_educational_articles_is_published ON educational_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_educational_articles_created_at ON educational_articles(created_at);

CREATE INDEX IF NOT EXISTS idx_article_progress_user_id ON article_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_article_progress_article_id ON article_progress(article_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify all policies are created
SELECT * FROM pg_policies WHERE tablename IN (
  'courses', 'course_lessons', 'course_enrollments', 'lesson_progress',
  'educational_articles', 'article_progress', 'user_roles', 'course_reward_claims'
);

-- Verify all indexes are created
SELECT * FROM pg_indexes WHERE tablename IN (
  'courses', 'course_lessons', 'course_enrollments', 'lesson_progress',
  'educational_articles', 'article_progress', 'user_roles', 'course_reward_claims'
);
