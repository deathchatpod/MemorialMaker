import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, uuid, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Main Admin Users (project-level admin)
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  businessName: text("business_name"),
  street: text("street"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("United States"),
  additionalAddresses: jsonb("additional_addresses").default([]),
  phone: text("phone"),
  website: text("website"),
  contactEmail: text("contact_email"),
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
  street: text("street"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("United States"),
  additionalAddresses: jsonb("additional_addresses").default([]),
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
  businessName: text("business_name"),
  street: text("street"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("United States"),
  additionalAddresses: jsonb("additional_addresses").default([]),
  phone: text("phone"),
  website: text("website"),
  contactEmail: text("contact_email"),
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
  deceasedName: text("deceased_name"), // Add missing field
  personalityTraits: jsonb("personality_traits").default([]), // Add missing field
  biography: text("biography"), // Add missing field
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
  collaboratorEmail: text("collaborator_email").notNull(),
  name: text("name"),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  invitedBy: integer("invited_by").notNull(),
  invitedByType: varchar("invited_by_type", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const collaborationSessions = pgTable("collaboration_sessions", {
  id: serial("id").primaryKey(),
  obituaryId: integer("obituary_id").notNull().references(() => obituaries.id, { onDelete: "cascade" }),
  collaboratorEmail: text("collaborator_email").notNull(),
  collaboratorName: text("collaborator_name"),
  uuid: text("uuid").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, active
  createdById: integer("created_by_id").notNull(),
  createdByType: varchar("created_by_type", { length: 50 }).notNull().default("admin"), // admin, funeral_home, employee
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
  conditionalQuestionId: integer("conditional_question_id"),
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
  funeralHomeId: integer("funeral_home_id").references(() => funeralHomes.id),
  createdById: integer("created_by_id").notNull(), // Can be funeral home or employee ID
  createdByType: varchar("created_by_type", { length: 20 }).notNull(), // 'funeral_home' or 'employee'
  obituaryId: integer("obituary_id").references(() => obituaries.id),
  slug: text("slug").notNull().unique(),
  personName: text("person_name").notNull(),
  dateOfBirth: text("date_of_birth"),
  dateOfDeath: text("date_of_death"),
  description: text("description"),
  socialMediaLinks: jsonb("social_media_links").default({}), // Object with platform keys: {pinterest: "url", instagram: "url", etc}
  collaboratorPromptDisabled: boolean("collaborator_prompt_disabled").default(false), // Per-memorial setting
  musicPlaylist: text("music_playlist"),
  images: jsonb("images").default([]), // Array of image objects with url, filename, isPrimary
  audioFiles: jsonb("audio_files").default([]), // Array of audio objects with url, filename, title, isPrimary
  youtubeLinks: jsonb("youtube_links").default([]), // Array of youtube objects with url, title, isPrimary
  primaryMediaType: varchar("primary_media_type", { length: 20 }), // 'image', 'audio', 'youtube'
  primaryMediaId: varchar("primary_media_id", { length: 100 }), // ID/filename of primary media
  isPublic: boolean("is_public").notNull().default(true),
  allowComments: boolean("allow_comments").notNull().default(true),
  // New fields for enhanced functionality
  pageLayout: jsonb("page_layout"), // Store drag-and-drop layout and styling
  theme: varchar("theme", { length: 100 }).default("classic"), // Theme selection
  backgroundImage: varchar("background_image", { length: 500 }), // Background image URL
  customStyles: jsonb("custom_styles"), // Additional styling options
  status: varchar("status", { length: 50 }).default("draft"), // draft, published, private
  viewCount: integer("view_count").default(0),
  // Cemetery/Grave Plot Information
  cemeteryName: text("cemetery_name"),
  cemeterySection: text("cemetery_section"),
  plotNumber: text("plot_number"),
  graveNotes: text("grave_notes"),
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

// Final Space Collaborators
export const finalSpaceCollaborators = pgTable("final_space_collaborators", {
  id: serial("id").primaryKey(),
  finalSpaceId: integer("final_space_id").references(() => finalSpaces.id).notNull(),
  collaboratorEmail: varchar("collaborator_email", { length: 255 }).notNull(),
  collaboratorName: varchar("collaborator_name", { length: 255 }),
  invitedBy: integer("invited_by").notNull(),
  invitedByType: varchar("invited_by_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Final Space Collaboration Sessions
export const finalSpaceCollaborationSessions = pgTable("final_space_collaboration_sessions", {
  id: serial("id").primaryKey(),
  uuid: varchar("uuid", { length: 255 }).unique().notNull(),
  finalSpaceId: integer("final_space_id").references(() => finalSpaces.id).notNull(),
  collaboratorEmail: varchar("collaborator_email", { length: 255 }).notNull(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Community Contributions
export const communityContributions = pgTable("community_contributions", {
  id: serial("id").primaryKey(),
  finalSpaceId: integer("final_space_id").references(() => finalSpaces.id, { onDelete: "cascade" }).notNull(),
  contributorId: integer("contributor_id").notNull(),
  contributorType: varchar("contributor_type", { length: 50 }).notNull(), // admin, funeral_home, employee, individual
  contributorName: varchar("contributor_name", { length: 255 }).notNull(),
  contributorEmail: varchar("contributor_email", { length: 255 }).notNull(),
  contributionType: varchar("contribution_type", { length: 20 }).notNull(), // image, audio, youtube, text
  mediaPath: text("media_path"), // for image/audio files
  youtubeUrl: text("youtube_url"), // for YouTube links
  textContent: text("text_content"), // for text contributions
  originalFileName: varchar("original_file_name", { length: 255 }),
  position: jsonb("position").default({}), // x, y coordinates and styling for memorial layout
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Community Contribution Comments
export const communityContributionComments = pgTable("community_contribution_comments", {
  id: serial("id").primaryKey(),
  contributionId: integer("contribution_id").references(() => communityContributions.id, { onDelete: "cascade" }).notNull(),
  commenterName: varchar("commenter_name", { length: 255 }).notNull(),
  commenterEmail: varchar("commenter_email", { length: 255 }).notNull(),
  commentText: text("comment_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  responseType: varchar("response_type", { length: 50 }).default("survey").notNull(),
  completedById: integer("completed_by_id"),
  completedByType: varchar("completed_by_type", { length: 50 }),
  submittedAt: timestamp("submitted_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  collaborators: many(finalSpaceCollaborators),
  collaborationSessions: many(finalSpaceCollaborationSessions),
  communityContributions: many(communityContributions),
}));

export const finalSpaceCollaboratorsRelations = relations(finalSpaceCollaborators, ({ one }) => ({
  finalSpace: one(finalSpaces, {
    fields: [finalSpaceCollaborators.finalSpaceId],
    references: [finalSpaces.id],
  }),
}));

export const finalSpaceCollaborationSessionsRelations = relations(finalSpaceCollaborationSessions, ({ one }) => ({
  finalSpace: one(finalSpaces, {
    fields: [finalSpaceCollaborationSessions.finalSpaceId],
    references: [finalSpaces.id],
  }),
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

export const communityContributionsRelations = relations(communityContributions, ({ one, many }) => ({
  finalSpace: one(finalSpaces, {
    fields: [communityContributions.finalSpaceId],
    references: [finalSpaces.id],
  }),
  comments: many(communityContributionComments),
}));

export const communityContributionCommentsRelations = relations(communityContributionComments, ({ one }) => ({
  contribution: one(communityContributions, {
    fields: [communityContributionComments.contributionId],
    references: [communityContributions.id],
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
}).extend({
  fullName: z.string().min(1, "Full name is required").max(200, "Name too long"),
  age: z.number().min(0, "Age cannot be negative").max(150, "Age must be realistic").optional(),
  dateOfBirth: z.string().optional().refine((date) => {
    if (!date) return true;
    const birthDate = new Date(date);
    return birthDate <= new Date();
  }, "Birth date cannot be in the future"),
  dateOfDeath: z.string().optional().refine((date) => {
    if (!date) return true;
    const deathDate = new Date(date);
    return deathDate <= new Date();
  }, "Death date cannot be in the future"),
}).refine((data) => {
  if (data.dateOfBirth && data.dateOfDeath) {
    return new Date(data.dateOfBirth) <= new Date(data.dateOfDeath);
  }
  return true;
}, {
  message: "Death date must be after birth date",
  path: ["dateOfDeath"]
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
}).extend({
  personName: z.string().min(1, "Person name is required").max(200, "Name too long"),
  dateOfBirth: z.string().optional().refine((date) => {
    if (!date) return true;
    const birthDate = new Date(date);
    return birthDate <= new Date();
  }, "Birth date cannot be in the future"),
  dateOfDeath: z.string().optional().refine((date) => {
    if (!date) return true;
    const deathDate = new Date(date);
    return deathDate <= new Date();
  }, "Death date cannot be in the future"),
  description: z.string().max(5000, "Description too long").optional(),
  musicPlaylist: z.string().url("Invalid playlist URL").optional().or(z.literal("")),
}).refine((data) => {
  if (data.dateOfBirth && data.dateOfDeath) {
    return new Date(data.dateOfBirth) <= new Date(data.dateOfDeath);
  }
  return true;
}, {
  message: "Death date must be after birth date",
  path: ["dateOfDeath"]
});

export const insertFinalSpaceCommentSchema = createInsertSchema(finalSpaceComments).omit({
  id: true,
  createdAt: true,
});

export const insertFinalSpaceImageSchema = createInsertSchema(finalSpaceImages).omit({
  id: true,
  createdAt: true,
});

export const insertFinalSpaceCollaboratorSchema = createInsertSchema(finalSpaceCollaborators).omit({
  id: true,
  createdAt: true,
});

export const insertFinalSpaceCollaborationSessionSchema = createInsertSchema(finalSpaceCollaborationSessions).omit({
  id: true,
  createdAt: true,
  lastAccessedAt: true,
});

export const insertObituaryCollaboratorSchema = createInsertSchema(obituaryCollaborators).omit({
  id: true,
  createdAt: true,
});

export const insertCollaborationSessionSchema = createInsertSchema(collaborationSessions).omit({
  id: true,
  createdAt: true,
});

export const insertCommunityContributionSchema = createInsertSchema(communityContributions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunityContributionCommentSchema = createInsertSchema(communityContributionComments).omit({
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

export type FinalSpaceCollaborator = typeof finalSpaceCollaborators.$inferSelect;
export type InsertFinalSpaceCollaborator = z.infer<typeof insertFinalSpaceCollaboratorSchema>;

export type FinalSpaceCollaborationSession = typeof finalSpaceCollaborationSessions.$inferSelect;
export type InsertFinalSpaceCollaborationSession = z.infer<typeof insertFinalSpaceCollaborationSessionSchema>;

// Obituary Reviews - extends obituaries for review workflow
export const obituaryReviews = pgTable("obituary_reviews", {
  id: serial("id").primaryKey(),
  funeralHomeId: integer("funeral_home_id").notNull().references(() => funeralHomes.id),
  createdById: integer("created_by_id").notNull(),
  createdByType: varchar("created_by_type", { length: 20 }).notNull(),
  originalFilename: text("original_filename").notNull(),
  originalFileSize: integer("original_file_size").notNull(),
  extractedText: text("extracted_text").notNull(),
  originalContent: text("original_content"), // Add missing field
  surveyResponses: jsonb("survey_responses").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
  aiProvider: varchar("ai_provider", { length: 20 }), // 'claude' or 'chatgpt'
  improvedContent: text("improved_content"),
  additionalFeedback: text("additional_feedback"),
  // New phrase feedback columns
  positivePhrases: text("positive_phrases"), // JSON array of phrases that work well
  phrasesToImprove: text("phrases_to_improve"), // JSON array of phrases needing improvement
  processedAt: timestamp("processed_at"),
  // Phase 4: Integration with main obituaries system
  finalObituaryId: integer("final_obituary_id").references(() => obituaries.id),
  isPublishedToSystem: boolean("is_published_to_system").default(false).notNull(),
  currentVersion: integer("current_version").default(1).notNull(),
  // Missing fields from storage layer
  uploadedBy: integer("uploaded_by"),
  uploadedByName: varchar("uploaded_by_name", { length: 255 }),
  documentMetadata: jsonb("document_metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Obituary Review Edit History (Phase 4: Version tracking)
export const obituaryReviewEdits = pgTable("obituary_review_edits", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").references(() => obituaryReviews.id, { onDelete: "cascade" }).notNull(),
  version: integer("version").notNull(),
  editedContent: text("edited_content").notNull(),
  editType: varchar("edit_type", { length: 50 }).notNull(), // 'original', 'ai_improved', 'user_edited'
  editedBy: integer("edited_by"),
  editedByType: varchar("edited_by_type", { length: 50 }), // admin, funeral_home, employee, individual
  editedByName: varchar("edited_by_name", { length: 255 }),
  changesSummary: text("changes_summary"), // Summary of what was changed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// API Usage tracking table
export const apiCalls = pgTable("api_calls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  userType: varchar("user_type", { length: 50 }).notNull(),
  obituaryReviewId: integer("obituary_review_id").references(() => obituaryReviews.id),
  provider: varchar("provider", { length: 50 }).notNull(), // 'claude', 'openai', etc
  model: varchar("model", { length: 100 }).notNull(),
  // Enhanced tracking fields
  platformFunction: varchar("platform_function", { length: 100 }).notNull(), // 'obituary_generation', 'obituary_review', 'revision', etc
  promptTemplate: varchar("prompt_template", { length: 100 }), // which template was used
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  tokensUsed: integer("tokens_used"), // total tokens (input + output)
  inputCost: decimal("input_cost", { precision: 10, scale: 6 }),
  outputCost: decimal("output_cost", { precision: 10, scale: 6 }),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 4 }),
  status: varchar("status", { length: 50 }).notNull(), // 'success', 'error', 'rate_limited'
  errorMessage: text("error_message"),
  responseTime: integer("response_time"), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

// API Pricing Configuration table
export const apiPricing = pgTable("api_pricing", {
  id: serial("id").primaryKey(),
  provider: varchar("provider", { length: 50 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  inputCostPer1M: decimal("input_cost_per_1m", { precision: 10, scale: 6 }).notNull(),
  outputCostPer1M: decimal("output_cost_per_1m", { precision: 10, scale: 6 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertObituaryReviewSchema = createInsertSchema(obituaryReviews);
export type ObituaryReview = typeof obituaryReviews.$inferSelect;
export type InsertObituaryReview = z.infer<typeof insertObituaryReviewSchema>;

export const insertObituaryReviewEditSchema = createInsertSchema(obituaryReviewEdits);
export type ObituaryReviewEdit = typeof obituaryReviewEdits.$inferSelect;
export type InsertObituaryReviewEdit = z.infer<typeof insertObituaryReviewEditSchema>;

export const insertApiCallSchema = createInsertSchema(apiCalls);
export type ApiCall = typeof apiCalls.$inferSelect;
export type InsertApiCall = z.infer<typeof insertApiCallSchema>;

export const insertApiPricingSchema = createInsertSchema(apiPricing);
export type ApiPricing = typeof apiPricing.$inferSelect;
export type InsertApiPricing = z.infer<typeof insertApiPricingSchema>;

export type CommunityContribution = typeof communityContributions.$inferSelect;
export type InsertCommunityContribution = z.infer<typeof insertCommunityContributionSchema>;

export type CommunityContributionComment = typeof communityContributionComments.$inferSelect;
export type InsertCommunityContributionComment = z.infer<typeof insertCommunityContributionCommentSchema>;