import { pgTable, uuid, text, timestamp, boolean, jsonb, numeric, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema';
import { freelance_contracts, freelance_projects } from './freelance-schema';

// User engagement table for tracking activity and analytics
export const user_engagement = pgTable('user_engagement', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  activity_type: text('activity_type').notNull(), // 'freelance_job_posted', 'freelance_proposal_submitted', 'freelance_project_accepted', 'freelance_milestone_completed', 'freelance_review_submitted', 'marketplace_purchase', 'social_post', 'chat_message', 'referral', etc.
  reference_id: uuid('reference_id'), // ID of the referenced entity (project_id, proposal_id, etc.)
  reference_type: text('reference_type'), // 'freelance_project', 'freelance_proposal', 'marketplace_order', 'social_post', etc.
  points_earned: integer('points_earned').default(0),
  multiplier: numeric('multiplier', { precision: 3, scale: 2 }).default('1.0'),
  total_points: integer('total_points').default(0), // points_earned * multiplier
  description: text('description'),
  metadata: jsonb('metadata'), // Additional context data
  is_verified: boolean('is_verified').default(false),
  verified_at: timestamp('verified_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Freelance disputes table for conflict resolution
export const freelance_disputes = pgTable('freelance_disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  contract_id: uuid('contract_id').notNull().references(() => freelance_contracts.id, { onDelete: 'cascade' }),
  project_id: uuid('project_id').notNull().references(() => freelance_projects.id, { onDelete: 'cascade' }),
  filed_by_id: uuid('filed_by_id').notNull().references(() => users.id),
  filed_against_id: uuid('filed_against_id').notNull().references(() => users.id),
  arbiter_id: uuid('arbiter_id').references(() => users.id),
  reason: text('reason').notNull(),
  description: text('description').notNull(),
  evidence_urls: jsonb('evidence_urls'),
  initial_offer: numeric('initial_offer', { precision: 12, scale: 2 }),
  counter_offer: numeric('counter_offer', { precision: 12, scale: 2 }),
  status: text('status').default('open'), // 'open', 'in_review', 'mediation', 'resolved', 'appealed'
  resolution: text('resolution'), // Description of the resolution
  final_amount: numeric('final_amount', { precision: 12, scale: 2 }), // Final amount awarded to claimant
  appeal_status: text('appeal_status'), // 'none', 'pending', 'approved', 'rejected'
  appeal_reason: text('appeal_reason'),
  resolution_date: timestamp('resolution_date'),
  appeal_deadline: timestamp('appeal_deadline'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Job matching score table for smart job recommendations
export const job_matching_scores = pgTable('job_matching_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  freelancer_id: uuid('freelancer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  project_id: uuid('project_id').notNull().references(() => freelance_projects.id, { onDelete: 'cascade' }),
  skills_match_percentage: numeric('skills_match_percentage', { precision: 5, scale: 2 }).default('0'),
  experience_match_percentage: numeric('experience_match_percentage', { precision: 5, scale: 2 }).default('0'),
  budget_match_percentage: numeric('budget_match_percentage', { precision: 5, scale: 2 }).default('0'),
  availability_match_percentage: numeric('availability_match_percentage', { precision: 5, scale: 2 }).default('0'),
  past_success_percentage: numeric('past_success_percentage', { precision: 5, scale: 2 }).default('0'),
  overall_match_score: numeric('overall_match_score', { precision: 5, scale: 2 }).default('0'), // Weighted average
  score_breakdown: jsonb('score_breakdown'), // Detailed breakdown of scoring
  recommendation_reason: text('recommendation_reason'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Analytics table for freelance earnings and performance
export const freelance_analytics = pgTable('freelance_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  period: text('period').notNull(), // 'daily', 'weekly', 'monthly', 'yearly'
  total_earnings: numeric('total_earnings', { precision: 12, scale: 2 }).default('0'),
  projects_posted: integer('projects_posted').default(0),
  projects_completed: integer('projects_completed').default(0),
  projects_in_progress: integer('projects_in_progress').default(0),
  proposals_sent: integer('proposals_sent').default(0),
  proposals_accepted: integer('proposals_accepted').default(0),
  acceptance_rate: numeric('acceptance_rate', { precision: 5, scale: 2 }).default('0'),
  average_project_value: numeric('average_project_value', { precision: 10, scale: 2 }).default('0'),
  average_rating: numeric('average_rating', { precision: 3, scale: 2 }).default('0'),
  client_reviews_count: integer('client_reviews_count').default(0),
  repeat_client_percentage: numeric('repeat_client_percentage', { precision: 5, scale: 2 }).default('0'),
  completion_rate: numeric('completion_rate', { precision: 5, scale: 2 }).default('0'),
  on_time_percentage: numeric('on_time_percentage', { precision: 5, scale: 2 }).default('0'),
  budget_adherence_percentage: numeric('budget_adherence_percentage', { precision: 5, scale: 2 }).default('0'),
  projected_monthly_earnings: numeric('projected_monthly_earnings', { precision: 12, scale: 2 }).default('0'),
  trends_data: jsonb('trends_data'), // Weekly/monthly trends
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Deadline reminders table for automated notifications
export const deadline_reminders = pgTable('deadline_reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  contract_id: uuid('contract_id').notNull().references(() => freelance_contracts.id, { onDelete: 'cascade' }),
  project_id: uuid('project_id').notNull().references(() => freelance_projects.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reminder_type: text('reminder_type').notNull(), // 'milestone_deadline', 'project_deadline', 'payment_deadline'
  deadline_date: timestamp('deadline_date').notNull(),
  reminder_dates: jsonb('reminder_dates').notNull(), // Array of reminder trigger dates (3 days, 1 day, 2 hours before)
  reminders_sent: jsonb('reminders_sent'), // Track which reminders have been sent
  notification_preferences: jsonb('notification_preferences'), // Email, SMS, push notification preferences
  is_active: boolean('is_active').default(true),
  completed_at: timestamp('completed_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Relations for user_engagement
export const userEngagementRelations = relations(user_engagement, ({ one }) => ({
  user: one(users, {
    fields: [user_engagement.user_id],
    references: [users.id],
  }),
}));

// Relations for freelance_disputes
export const freelanceDisputesRelations = relations(freelance_disputes, ({ one }) => ({
  contract: one(freelance_contracts, {
    fields: [freelance_disputes.contract_id],
    references: [freelance_contracts.id],
  }),
  project: one(freelance_projects, {
    fields: [freelance_disputes.project_id],
    references: [freelance_projects.id],
  }),
  filedBy: one(users, {
    fields: [freelance_disputes.filed_by_id],
    references: [users.id],
    relationName: 'disputesFiledBy',
  }),
  filedAgainst: one(users, {
    fields: [freelance_disputes.filed_against_id],
    references: [users.id],
    relationName: 'disputesFiledAgainst',
  }),
  arbiter: one(users, {
    fields: [freelance_disputes.arbiter_id],
    references: [users.id],
    relationName: 'arbitedDisputes',
  }),
}));

// Relations for job_matching_scores
export const jobMatchingScoresRelations = relations(job_matching_scores, ({ one }) => ({
  freelancer: one(users, {
    fields: [job_matching_scores.freelancer_id],
    references: [users.id],
  }),
  project: one(freelance_projects, {
    fields: [job_matching_scores.project_id],
    references: [freelance_projects.id],
  }),
}));

// Relations for freelance_analytics
export const freelanceAnalyticsRelations = relations(freelance_analytics, ({ one }) => ({
  user: one(users, {
    fields: [freelance_analytics.user_id],
    references: [users.id],
  }),
}));

// Relations for deadline_reminders
export const deadlineRemindersRelations = relations(deadline_reminders, ({ one }) => ({
  contract: one(freelance_contracts, {
    fields: [deadline_reminders.contract_id],
    references: [freelance_contracts.id],
  }),
  project: one(freelance_projects, {
    fields: [deadline_reminders.project_id],
    references: [freelance_projects.id],
  }),
  user: one(users, {
    fields: [deadline_reminders.user_id],
    references: [users.id],
  }),
}));
