import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "./auth";
import { storage } from "./storage";
import { hashPassword } from "./auth";
import { generateObituariesWithClaude, generateObituariesWithChatGPT, generateRevisedObituary } from "./services/ai";
import { processDocument, deleteDocument } from "./services/document";
import { generateObituaryPDF } from "./services/pdf";
import { insertObituarySchema, insertGeneratedObituarySchema, insertTextFeedbackSchema, insertQuestionSchema, insertPromptTemplateSchema, insertFinalSpaceSchema, insertFinalSpaceCommentSchema, insertObituaryCollaboratorSchema, insertCollaborationSessionSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

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
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Passport initialization
  app.use(passport.initialize());
  app.use(passport.session());

  // Initialize default data
  await initializeDefaultData();

  // Auth routes
  app.post('/auth/login', passport.authenticate('local'), (req, res) => {
    res.json({ user: req.user, message: 'Login successful' });
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
      res.json(req.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
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
    const existingSurveys = await storage.getSurveys();
    
    if (existingSurveys.length === 0) {
      // Create default survey
      const defaultSurvey = await storage.createSurvey({
        name: "Obituary Information Form",
        description: "Standard form for collecting obituary information",
        createdById: 1, // Default admin user
        status: "active"
      });

      const defaultQuestions = [
        { questionText: "Full Name", questionType: "text", surveyId: defaultSurvey.id, isRequired: true, orderIndex: 1 },
        { questionText: "Age", questionType: "number", surveyId: defaultSurvey.id, orderIndex: 2 },
        { questionText: "Date of Birth", questionType: "date", surveyId: defaultSurvey.id, orderIndex: 3 },
        { questionText: "Date of Death", questionType: "date", surveyId: defaultSurvey.id, orderIndex: 4 },
        { questionText: "Location", questionType: "text", surveyId: defaultSurvey.id, orderIndex: 5 },
        { questionText: "Obituary Tone", questionType: "radio", surveyId: defaultSurvey.id, isRequired: true, orderIndex: 6, options: [
          { label: "Traditional", value: "traditional" },
          { label: "Celebratory", value: "celebratory" },
          { label: "Lighthearted", value: "lighthearted" }
        ]}
      ];

      for (const question of defaultQuestions) {
        await storage.createQuestion(question);
      }
      
      console.log("Default survey and questions created");
    }
  } catch (error) {
    console.error("Error initializing questions:", error);
  }
}