import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  numeric,
  integer,
  varchar,
  decimal,
  primaryKey,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Courses table - for platform and creator-created courses
export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    instructor_id: uuid('instructor_id').notNull(),
    course_type: varchar('course_type', { length: 50 }).notNull().default('platform'), // 'platform' or 'creator'
    title: text('title').notNull(),
    description: text('description'),
    level: varchar('level', { length: 20 }).default('Beginner'), // 'Beginner', 'Intermediate', 'Advanced'
    category: varchar('category', { length: 100 }),
    duration: varchar('duration', { length: 100 }),
    is_active: boolean('is_active').default(true),
    is_published: boolean('is_published').default(false),
    published_at: timestamp('published_at'),
    thumbnail_url: text('thumbnail_url'),
    banner_url: text('banner_url'),
    price: decimal('price', { precision: 10, scale: 2 }).default('0'),
    currency: varchar('currency', { length: 10 }).default('USD'),
    is_paid: boolean('is_paid').default(false),
    objectives: text('objectives').array(),
    requirements: text('requirements').array(),
    tags: text('tags').array(),
    total_students: integer('total_students').default(0),
    rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
    reviews_count: integer('reviews_count').default(0),
    reward_enrollment: decimal('reward_enrollment', { precision: 10, scale: 2 }).default('0.25'),
    reward_completion: decimal('reward_completion', { precision: 10, scale: 2 }).default('3'),
    reward_certificate: decimal('reward_certificate', { precision: 10, scale: 2 }).default('5'),
    has_certificate: boolean('has_certificate').default(true),
    instructor_avatar: text('instructor_avatar'),
    instructor_name: text('instructor_name'),
    instructor_title: text('instructor_title'),
    instructor_bio: text('instructor_bio'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    instructorIdx: uniqueIndex('courses_instructor_idx').on(table.instructor_id),
  })
);

// Course lessons table
export const course_lessons = pgTable('course_lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  course_id: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  lesson_type: varchar('lesson_type', { length: 50 }).default('video'), // 'video', 'text', 'quiz', 'interactive'
  content: text('content'),
  video_url: text('video_url'),
  duration: integer('duration'), // in minutes
  sort_order: integer('sort_order').default(0),
  quiz_questions: jsonb('quiz_questions'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Course enrollments table
export const course_enrollments = pgTable(
  'course_enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull(),
    course_id: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    enrolled_at: timestamp('enrolled_at').defaultNow(),
    progress_percentage: integer('progress_percentage').default(0),
    completed_lessons: uuid('completed_lessons').array(),
    time_spent_minutes: integer('time_spent_minutes').default(0),
    status: varchar('status', { length: 50 }).default('enrolled'), // 'enrolled', 'completed', 'abandoned'
    completed_at: timestamp('completed_at'),
    enrollment_reward_claimed: boolean('enrollment_reward_claimed').default(false),
    completion_reward_claimed: boolean('completion_reward_claimed').default(false),
    certificate_reward_claimed: boolean('certificate_reward_claimed').default(false),
    certificate_url: text('certificate_url'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userCourseUnique: uniqueIndex('course_enrollments_user_course_unique').on(
      table.user_id,
      table.course_id
    ),
  })
);

// Lesson progress table
export const lesson_progress = pgTable(
  'lesson_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull(),
    lesson_id: uuid('lesson_id').notNull().references(() => course_lessons.id, { onDelete: 'cascade' }),
    course_id: uuid('course_id').notNull(),
    completed: boolean('completed').default(false),
    quiz_score: integer('quiz_score'),
    time_spent_minutes: integer('time_spent_minutes').default(0),
    completed_at: timestamp('completed_at'),
    started_at: timestamp('started_at').defaultNow(),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userLessonUnique: uniqueIndex('lesson_progress_user_lesson_unique').on(
      table.user_id,
      table.lesson_id
    ),
  })
);

// Educational articles table
export const educational_articles = pgTable('educational_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  author_id: uuid('author_id').notNull(),
  difficulty: varchar('difficulty', { length: 20 }).default('Beginner'),
  category: varchar('category', { length: 100 }),
  reading_time: integer('reading_time'), // in minutes
  featured_image: text('featured_image'),
  is_published: boolean('is_published').default(false),
  published_at: timestamp('published_at'),
  quiz_questions: jsonb('quiz_questions'),
  quiz_passing_score: integer('quiz_passing_score').default(70),
  views_count: integer('views_count').default(0),
  likes_count: integer('likes_count').default(0),
  bookmarks_count: integer('bookmarks_count').default(0),
  quiz_attempts: integer('quiz_attempts').default(0),
  average_quiz_score: decimal('average_quiz_score', { precision: 5, scale: 2 }).default('0'),
  reward_reading: decimal('reward_reading', { precision: 10, scale: 2 }).default('1'),
  reward_quiz_completion: decimal('reward_quiz_completion', { precision: 10, scale: 2 }).default('2'),
  reward_perfect_score: decimal('reward_perfect_score', { precision: 10, scale: 2 }).default('3'),
  tags: text('tags').array(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Article progress table
export const article_progress = pgTable(
  'article_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull(),
    article_id: uuid('article_id').notNull().references(() => educational_articles.id, { onDelete: 'cascade' }),
    read: boolean('read').default(false),
    quiz_score: integer('quiz_score'),
    time_spent_minutes: integer('time_spent_minutes').default(0),
    bookmarked: boolean('bookmarked').default(false),
    liked: boolean('liked').default(false),
    reading_reward_claimed: boolean('reading_reward_claimed').default(false),
    quiz_reward_claimed: boolean('quiz_reward_claimed').default(false),
    perfect_score_reward_claimed: boolean('perfect_score_reward_claimed').default(false),
    read_at: timestamp('read_at'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userArticleUnique: uniqueIndex('article_progress_user_article_unique').on(
      table.user_id,
      table.article_id
    ),
  })
);

// User roles table - for admin management
export const user_roles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().unique(),
  role: varchar('role', { length: 50 }).default('user'), // 'admin', 'instructor', 'user'
  created_by: uuid('created_by'),
  created_at: timestamp('created_at').defaultNow(),
});

// Course reward claims tracking table
export const course_reward_claims = pgTable('course_reward_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  course_id: uuid('course_id').notNull(),
  reward_type: varchar('reward_type', { length: 50 }).notNull(), // 'enrollment', 'completion', 'certificate'
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

// Relations
export const coursesRelations = relations(courses, ({ many }) => ({
  lessons: many(course_lessons),
  enrollments: many(course_enrollments),
}));

export const course_lessonsRelations = relations(course_lessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [course_lessons.course_id],
    references: [courses.id],
  }),
  progress: many(lesson_progress),
}));

export const course_enrollmentsRelations = relations(course_enrollments, ({ one }) => ({
  course: one(courses, {
    fields: [course_enrollments.course_id],
    references: [courses.id],
  }),
}));

export const lesson_progressRelations = relations(lesson_progress, ({ one }) => ({
  lesson: one(course_lessons, {
    fields: [lesson_progress.lesson_id],
    references: [course_lessons.id],
  }),
}));

export const educational_articlesRelations = relations(educational_articles, ({ many }) => ({
  progress: many(article_progress),
}));

export const article_progressRelations = relations(article_progress, ({ one }) => ({
  article: one(educational_articles, {
    fields: [article_progress.article_id],
    references: [educational_articles.id],
  }),
}));
