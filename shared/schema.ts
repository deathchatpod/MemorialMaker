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

export const promptTemplates = pgTable("prompt_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  platform: varchar("platform", { length: 20 }).notNull(), // 'claude' or 'chatgpt'
  promptType: varchar("prompt_type", { length: 20 }).notNull(), // 'base' or 'revision'
  template: text("template").notNull(),
  description: text("description"),
  contextDocument: text("context_document"), // Path to uploaded document
  contextDocumentName: varchar("context_document_name", { length: 255 }), // Original filename
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const finalSpaces = pgTable("final_spaces", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // URL-friendly identifier
  personName: varchar("person_name", { length: 255 }).notNull(),
  dateOfBirth: varchar("date_of_birth", { length: 10 }),
  dateOfDeath: varchar("date_of_death", { length: 10 }),
  obituaryId: integer("obituary_id").references(() => obituaries.id, { onDelete: "set null" }),
  spotifyPlaylistUrl: text("spotify_playlist_url"),
  pandoraPlaylistUrl: text("pandora_playlist_url"),
  metaAccessToken: text("meta_access_token"), // For Facebook integration
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const finalSpaceComments = pgTable("final_space_comments", {
  id: serial("id").primaryKey(),
  finalSpaceId: integer("final_space_id").notNull().references(() => finalSpaces.id, { onDelete: "cascade" }),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  authorEmail: varchar("author_email", { length: 255 }), // Optional for contact
  content: text("content").notNull(),
  isApproved: boolean("is_approved").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const finalSpaceImages = pgTable("final_space_images", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").notNull().references(() => finalSpaceComments.id, { onDelete: "cascade" }),
  imagePath: text("image_path").notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  obituaries: many(obituaries),
  finalSpaces: many(finalSpaces),
}));

export const obituariesRelations = relations(obituaries, ({ one, many }) => ({
  user: one(users, {
    fields: [obituaries.userId],
    references: [users.id],
  }),
  generatedObituaries: many(generatedObituaries),
  finalSpaces: many(finalSpaces),
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

export const finalSpacesRelations = relations(finalSpaces, ({ one, many }) => ({
  user: one(users, {
    fields: [finalSpaces.userId],
    references: [users.id],
  }),
  obituary: one(obituaries, {
    fields: [finalSpaces.obituaryId],
    references: [obituaries.id],
  }),
  comments: many(finalSpaceComments),
}));

export const finalSpaceCommentsRelations = relations(finalSpaceComments, ({ one, many }) => ({
  finalSpace: one(finalSpaces, {
    fields: [finalSpaceComments.finalSpaceId],
    references: [finalSpaces.id],
  }),
  images: many(finalSpaceImages),
}));

export const finalSpaceImagesRelations = relations(finalSpaceImages, ({ one }) => ({
  comment: one(finalSpaceComments, {
    fields: [finalSpaceImages.commentId],
    references: [finalSpaceComments.id],
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

export const insertPromptTemplateSchema = createInsertSchema(promptTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFinalSpaceSchema = createInsertSchema(finalSpaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFinalSpaceCommentSchema = createInsertSchema(finalSpaceComments).omit({
  id: true,
  createdAt: true,
});

export const insertFinalSpaceImageSchema = createInsertSchema(finalSpaceImages).omit({
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
export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type InsertPromptTemplate = z.infer<typeof insertPromptTemplateSchema>;
export type FinalSpace = typeof finalSpaces.$inferSelect;
export type InsertFinalSpace = z.infer<typeof insertFinalSpaceSchema>;
export type FinalSpaceComment = typeof finalSpaceComments.$inferSelect;
export type InsertFinalSpaceComment = z.infer<typeof insertFinalSpaceCommentSchema>;
export type FinalSpaceImage = typeof finalSpaceImages.$inferSelect;
export type InsertFinalSpaceImage = z.infer<typeof insertFinalSpaceImageSchema>;
