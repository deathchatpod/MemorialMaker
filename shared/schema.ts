import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Main Admin Users (project-level admin)
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Funeral Homes (parent accounts)
export const funeralHomes = pgTable("funeral_homes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  googleId: text("google_id").unique(),
  name: text("name").notNull(),
  businessName: text("business_name").notNull(),
  address: text("address"),
  phone: text("phone"),
  website: text("website"),
  contactEmail: text("contact_email"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Funeral Home Employee Users
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  funeralHomeId: integer("funeral_home_id").notNull().references(() => funeralHomes.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  password: text("password"),
  googleId: text("google_id").unique(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Employee Invitations
export const employeeInvitations = pgTable("employee_invitations", {
  id: serial("id").primaryKey(),
  funeralHomeId: integer("funeral_home_id").notNull().references(() => funeralHomes.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  inviteToken: text("invite_token").notNull().unique(),
  isUsed: boolean("is_used").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Sessions for authentication
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  userType: varchar("user_type", { length: 20 }).notNull(), // 'admin', 'funeral_home', 'employee'
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Obituaries (linked to either funeral home or employee)
export const obituaries = pgTable("obituaries", {
  id: serial("id").primaryKey(),
  funeralHomeId: integer("funeral_home_id").notNull().references(() => funeralHomes.id),
  createdById: integer("created_by_id").notNull(), // Can be funeral home or employee ID
  createdByType: varchar("created_by_type", { length: 20 }).notNull(), // 'funeral_home' or 'employee'
  fullName: text("full_name").notNull(),
  age: integer("age"),
  dateOfBirth: text("date_of_birth"),
  dateOfDeath: text("date_of_death"),
  location: text("location"),
  formData: jsonb("form_data").notNull(),
  imageUrl: text("image_url"),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // 'draft', 'generated', 'completed'
  hasClaudeRevision: boolean("has_claude_revision").notNull().default(false),
  hasChatgptRevision: boolean("has_chatgpt_revision").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const generatedObituaries = pgTable("generated_obituaries", {
  id: serial("id").primaryKey(),
  obituaryId: integer("obituary_id").notNull().references(() => obituaries.id, { onDelete: "cascade" }),
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
  generatedObituaryId: integer("generated_obituary_id").notNull().references(() => generatedObituaries.id, { onDelete: "cascade" }),
  selectedText: text("selected_text").notNull(),
  feedbackType: varchar("feedback_type", { length: 10 }).notNull(), // 'liked' or 'disliked'
  collaboratorName: text("collaborator_name"), // null for owner feedback
  collaboratorEmail: text("collaborator_email"), // null for owner feedback
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const obituaryCollaborators = pgTable("obituary_collaborators", {
  id: serial("id").primaryKey(),
  obituaryId: integer("obituary_id").notNull().references(() => obituaries.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const collaborationSessions = pgTable("collaboration_sessions", {
  id: serial("id").primaryKey(),
  obituaryId: integer("obituary_id").notNull().references(() => obituaries.id, { onDelete: "cascade" }),
  uuid: text("uuid").notNull().unique(),
  collaboratorEmail: text("collaborator_email").notNull(),
  collaboratorName: text("collaborator_name"),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, active
  createdById: integer("created_by_id").notNull().references(() => adminUsers.id),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 20 }).notNull(), // text, textarea, email, tel, number, date, radio, checkbox, select
  placeholder: text("placeholder"),
  isRequired: boolean("is_required").notNull().default(false),
  options: jsonb("options"), // For radio/checkbox options
  orderIndex: integer("order_index").notNull().default(0),
  // Conditional logic fields
  conditionalQuestionId: integer("conditional_question_id").references(() => questions.id),
  conditionalValue: text("conditional_value"), // The value that triggers this question to show
  conditionalOperator: varchar("conditional_operator", { length: 10 }).default("equals"), // equals, contains, not_equals
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const promptTemplates = pgTable("prompt_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  platform: varchar("platform", { length: 20 }).notNull(), // 'claude' or 'chatgpt'
  promptType: varchar("prompt_type", { length: 20 }).notNull(), // 'base', 'revision'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Final Spaces (linked to funeral home)
export const finalSpaces = pgTable("final_spaces", {
  id: serial("id").primaryKey(),
  funeralHomeId: integer("funeral_home_id").notNull().references(() => funeralHomes.id),
  createdById: integer("created_by_id").notNull(), // Can be funeral home or employee ID
  createdByType: varchar("created_by_type", { length: 20 }).notNull(), // 'funeral_home' or 'employee'
  obituaryId: integer("obituary_id").references(() => obituaries.id),
  slug: text("slug").notNull().unique(),
  personName: text("person_name").notNull(),
  dateOfBirth: text("date_of_birth"),
  dateOfDeath: text("date_of_death"),
  description: text("description"),
  socialMediaLinks: jsonb("social_media_links"),
  musicPlaylist: text("music_playlist"),
  isPublic: boolean("is_public").notNull().default(true),
  allowComments: boolean("allow_comments").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const finalSpaceComments = pgTable("final_space_comments", {
  id: serial("id").primaryKey(),
  finalSpaceId: integer("final_space_id").notNull().references(() => finalSpaces.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email"),
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

// User Types
export const userTypes = pgTable("user_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Survey Responses  
export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").references(() => surveys.id).notNull(),
  userTypeId: integer("user_type_id").references(() => userTypes.id), 
  responses: jsonb("responses").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Relations
export const funeralHomesRelations = relations(funeralHomes, ({ many }) => ({
  employees: many(employees),
  invitations: many(employeeInvitations),
  obituaries: many(obituaries),
  finalSpaces: many(finalSpaces),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  funeralHome: one(funeralHomes, {
    fields: [employees.funeralHomeId],
    references: [funeralHomes.id],
  }),
  obituaries: many(obituaries),
  finalSpaces: many(finalSpaces),
}));

export const employeeInvitationsRelations = relations(employeeInvitations, ({ one }) => ({
  funeralHome: one(funeralHomes, {
    fields: [employeeInvitations.funeralHomeId],
    references: [funeralHomes.id],
  }),
}));

export const obituariesRelations = relations(obituaries, ({ one, many }) => ({
  funeralHome: one(funeralHomes, {
    fields: [obituaries.funeralHomeId],
    references: [funeralHomes.id],
  }),
  generatedObituaries: many(generatedObituaries),
  finalSpaces: many(finalSpaces),
  collaborators: many(obituaryCollaborators),
  collaborationSessions: many(collaborationSessions),
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
  funeralHome: one(funeralHomes, {
    fields: [finalSpaces.funeralHomeId],
    references: [funeralHomes.id],
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

export const obituaryCollaboratorsRelations = relations(obituaryCollaborators, ({ one }) => ({
  obituary: one(obituaries, {
    fields: [obituaryCollaborators.obituaryId],
    references: [obituaries.id],
  }),
}));

export const surveysRelations = relations(surveys, ({ one, many }) => ({
  createdBy: one(adminUsers, {
    fields: [surveys.createdById],
    references: [adminUsers.id],
  }),
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  survey: one(surveys, {
    fields: [questions.surveyId],
    references: [surveys.id],
  }),
}));

export const collaborationSessionsRelations = relations(collaborationSessions, ({ one }) => ({
  obituary: one(obituaries, {
    fields: [collaborationSessions.obituaryId],
    references: [obituaries.id],
  }),
}));

// Insert schemas
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFuneralHomeSchema = createInsertSchema(funeralHomes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeInvitationSchema = createInsertSchema(employeeInvitations).omit({
  id: true,
  createdAt: true,
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

export const insertSurveySchema = createInsertSchema(surveys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertObituaryCollaboratorSchema = createInsertSchema(obituaryCollaborators).omit({
  id: true,
  createdAt: true,
});

export const insertCollaborationSessionSchema = createInsertSchema(collaborationSessions).omit({
  id: true,
  createdAt: true,
});

// Types
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export type FuneralHome = typeof funeralHomes.$inferSelect;
export type InsertFuneralHome = z.infer<typeof insertFuneralHomeSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type EmployeeInvitation = typeof employeeInvitations.$inferSelect;
export type InsertEmployeeInvitation = z.infer<typeof insertEmployeeInvitationSchema>;

export type Session = typeof sessions.$inferSelect;

export type Obituary = typeof obituaries.$inferSelect;
export type InsertObituary = z.infer<typeof insertObituarySchema>;

export type GeneratedObituary = typeof generatedObituaries.$inferSelect;
export type InsertGeneratedObituary = z.infer<typeof insertGeneratedObituarySchema>;

export type TextFeedback = typeof textFeedback.$inferSelect;
export type InsertTextFeedback = z.infer<typeof insertTextFeedbackSchema>;

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = z.infer<typeof insertSurveySchema>;

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

export type ObituaryCollaborator = typeof obituaryCollaborators.$inferSelect;
export type InsertObituaryCollaborator = z.infer<typeof insertObituaryCollaboratorSchema>;

export type CollaborationSession = typeof collaborationSessions.$inferSelect;
export type InsertCollaborationSession = z.infer<typeof insertCollaborationSessionSchema>;

export type UserType = typeof userTypes.$inferSelect;
export type InsertUserType = typeof userTypes.$inferInsert;

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = typeof surveyResponses.$inferInsert;