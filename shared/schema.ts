import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  decimal,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User table for Replit Auth - Oligarch users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workers table - human workers who complete tasks via Telegram
export const workers = pgTable("workers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramUsername: varchar("telegram_username").notNull().unique(),
  telegramChatId: varchar("telegram_chat_id").unique(),
  skills: text("skills").array().notNull().default(sql`ARRAY[]::text[]`),
  availability: varchar("availability", { length: 20 }).notNull().default("available"), // available, busy, offline
  stripeAccountId: varchar("stripe_account_id"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  completedTasks: integer("completed_tasks").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks table - tasks submitted by customer agents
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull(),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }).notNull(),
  location: text("location"),
  requirements: jsonb("requirements"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, assigned, in_progress, submitted, verified, approved, rejected, cancelled
  assignedWorkerId: varchar("assigned_worker_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task assignments - tracks bidding and assignment history
export const taskAssignments = pgTable("task_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  workerId: varchar("worker_id").notNull().references(() => workers.id),
  notifiedAt: timestamp("notified_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  status: varchar("status", { length: 20 }).notNull().default("notified"), // notified, accepted, rejected, expired
});

// Task evidence - photos and location submitted by workers
export const taskEvidence = pgTable("task_evidence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  workerId: varchar("worker_id").notNull().references(() => workers.id),
  photoUrls: text("photo_urls").array().notNull().default(sql`ARRAY[]::text[]`),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// AI Verifications - results from Anthropic AI analysis
export const verifications = pgTable("verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  evidenceId: varchar("evidence_id").notNull().references(() => taskEvidence.id),
  decision: varchar("decision", { length: 20 }).notNull(), // approved, rejected, needs_review
  reasoning: text("reasoning").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  analyzedAt: timestamp("analyzed_at").defaultNow(),
});

// Payments - track payments to workers
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  workerId: varchar("worker_id").notNull().references(() => workers.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentId: varchar("stripe_payment_id"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, processing, completed, failed
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Settings - oligarch configuration
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const workersRelations = relations(workers, ({ many }) => ({
  taskAssignments: many(taskAssignments),
  taskEvidence: many(taskEvidence),
  payments: many(payments),
}));

export const tasksRelations = relations(tasks, ({ many, one }) => ({
  assignments: many(taskAssignments),
  evidence: many(taskEvidence),
  verifications: many(verifications),
  payments: many(payments),
  assignedWorker: one(workers, {
    fields: [tasks.assignedWorkerId],
    references: [workers.id],
  }),
}));

export const taskAssignmentsRelations = relations(taskAssignments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAssignments.taskId],
    references: [tasks.id],
  }),
  worker: one(workers, {
    fields: [taskAssignments.workerId],
    references: [workers.id],
  }),
}));

export const taskEvidenceRelations = relations(taskEvidence, ({ one, many }) => ({
  task: one(tasks, {
    fields: [taskEvidence.taskId],
    references: [tasks.id],
  }),
  worker: one(workers, {
    fields: [taskEvidence.workerId],
    references: [workers.id],
  }),
  verifications: many(verifications),
}));

export const verificationsRelations = relations(verifications, ({ one }) => ({
  task: one(tasks, {
    fields: [verifications.taskId],
    references: [tasks.id],
  }),
  evidence: one(taskEvidence, {
    fields: [verifications.evidenceId],
    references: [taskEvidence.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  task: one(tasks, {
    fields: [payments.taskId],
    references: [tasks.id],
  }),
  worker: one(workers, {
    fields: [payments.workerId],
    references: [workers.id],
  }),
}));

// Insert schemas
export const insertWorkerSchema = createInsertSchema(workers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  assignedWorkerId: true,
});

export const insertTaskAssignmentSchema = createInsertSchema(taskAssignments).omit({
  id: true,
  notifiedAt: true,
  acceptedAt: true,
});

export const insertTaskEvidenceSchema = createInsertSchema(taskEvidence).omit({
  id: true,
  submittedAt: true,
});

export const insertVerificationSchema = createInsertSchema(verifications).omit({
  id: true,
  analyzedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  paidAt: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type Worker = typeof workers.$inferSelect;
export type InsertWorker = z.infer<typeof insertWorkerSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type InsertTaskAssignment = z.infer<typeof insertTaskAssignmentSchema>;

export type TaskEvidence = typeof taskEvidence.$inferSelect;
export type InsertTaskEvidence = z.infer<typeof insertTaskEvidenceSchema>;

export type Verification = typeof verifications.$inferSelect;
export type InsertVerification = z.infer<typeof insertVerificationSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// User types for Replit Auth
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
