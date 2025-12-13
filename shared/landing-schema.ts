import { pgTable, uuid, text, timestamp, boolean, jsonb, numeric, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Testimonials table
export const landing_testimonials = pgTable('landing_testimonials', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id'),
  name: text('name').notNull(),
  title: text('title').notNull(),
  quote: text('quote').notNull(),
  image_url: text('image_url'),
  metrics: jsonb('metrics'),
  category: text('category').notNull().default('general'),
  rating: integer('rating').default(5),
  is_verified: boolean('is_verified').default(false),
  is_featured: boolean('is_featured').default(true),
  order: integer('order').default(0),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => ({
  categoryIdx: index('landing_testimonials_category_idx').on(table.category),
  featuredIdx: index('landing_testimonials_featured_idx').on(table.is_featured),
  orderIdx: index('landing_testimonials_order_idx').on(table.order),
}));

// FAQs table
export const landing_faqs = pgTable('landing_faqs', {
  id: uuid('id').primaryKey().defaultRandom(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  category: text('category').notNull().default('general'),
  order: integer('order').default(0),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => ({
  categoryIdx: index('landing_faqs_category_idx').on(table.category),
  activeIdx: index('landing_faqs_active_idx').on(table.is_active),
  orderIdx: index('landing_faqs_order_idx').on(table.order),
}));

// Use Cases table
export const landing_use_cases = pgTable('landing_use_cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_type: text('user_type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  avatar_url: text('avatar_url'),
  results: jsonb('results'),
  timeline_weeks: integer('timeline_weeks'),
  image_url: text('image_url'),
  is_featured: boolean('is_featured').default(true),
  order: integer('order').default(0),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userTypeIdx: index('landing_use_cases_user_type_idx').on(table.user_type),
  featuredIdx: index('landing_use_cases_featured_idx').on(table.is_featured),
  orderIdx: index('landing_use_cases_order_idx').on(table.order),
}));

// Social Proof Stats table
export const landing_social_proof_stats = pgTable('landing_social_proof_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  metric_name: text('metric_name').notNull().unique(),
  current_value: numeric('current_value', { precision: 20, scale: 0 }).notNull(),
  unit: text('unit').notNull(),
  display_format: text('display_format').default('number'),
  label: text('label').notNull(),
  icon: text('icon'),
  order: integer('order').default(0),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => ({
  metricNameIdx: index('landing_stats_metric_name_idx').on(table.metric_name),
}));

// Comparison Matrix table
export const landing_comparison_matrix = pgTable('landing_comparison_matrix', {
  id: uuid('id').primaryKey().defaultRandom(),
  feature_name: text('feature_name').notNull(),
  category: text('category').notNull(),
  eloity_has: boolean('eloity_has').default(true),
  feature_description: text('feature_description'),
  competitors: jsonb('competitors'),
  order: integer('order').default(0),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => ({
  categoryIdx: index('landing_comparison_category_idx').on(table.category),
  activeIdx: index('landing_comparison_active_idx').on(table.is_active),
}));

// Waitlist Leads table
export const landing_waitlist_leads = pgTable('landing_waitlist_leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  user_type_interested: text('user_type_interested').default('not_sure'),
  country: text('country'),
  phone: text('phone'),
  message: text('message'),
  source: text('source').default('homepage'),
  lead_score: integer('lead_score').default(0),
  is_verified: boolean('is_verified').default(false),
  conversion_status: text('conversion_status').default('waitlist'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => ({
  emailIdx: index('landing_waitlist_email_idx').on(table.email),
  statusIdx: index('landing_waitlist_status_idx').on(table.conversion_status),
  scoreIdx: index('landing_waitlist_score_idx').on(table.lead_score),
  createdIdx: index('landing_waitlist_created_idx').on(table.created_at),
}));

// Relations
export const landing_testimonials_relations = relations(landing_testimonials, ({ one }) => ({
  // Can link to users table if verified
}));

export const landing_use_cases_relations = relations(landing_use_cases, ({ one }) => ({
  // Can link to users table if real user story
}));
