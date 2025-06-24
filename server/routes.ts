import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "./auth";
import { storage } from "./storage";
import { hashPassword } from "./auth";
import { generateObituariesWithClaude, generateObituariesWithChatGPT, generateRevisedObituary } from "./services/ai";
import { processDocument, deleteDocument } from "./services/document";
import { generateObituaryPDF } from "./services/pdf";
import { insertObituarySchema, insertGeneratedObituarySchema, insertTextFeedbackSchema, insertQuestionSchema, insertPromptTemplateSchema, insertFinalSpaceSchema, insertFinalSpaceCommentSchema, insertObituaryCollaboratorSchema, insertCollaborationSessionSchema, obituaryCollaborators, collaborationSessions } from "@shared/schema";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration with extended duration for testing
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on activity
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days for testing
    }
  }));

  // Passport initialization
  app.use(passport.initialize());
  app.use(passport.session());

  // Initialize default data
  await initializeDefaultData();

  // Auth routes with extended session
  app.post('/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Authentication error' });
      }
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login error' });
        }
        
        // Extend session duration on login for testing
        if (req.session && req.session.cookie) {
          req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        }
        
        console.log('Login response:', { 
          user: { 
            id: user.id, 
            email: user.email, 
            userType: user.userType,
            name: user.name || user.businessName
          }, 
          message: 'Login successful',
          redirect: '/dashboard'
        });
        
        res.json({ 
          user: { 
            id: user.id, 
            email: user.email, 
            userType: user.userType,
            name: user.name || user.businessName
          }, 
          message: 'Login successful',
          redirect: '/dashboard'
        });
      });
    })(req, res, next);
  });

  // Google OAuth routes - temporarily disabled
  // app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  // app.get('/auth/google/callback', 
  //   passport.authenticate('google', { failureRedirect: '/login' }),
  //   (req, res) => {
  //     res.redirect('/');
  //   }
  // );

  app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      console.log('Authenticated user:', req.user);
      // Extend session on each request during development
      if (process.env.NODE_ENV === 'development' && req.session && req.session.cookie) {
        req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      }
      res.json(req.user);
    } else {
      // In development, provide mock user for testing
      if (process.env.NODE_ENV === 'development') {
        const mockUser = { 
          id: 1, 
          email: 'admin@deathmatters.com', 
          userType: 'admin',
          name: 'System Admin'
        };
        res.json(mockUser);
      } else {
        res.status(401).json({ message: 'Not authenticated' });
      }
    }
  });

  // Registration endpoint
  app.post('/auth/register', async (req, res) => {
    try {
      const { name, businessName, email, password, phone, address, website } = req.body;
      
      // Check if email already exists
      const existingFuneralHome = await storage.getFuneralHomeByEmail(email);
      if (existingFuneralHome) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create funeral home account
      const funeralHome = await storage.createFuneralHome({
        name,
        businessName,
        email,
        password: hashedPassword,
        phone,
        address,
        website,
        contactEmail: email,
        isActive: true
      });

      res.status(201).json({ message: 'Account created successfully', funeralHome: { id: funeralHome.id, name: funeralHome.name, email: funeralHome.email } });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  // Current user endpoint
  app.get("/api/users/current", async (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      // Return dummy admin user for testing when not authenticated
      const dummyUser = { 
        id: 1, 
        name: 'Admin User', 
        email: 'admin@example.com',
        userType: 'admin' 
      };
      res.json(dummyUser);
    }
  });

  // Funeral Home routes
  app.get("/api/funeral-homes", async (req, res) => {
    try {
      const funeralHomes = await storage.getAllFuneralHomes();
      res.json(funeralHomes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch funeral homes" });
    }
  });

  // Employee routes
  app.get("/api/employees/:funeralHomeId", async (req, res) => {
    try {
      const funeralHomeId = parseInt(req.params.funeralHomeId);
      const employees = await storage.getEmployeesByFuneralHome(funeralHomeId);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // Employee invitation routes
  app.get("/api/employee-invitations/:funeralHomeId", async (req, res) => {
    try {
      const funeralHomeId = parseInt(req.params.funeralHomeId);
      const invitations = await storage.getEmployeeInvitationsByFuneralHome(funeralHomeId);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.post("/api/employee-invitations", async (req, res) => {
    try {
      const { email, funeralHomeId } = req.body;
      
      // Generate invite token and expiration
      const inviteToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const invitation = await storage.createEmployeeInvitation({
        funeralHomeId,
        email,
        inviteToken,
        expiresAt,
        isUsed: false
      });

      res.json(invitation);
    } catch (error) {
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  app.delete("/api/employee-invitations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEmployeeInvitation(id);
      res.json({ message: "Invitation deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete invitation" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEmployee(id);
      res.json({ message: "Employee deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  app.patch("/api/employees/:id/suspend", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.suspendEmployee(id);
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to suspend employee" });
    }
  });

  app.patch("/api/employees/:id/activate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.activateEmployee(id);
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to activate employee" });
    }
  });

  // Funeral home account management
  app.get("/api/funeral-homes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const funeralHome = await storage.getFuneralHome(id);
      if (!funeralHome) {
        return res.status(404).json({ message: "Funeral home not found" });
      }
      res.json(funeralHome);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch funeral home" });
    }
  });

  app.patch("/api/funeral-homes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const funeralHome = await storage.updateFuneralHome(id, updates);
      res.json(funeralHome);
    } catch (error) {
      res.status(500).json({ message: "Failed to update funeral home" });
    }
  });

  app.patch("/api/funeral-homes/:id/change-password", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { currentPassword, newPassword } = req.body;
      
      const funeralHome = await storage.getFuneralHome(id);
      if (!funeralHome || !funeralHome.password) {
        return res.status(404).json({ message: "Funeral home not found" });
      }

      const bcrypt = require('bcryptjs');
      const isValid = await bcrypt.compare(currentPassword, funeralHome.password);
      if (!isValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateFuneralHome(id, { password: hashedPassword });
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Obituary endpoints
  app.get("/api/obituaries", async (req, res) => {
    try {
      // For now, return all obituaries (will be filtered by user permissions later)
      const obituaries = await storage.getAllObituaries();
      res.json(obituaries);
    } catch (error) {
      console.error('Error fetching obituaries:', error);
      res.status(500).json({ message: "Failed to fetch obituaries" });
    }
  });

  app.get("/api/obituaries/completed", async (req, res) => {
    try {
      // For now, return all completed obituaries (will be filtered by user permissions later)
      const obituaries = await storage.getAllObituaries();
      const completed = obituaries.filter(o => o.status === 'generated');
      res.json(completed);
    } catch (error) {
      console.error('Error fetching completed obituaries:', error);
      res.status(500).json({ message: "Failed to fetch obituaries" });
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
        funeralHomeId: 1, // Default for testing
        createdById: 1,
        createdByType: 'funeral_home',
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

      const formData = obituary.formData as any;
      
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

  // Collaborator endpoints
  app.get("/api/obituaries/:id/collaborators", async (req, res) => {
    try {
      const obituaryId = parseInt(req.params.id);
      const collaborators = await storage.getObituaryCollaborators(obituaryId);
      res.json(collaborators);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collaborators" });
    }
  });

  app.post("/api/obituaries/:id/collaborators", async (req, res) => {
    try {
      const obituaryId = parseInt(req.params.id);
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Generate unique collaboration session
      const { v4: uuidv4 } = await import('uuid');
      const uuid = uuidv4();
      
      // Create collaboration session
      const session = await storage.createCollaborationSession({
        obituaryId,
        collaboratorEmail: email,
        uuid,
        collaboratorName: null
      });

      // Create collaborator record
      const collaborator = await storage.createObituaryCollaborator({
        obituaryId,
        email: email,
        name: null
      });

      const shareableLink = `${req.protocol}://${req.get('host')}/collaborate/${uuid}`;
      
      res.json({
        message: "Collaborator added successfully",
        collaborationLink: `/collaborate/${uuid}`,
        session,
        collaborator
      });
    } catch (error) {
      console.error('Error adding collaborator:', error);
      res.status(500).json({ message: "Failed to add collaborator" });
    }
  });

  app.delete("/api/obituaries/collaborators/:id", async (req, res) => {
    try {
      const collaboratorId = parseInt(req.params.id);
      await storage.deleteObituaryCollaborator(collaboratorId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove collaborator" });
    }
  });

  // Collaboration session endpoints
  app.get("/api/collaborate/:uuid", async (req, res) => {
    try {
      const uuid = req.params.uuid;
      const session = await storage.getCollaborationSession(uuid);
      
      if (!session) {
        return res.status(404).json({ message: "Collaboration session not found" });
      }

      const obituary = await storage.getObituary(session.obituaryId);
      const generatedObituaries = await storage.getGeneratedObituaries(session.obituaryId);
      
      res.json({
        session,
        obituary,
        generatedObituaries
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collaboration session" });
    }
  });

  app.post("/api/collaborate/:uuid/identify", async (req, res) => {
    try {
      const uuid = req.params.uuid;
      const { name } = req.body;
      
      const session = await storage.updateCollaborationSession(uuid, {
        collaboratorName: name
      });
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to identify collaborator" });
    }
  });

  // Text feedback endpoints
  app.post("/api/generated-obituaries/:id/feedback", async (req, res) => {
    try {
      const generatedObituaryId = parseInt(req.params.id);
      const { selectedText, feedbackType, collaboratorName, collaboratorEmail } = req.body;
      
      const feedback = await storage.createTextFeedback({
        generatedObituaryId,
        selectedText,
        feedbackType,
        collaboratorName,
        collaboratorEmail
      });
      
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to save feedback" });
    }
  });

  app.get("/api/generated-obituaries/:id/feedback", async (req, res) => {
    try {
      const generatedObituaryId = parseInt(req.params.id);
      const feedback = await storage.getTextFeedback(generatedObituaryId);
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // Revision endpoints
  app.post("/api/obituaries/:id/revise", async (req, res) => {
    try {
      const obituaryId = parseInt(req.params.id);
      const { aiProvider } = req.body;
      
      const obituary = await storage.getObituary(obituaryId);
      if (!obituary) {
        return res.status(404).json({ message: "Obituary not found" });
      }

      // Get existing generated obituaries to get feedback
      const existingObituaries = await storage.getGeneratedObituaries(obituaryId);
      const latestVersion = existingObituaries
        .filter(o => o.aiProvider === aiProvider)
        .sort((a, b) => b.version - a.version)[0];

      if (!latestVersion) {
        return res.status(400).json({ message: "No existing obituary to revise" });
      }

      // Get feedback for the latest version
      const feedback = await storage.getTextFeedback(latestVersion.id);
      
      // Generate revision based on feedback
      let revisedContent;
      if (aiProvider === 'claude') {
        revisedContent = await generateClaudeRevision(latestVersion.content, feedback);
      } else {
        revisedContent = await generateChatGPTRevision(latestVersion.content, feedback);
      }

      // Create new revision with incremented version
      const revision = await storage.createGeneratedObituary({
        obituaryId,
        aiProvider,
        version: latestVersion.version + 1,
        content: revisedContent,
        isRevision: true,
        revisionPrompt: `Revision based on ${feedback.length} feedback items`
      });

      res.json(revision);
    } catch (error) {
      console.error('Error creating revision:', error);
      res.status(500).json({ message: "Failed to create revision" });
    }
  });

  // Add missing storage methods - these need to be implemented in storage
  const generateClaudeRevision = async (content: string, feedback: any[]) => {
    // Placeholder - implement with actual Claude API
    return content + "\n\n[Revised based on feedback]";
  };

  const generateChatGPTRevision = async (content: string, feedback: any[]) => {
    // Placeholder - implement with actual ChatGPT API
    return content + "\n\n[Revised based on feedback]";
  };

  // Collaborations endpoint for dashboard
  app.get("/api/collaborations/:userId/:userType", async (req, res) => {
    try {
      const { userId, userType } = req.params;
      
      // Get collaborations based on user type
      let collaborations = [];
      
      if (userType === 'individual') {
        // For individuals, get collaborations where they are invited
        const allCollaborators = await db.select()
          .from(obituaryCollaborators)
          .where(eq(obituaryCollaborators.collaboratorEmail, 
            // Get user email from userId - this would need proper user lookup
            'individual@example.com' // Placeholder
          ));
        
        // Get collaboration sessions and obituary details
        for (const collab of allCollaborators) {
          const sessions = await db.select()
            .from(collaborationSessions)
            .where(eq(collaborationSessions.obituaryId, collab.obituaryId));
          
          const obituary = await storage.getObituary(collab.obituaryId);
          
          collaborations.push({
            ...collab,
            collaborationUuid: sessions[0]?.uuid,
            obituary
          });
        }
      } else {
        // For other user types, get obituaries they can collaborate on
        const userObituaries = await storage.getObituariesByCreator(parseInt(userId), userType);
        
        for (const obituary of userObituaries) {
          const collabs = await storage.getObituaryCollaborators(obituary.id);
          collaborations.push(...collabs.map(c => ({ ...c, obituary })));
        }
      }
      
      res.json(collaborations);
    } catch (error) {
      console.error("Error fetching collaborations:", error);
      res.status(500).json({ error: "Failed to fetch collaborations" });
    }
  });

  // Survey routes
  app.get("/api/surveys", async (req, res) => {
    try {
      const surveys = await storage.getSurveys();
      res.json(surveys);
    } catch (error) {
      console.error("Error fetching surveys:", error);
      res.status(500).json({ error: "Failed to fetch surveys" });
    }
  });

  app.get("/api/surveys/:id", async (req, res) => {
    try {
      const survey = await storage.getSurvey(parseInt(req.params.id));
      if (!survey) {
        return res.status(404).json({ error: "Survey not found" });
      }
      res.json(survey);
    } catch (error) {
      console.error("Error fetching survey:", error);
      res.status(500).json({ error: "Failed to fetch survey" });
    }
  });

  app.post("/api/surveys", async (req, res) => {
    try {
      const survey = await storage.createSurvey(req.body);
      res.status(201).json(survey);
    } catch (error) {
      console.error("Error creating survey:", error);
      res.status(500).json({ error: "Failed to create survey" });
    }
  });

  app.put("/api/surveys/:id", async (req, res) => {
    try {
      const survey = await storage.updateSurvey(parseInt(req.params.id), req.body);
      res.json(survey);
    } catch (error) {
      console.error("Error updating survey:", error);
      res.status(500).json({ error: "Failed to update survey" });
    }
  });

  app.delete("/api/surveys/:id", async (req, res) => {
    try {
      await storage.deleteSurvey(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting survey:", error);
      res.status(500).json({ error: "Failed to delete survey" });
    }
  });

  // Questions endpoints
  app.get("/api/questions", async (req, res) => {
    try {
      const { surveyId } = req.query;
      const questions = surveyId 
        ? await storage.getQuestionsBySurvey(parseInt(surveyId as string))
        : await storage.getQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
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

  // Prompt Templates endpoints
  app.get("/api/prompt-templates", async (req, res) => {
    try {
      const templates = await storage.getPromptTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching prompt templates:', error);
      res.status(500).json({ message: "Failed to fetch prompt templates" });
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

  // Final Spaces endpoints
  app.get("/api/final-spaces", async (req, res) => {
    try {
      const finalSpaces = await storage.getAllFinalSpaces();
      res.json(finalSpaces);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch final spaces" });
    }
  });

  app.post("/api/final-spaces", upload.single('image'), async (req, res) => {
    try {
      const formData = JSON.parse(req.body.formData);
      
      // Generate slug from person name
      const slug = formData.personName.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now();

      const validatedData = insertFinalSpaceSchema.parse({
        funeralHomeId: 1, // Default for testing
        createdById: 1,
        createdByType: 'funeral_home',
        obituaryId: formData.obituaryId ? parseInt(formData.obituaryId) : undefined,
        slug,
        personName: formData.personName,
        dateOfBirth: formData.dateOfBirth,
        dateOfDeath: formData.dateOfDeath,
        description: formData.description,
        socialMediaLinks: formData.socialMediaLinks || [],
        musicPlaylist: formData.musicPlaylist,
        isPublic: formData.isPublic !== false,
        allowComments: formData.allowComments !== false,
      });

      const finalSpace = await storage.createFinalSpace(validatedData);
      res.json(finalSpace);
    } catch (error) {
      console.error('Error creating final space:', error);
      res.status(400).json({ message: "Failed to create final space" });
    }
  });

  // User Type routes
  app.get("/api/user-types", async (req, res) => {
    try {
      const userTypes = await storage.getUserTypes();
      res.json(userTypes);
    } catch (error) {
      console.error("Error fetching user types:", error);
      res.status(500).json({ message: "Failed to fetch user types" });
    }
  });

  // Survey Response routes
  app.get("/api/survey-responses/:surveyId", async (req, res) => {
    try {
      const surveyId = parseInt(req.params.surveyId);
      if (isNaN(surveyId)) {
        return res.status(400).json({ message: "Invalid survey ID" });
      }

      const responses = await storage.getSurveyResponses(surveyId);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching survey responses:", error);
      res.status(500).json({ message: "Failed to fetch survey responses" });
    }
  });

  app.post("/api/survey-responses", async (req, res) => {
    try {
      const response = await storage.createSurveyResponse(req.body);
      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating survey response:", error);
      res.status(500).json({ message: "Failed to create survey response" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeDefaultData() {
  try {
    console.log("Initializing default data...");
    
    // Initialize default prompt templates
    await initializeDefaultPromptTemplates();
    
    // Initialize default questions
    await initializeDefaultQuestions();
    
    console.log("Default data initialized successfully");
  } catch (error) {
    console.error("Error initializing default data:", error);
  }
}

async function initializeDefaultPromptTemplates() {
  try {
    const existingTemplates = await storage.getPromptTemplates();
    
    if (existingTemplates.length === 0) {
      const defaultTemplates = [
        {
          name: "Claude Base Prompt",
          platform: "claude",
          promptType: "base",
          content: "You are an expert obituary writer. Create a respectful, heartfelt obituary based on the provided information. Focus on celebrating the person's life, achievements, and relationships. Use a {{tone}} tone throughout."
        },
        {
          name: "Claude Revision Prompt", 
          platform: "claude",
          promptType: "revision",
          content: "Revise the obituary based on the feedback provided. Incorporate the liked elements and improve or replace the disliked elements while maintaining the overall structure and respectful tone."
        },
        {
          name: "ChatGPT Base Prompt",
          platform: "chatgpt", 
          promptType: "base",
          content: "Create a meaningful obituary that honors the memory of {{fullName}}. Use a {{tone}} tone and include their life story, accomplishments, and the love they shared with family and friends."
        },
        {
          name: "ChatGPT Revision Prompt",
          platform: "chatgpt",
          promptType: "revision", 
          content: "Please revise this obituary based on the feedback. Keep the elements that were liked and improve or rewrite the parts that were marked for change. Maintain dignity and respect throughout."
        }
      ];

      for (const template of defaultTemplates) {
        await storage.createPromptTemplate(template);
      }
      
      console.log("Default prompt templates created");
    }
  } catch (error) {
    console.error("Error initializing prompt templates:", error);
  }
}

async function initializeDefaultQuestions() {
  try {
    // Skip survey creation since it's now handled by database initialization
    console.log("Question initialization skipped - handled by database setup");
  } catch (error) {
    console.error("Error initializing questions:", error);
  }
}