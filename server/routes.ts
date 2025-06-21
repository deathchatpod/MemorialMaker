import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateObituariesWithClaude, generateObituariesWithChatGPT, generateRevisedObituary, type ObituaryFormData } from "./services/ai";
import { generateObituaryPDF } from "./services/pdf";
import { processDocument, deleteDocument, formatDocumentForPrompt } from "./services/document";
import { insertObituarySchema, insertGeneratedObituarySchema, insertTextFeedbackSchema, insertQuestionSchema, insertPromptTemplateSchema, insertFinalSpaceSchema, insertFinalSpaceCommentSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Configure multer for document uploads (docx, pdf)
const documentUpload = multer({
  dest: 'uploads/documents/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/pdf' // .pdf
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .docx and .pdf files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default data
  await initializeDefaultData();

  // Auth endpoints (simplified for dummy users)
  app.get("/api/users/current", async (req, res) => {
    // Return dummy user based on query param
    const userType = req.query.type as string || 'user';
    const dummyUser = userType === 'admin' 
      ? { id: 2, username: 'admin', userType: 'admin' }
      : { id: 1, username: 'user', userType: 'user' };
    
    res.json(dummyUser);
  });

  // Obituary endpoints
  app.get("/api/obituaries", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      const userType = req.query.userType as string || 'user';
      
      let obituaries;
      if (userType === 'admin') {
        obituaries = await storage.getAllObituaries();
      } else {
        obituaries = await storage.getObituariesByUser(userId);
      }
      
      res.json(obituaries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch obituaries" });
    }
  });

  app.get("/api/obituaries/completed", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      const userType = req.query.userType as string || 'user';
      
      console.log('Fetching completed obituaries for userId:', userId, 'userType:', userType);
      
      let obituaries;
      if (userType === 'admin') {
        obituaries = await storage.getAllObituaries();
        console.log('Admin - found obituaries:', obituaries.length);
      } else {
        obituaries = await storage.getCompletedObituariesByUser(userId);
        console.log('User - found completed obituaries:', obituaries.length);
      }
      
      res.json(obituaries);
    } catch (error) {
      console.error('Error fetching completed obituaries:', error);
      res.status(500).json({ message: "Failed to fetch obituaries", error: error.message });
    }
  });

  app.get("/api/obituaries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const obituary = await storage.getObituary(id);
      
      if (!obituary) {
        return res.status(404).json({ message: "Obituary not found" });
      }
      
      res.json(obituary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch obituary" });
    }
  });

  app.post("/api/obituaries", upload.single('photo'), async (req, res) => {
    try {
      const formData = JSON.parse(req.body.formData);
      const validatedData = insertObituarySchema.parse({
        userId: parseInt(req.body.userId) || 1,
        fullName: formData.fullName,
        age: formData.age ? parseInt(formData.age) : undefined,
        dateOfBirth: formData.dateOfBirth,
        dateOfDeath: formData.dateOfDeath,
        location: formData.location,
        formData: formData,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
        status: 'draft',
      });

      const obituary = await storage.createObituary(validatedData);
      res.json(obituary);
    } catch (error) {
      console.error('Error creating obituary:', error);
      res.status(400).json({ message: "Failed to create obituary" });
    }
  });

  app.post("/api/obituaries/:id/generate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const obituary = await storage.getObituary(id);
      
      if (!obituary) {
        return res.status(404).json({ message: "Obituary not found" });
      }

      const formData = obituary.formData as ObituaryFormData;
      
      // Generate obituaries from both AI services
      const [claudeResults, chatgptResults] = await Promise.all([
        generateObituariesWithClaude(formData),
        generateObituariesWithChatGPT(formData)
      ]);

      // Save generated obituaries to database
      const generatedObituaries = [];
      
      for (let i = 0; i < claudeResults.length; i++) {
        const generated = await storage.createGeneratedObituary({
          obituaryId: id,
          aiProvider: 'claude',
          version: i + 1,
          content: claudeResults[i].content,
          tone: claudeResults[i].tone,
        });
        generatedObituaries.push(generated);
      }
      
      for (let i = 0; i < chatgptResults.length; i++) {
        const generated = await storage.createGeneratedObituary({
          obituaryId: id,
          aiProvider: 'chatgpt',
          version: i + 1,
          content: chatgptResults[i].content,
          tone: chatgptResults[i].tone,
        });
        generatedObituaries.push(generated);
      }

      // Update obituary status
      await storage.updateObituary(id, { status: 'generated' });

      res.json({ message: "Obituaries generated successfully", obituaries: generatedObituaries });
    } catch (error) {
      console.error('Error generating obituaries:', error);
      res.status(500).json({ message: "Failed to generate obituaries" });
    }
  });

  app.get("/api/obituaries/:id/generated", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const generatedObituaries = await storage.getGeneratedObituaries(id);
      res.json(generatedObituaries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch generated obituaries" });
    }
  });

  app.put("/api/generated-obituaries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { content } = req.body;
      
      const updatedObituary = await storage.updateGeneratedObituary(id, content);
      res.json(updatedObituary);
    } catch (error) {
      res.status(500).json({ message: "Failed to update obituary" });
    }
  });

  // Text feedback endpoints
  app.post("/api/text-feedback", async (req, res) => {
    try {
      const validatedData = insertTextFeedbackSchema.parse(req.body);
      const feedback = await storage.createTextFeedback(validatedData);
      res.json(feedback);
    } catch (error) {
      res.status(400).json({ message: "Failed to save feedback" });
    }
  });

  app.post("/api/generated-obituaries/:id/feedback", async (req, res) => {
    try {
      const generatedObituaryId = parseInt(req.params.id);
      const validatedData = insertTextFeedbackSchema.parse({
        ...req.body,
        generatedObituaryId
      });
      const feedback = await storage.createTextFeedback(validatedData);
      res.json(feedback);
    } catch (error) {
      res.status(400).json({ message: "Failed to save feedback" });
    }
  });

  app.get("/api/generated-obituaries/:id/feedback", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feedback = await storage.getTextFeedback(id);
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.delete("/api/generated-obituaries/:id/feedback", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTextFeedback(id);
      res.json({ message: "Feedback cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear feedback" });
    }
  });

  // Revision endpoints
  app.post("/api/obituaries/:id/revise", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { feedback, aiProvider } = req.body;
      
      const obituary = await storage.getObituary(id);
      if (!obituary) {
        return res.status(404).json({ message: "Obituary not found" });
      }

      // Check if revision already exists for this AI provider
      const existingObituaries = await storage.getGeneratedObituaries(id);
      const existingRevision = existingObituaries.find(o => o.aiProvider === aiProvider && o.isRevision);
      
      if (existingRevision) {
        return res.status(400).json({ 
          message: `A revision for ${aiProvider} already exists. Only one revision per AI provider is allowed.` 
        });
      }

      const formData = obituary.formData as ObituaryFormData;
      const revisedResult = await generateRevisedObituary(formData, feedback, aiProvider);
      
      const generatedObituary = await storage.createGeneratedObituary({
        obituaryId: id,
        aiProvider: aiProvider,
        version: 1,
        content: revisedResult.content,
        tone: revisedResult.tone,
        isRevision: true,
        revisionPrompt: JSON.stringify(feedback),
      });

      res.json(generatedObituary);
    } catch (error) {
      console.error('Error generating revision:', error);
      res.status(500).json({ message: "Failed to generate revision" });
    }
  });

  // PDF generation
  app.post("/api/obituaries/:id/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { generatedObituaryId } = req.body;
      
      const obituary = await storage.getObituary(id);
      if (!obituary) {
        return res.status(404).json({ message: "Obituary not found" });
      }

      const generatedObituaries = await storage.getGeneratedObituaries(id);
      const selectedObituary = generatedObituaries.find(o => o.id === generatedObituaryId);
      
      if (!selectedObituary) {
        return res.status(404).json({ message: "Generated obituary not found" });
      }

      const pdfBuffer = await generateObituaryPDF({
        obituaryText: selectedObituary.content,
        fullName: obituary.fullName,
        dateOfBirth: obituary.dateOfBirth || undefined,
        dateOfDeath: obituary.dateOfDeath || undefined,
        imageUrl: obituary.imageUrl || undefined,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${obituary.fullName}_obituary.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Question management endpoints
  app.get("/api/questions", async (req, res) => {
    try {
      const category = req.query.category as string;
      let questions;
      
      if (category) {
        questions = await storage.getQuestionsByCategory(category);
      } else {
        questions = await storage.getQuestions();
      }
      
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post("/api/questions", async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(validatedData);
      res.json(question);
    } catch (error) {
      res.status(400).json({ message: "Failed to create question" });
    }
  });

  app.put("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedQuestion = await storage.updateQuestion(id, req.body);
      res.json(updatedQuestion);
    } catch (error) {
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteQuestion(id);
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Prompt template management endpoints
  app.get("/api/prompt-templates", async (req, res) => {
    try {
      const templates = await storage.getPromptTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prompt templates" });
    }
  });

  app.get("/api/prompt-templates/:platform/:promptType", async (req, res) => {
    try {
      const { platform, promptType } = req.params;
      const template = await storage.getPromptTemplate(platform, promptType);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prompt template" });
    }
  });

  app.post("/api/prompt-templates", async (req, res) => {
    try {
      const validatedData = insertPromptTemplateSchema.parse(req.body);
      const template = await storage.createPromptTemplate(validatedData);
      res.json(template);
    } catch (error) {
      res.status(400).json({ message: "Failed to create prompt template" });
    }
  });

  app.put("/api/prompt-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedTemplate = await storage.updatePromptTemplate(id, req.body);
      res.json(updatedTemplate);
    } catch (error) {
      res.status(500).json({ message: "Failed to update prompt template" });
    }
  });

  app.post("/api/prompt-templates/:id/upload-document", documentUpload.single('document'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ message: "No document file provided" });
      }

      // Get the existing template
      const existingTemplate = await storage.getPromptTemplates();
      const template = existingTemplate.find(t => t.id === id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Process the uploaded document
      const processedDocument = await processDocument(req.file);
      
      // Delete old document if it exists
      if (template.contextDocument) {
        deleteDocument(template.contextDocument);
      }

      // Update the template with the new document
      const updatedTemplate = await storage.updatePromptTemplate(id, {
        contextDocument: processedDocument.filePath,
        contextDocumentName: processedDocument.filename
      });

      res.json({
        template: updatedTemplate,
        documentText: processedDocument.text.substring(0, 500) + (processedDocument.text.length > 500 ? '...' : ''),
        filename: processedDocument.filename
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to upload document" });
    }
  });

  app.delete("/api/prompt-templates/:id/document", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the existing template
      const existingTemplate = await storage.getPromptTemplates();
      const template = existingTemplate.find(t => t.id === id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Delete the document file if it exists
      if (template.contextDocument) {
        deleteDocument(template.contextDocument);
      }

      // Update the template to remove document references
      const updatedTemplate = await storage.updatePromptTemplate(id, {
        contextDocument: null,
        contextDocumentName: null
      });

      res.json(updatedTemplate);
    } catch (error) {
      res.status(500).json({ message: "Failed to remove document" });
    }
  });

  app.delete("/api/prompt-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePromptTemplate(id);
      res.json({ message: "Prompt template deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete prompt template" });
    }
  });

  // Final Spaces API
  app.get("/api/final-spaces", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const userType = req.query.userType as string;
      
      let finalSpaces;
      if (userType === 'admin') {
        finalSpaces = await storage.getAllFinalSpaces();
      } else {
        finalSpaces = await storage.getFinalSpacesByUser(userId);
      }
      
      res.json(finalSpaces);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch final spaces" });
    }
  });

  app.get("/api/final-spaces/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const finalSpace = await storage.getFinalSpace(id);
      
      if (!finalSpace) {
        return res.status(404).json({ message: "Final space not found" });
      }
      
      res.json(finalSpace);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch final space" });
    }
  });

  app.get("/api/final-spaces/slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const finalSpace = await storage.getFinalSpaceBySlug(slug);
      
      if (!finalSpace) {
        return res.status(404).json({ message: "Final space not found" });
      }
      
      res.json(finalSpace);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch final space" });
    }
  });

  app.post("/api/final-spaces", async (req, res) => {
    try {
      const validatedData = insertFinalSpaceSchema.parse(req.body);
      
      // Generate URL-friendly slug from person name
      const slug = validatedData.personName
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      // Ensure slug uniqueness
      let finalSlug = slug;
      let counter = 1;
      while (await storage.getFinalSpaceBySlug(finalSlug)) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
      
      const finalSpace = await storage.createFinalSpace({
        ...validatedData,
        slug: finalSlug
      });
      
      res.json(finalSpace);
    } catch (error) {
      console.error('Error creating final space:', error);
      res.status(400).json({ message: "Failed to create final space" });
    }
  });

  app.put("/api/final-spaces/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedSpace = await storage.updateFinalSpace(id, req.body);
      res.json(updatedSpace);
    } catch (error) {
      res.status(500).json({ message: "Failed to update final space" });
    }
  });

  app.delete("/api/final-spaces/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFinalSpace(id);
      res.json({ message: "Final space deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete final space" });
    }
  });

  // Final Space Comments API
  app.get("/api/final-spaces/:id/comments", async (req, res) => {
    try {
      const finalSpaceId = parseInt(req.params.id);
      const comments = await storage.getFinalSpaceComments(finalSpaceId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/final-spaces/:id/comments", async (req, res) => {
    try {
      const finalSpaceId = parseInt(req.params.id);
      const validatedData = insertFinalSpaceCommentSchema.parse({
        ...req.body,
        finalSpaceId
      });
      
      const comment = await storage.createFinalSpaceComment(validatedData);
      res.json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(400).json({ message: "Failed to create comment" });
    }
  });

  app.delete("/api/final-spaces/comments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFinalSpaceComment(id);
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Collaboration API Routes
  
  // Get collaborators for an obituary
  app.get("/api/obituaries/:id/collaborators", async (req, res) => {
    try {
      const obituaryId = parseInt(req.params.id);
      const collaborators = await storage.getObituaryCollaborators(obituaryId);
      res.json(collaborators);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collaborators" });
    }
  });

  // Add a collaborator to an obituary
  app.post("/api/obituaries/:id/collaborators", async (req, res) => {
    try {
      const obituaryId = parseInt(req.params.id);
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const collaborator = await storage.createObituaryCollaborator({
        obituaryId,
        email
      });

      // Generate UUID for collaboration session
      const uuid = crypto.randomUUID();
      await storage.createCollaborationSession({
        uuid,
        obituaryId,
        collaboratorEmail: email
      });

      res.json({ 
        collaborator,
        shareableLink: `${req.protocol}://${req.get('host')}/collaborate/${uuid}`
      });
    } catch (error) {
      console.error('Error adding collaborator:', error);
      res.status(500).json({ message: "Failed to add collaborator" });
    }
  });

  // Remove a collaborator
  app.delete("/api/obituaries/collaborators/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteObituaryCollaborator(id);
      res.json({ message: "Collaborator removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove collaborator" });
    }
  });

  // Access obituary via collaboration link
  app.get("/api/collaborate/:uuid", async (req, res) => {
    try {
      const { uuid } = req.params;
      const session = await storage.getCollaborationSession(uuid);
      
      if (!session) {
        return res.status(404).json({ message: "Invalid collaboration link" });
      }

      const obituary = await storage.getObituary(session.obituaryId);
      if (!obituary) {
        return res.status(404).json({ message: "Obituary not found" });
      }

      const generatedObituaries = await storage.getGeneratedObituaries(session.obituaryId);
      
      res.json({
        obituary,
        generatedObituaries,
        session,
        isCollaborator: true
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to access collaboration" });
    }
  });

  // Update collaborator name when they first access
  app.post("/api/collaborate/:uuid/identify", async (req, res) => {
    try {
      const { uuid } = req.params;
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      const updatedSession = await storage.updateCollaborationSession(uuid, {
        collaboratorName: name,
        accessedAt: new Date()
      });

      res.json(updatedSession);
    } catch (error) {
      res.status(500).json({ message: "Failed to update collaborator info" });
    }
  });

  // Completed obituaries for dropdown
  app.get("/api/obituaries/completed", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const completedObituaries = await storage.getCompletedObituariesByUser(userId);
      res.json(completedObituaries);
    } catch (error) {
      console.error('Error fetching completed obituaries:', error);
      res.status(500).json({ 
        message: "Failed to fetch completed obituaries",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    const filePath = path.join(process.cwd(), 'uploads', req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeDefaultData() {
  try {
    // Create dummy users if they don't exist
    const existingUser = await storage.getUserByUsername('user');
    if (!existingUser) {
      await storage.createUser({ username: 'user', password: 'password', userType: 'user' });
    }
    
    const existingAdmin = await storage.getUserByUsername('admin');
    if (!existingAdmin) {
      await storage.createUser({ username: 'admin', password: 'password', userType: 'admin' });
    }
    
    // Initialize default questions from the document
    const existingQuestions = await storage.getQuestions();
    if (existingQuestions.length === 0) {
      await initializeDefaultQuestions();
    }
    
    // Initialize default prompt templates
    const existingTemplates = await storage.getPromptTemplates();
    if (existingTemplates.length === 0) {
      await initializeDefaultPromptTemplates();
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
}

async function initializeDefaultPromptTemplates() {
  const defaultTemplates = [
    {
      name: "Claude Base Prompt",
      platform: "claude",
      promptType: "base",
      template: `Write a heartfelt obituary for {{fullName}}{{#if age}}, age {{age}}{{/if}}. Use a {{tone}} tone appropriate for a {{ageCategory}} person.

Include the following information:
{{#if dateOfBirth}}{{#if dateOfDeath}}- Born {{dateOfBirth}}, passed away {{dateOfDeath}}{{else}}- Born {{dateOfBirth}}{{/if}}{{else}}{{#if dateOfDeath}}- Passed away {{dateOfDeath}}{{/if}}{{/if}}
{{#if location}}- Location: {{location}}{{/if}}
{{#if education}}- Education: {{education}}{{/if}}
{{#if career}}- Career: {{career}}{{/if}}
{{#if achievements}}- Achievements: {{achievements}}{{/if}}
{{#if family}}- Family: {{family}}{{/if}}
{{#if traits}}- Personality traits: {{traits}}{{/if}}
{{#if hobbies}}- Hobbies and interests: {{hobbies}}{{/if}}
{{#if religion}}- Faith: {{religion}}{{/if}}
{{#if specialNotes}}- Special notes: {{specialNotes}}{{/if}}

Write a complete, flowing obituary that honors their memory appropriately. Make it personal and meaningful.`,
      description: "Base template for Claude obituary generation"
    },
    {
      name: "Claude Revision Prompt",
      platform: "claude",
      promptType: "revision",
      template: `Please revise the following obituary based on family feedback:

ORIGINAL OBITUARY:
{{originalContent}}

--- REVISION INSTRUCTIONS ---
{{#if likedText}}Please include similar language and themes to these phrases the family liked:
{{#each likedText}}- "{{this}}"
{{/each}}{{/if}}
{{#if dislikedText}}Please avoid or rephrase content similar to these phrases the family wants changed:
{{#each dislikedText}}- "{{this}}"
{{/each}}{{/if}}

Please provide a revised version that incorporates this feedback while maintaining the overall tone and completeness of the obituary.`,
      description: "Revision template for Claude based on user feedback"
    },
    {
      name: "ChatGPT Base Prompt",
      platform: "chatgpt",
      promptType: "base",
      template: `Write a heartfelt obituary for {{fullName}}{{#if age}}, age {{age}}{{/if}}. Use a {{tone}} tone appropriate for a {{ageCategory}} person.

Include the following information:
{{#if dateOfBirth}}{{#if dateOfDeath}}- Born {{dateOfBirth}}, passed away {{dateOfDeath}}{{else}}- Born {{dateOfBirth}}{{/if}}{{else}}{{#if dateOfDeath}}- Passed away {{dateOfDeath}}{{/if}}{{/if}}
{{#if location}}- Location: {{location}}{{/if}}
{{#if education}}- Education: {{education}}{{/if}}
{{#if career}}- Career: {{career}}{{/if}}
{{#if achievements}}- Achievements: {{achievements}}{{/if}}
{{#if family}}- Family: {{family}}{{/if}}
{{#if traits}}- Personality traits: {{traits}}{{/if}}
{{#if hobbies}}- Hobbies and interests: {{hobbies}}{{/if}}
{{#if religion}}- Faith: {{religion}}{{/if}}
{{#if specialNotes}}- Special notes: {{specialNotes}}{{/if}}

Write a complete, flowing obituary that honors their memory appropriately. Make it personal and meaningful.`,
      description: "Base template for ChatGPT obituary generation"
    },
    {
      name: "ChatGPT Revision Prompt",
      platform: "chatgpt",
      promptType: "revision",
      template: `Please revise the following obituary based on family feedback:

ORIGINAL OBITUARY:
{{originalContent}}

--- REVISION INSTRUCTIONS ---
{{#if likedText}}Please include similar language and themes to these phrases the family liked:
{{#each likedText}}- "{{this}}"
{{/each}}{{/if}}
{{#if dislikedText}}Please avoid or rephrase content similar to these phrases the family wants changed:
{{#each dislikedText}}- "{{this}}"
{{/each}}{{/if}}

Please provide a revised version that incorporates this feedback while maintaining the overall tone and completeness of the obituary.`,
      description: "Revision template for ChatGPT based on user feedback"
    }
  ];

  for (const template of defaultTemplates) {
    await storage.createPromptTemplate(template);
  }
  
  console.log('Default prompt templates initialized successfully');
}

async function initializeDefaultQuestions() {
  const defaultQuestions = [
    // Basic Information
    { category: 'basic', questionText: 'Full Name', questionType: 'text', isRequired: true, placeholder: 'Include maiden name if applicable', sortOrder: 1 },
    { category: 'basic', questionText: 'Age at Death', questionType: 'number', isRequired: false, sortOrder: 2 },
    { category: 'basic', questionText: 'Date of Birth', questionType: 'date', isRequired: false, sortOrder: 3 },
    { category: 'basic', questionText: 'Date of Death', questionType: 'date', isRequired: false, sortOrder: 4 },
    { category: 'basic', questionText: 'Location', questionType: 'text', isRequired: false, placeholder: 'Where they lived/passed or are from', sortOrder: 5 },
    
    // Biography
    { category: 'biography', questionText: 'High School', questionType: 'text', isRequired: false, placeholder: 'School name', sortOrder: 1 },
    { category: 'biography', questionText: 'High School Graduation Year', questionType: 'number', isRequired: false, sortOrder: 2 },
    { category: 'biography', questionText: 'Higher Education', questionType: 'text', isRequired: false, placeholder: 'College/University name', sortOrder: 3 },
    { category: 'biography', questionText: 'Degree & Major', questionType: 'text', isRequired: false, placeholder: 'e.g., Bachelor of Arts in History', sortOrder: 4 },
    { category: 'biography', questionText: 'Job Title', questionType: 'text', isRequired: false, sortOrder: 5 },
    { category: 'biography', questionText: 'Company/Organization', questionType: 'text', isRequired: false, sortOrder: 6 },
    { category: 'biography', questionText: 'Years of Service', questionType: 'number', isRequired: false, sortOrder: 7 },
    { category: 'biography', questionText: 'Noteworthy Achievements', questionType: 'textarea', isRequired: false, placeholder: 'Outside of work and school...', sortOrder: 8 },
    
    // Characteristics
    { 
      category: 'characteristics', 
      questionText: 'Tone', 
      questionType: 'radio', 
      isRequired: true,
      options: [
        { value: 'traditional', label: 'Traditional / Formal', description: 'Classic, respectful approach' },
        { value: 'celebratory', label: 'Celebratory / Uplifting', description: 'Focus on joy and life celebration' },
        { value: 'poetic', label: 'Poetic / Reflective', description: 'Thoughtful and meaningful' },
        { value: 'lighthearted', label: 'Lighthearted / Humorous', description: 'Warm and uplifting with gentle humor' },
        { value: 'personal', label: 'Personal / Story Driven', description: 'Rich in personal stories and anecdotes' }
      ],
      sortOrder: 1 
    },
    { 
      category: 'characteristics', 
      questionText: 'Age Category', 
      questionType: 'radio', 
      isRequired: true,
      options: [
        { value: 'child', label: 'Child / Infant' },
        { value: 'young', label: 'Teenager / Young Adult' },
        { value: 'middle', label: 'Middle-Aged Adult' },
        { value: 'senior', label: 'Senior / Elderly' }
      ],
      sortOrder: 2 
    },
    {
      category: 'characteristics',
      questionText: 'Personality Traits',
      questionType: 'checkbox',
      isRequired: false,
      options: [
        { value: 'kind', label: 'Kind and Compassionate' },
        { value: 'hardworking', label: 'Hardworking and Dedicated' },
        { value: 'loyal', label: 'Loyal and Devoted' },
        { value: 'funny', label: 'Funny and Witty' },
        { value: 'strong', label: 'Strong and Resilient' },
        { value: 'generous', label: 'Generous and Giving' },
        { value: 'adventurous', label: 'Adventurous and Free-Spirited' },
        { value: 'creative', label: 'Creative and Artistic' },
        { value: 'loving', label: 'Loving and Family Oriented' },
        { value: 'wise', label: 'Wise and Thoughtful' },
        { value: 'patient', label: 'Patient and Understanding' },
        { value: 'faithful', label: 'Faithful and Spiritual' }
      ],
      sortOrder: 3
    },
    
    // Hobbies
    {
      category: 'hobbies',
      questionText: 'Hobbies & Interests',
      questionType: 'checkbox',
      isRequired: false,
      options: [
        { value: 'gardening', label: 'Gardening' },
        { value: 'cooking', label: 'Cooking/Baking' },
        { value: 'reading', label: 'Reading' },
        { value: 'fishing', label: 'Fishing/Hunting' },
        { value: 'sports', label: 'Sports' },
        { value: 'crafting', label: 'Crafting/Artist' },
        { value: 'knitting', label: 'Knitting/Sewing' },
        { value: 'music', label: 'Music' },
        { value: 'traveling', label: 'Traveling' },
        { value: 'volunteering', label: 'Community Service' },
        { value: 'dancing', label: 'Dancing' },
        { value: 'animals', label: 'Animals/Pets' }
      ],
      sortOrder: 1
    },
    { category: 'hobbies', questionText: 'Additional Details about Hobbies', questionType: 'textarea', isRequired: false, placeholder: 'Provide more details about their interests and passions...', sortOrder: 2 },
  ];

  for (const question of defaultQuestions) {
    await storage.createQuestion(question);
  }
}
