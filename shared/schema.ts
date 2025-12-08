import { sql } from "drizzle-orm";
import { mysqlTable, text, varchar, timestamp, boolean, int } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin users table for authentication
export const adminUsers = mysqlTable("admin_users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"), // admin or professor
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User queries table - stores all chatbot interactions
export const queries = mysqlTable("queries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  userType: text("user_type").notNull().default("visitor"), // visitor, student, parent
  category: text("category"), // admissions, academic, campus, scholarships, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  responseTime: int("response_time"), // in milliseconds
});

// FAQ management table
export const faqs = mysqlTable("faqs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull(), // admissions, academic, campus, scholarships
  priority: int("priority").notNull().default(0), // higher priority = shown first
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Chat history table - stores individual chat messages
export const chatHistory = mysqlTable("chat_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  queryId: varchar("query_id", { length: 36 }), // References queries table
  message: text("message").notNull(),
  isUser: boolean("is_user").notNull(), // true if user message, false if AI response
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Analytics events table - stores all user interactions
export const analyticsEvents = mysqlTable("analytics_events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  eventType: text("event_type").notNull(), // chat_query, feedback, interaction, etc.
  eventData: text("event_data"), // JSON string of event details
  sessionId: varchar("session_id", { length: 36 }),
  userType: text("user_type"), // visitor, student, parent
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Feedback table - stores user feedback on queries
export const feedback = mysqlTable("feedback", {
  id: varchar("id", { length: 36 }).primaryKey(),
  queryId: varchar("query_id", { length: 36 }).notNull(), // References queries table
  rating: text("rating").notNull(), // positive or negative
  comment: text("comment"), // optional user comment
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas with enhanced validation
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
}).extend({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]+$/, "Username can only contain lowercase letters, numbers, hyphens and underscores"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  role: z.enum(['admin', 'professor']).default('admin'),
  fullName: z.string()
    .min(3, "Full name must be at least 3 characters")
    .max(100, "Full name must not exceed 100 characters")
    .trim(),
  email: z.string()
    .email("Invalid email format")
    .max(255, "Email must not exceed 255 characters")
    .trim()
    .toLowerCase(),
});

export const insertQuerySchema = createInsertSchema(queries).omit({
  id: true,
  createdAt: true,
}).extend({
  question: z.string()
    .min(1, "Question cannot be empty")
    .max(1000, "Question must not exceed 1000 characters")
    .trim(),
  answer: z.string()
    .min(1, "Answer cannot be empty")
    .max(5000, "Answer must not exceed 5000 characters")
    .trim(),
  userType: z.enum(['visitor', 'student', 'parent']).default('visitor'),
  category: z.string()
    .max(50, "Category must not exceed 50 characters")
    .nullable()
    .optional(),
  responseTime: z.number()
    .int()
    .positive()
    .optional(),
});

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  question: z.string()
    .min(10, "Question must be at least 10 characters")
    .max(500, "Question must not exceed 500 characters")
    .trim(),
  answer: z.string()
    .min(20, "Answer must be at least 20 characters")
    .max(2000, "Answer must not exceed 2000 characters")
    .trim(),
  category: z.enum(['admissions', 'academic', 'campus', 'scholarships', 'general']),
  priority: z.number()
    .int()
    .min(0, "Priority cannot be negative")
    .max(100, "Priority cannot exceed 100")
    .default(0),
  isActive: z.boolean().default(true),
});

// Types
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export type Query = typeof queries.$inferSelect;
export type InsertQuery = z.infer<typeof insertQuerySchema>;

export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = z.infer<typeof insertFaqSchema>;

export type ChatHistory = typeof chatHistory.$inferSelect;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

export type Feedback = typeof feedback.$inferSelect;

// API Response Validation Schemas
export const apiChatResponseSchema = z.object({
  answer: z.string(),
  audioUrl: z.string().optional(),
  category: z.string().optional(),
});

export const apiLoginResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    username: z.string(),
    role: z.string(),
    fullName: z.string(),
    email: z.string().email(),
    createdAt: z.date(),
  }),
});

export const apiQueryResponseSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  userType: z.enum(['visitor', 'student', 'parent']),
  category: z.string().nullable(),
  createdAt: z.date(),
  responseTime: z.number().nullable(),
});

export const apiAnalyticsResponseSchema = z.object({
  totalQueries: z.number(),
  avgResponseTime: z.number(),
  popularQuestions: z.array(z.object({
    question: z.string(),
    count: z.number(),
  })),
  categoryBreakdown: z.array(z.object({
    category: z.string(),
    count: z.number(),
  })),
  peakHours: z.array(z.object({
    hour: z.number(),
    count: z.number(),
  })),
  userTypeDistribution: z.array(z.object({
    userType: z.string(),
    count: z.number(),
  })),
  feedbackPositive: z.number(),
  feedbackNegative: z.number(),
});

// Type exports for API responses
export type ApiChatResponse = z.infer<typeof apiChatResponseSchema>;
export type ApiLoginResponse = z.infer<typeof apiLoginResponseSchema>;
export type ApiQueryResponse = z.infer<typeof apiQueryResponseSchema>;
export type ApiAnalyticsResponse = z.infer<typeof apiAnalyticsResponseSchema>;
