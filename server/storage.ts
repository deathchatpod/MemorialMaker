import { 
  adminUsers, funeralHomes, employees, employeeInvitations, obituaries, generatedObituaries, 
  textFeedback, surveys, questions, promptTemplates, finalSpaces, finalSpaceComments, finalSpaceImages,
  finalSpaceCollaborators, finalSpaceCollaborationSessions, obituaryCollaborators, collaborationSessions, userTypes, surveyResponses, obituaryReviews, obituaryReviewEdits, apiCalls, apiPricing, communityContributions, communityContributionComments, customerFeedback, notificationPreferences,
  type AdminUser, type InsertAdminUser, type FuneralHome, type InsertFuneralHome,
  type Employee, type InsertEmployee, type EmployeeInvitation, type InsertEmployeeInvitation,
  type Obituary, type InsertObituary, type GeneratedObituary, type InsertGeneratedObituary,
  type TextFeedback, type InsertTextFeedback, type Survey, type InsertSurvey, type Question, type InsertQuestion, 
  type PromptTemplate, type InsertPromptTemplate, type FinalSpace, type InsertFinalSpace, 
  type FinalSpaceComment, type InsertFinalSpaceComment, type FinalSpaceImage, type InsertFinalSpaceImage,
  type FinalSpaceCollaborator, type InsertFinalSpaceCollaborator,
  type FinalSpaceCollaborationSession, type InsertFinalSpaceCollaborationSession,
  type ObituaryCollaborator, type InsertObituaryCollaborator,
  type CollaborationSession, type InsertCollaborationSession,
  type UserType, type InsertUserType, type SurveyResponse, type InsertSurveyResponse,
  type ObituaryReview, type InsertObituaryReview, type ObituaryReviewEdit, type InsertObituaryReviewEdit, type ApiCall, type InsertApiCall, type ApiPricing, type InsertApiPricing, type CommunityContribution, type InsertCommunityContribution, type CommunityContributionComment, type InsertCommunityContributionComment, type CustomerFeedback, type InsertCustomerFeedback, type NotificationPreferences, type InsertNotificationPreferences
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql, or, ilike, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Admin Users
  getAdminUser(id: number): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;

  // Funeral Homes
  getFuneralHome(id: number): Promise<FuneralHome | undefined>;
  getFuneralHomeByEmail(email: string): Promise<FuneralHome | undefined>;
  getAllFuneralHomes(): Promise<FuneralHome[]>;
  createFuneralHome(funeralHome: InsertFuneralHome): Promise<FuneralHome>;
  updateFuneralHome(id: number, updates: Partial<FuneralHome>): Promise<FuneralHome>;
  deleteFuneralHome(id: number): Promise<void>;

  // Employees
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  getEmployeesByFuneralHome(funeralHomeId: number): Promise<Employee[]>;
  getEmployeeCount(funeralHomeId: number): Promise<number>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, updates: Partial<Employee>): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;
  suspendEmployee(id: number): Promise<Employee>;
  activateEmployee(id: number): Promise<Employee>;

  // Employee Invitations
  getEmployeeInvitation(token: string): Promise<EmployeeInvitation | undefined>;
  getEmployeeInvitationsByFuneralHome(funeralHomeId: number): Promise<EmployeeInvitation[]>;
  createEmployeeInvitation(invitation: InsertEmployeeInvitation): Promise<EmployeeInvitation>;
  markInvitationUsed(token: string): Promise<void>;
  deleteEmployeeInvitation(id: number): Promise<void>;

  // Obituaries
  getObituariesByFuneralHome(funeralHomeId: number): Promise<Obituary[]>;
  getObituariesByCreator(createdById: number, createdByType: string): Promise<Obituary[]>;
  getCompletedObituariesByFuneralHome(funeralHomeId: number): Promise<Obituary[]>;
  getAllObituaries(): Promise<Obituary[]>;
  getObituary(id: number): Promise<Obituary | undefined>;
  createObituary(obituary: InsertObituary): Promise<Obituary>;
  updateObituary(id: number, obituary: Partial<Obituary>): Promise<Obituary>;
  deleteObituary(id: number): Promise<void>;
  
  // Generated Obituaries
  getGeneratedObituaries(obituaryId: number): Promise<GeneratedObituary[]>;
  createGeneratedObituary(generatedObituary: InsertGeneratedObituary): Promise<GeneratedObituary>;
  updateGeneratedObituary(id: number, content: string): Promise<GeneratedObituary>;
  
  // Text Feedback
  getTextFeedback(generatedObituaryId: number): Promise<TextFeedback[]>;
  createTextFeedback(feedback: InsertTextFeedback): Promise<TextFeedback>;
  deleteTextFeedback(generatedObituaryId: number): Promise<void>;
  
  // Surveys
  getSurveys(): Promise<Survey[]>;
  getSurvey(id: number): Promise<Survey | undefined>;
  createSurvey(survey: InsertSurvey): Promise<Survey>;
  updateSurvey(id: number, updates: Partial<Survey>): Promise<Survey>;
  deleteSurvey(id: number): Promise<void>;
  
  // Questions
  getQuestions(): Promise<Question[]>;
  getQuestionsBySurvey(surveyId: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<Question>): Promise<Question>;
  deleteQuestion(id: number): Promise<void>;
  
  // Prompt Templates
  getPromptTemplates(): Promise<PromptTemplate[]>;
  getPromptTemplate(platform: string, promptType: string): Promise<PromptTemplate | undefined>;
  createPromptTemplate(template: InsertPromptTemplate): Promise<PromptTemplate>;
  updatePromptTemplate(id: number, template: Partial<PromptTemplate>): Promise<PromptTemplate>;
  deletePromptTemplate(id: number): Promise<void>;
  
  // Final Spaces
  getFinalSpacesByFuneralHome(funeralHomeId: number): Promise<FinalSpace[]>;
  getFinalSpacesByCreator(createdById: number, createdByType: string): Promise<FinalSpace[]>;
  getAllFinalSpaces(): Promise<FinalSpace[]>;
  getFinalSpace(id: number): Promise<FinalSpace | undefined>;
  getFinalSpaceBySlug(slug: string): Promise<FinalSpace | undefined>;
  createFinalSpace(finalSpace: InsertFinalSpace): Promise<FinalSpace>;
  updateFinalSpace(id: number, finalSpace: Partial<FinalSpace>): Promise<FinalSpace>;
  deleteFinalSpace(id: number): Promise<void>;
  
  // Final Space Comments
  getFinalSpaceComments(finalSpaceId: number): Promise<FinalSpaceComment[]>;
  createFinalSpaceComment(comment: InsertFinalSpaceComment): Promise<FinalSpaceComment>;
  deleteFinalSpaceComment(id: number): Promise<void>;
  
  // Final Space Images
  getFinalSpaceImages(commentId: number): Promise<FinalSpaceImage[]>;
  createFinalSpaceImage(image: InsertFinalSpaceImage): Promise<FinalSpaceImage>;
  deleteFinalSpaceImage(id: number): Promise<void>;
  
  // Final Space Collaborators
  getFinalSpaceCollaborators(finalSpaceId: number): Promise<FinalSpaceCollaborator[]>;
  createFinalSpaceCollaborator(collaborator: InsertFinalSpaceCollaborator): Promise<FinalSpaceCollaborator>;
  deleteFinalSpaceCollaborator(id: number): Promise<void>;
  
  // Final Space Collaboration Sessions
  getFinalSpaceCollaborationSession(uuid: string): Promise<FinalSpaceCollaborationSession | undefined>;
  createFinalSpaceCollaborationSession(session: InsertFinalSpaceCollaborationSession): Promise<FinalSpaceCollaborationSession>;
  updateFinalSpaceCollaborationSession(uuid: string, updates: Partial<FinalSpaceCollaborationSession>): Promise<FinalSpaceCollaborationSession>;
  
  // Obituary Collaborators
  getObituaryCollaborators(obituaryId: number): Promise<ObituaryCollaborator[]>;
  createObituaryCollaborator(collaborator: InsertObituaryCollaborator): Promise<ObituaryCollaborator>;
  deleteObituaryCollaborator(id: number): Promise<void>;
  
  // Collaboration Sessions
  getCollaborationSession(uuid: string): Promise<CollaborationSession | undefined>;
  createCollaborationSession(session: InsertCollaborationSession): Promise<CollaborationSession>;
  updateCollaborationSession(uuid: string, updates: Partial<CollaborationSession>): Promise<CollaborationSession>;
  
  // User Types
  getUserTypes(): Promise<UserType[]>;
  createUserType(userType: InsertUserType): Promise<UserType>;

  // Survey Responses
  getSurveyResponses(surveyId: number): Promise<SurveyResponse[]>;
  getSurveyResponsesByType(responseType: string, userId?: number, userType?: string, funeralHomeId?: number): Promise<SurveyResponse[]>;
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;

  // Obituary Reviews
  getObituaryReviews(funeralHomeId?: number): Promise<ObituaryReview[]>;
  getObituaryReview(id: number): Promise<ObituaryReview | undefined>;
  createObituaryReview(review: InsertObituaryReview): Promise<ObituaryReview>;
  updateObituaryReview(id: number, updates: Partial<ObituaryReview>): Promise<ObituaryReview>;
  deleteObituaryReview(id: number): Promise<void>;
  
  // Obituary Review Edit History (Phase 4)
  getObituaryReviewEdits(reviewId: number): Promise<ObituaryReviewEdit[]>;
  createObituaryReviewEdit(edit: InsertObituaryReviewEdit): Promise<ObituaryReviewEdit>;
  publishObituaryReviewToSystem(reviewId: number, userId: number, userType: string): Promise<Obituary>;
  
  // API Calls
  getApiCalls(userId?: number, timeRange?: { start: Date; end: Date }): Promise<ApiCall[]>;
  createApiCall(apiCall: InsertApiCall): Promise<number>;
  updateApiCall(id: number, updates: Partial<ApiCall>): Promise<ApiCall>;
  
  // API Pricing
  getApiPricing(): Promise<ApiPricing[]>;
  getApiPricingByProvider(provider: string, model: string): Promise<ApiPricing | undefined>;
  createApiPricing(pricing: InsertApiPricing): Promise<ApiPricing>;
  updateApiPricing(id: number, updates: Partial<ApiPricing>): Promise<ApiPricing>;
  deleteApiPricing(id: number): Promise<void>;
  
  // Collaboration queries for unified table
  getObituaryCollaborationsByEmail(email: string): Promise<any[]>;
  getFinalSpaceCollaborationsByEmail(email: string): Promise<any[]>;
  
  // Community Contributions
  getCommunityContributions(finalSpaceId: number): Promise<CommunityContribution[]>;
  getCommunityContribution(id: number): Promise<CommunityContribution | undefined>;
  createCommunityContribution(contribution: InsertCommunityContribution): Promise<CommunityContribution>;
  updateCommunityContribution(id: number, updates: Partial<CommunityContribution>): Promise<CommunityContribution>;
  deleteCommunityContribution(id: number): Promise<void>;
  
  // Community Contribution Comments
  getCommunityContributionComments(contributionId: number): Promise<CommunityContributionComment[]>;
  createCommunityContributionComment(comment: InsertCommunityContributionComment): Promise<CommunityContributionComment>;
  deleteCommunityContributionComment(id: number): Promise<void>;
  
  // Customer Feedback
  getCustomerFeedback(): Promise<CustomerFeedback[]>;
  getCustomerFeedbackById(id: number): Promise<CustomerFeedback | undefined>;
  createCustomerFeedback(feedback: InsertCustomerFeedback): Promise<CustomerFeedback>;
  updateCustomerFeedbackStatus(id: number, status: string): Promise<CustomerFeedback | undefined>;
  
  // Notification Preferences
  getNotificationPreferences(userId: number, userType: string): Promise<NotificationPreferences | undefined>;
  updateNotificationPreferences(userId: number, userType: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
  
  // Search functionality
  searchContent(query: string, filters?: {
    type?: 'obituaries' | 'memorials' | 'all';
    dateFrom?: string;
    dateTo?: string;
    funeralHomeId?: number;
    status?: string;
  }): Promise<{
    obituaries: any[];
    memorials: any[];
    total: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Admin Users
  async getAdminUser(id: number): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user || undefined;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return user || undefined;
  }

  async createAdminUser(insertUser: InsertAdminUser): Promise<AdminUser> {
    const [user] = await db.insert(adminUsers).values(insertUser).returning();
    return user;
  }

  // Funeral Homes
  async getFuneralHome(id: number): Promise<FuneralHome | undefined> {
    const [funeralHome] = await db.select().from(funeralHomes).where(eq(funeralHomes.id, id));
    return funeralHome || undefined;
  }

  async getFuneralHomeByEmail(email: string): Promise<FuneralHome | undefined> {
    const [funeralHome] = await db.select().from(funeralHomes).where(eq(funeralHomes.email, email));
    return funeralHome || undefined;
  }

  async getAllFuneralHomes(): Promise<FuneralHome[]> {
    return await db.select().from(funeralHomes).orderBy(desc(funeralHomes.createdAt));
  }

  async createFuneralHome(insertFuneralHome: InsertFuneralHome): Promise<FuneralHome> {
    const [funeralHome] = await db.insert(funeralHomes).values(insertFuneralHome).returning();
    return funeralHome;
  }

  async updateFuneralHome(id: number, updates: Partial<FuneralHome>): Promise<FuneralHome> {
    const [funeralHome] = await db
      .update(funeralHomes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(funeralHomes.id, id))
      .returning();
    return funeralHome;
  }

  async deleteFuneralHome(id: number): Promise<void> {
    await db.delete(funeralHomes).where(eq(funeralHomes.id, id));
  }

  // Employees
  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.email, email));
    return employee || undefined;
  }

  async getEmployeesByFuneralHome(funeralHomeId: number): Promise<Employee[]> {
    return await db.select().from(employees)
      .where(eq(employees.funeralHomeId, funeralHomeId))
      .orderBy(desc(employees.createdAt));
  }

  async getEmployeeCount(funeralHomeId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(employees)
      .where(and(eq(employees.funeralHomeId, funeralHomeId), eq(employees.isActive, true)));
    return result[0]?.count || 0;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(insertEmployee).returning();
    return employee;
  }

  async updateEmployee(id: number, updates: Partial<Employee>): Promise<Employee> {
    const [employee] = await db
      .update(employees)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return employee;
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  async suspendEmployee(id: number): Promise<Employee> {
    return this.updateEmployee(id, { isActive: false });
  }

  async activateEmployee(id: number): Promise<Employee> {
    return this.updateEmployee(id, { isActive: true });
  }

  // Employee Invitations
  async getEmployeeInvitation(token: string): Promise<EmployeeInvitation | undefined> {
    const [invitation] = await db.select().from(employeeInvitations)
      .where(eq(employeeInvitations.inviteToken, token));
    return invitation || undefined;
  }

  async getEmployeeInvitationsByFuneralHome(funeralHomeId: number): Promise<EmployeeInvitation[]> {
    return await db.select().from(employeeInvitations)
      .where(eq(employeeInvitations.funeralHomeId, funeralHomeId))
      .orderBy(desc(employeeInvitations.createdAt));
  }

  async createEmployeeInvitation(insertInvitation: InsertEmployeeInvitation): Promise<EmployeeInvitation> {
    const [invitation] = await db.insert(employeeInvitations).values(insertInvitation).returning();
    return invitation;
  }

  async markInvitationUsed(token: string): Promise<void> {
    await db.update(employeeInvitations)
      .set({ isUsed: true })
      .where(eq(employeeInvitations.inviteToken, token));
  }

  async deleteEmployeeInvitation(id: number): Promise<void> {
    await db.delete(employeeInvitations).where(eq(employeeInvitations.id, id));
  }

  // Obituaries
  async getObituariesByFuneralHome(funeralHomeId: number): Promise<Obituary[]> {
    return await db.select().from(obituaries)
      .where(eq(obituaries.funeralHomeId, funeralHomeId))
      .orderBy(desc(obituaries.createdAt));
  }

  async getObituariesByCreator(createdById: number, createdByType: string): Promise<Obituary[]> {
    return await db.select().from(obituaries)
      .where(and(eq(obituaries.createdById, createdById), eq(obituaries.createdByType, createdByType)))
      .orderBy(desc(obituaries.createdAt));
  }

  async getCompletedObituariesByFuneralHome(funeralHomeId: number): Promise<Obituary[]> {
    return await db.select().from(obituaries)
      .where(and(eq(obituaries.funeralHomeId, funeralHomeId), eq(obituaries.status, 'generated')))
      .orderBy(desc(obituaries.createdAt));
  }

  async getAllObituaries(): Promise<Obituary[]> {
    return await db.select().from(obituaries).orderBy(desc(obituaries.createdAt));
  }

  async getObituary(id: number): Promise<Obituary | undefined> {
    const [obituary] = await db.select().from(obituaries).where(eq(obituaries.id, id));
    return obituary || undefined;
  }

  async createObituary(insertObituary: InsertObituary): Promise<Obituary> {
    const [obituary] = await db.insert(obituaries).values(insertObituary).returning();
    return obituary;
  }

  async updateObituary(id: number, updates: Partial<Obituary>): Promise<Obituary> {
    const [obituary] = await db
      .update(obituaries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(obituaries.id, id))
      .returning();
    return obituary;
  }

  async deleteObituary(id: number): Promise<void> {
    await db.delete(obituaries).where(eq(obituaries.id, id));
  }

  // Generated Obituaries
  async getGeneratedObituaries(obituaryId: number): Promise<GeneratedObituary[]> {
    return await db.select().from(generatedObituaries)
      .where(eq(generatedObituaries.obituaryId, obituaryId))
      .orderBy(generatedObituaries.aiProvider, generatedObituaries.version);
  }

  async createGeneratedObituary(insertGeneratedObituary: InsertGeneratedObituary): Promise<GeneratedObituary> {
    const [generatedObituary] = await db.insert(generatedObituaries).values(insertGeneratedObituary).returning();
    return generatedObituary;
  }

  async updateGeneratedObituary(id: number, content: string): Promise<GeneratedObituary> {
    const [obituary] = await db
      .update(generatedObituaries)
      .set({ content })
      .where(eq(generatedObituaries.id, id))
      .returning();
    return obituary;
  }

  // Text Feedback
  async getTextFeedback(generatedObituaryId: number): Promise<TextFeedback[]> {
    return await db.select().from(textFeedback)
      .where(eq(textFeedback.generatedObituaryId, generatedObituaryId))
      .orderBy(desc(textFeedback.createdAt));
  }

  async createTextFeedback(insertFeedback: InsertTextFeedback): Promise<TextFeedback> {
    const [feedback] = await db.insert(textFeedback).values(insertFeedback).returning();
    return feedback;
  }

  async deleteTextFeedback(generatedObituaryId: number): Promise<void> {
    await db.delete(textFeedback).where(eq(textFeedback.generatedObituaryId, generatedObituaryId));
  }

  // Surveys
  async getSurveys(): Promise<Survey[]> {
    return await db.select().from(surveys)
      .orderBy(desc(surveys.updatedAt));
  }

  async getSurvey(id: number): Promise<Survey | undefined> {
    const [survey] = await db.select().from(surveys).where(eq(surveys.id, id));
    return survey || undefined;
  }

  async createSurvey(insertSurvey: InsertSurvey): Promise<Survey> {
    const [survey] = await db.insert(surveys).values(insertSurvey).returning();
    return survey;
  }

  async updateSurvey(id: number, updates: Partial<Survey>): Promise<Survey> {
    const [survey] = await db
      .update(surveys)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(surveys.id, id))
      .returning();
    return survey;
  }

  async deleteSurvey(id: number): Promise<void> {
    await db.delete(surveys).where(eq(surveys.id, id));
  }

  // Questions
  async getQuestions(): Promise<Question[]> {
    return await db.select().from(questions)
      .orderBy(questions.surveyId, questions.orderIndex);
  }

  async getQuestionsBySurvey(surveyId: number): Promise<Question[]> {
    return await db.select().from(questions)
      .where(eq(questions.surveyId, surveyId))
      .orderBy(questions.orderIndex);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values(insertQuestion).returning();
    return question;
  }

  async updateQuestion(id: number, updates: Partial<Question>): Promise<Question> {
    try {
      const [question] = await db
        .update(questions)
        .set(updates)
        .where(eq(questions.id, id))
        .returning();
      
      if (!question) {
        throw new Error(`Question with id ${id} not found`);
      }
      
      return question;
    } catch (error) {

      throw error;
    }
  }

  async deleteQuestion(id: number): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  // Prompt Templates
  async getPromptTemplates(): Promise<PromptTemplate[]> {
    // Use raw query to handle column name mismatch temporarily
    const templates = await db.execute(sql`
      SELECT id, name, platform, prompt_type, template as content, created_at, updated_at 
      FROM prompt_templates 
      ORDER BY platform, prompt_type
    `);
    return templates.rows.map(row => ({
      id: row.id as number,
      name: row.name as string,
      platform: row.platform as string,
      promptType: row.prompt_type as string,
      content: row.content as string,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
    }));
  }

  async getPromptTemplate(platform: string, promptType: string): Promise<PromptTemplate | undefined> {
    const [template] = await db.select().from(promptTemplates)
      .where(and(eq(promptTemplates.platform, platform), eq(promptTemplates.promptType, promptType)));
    return template || undefined;
  }

  async createPromptTemplate(insertTemplate: InsertPromptTemplate): Promise<PromptTemplate> {
    const [template] = await db.insert(promptTemplates).values(insertTemplate).returning();
    return template;
  }

  async updatePromptTemplate(id: number, updates: Partial<PromptTemplate>): Promise<PromptTemplate> {
    const [template] = await db
      .update(promptTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(promptTemplates.id, id))
      .returning();
    return template;
  }

  async deletePromptTemplate(id: number): Promise<void> {
    await db.delete(promptTemplates).where(eq(promptTemplates.id, id));
  }

  // Final Spaces
  async getFinalSpacesByFuneralHome(funeralHomeId: number): Promise<FinalSpace[]> {
    return await db.select().from(finalSpaces)
      .where(eq(finalSpaces.funeralHomeId, funeralHomeId))
      .orderBy(desc(finalSpaces.createdAt));
  }

  async getFinalSpacesByCreator(createdById: number, createdByType: string): Promise<FinalSpace[]> {
    return await db.select().from(finalSpaces)
      .where(and(eq(finalSpaces.createdById, createdById), eq(finalSpaces.createdByType, createdByType)))
      .orderBy(desc(finalSpaces.createdAt));
  }

  async getAllFinalSpaces(): Promise<FinalSpace[]> {
    return await db.select().from(finalSpaces).orderBy(desc(finalSpaces.createdAt));
  }

  async getFinalSpace(id: number): Promise<FinalSpace | undefined> {
    const [finalSpace] = await db.select().from(finalSpaces).where(eq(finalSpaces.id, id));
    return finalSpace || undefined;
  }

  async getFinalSpaceBySlug(slug: string): Promise<FinalSpace | undefined> {
    const [finalSpace] = await db.select().from(finalSpaces).where(eq(finalSpaces.slug, slug));
    return finalSpace || undefined;
  }

  async createFinalSpace(insertFinalSpace: InsertFinalSpace): Promise<FinalSpace> {
    const [finalSpace] = await db.insert(finalSpaces).values(insertFinalSpace).returning();
    return finalSpace;
  }

  async updateFinalSpace(id: number, updates: Partial<FinalSpace>): Promise<FinalSpace> {
    const [finalSpace] = await db
      .update(finalSpaces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(finalSpaces.id, id))
      .returning();
    return finalSpace;
  }

  async deleteFinalSpace(id: number): Promise<void> {
    await db.delete(finalSpaces).where(eq(finalSpaces.id, id));
  }

  // Final Space Comments
  async getFinalSpaceComments(finalSpaceId: number): Promise<FinalSpaceComment[]> {
    return await db.select().from(finalSpaceComments)
      .where(eq(finalSpaceComments.finalSpaceId, finalSpaceId))
      .orderBy(desc(finalSpaceComments.createdAt));
  }

  async createFinalSpaceComment(insertComment: InsertFinalSpaceComment): Promise<FinalSpaceComment> {
    const [comment] = await db.insert(finalSpaceComments).values(insertComment).returning();
    return comment;
  }

  async deleteFinalSpaceComment(id: number): Promise<void> {
    await db.delete(finalSpaceComments).where(eq(finalSpaceComments.id, id));
  }

  // Final Space Images
  async getFinalSpaceImages(commentId: number): Promise<FinalSpaceImage[]> {
    return await db.select().from(finalSpaceImages)
      .where(eq(finalSpaceImages.commentId, commentId))
      .orderBy(desc(finalSpaceImages.createdAt));
  }

  async createFinalSpaceImage(insertImage: InsertFinalSpaceImage): Promise<FinalSpaceImage> {
    const [image] = await db.insert(finalSpaceImages).values(insertImage).returning();
    return image;
  }

  async deleteFinalSpaceImage(id: number): Promise<void> {
    await db.delete(finalSpaceImages).where(eq(finalSpaceImages.id, id));
  }
  
  // Final Space Collaborators
  async getFinalSpaceCollaborators(finalSpaceId: number): Promise<FinalSpaceCollaborator[]> {
    return await db.select().from(finalSpaceCollaborators).where(eq(finalSpaceCollaborators.finalSpaceId, finalSpaceId));
  }

  async createFinalSpaceCollaborator(insertCollaborator: InsertFinalSpaceCollaborator): Promise<FinalSpaceCollaborator> {
    const [collaborator] = await db
      .insert(finalSpaceCollaborators)
      .values(insertCollaborator)
      .returning();
    return collaborator;
  }

  async deleteFinalSpaceCollaborator(id: number): Promise<void> {
    await db.delete(finalSpaceCollaborators).where(eq(finalSpaceCollaborators.id, id));
  }
  
  // Final Space Collaboration Sessions
  async getFinalSpaceCollaborationSession(uuid: string): Promise<FinalSpaceCollaborationSession | undefined> {
    const [session] = await db.select().from(finalSpaceCollaborationSessions).where(eq(finalSpaceCollaborationSessions.uuid, uuid));
    return session;
  }

  async createFinalSpaceCollaborationSession(insertSession: InsertFinalSpaceCollaborationSession): Promise<FinalSpaceCollaborationSession> {
    const [session] = await db
      .insert(finalSpaceCollaborationSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateFinalSpaceCollaborationSession(uuid: string, updates: Partial<FinalSpaceCollaborationSession>): Promise<FinalSpaceCollaborationSession> {
    const [session] = await db
      .update(finalSpaceCollaborationSessions)
      .set(updates)
      .where(eq(finalSpaceCollaborationSessions.uuid, uuid))
      .returning();
    return session;
  }

  // Obituary Collaborators
  async getObituaryCollaborators(obituaryId: number): Promise<ObituaryCollaborator[]> {
    return await db.select().from(obituaryCollaborators)
      .where(eq(obituaryCollaborators.obituaryId, obituaryId))
      .orderBy(desc(obituaryCollaborators.createdAt));
  }

  async createObituaryCollaborator(insertCollaborator: InsertObituaryCollaborator): Promise<ObituaryCollaborator> {
    const [collaborator] = await db.insert(obituaryCollaborators).values(insertCollaborator).returning();
    return collaborator;
  }

  async deleteObituaryCollaborator(id: number): Promise<void> {
    await db.delete(obituaryCollaborators).where(eq(obituaryCollaborators.id, id));
  }

  // Collaboration Sessions
  async getCollaborationSession(uuid: string): Promise<CollaborationSession | undefined> {
    const [session] = await db.select().from(collaborationSessions)
      .where(eq(collaborationSessions.uuid, uuid));
    return session || undefined;
  }

  async createCollaborationSession(insertSession: InsertCollaborationSession): Promise<CollaborationSession> {
    const [session] = await db.insert(collaborationSessions).values(insertSession).returning();
    return session;
  }

  async updateCollaborationSession(uuid: string, updates: Partial<CollaborationSession>): Promise<CollaborationSession> {
    const [session] = await db
      .update(collaborationSessions)
      .set(updates)
      .where(eq(collaborationSessions.uuid, uuid))
      .returning();
    return session;
  }

  // User Types
  async getUserTypes(): Promise<UserType[]> {
    return await db.select().from(userTypes).where(eq(userTypes.isActive, true)).orderBy(userTypes.name);
  }

  async createUserType(insertUserType: InsertUserType): Promise<UserType> {
    const [userType] = await db.insert(userTypes).values(insertUserType).returning();
    return userType;
  }

  // Survey Responses
  async getSurveyResponses(surveyId: number): Promise<SurveyResponse[]> {
    return await db.select().from(surveyResponses).where(eq(surveyResponses.surveyId, surveyId));
  }

  async createSurveyResponse(insertResponse: InsertSurveyResponse): Promise<SurveyResponse> {
    const [response] = await db.insert(surveyResponses).values(insertResponse).returning();
    return response;
  }
  
  // Collaboration queries for unified table
  async getObituaryCollaborationsByEmail(email: string): Promise<any[]> {
    return await db
      .select({
        id: obituaryCollaborators.id,
        obituaryId: obituaryCollaborators.obituaryId,
        obituaryTitle: obituaries.deceasedName,
        collaboratorEmail: obituaryCollaborators.collaboratorEmail,
        status: obituaryCollaborators.status,
        invitedBy: obituaryCollaborators.invitedBy,
        invitedByType: obituaryCollaborators.invitedByType,
        createdAt: obituaryCollaborators.createdAt,
      })
      .from(obituaryCollaborators)
      .leftJoin(obituaries, eq(obituaryCollaborators.obituaryId, obituaries.id))
      .where(eq(obituaryCollaborators.collaboratorEmail, email));
  }

  async getFinalSpaceCollaborationsByEmail(email: string): Promise<any[]> {
    return await db
      .select({
        id: finalSpaceCollaborators.id,
        finalSpaceId: finalSpaceCollaborators.finalSpaceId,
        finalSpaceName: finalSpaces.personName,
        collaboratorEmail: finalSpaceCollaborators.collaboratorEmail,
        status: finalSpaceCollaborators.status,
        invitedBy: finalSpaceCollaborators.invitedBy,
        invitedByType: finalSpaceCollaborators.invitedByType,
        createdAt: finalSpaceCollaborators.createdAt,
      })
      .from(finalSpaceCollaborators)
      .leftJoin(finalSpaces, eq(finalSpaceCollaborators.finalSpaceId, finalSpaces.id))
      .where(eq(finalSpaceCollaborators.collaboratorEmail, email));
  }

  // Search functionality implementation
  async searchContent(query: string, filters?: {
    type?: 'obituaries' | 'memorials' | 'all';
    dateFrom?: string;
    dateTo?: string;
    funeralHomeId?: number;
    status?: string;
  }): Promise<{
    obituaries: any[];
    memorials: any[];
    total: number;
  }> {
    const searchResults = {
      obituaries: [] as any[],
      memorials: [] as any[],
      total: 0
    };

    const searchQuery = `%${query}%`;
    
    // Search obituaries if not filtered to memorials only
    if (!filters?.type || filters.type === 'obituaries' || filters.type === 'all') {
      let obituaryQuery = db
        .select({
          id: obituaries.id,
          type: sql<string>`'obituary'`,
          title: obituaries.deceasedName,
          description: obituaries.personalityTraits,
          createdAt: obituaries.createdAt,
          funeralHomeId: obituaries.funeralHomeId,
          status: obituaries.status
        })
        .from(obituaries)
        .where(
          or(
            ilike(obituaries.deceasedName, searchQuery),
            ilike(obituaries.personalityTraits, searchQuery),
            ilike(obituaries.biography, searchQuery)
          )
        );

      searchResults.obituaries = await obituaryQuery.orderBy(desc(obituaries.createdAt));
    }

    // Search memorials if not filtered to obituaries only
    if (!filters?.type || filters.type === 'memorials' || filters.type === 'all') {
      let memorialQuery = db
        .select({
          id: finalSpaces.id,
          type: sql<string>`'memorial'`,
          title: finalSpaces.personName,
          description: finalSpaces.description,
          createdAt: finalSpaces.createdAt,
          funeralHomeId: finalSpaces.funeralHomeId,
          status: finalSpaces.status
        })
        .from(finalSpaces)
        .where(
          or(
            ilike(finalSpaces.personName, searchQuery),
            ilike(finalSpaces.description, searchQuery),
            ilike(finalSpaces.slug, searchQuery)
          )
        );

      searchResults.memorials = await memorialQuery.orderBy(desc(finalSpaces.createdAt));
    }

    searchResults.total = searchResults.obituaries.length + searchResults.memorials.length;
    return searchResults;
  }

  async getSurveyResponsesByType(responseType: string, userId?: number, userType?: string, funeralHomeId?: number): Promise<SurveyResponse[]> {
    const query = db.select().from(surveyResponses).where(eq(surveyResponses.responseType, responseType));
    return query.orderBy(desc(surveyResponses.createdAt));
  }

  // Obituary Reviews
  async getObituaryReviews(funeralHomeId?: number): Promise<ObituaryReview[]> {
    let query = db.select().from(obituaryReviews);
    
    if (funeralHomeId) {
      query = query.where(eq(obituaryReviews.funeralHomeId, funeralHomeId));
    }
    
    return await query.orderBy(desc(obituaryReviews.createdAt));
  }

  async getObituaryReview(id: number): Promise<ObituaryReview | undefined> {
    const [review] = await db.select().from(obituaryReviews).where(eq(obituaryReviews.id, id));
    return review;
  }

  async createObituaryReview(review: InsertObituaryReview): Promise<ObituaryReview> {
    const [newReview] = await db.insert(obituaryReviews).values(review).returning();
    return newReview;
  }

  async updateObituaryReview(id: number, updates: Partial<ObituaryReview>): Promise<ObituaryReview> {
    const [updatedReview] = await db.update(obituaryReviews)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(obituaryReviews.id, id))
      .returning();
    return updatedReview;
  }

  async getObituaryReview(id: number): Promise<ObituaryReview | undefined> {
    const [review] = await db.select().from(obituaryReviews).where(eq(obituaryReviews.id, id));
    return review || undefined;
  }

  async deleteObituaryReview(id: number): Promise<void> {
    await db.delete(obituaryReviews).where(eq(obituaryReviews.id, id));
  }

  async getObituaryReviewEdits(reviewId: number): Promise<ObituaryReviewEdit[]> {
    return db.select().from(obituaryReviewEdits).where(eq(obituaryReviewEdits.reviewId, reviewId));
  }

  async createObituaryReviewEdit(edit: InsertObituaryReviewEdit): Promise<ObituaryReviewEdit> {
    const [newEdit] = await db.insert(obituaryReviewEdits).values(edit).returning();
    return newEdit;
  }

  async publishObituaryReviewToSystem(reviewId: number, userId: number, userType: string): Promise<Obituary> {
    const review = await this.getObituaryReview(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    const obituaryData: InsertObituary = {
      funeralHomeId: review.funeralHomeId,
      createdById: userId,
      createdByType: userType,
      fullName: review.originalFilename.replace(/\.[^/.]+$/, ""),
      formData: review.surveyResponses || {},
      status: 'generated'
    };

    const obituary = await this.createObituary(obituaryData);
    
    await this.updateObituaryReview(reviewId, {
      isPublishedToSystem: true,
      finalObituaryId: obituary.id
    });

    return obituary;
  }

  // API Calls methods
  async getApiCalls(userId?: number, timeRange?: { start: Date; end: Date }): Promise<ApiCall[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(apiCalls.userId, userId));
    }
    
    if (timeRange) {
      conditions.push(gte(apiCalls.createdAt, timeRange.start));
      conditions.push(lte(apiCalls.createdAt, timeRange.end));
    }
    
    let query = db.select().from(apiCalls);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(apiCalls.createdAt));
  }

  async createApiCall(apiCall: InsertApiCall): Promise<number> {
    const [newCall] = await db.insert(apiCalls).values(apiCall).returning({ id: apiCalls.id });
    return newCall.id;
  }

  async updateApiCall(id: number, updates: Partial<ApiCall>): Promise<ApiCall> {
    const [updatedCall] = await db.update(apiCalls)
      .set(updates)
      .where(eq(apiCalls.id, id))
      .returning();
    return updatedCall;
  }

  // API Pricing management methods
  async getApiPricing(): Promise<ApiPricing[]> {
    return await db.select().from(apiPricing).where(eq(apiPricing.isActive, true)).orderBy(apiPricing.provider, apiPricing.model);
  }

  async getApiPricingByProvider(provider: string, model: string): Promise<ApiPricing | undefined> {
    const [pricing] = await db.select().from(apiPricing)
      .where(
        and(
          eq(apiPricing.provider, provider),
          eq(apiPricing.model, model),
          eq(apiPricing.isActive, true)
        )
      );
    return pricing;
  }

  async createApiPricing(pricing: InsertApiPricing): Promise<ApiPricing> {
    const [newPricing] = await db.insert(apiPricing).values(pricing).returning();
    return newPricing;
  }

  async updateApiPricing(id: number, updates: Partial<ApiPricing>): Promise<ApiPricing> {
    const [updatedPricing] = await db.update(apiPricing)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(apiPricing.id, id))
      .returning();
    return updatedPricing;
  }

  async deleteApiPricing(id: number): Promise<void> {
    await db.delete(apiPricing).where(eq(apiPricing.id, id));
  }

  // Phase 4: Obituary Review Edit History
  async getObituaryReviewEdits(reviewId: number): Promise<ObituaryReviewEdit[]> {
    return db.select().from(obituaryReviewEdits)
      .where(eq(obituaryReviewEdits.reviewId, reviewId))
      .orderBy(desc(obituaryReviewEdits.version));
  }

  async createObituaryReviewEdit(edit: InsertObituaryReviewEdit): Promise<ObituaryReviewEdit> {
    const [newEdit] = await db.insert(obituaryReviewEdits).values(edit).returning();
    return newEdit;
  }

  async publishObituaryReviewToSystem(reviewId: number, userId: number, userType: string): Promise<Obituary> {
    // Get the review and its latest version
    const review = await this.getObituaryReview(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    const edits = await this.getObituaryReviewEdits(reviewId);
    const latestEdit = edits[0]; // Most recent version
    const finalContent = latestEdit?.editedContent || review.improvedContent || review.extractedText;

    // Extract name from survey responses for obituary title
    const responses = review.surveyResponses as any;
    const deceasedName = responses?.['Full Name'] || responses?.['full_name'] || 'Unknown';

    // Create obituary in main system with proper formData
    const formData = {
      fullName: deceasedName,
      reviewContent: finalContent,
      originalFilename: review.originalFilename,
      extractedFromReview: true,
      tone: "respectful",
      traits: [],
      hobbies: [],
      children: [],
      grandchildren: [],
      siblings: [],
      parents: []
    };

    const obituaryData: InsertObituary = {
      funeralHomeId: review.funeralHomeId,
      createdById: userId,
      createdByType: userType,
      fullName: deceasedName,
      formData: formData,
      status: 'completed'
    };



    const newObituary = await this.createObituary(obituaryData);

    // Create generated obituary content
    await this.createGeneratedObituary({
      obituaryId: newObituary.id,
      content: finalContent,
      aiProvider: review.aiProvider || 'claude',
      version: 1,
    });

    // Update review to mark as published
    await this.updateObituaryReview(reviewId, {
      finalObituaryId: newObituary.id,
      isPublishedToSystem: true,
    });

    return newObituary;
  }

  async deleteObituaryReview(id: number): Promise<void> {
    // First delete related API calls to avoid foreign key constraint violation
    await db.delete(apiCalls).where(eq(apiCalls.obituaryReviewId, id));
    
    // Then delete the obituary review
    await db.delete(obituaryReviews).where(eq(obituaryReviews.id, id));
  }

  // Community Contributions
  async getCommunityContributions(finalSpaceId: number): Promise<CommunityContribution[]> {
    return await db
      .select()
      .from(communityContributions)
      .where(and(
        eq(communityContributions.finalSpaceId, finalSpaceId),
        eq(communityContributions.isVisible, true)
      ))
      .orderBy(desc(communityContributions.createdAt));
  }

  async getCommunityContribution(id: number): Promise<CommunityContribution | undefined> {
    const [contribution] = await db
      .select()
      .from(communityContributions)
      .where(eq(communityContributions.id, id));
    return contribution || undefined;
  }

  async createCommunityContribution(contribution: InsertCommunityContribution): Promise<CommunityContribution> {
    const [newContribution] = await db
      .insert(communityContributions)
      .values(contribution)
      .returning();
    return newContribution;
  }

  async updateCommunityContribution(id: number, updates: Partial<CommunityContribution>): Promise<CommunityContribution> {
    const [updatedContribution] = await db
      .update(communityContributions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(communityContributions.id, id))
      .returning();
    return updatedContribution;
  }

  async deleteCommunityContribution(id: number): Promise<void> {
    await db.delete(communityContributions).where(eq(communityContributions.id, id));
  }

  // Community Contribution Comments
  async getCommunityContributionComments(contributionId: number): Promise<CommunityContributionComment[]> {
    return await db
      .select()
      .from(communityContributionComments)
      .where(eq(communityContributionComments.contributionId, contributionId))
      .orderBy(communityContributionComments.createdAt);
  }

  async createCommunityContributionComment(comment: InsertCommunityContributionComment): Promise<CommunityContributionComment> {
    const [newComment] = await db
      .insert(communityContributionComments)
      .values(comment)
      .returning();
    return newComment;
  }

  async deleteCommunityContributionComment(id: number): Promise<void> {
    await db.delete(communityContributionComments).where(eq(communityContributionComments.id, id));
  }

  // Customer Feedback methods
  async getCustomerFeedback(): Promise<CustomerFeedback[]> {
    return await db
      .select()
      .from(customerFeedback)
      .orderBy(desc(customerFeedback.createdAt));
  }

  async getCustomerFeedbackById(id: number): Promise<CustomerFeedback | undefined> {
    const [feedback] = await db
      .select()
      .from(customerFeedback)
      .where(eq(customerFeedback.id, id));
    return feedback || undefined;
  }

  async createCustomerFeedback(feedback: InsertCustomerFeedback): Promise<CustomerFeedback> {
    const [newFeedback] = await db
      .insert(customerFeedback)
      .values(feedback)
      .returning();
    return newFeedback;
  }

  async updateCustomerFeedbackStatus(id: number, status: string): Promise<CustomerFeedback | undefined> {
    const [updatedFeedback] = await db
      .update(customerFeedback)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(customerFeedback.id, id))
      .returning();
    return updatedFeedback || undefined;
  }

  // Notification Preferences methods
  async getNotificationPreferences(userId: number, userType: string): Promise<NotificationPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(notificationPreferences)
      .where(and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.userType, userType)
      ));
    
    // If no preferences exist, create default ones
    if (!preferences) {
      const defaultPreferences: InsertNotificationPreferences = {
        userId,
        userType,
        inPlatformEnabled: true,
        emailEnabled: true,
        collaborationInviteReceived: { inPlatform: true, email: true },
        collaborationInviteAccepted: { inPlatform: true, email: true },
        newCollaboratorAdded: { inPlatform: true, email: true },
        collaboratorMadeChanges: { inPlatform: true, email: true },
        obituaryStatusChanged: { inPlatform: true, email: true },
        finalspaceUpdated: { inPlatform: true, email: true },
        newObituaryPublished: { inPlatform: true, email: true },
        contentReviewCompleted: { inPlatform: true, email: true },
        employeeInvitationSent: { inPlatform: true, email: true },
        employeeInvitationAccepted: { inPlatform: true, email: true },
        newTeamMemberJoined: { inPlatform: true, email: true },
        teamMemberRoleChanged: { inPlatform: true, email: true },
        accountInformationUpdated: { inPlatform: true, email: true },
        passwordChanged: { inPlatform: true, email: true },
        loginFromNewDevice: { inPlatform: true, email: true },
        newFeedbackReceived: { inPlatform: true, email: true }
      };
      
      return await this.updateNotificationPreferences(userId, userType, defaultPreferences);
    }
    
    return preferences;
  }

  async updateNotificationPreferences(userId: number, userType: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    // Check if preferences exist
    const existing = await db
      .select()
      .from(notificationPreferences)
      .where(and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.userType, userType)
      ));

    if (existing.length > 0) {
      // Update existing preferences
      const [updated] = await db
        .update(notificationPreferences)
        .set({
          ...preferences,
          updatedAt: new Date()
        })
        .where(and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.userType, userType)
        ))
        .returning();
      return updated;
    } else {
      // Create new preferences
      const [created] = await db
        .insert(notificationPreferences)
        .values({
          userId,
          userType,
          ...preferences
        } as InsertNotificationPreferences)
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();