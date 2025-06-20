import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  userType: varchar("user_type", { length: 20 }).notNull().default("user"), // 'user' or 'admin'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const obituaries = pgTable("obituaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fullName: text("full_name").notNull(),
  age: integer("age"),
  dateOfBirth: text("date_of_birth"),
  dateOfDeath: text("date_of_death"),
  location: text("location"),
  formData: jsonb("form_data").notNull(),
  imageUrl: text("image_url"),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // 'draft', 'generated', 'completed'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const generatedObituaries = pgTable("generated_obituaries", {
  id: serial("id").primaryKey(),
  obituaryId: integer("obituary_id").notNull().references(() => obituaries.id),
  aiProvider: varchar("ai_provider", { length: 20 }).notNull(), // 'claude' or 'chatgpt'
  version: integer("version").notNull(), // 1, 2, or 3
  content: text("content").notNull(),
  tone: text("tone"),
  isRevision: boolean("is_revision").notNull().default(false),
  revisionPrompt: text("revision_prompt"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const textFeedback = pgTable("text_feedback", {
  id: serial("id").primaryKey(),
  generatedObituaryId: integer("generated_obituary_id").notNull().references(() => generatedObituaries.id),
  selectedText: text("selected_text").notNull(),
  feedbackType: varchar("feedback_type", { length: 10 }).notNull(), // 'liked' or 'disliked'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 50 }).notNull(),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 20 }).notNull(), // 'text', 'number', 'radio', 'checkbox', 'textarea'
  isRequired: boolean("is_required").notNull().default(false),
  placeholder: text("placeholder"),
  options: jsonb("options"), // For radio/checkbox options
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  obituaries: many(obituaries),
}));

export const obituariesRelations = relations(obituaries, ({ one, many }) => ({
  user: one(users, {
    fields: [obituaries.userId],
    references: [users.id],
  }),
  generatedObituaries: many(generatedObituaries),
}));

export const generatedObituariesRelations = relations(generatedObituaries, ({ one, many }) => ({
  obituary: one(obituaries, {
    fields: [generatedObituaries.obituaryId],
    references: [obituaries.id],
  }),
  textFeedback: many(textFeedback),
}));

export const textFeedbackRelations = relations(textFeedback, ({ one }) => ({
  generatedObituary: one(generatedObituaries, {
    fields: [textFeedback.generatedObituaryId],
    references: [generatedObituaries.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  userType: true,
});

export const insertObituarySchema = createInsertSchema(obituaries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeneratedObituarySchema = createInsertSchema(generatedObituaries).omit({
  id: true,
  createdAt: true,
});

export const insertTextFeedbackSchema = createInsertSchema(textFeedback).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Obituary = typeof obituaries.$inferSelect;
export type InsertObituary = z.infer<typeof insertObituarySchema>;
export type GeneratedObituary = typeof generatedObituaries.$inferSelect;
export type InsertGeneratedObituary = z.infer<typeof insertGeneratedObituarySchema>;
export type TextFeedback = typeof textFeedback.$inferSelect;
export type InsertTextFeedback = z.infer<typeof insertTextFeedbackSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
