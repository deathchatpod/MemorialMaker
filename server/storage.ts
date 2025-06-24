import { 
  adminUsers, funeralHomes, employees, employeeInvitations, obituaries, generatedObituaries, 
  textFeedback, surveys, questions, promptTemplates, finalSpaces, finalSpaceComments, finalSpaceImages,
  obituaryCollaborators, collaborationSessions,
  type AdminUser, type InsertAdminUser, type FuneralHome, type InsertFuneralHome,
  type Employee, type InsertEmployee, type EmployeeInvitation, type InsertEmployeeInvitation,
  type Obituary, type InsertObituary, type GeneratedObituary, type InsertGeneratedObituary,
  type TextFeedback, type InsertTextFeedback, type Survey, type InsertSurvey, type Question, type InsertQuestion, 
  type PromptTemplate, type InsertPromptTemplate, type FinalSpace, type InsertFinalSpace, 
  type FinalSpaceComment, type InsertFinalSpaceComment, type FinalSpaceImage, type InsertFinalSpaceImage,
  type ObituaryCollaborator, type InsertObituaryCollaborator, type CollaborationSession, type InsertCollaborationSession
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql } from "drizzle-orm";

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
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
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
    const [question] = await db
      .update(questions)
      .set(updates)
      .where(eq(questions.id, id))
      .returning();
    return question;
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
}

export const storage = new DatabaseStorage();