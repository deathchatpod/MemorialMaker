import { 
  users, obituaries, generatedObituaries, textFeedback, questions, promptTemplates, finalSpaces, finalSpaceComments, finalSpaceImages,
  type User, type InsertUser, type Obituary, type InsertObituary,
  type GeneratedObituary, type InsertGeneratedObituary,
  type TextFeedback, type InsertTextFeedback,
  type Question, type InsertQuestion, type PromptTemplate, type InsertPromptTemplate,
  type FinalSpace, type InsertFinalSpace, type FinalSpaceComment, type InsertFinalSpaceComment,
  type FinalSpaceImage, type InsertFinalSpaceImage
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Obituaries
  getObituariesByUser(userId: number): Promise<Obituary[]>;
  getAllObituaries(): Promise<Obituary[]>;
  getCompletedObituariesByUser(userId: number): Promise<Obituary[]>;
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
  
  // Questions
  getQuestions(): Promise<Question[]>;
  getQuestionsByCategory(category: string): Promise<Question[]>;
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
  getFinalSpacesByUser(userId: number): Promise<FinalSpace[]>;
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
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Obituaries
  async getObituariesByUser(userId: number): Promise<Obituary[]> {
    return await db
      .select()
      .from(obituaries)
      .where(eq(obituaries.userId, userId))
      .orderBy(desc(obituaries.createdAt));
  }

  async getAllObituaries(): Promise<Obituary[]> {
    return await db
      .select()
      .from(obituaries)
      .orderBy(desc(obituaries.createdAt));
  }

  async getObituary(id: number): Promise<Obituary | undefined> {
    const [obituary] = await db.select().from(obituaries).where(eq(obituaries.id, id));
    return obituary || undefined;
  }

  async createObituary(obituary: InsertObituary): Promise<Obituary> {
    const [newObituary] = await db
      .insert(obituaries)
      .values({
        ...obituary,
        updatedAt: new Date(),
      })
      .returning();
    return newObituary;
  }

  async updateObituary(id: number, obituary: Partial<Obituary>): Promise<Obituary> {
    const [updatedObituary] = await db
      .update(obituaries)
      .set({
        ...obituary,
        updatedAt: new Date(),
      })
      .where(eq(obituaries.id, id))
      .returning();
    return updatedObituary;
  }

  async deleteObituary(id: number): Promise<void> {
    await db.delete(obituaries).where(eq(obituaries.id, id));
  }

  // Generated Obituaries
  async getGeneratedObituaries(obituaryId: number): Promise<GeneratedObituary[]> {
    return await db
      .select()
      .from(generatedObituaries)
      .where(eq(generatedObituaries.obituaryId, obituaryId))
      .orderBy(generatedObituaries.aiProvider, generatedObituaries.version);
  }

  async createGeneratedObituary(generatedObituary: InsertGeneratedObituary): Promise<GeneratedObituary> {
    const [newGeneratedObituary] = await db
      .insert(generatedObituaries)
      .values(generatedObituary)
      .returning();
    return newGeneratedObituary;
  }

  async updateGeneratedObituary(id: number, content: string): Promise<GeneratedObituary> {
    const [updatedObituary] = await db
      .update(generatedObituaries)
      .set({ content })
      .where(eq(generatedObituaries.id, id))
      .returning();
    return updatedObituary;
  }

  // Text Feedback
  async getTextFeedback(generatedObituaryId: number): Promise<TextFeedback[]> {
    return await db
      .select()
      .from(textFeedback)
      .where(eq(textFeedback.generatedObituaryId, generatedObituaryId));
  }

  async createTextFeedback(feedback: InsertTextFeedback): Promise<TextFeedback> {
    const [newFeedback] = await db
      .insert(textFeedback)
      .values(feedback)
      .returning();
    return newFeedback;
  }

  async deleteTextFeedback(generatedObituaryId: number): Promise<void> {
    await db.delete(textFeedback).where(eq(textFeedback.generatedObituaryId, generatedObituaryId));
  }

  // Questions
  async getQuestions(): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.isActive, true))
      .orderBy(questions.category, questions.sortOrder);
  }

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(and(eq(questions.category, category), eq(questions.isActive, true)))
      .orderBy(questions.sortOrder);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db
      .insert(questions)
      .values(question)
      .returning();
    return newQuestion;
  }

  async updateQuestion(id: number, question: Partial<Question>): Promise<Question> {
    const [updatedQuestion] = await db
      .update(questions)
      .set(question)
      .where(eq(questions.id, id))
      .returning();
    return updatedQuestion;
  }

  async deleteQuestion(id: number): Promise<void> {
    await db.update(questions).set({ isActive: false }).where(eq(questions.id, id));
  }

  // Prompt Templates
  async getPromptTemplates(): Promise<PromptTemplate[]> {
    return await db
      .select()
      .from(promptTemplates)
      .where(eq(promptTemplates.isActive, true))
      .orderBy(promptTemplates.platform, promptTemplates.promptType);
  }

  async getPromptTemplate(platform: string, promptType: string): Promise<PromptTemplate | undefined> {
    const [template] = await db
      .select()
      .from(promptTemplates)
      .where(and(
        eq(promptTemplates.platform, platform),
        eq(promptTemplates.promptType, promptType),
        eq(promptTemplates.isActive, true)
      ));
    return template || undefined;
  }

  async createPromptTemplate(template: InsertPromptTemplate): Promise<PromptTemplate> {
    const [newTemplate] = await db
      .insert(promptTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updatePromptTemplate(id: number, template: Partial<PromptTemplate>): Promise<PromptTemplate> {
    const [updatedTemplate] = await db
      .update(promptTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(promptTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deletePromptTemplate(id: number): Promise<void> {
    await db.delete(promptTemplates).where(eq(promptTemplates.id, id));
  }
}

export const storage = new DatabaseStorage();
