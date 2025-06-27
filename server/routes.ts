import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "./auth";
import { storage } from "./storage";
import { hashPassword, requireAuth, requireAdmin } from "./auth";
import { generateObituariesWithClaude, generateObituariesWithChatGPT, generateRevisedObituary } from "./services/ai";
import { processDocument, deleteDocument } from "./services/document";
import { generateObituaryPDF } from "./services/pdf";
import { DocumentProcessor } from "./services/documentProcessor";
import { ExportService } from "./services/exportService";
import { NotificationService } from "./services/notifications";
import notificationRoutes from "./routes/notifications";
import { insertObituarySchema, insertGeneratedObituarySchema, insertTextFeedbackSchema, insertQuestionSchema, insertPromptTemplateSchema, insertFinalSpaceSchema, insertFinalSpaceCommentSchema, insertObituaryCollaboratorSchema, insertCollaborationSessionSchema, obituaryCollaborators, collaborationSessions, questions as questionsTable, insertObituaryReviewSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { db } from "./db";
import { eq, and, or, ilike, gte, lte, desc, sql } from "drizzle-orm";
import { obituaries, finalSpaces } from "@shared/schema";
import { apiRateLimit, searchRateLimit, securityHeaders, sanitizeInput, validateFileUpload } from "./middleware/security";
import Anthropic from "@anthropic-ai/sdk";

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

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Automatic AI processing function
async function processObituaryReviewAsync(reviewId: number) {
  try {
    // Set status to processing
    await storage.updateObituaryReview(reviewId, { 
      status: 'processing',
      aiProvider: 'claude'
    });

    // Get review data
    const review = await storage.getObituaryReview(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    // Create AI prompt for obituary feedback
    const prompt = `You are an expert obituary editor providing constructive feedback. Please review this obituary content and provide:

1. IMPROVED VERSION: A refined version of the obituary with better flow, structure, and emotional resonance
2. SPECIFIC FEEDBACK: Detailed suggestions for improvements in areas like:
   - Writing style and tone
   - Structure and organization  
   - Emotional impact
   - Completeness of information
   - Grammar and clarity

Original Obituary Content:
${review.extractedText}

Survey Context (if provided):
${JSON.stringify(review.surveyResponses, null, 2)}

Please format your response as:
IMPROVED VERSION:
[Your improved obituary here]

FEEDBACK:
[Your detailed feedback here]`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: prompt
      }]
    });

    const contentBlock = response.content[0];
    const aiResponse = contentBlock.type === 'text' ? contentBlock.text : '';
    
    // Parse the response to separate improved content and feedback
    const parts = aiResponse.split('FEEDBACK:');
    const improvedContent = parts[0]?.replace('IMPROVED VERSION:', '').trim() || aiResponse;
    const additionalFeedback = parts[1]?.trim() || 'AI processing completed successfully.';

    // Update review with AI results
    await storage.updateObituaryReview(reviewId, {
      status: 'completed',
      improvedContent,
      additionalFeedback,
      processedAt: new Date()
    });

    console.log(`Obituary review ${reviewId} processed successfully`);
  } catch (error) {
    console.error(`Error processing obituary review ${reviewId}:`, error);
    
    // Update status to failed
    await storage.updateObituaryReview(reviewId, {
      status: 'failed',
      additionalFeedback: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration with PostgreSQL store for persistence
  const PgSession = connectPgSimple(session);
  app.use(session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
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

  // Auth routes with enhanced security
  app.post('/auth/login', async (req, res, next) => {
    try {
      const { username: email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Check account lockout
      const { isAccountLocked, getRemainingAttempts, recordLoginAttempt, resetLoginAttempts } = await import('./utils/passwordSecurity');
      const lockInfo = isAccountLocked(email);
      if (lockInfo.locked) {
        return res.status(423).json({ 
          message: `Account temporarily locked. Try again in ${lockInfo.remainingTime} minutes.`,
          remainingTime: lockInfo.remainingTime
        });
      }

      passport.authenticate('local', async (err: any, user: any, info: any) => {
        if (err) {
          return res.status(500).json({ message: 'Authentication error' });
        }
        
        if (!user) {
          // Record failed login attempt
          recordLoginAttempt(email, false);
          const remainingAttempts = getRemainingAttempts(email);
          
          let message = 'Invalid credentials';
          if (remainingAttempts <= 2) {
            message += ` (${remainingAttempts} attempts remaining)`;
          }
          
          return res.status(401).json({ message });
        }
        
        // Record successful login and reset attempts
        recordLoginAttempt(email, true);
        resetLoginAttempts(email);
        
        req.logIn(user, (err) => {
          if (err) {
            return res.status(500).json({ message: 'Login error' });
          }
          
          // Extend session duration on login
          if (req.session && req.session.cookie) {
            req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
          }
          
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
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
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
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Registration endpoint with password validation
  app.post('/auth/register', async (req, res) => {
    try {
      const { name, businessName, email, password, phone, website } = req.body;
      
      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
      }

      // Validate password complexity
      const { validatePasswordComplexity, hashPassword } = await import('./utils/passwordSecurity');
      const passwordValidation = validatePasswordComplexity(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: 'Password does not meet security requirements',
          errors: passwordValidation.errors
        });
      }
      
      // Check if email already exists
      const existingFuneralHome = await storage.getFuneralHomeByEmail(email);
      if (existingFuneralHome) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Hash password with enhanced security
      const hashedPassword = await hashPassword(password);

      // Create funeral home account with encrypted sensitive data
      const { encryptUserSensitiveFields } = await import('./utils/encryption');
      const userData = {
        name,
        businessName,
        email,
        password: hashedPassword,
        phone,
        website,
        contactEmail: email,
        isActive: true
      };

      // Encrypt sensitive fields before storage
      const encryptedUserData = encryptUserSensitiveFields(userData);
      const funeralHome = await storage.createFuneralHome(encryptedUserData);

      res.status(201).json({ 
        message: 'Account created successfully', 
        funeralHome: { 
          id: funeralHome.id, 
          name: funeralHome.name, 
          email: funeralHome.email 
        } 
      });
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

  // Get specific employee by ID
  app.get("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  // Update employee information
  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const employee = await storage.updateEmployee(id, updates);
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  // Get specific admin user by ID
  app.get("/api/admin-users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const adminUser = await storage.getAdminUser(id);
      if (!adminUser) {
        return res.status(404).json({ message: "Admin user not found" });
      }
      res.json(adminUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin user" });
    }
  });

  // Update admin user information
  app.patch("/api/admin-users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // For now, since updateAdminUser doesn't exist in storage, we'll return the current user
      // This would need to be implemented in storage.ts for full functionality
      const adminUser = await storage.getAdminUser(id);
      if (!adminUser) {
        return res.status(404).json({ message: "Admin user not found" });
      }
      
      // In a real implementation, you'd update the admin user here
      res.json({ ...adminUser, ...updates });
    } catch (error) {
      res.status(500).json({ message: "Failed to update admin user" });
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
        const userEmail = (req.user as any)?.email;
        if (!userEmail) {
          return res.status(401).json({ message: "User email not found" });
        }
        
        const allCollaborators = await db.select()
          .from(obituaryCollaborators)
          .where(eq(obituaryCollaborators.email, userEmail));
        
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
  app.get("/api/surveys", async (req: any, res) => {
    try {
      const surveys = await storage.getSurveys();
      res.json(surveys);
    } catch (error) {
      console.error("Error fetching surveys:", error);
      res.status(500).json({ error: "Failed to fetch surveys" });
    }
  });

  app.get("/api/surveys/:id", requireAuth, async (req: any, res) => {
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

  app.post("/api/surveys", requireAuth, async (req: any, res) => {
    try {
      const surveyData = {
        ...req.body,
        createdById: req.user.id,
        createdByType: req.user.userType,
        version: 1
      };
      const survey = await storage.createSurvey(surveyData);
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

  // AI Processing endpoint for obituary reviews
  app.post("/api/obituary-reviews/:id/process", requireAuth, async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const review = await storage.getObituaryReview(reviewId);
      
      if (!review) {
        return res.status(404).json({ error: "Obituary review not found" });
      }

      // Check if user has permission to process this review
      const user = req.user;
      if (user.userType !== 'admin' && review.createdById !== user.id) {
        return res.status(403).json({ error: "Unauthorized to process this review" });
      }

      // Import Claude service
      const { ClaudeService } = await import('./services/claude');

      // Process with Claude AI
      const result = await ClaudeService.processWithRetry({
        userId: user.id,
        userType: user.userType,
        originalText: review.extractedText,
        surveyResponses: review.surveyResponses,
        obituaryReviewId: reviewId
      });

      // Update review with AI results
      const updatedReview = await storage.updateObituaryReview(reviewId, {
        improvedContent: result.editedText,
        additionalFeedback: result.feedback,
        aiProvider: 'claude',
        status: 'completed',
        processedAt: new Date()
      });

      res.json({
        feedback: result.feedback,
        editedText: result.editedText,
        tokensUsed: result.tokensUsed,
        estimatedCost: result.estimatedCost,
        review: updatedReview
      });

    } catch (error) {
      console.error("Error processing obituary review:", error);
      
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        return res.status(429).json({ error: error.message });
      }
      
      res.status(500).json({ error: "Failed to process obituary review. Please try again later." });
    }
  });

  // API Usage dashboard endpoint
  app.get("/api/api-usage", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const { timeRange = '24h', userId } = req.query;
      
      // Only admin can view all users' usage
      if (userId && user.userType !== 'admin') {
        return res.status(403).json({ error: "Unauthorized to view other users' API usage" });
      }

      // Calculate time range
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const targetUserId = userId ? parseInt(userId) : (user.userType === 'admin' ? undefined : user.id);
      
      const apiCalls = await storage.getApiCalls(targetUserId, {
        start: startDate,
        end: now
      });

      // Calculate totals
      const totalCalls = apiCalls.length;
      const totalCost = apiCalls.reduce((sum, call) => sum + (parseFloat(call.estimatedCost?.toString() || '0')), 0);
      const totalTokens = apiCalls.reduce((sum, call) => sum + (call.tokensUsed || 0), 0);
      const successfulCalls = apiCalls.filter(call => call.status === 'success').length;

      res.json({
        calls: apiCalls,
        summary: {
          totalCalls,
          totalCost: totalCost.toFixed(4),
          totalTokens,
          successfulCalls,
          errorRate: totalCalls > 0 ? ((totalCalls - successfulCalls) / totalCalls * 100).toFixed(2) : 0
        },
        timeRange,
        period: {
          start: startDate,
          end: now
        }
      });

    } catch (error) {
      console.error("Error fetching API usage:", error);
      res.status(500).json({ error: "Failed to fetch API usage data" });
    }
  });

  // Document processing endpoint for obituary reviews
  app.post('/api/process-document', requireAuth, upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Validate file type
      const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Invalid file type. Only .docx and .pdf files are allowed.' });
      }

      const result = await processDocument(req.file);
      res.json({ text: result.text, filename: result.filename });
    } catch (error) {
      console.error('Document processing error:', error);
      res.status(500).json({ error: 'Failed to process document' });
    }
  });

  // Obituary Review endpoints for Phase 2
  app.post('/api/obituary-reviews', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const validatedData = insertObituaryReviewSchema.parse({
        funeralHomeId: user.userType === 'admin' ? 1 : (user.userType === 'funeral_home' ? user.id : user.funeralHomeId),
        createdById: user.id,
        createdByType: user.userType,
        originalFilename: req.body.originalFilename,
        originalFileSize: req.body.originalFileSize,
        extractedText: req.body.extractedText,
        surveyResponses: req.body.surveyResponses,
        status: 'pending'
      });

      const review = await storage.createObituaryReview(validatedData);
      
      // Trigger automatic AI processing
      processObituaryReviewAsync(review.id);
      
      res.json(review);
    } catch (error) {
      console.error('Error creating obituary review:', error);
      res.status(500).json({ error: 'Failed to create obituary review' });
    }
  });

  app.get('/api/obituary-reviews', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      let funeralHomeId: number | undefined;

      if (user.userType === 'funeral_home') {
        funeralHomeId = user.id;
      } else if (user.userType === 'employee') {
        funeralHomeId = user.funeralHomeId;
      }
      // Admin users see all reviews (funeralHomeId = undefined)

      const reviews = await storage.getObituaryReviews(funeralHomeId);
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching obituary reviews:', error);
      res.status(500).json({ error: 'Failed to fetch obituary reviews' });
    }
  });

  app.get('/api/obituary-reviews/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const review = await storage.getObituaryReview(id);
      
      if (!review) {
        return res.status(404).json({ error: 'Obituary review not found' });
      }

      // If review is pending, trigger automatic processing
      if (review.status === 'pending') {
        processObituaryReviewAsync(id);
      }

      res.json(review);
    } catch (error) {
      console.error('Error fetching obituary review:', error);
      res.status(500).json({ error: 'Failed to fetch obituary review' });
    }
  });

  // Manual processing trigger endpoint
  app.post('/api/obituary-reviews/:id/process', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const review = await storage.getObituaryReview(id);
      
      if (!review) {
        return res.status(404).json({ error: 'Obituary review not found' });
      }

      if (review.status === 'completed') {
        return res.json({ message: 'Review already processed', review });
      }

      // Trigger processing
      processObituaryReviewAsync(id);
      
      res.json({ message: 'Processing started', status: 'processing' });
    } catch (error) {
      console.error('Error triggering obituary review processing:', error);
      res.status(500).json({ error: 'Failed to trigger processing' });
    }
  });

  // Admin Delete Endpoints
  app.delete('/api/obituaries/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const obituaryId = parseInt(req.params.id);
      await storage.deleteObituary(obituaryId);
      res.json({ message: 'Obituary deleted successfully' });
    } catch (error) {
      console.error('Error deleting obituary:', error);
      res.status(500).json({ error: 'Failed to delete obituary' });
    }
  });

  app.delete('/api/obituary-reviews/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      await storage.deleteObituaryReview(reviewId);
      res.json({ message: 'Obituary review deleted successfully' });
    } catch (error) {
      console.error('Error deleting obituary review:', error);
      res.status(500).json({ error: 'Failed to delete obituary review' });
    }
  });

  // Phase 4: Obituary Review Edit History endpoints
  app.get('/api/obituary-reviews/:id/edits', async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const edits = await storage.getObituaryReviewEdits(reviewId);
      res.json(edits);
    } catch (error) {
      console.error('Error fetching obituary review edits:', error);
      res.status(500).json({ error: 'Failed to fetch obituary review edits' });
    }
  });

  app.post('/api/obituary-reviews/:id/edits', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const reviewId = parseInt(req.params.id);
      const { editedContent, editComment } = req.body;

      // Get current version number
      const existingEdits = await storage.getObituaryReviewEdits(reviewId);
      const nextVersion = existingEdits.length + 1;

      const editData = {
        reviewId,
        version: nextVersion,
        editedContent,
        editType: 'manual_edit',
        editComment,
        editedBy: user.id,
        editedByType: user.userType,
      };

      const newEdit = await storage.createObituaryReviewEdit(editData);
      res.json(newEdit);
    } catch (error) {
      console.error('Error creating obituary review edit:', error);
      res.status(500).json({ error: 'Failed to save obituary review edit' });
    }
  });

  app.post('/api/obituary-reviews/:id/publish', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const reviewId = parseInt(req.params.id);

      const newObituary = await storage.publishObituaryReviewToSystem(reviewId, user.id, user.userType);
      res.json(newObituary);
    } catch (error) {
      console.error('Error publishing obituary review:', error);
      res.status(500).json({ error: 'Failed to publish obituary review to system' });
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

  app.put("/api/questions/:id", async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const question = await storage.updateQuestion(questionId, req.body);
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ error: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      await storage.deleteQuestion(questionId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ error: "Failed to delete question" });
    }
  });

  app.put("/api/questions/reorder", async (req, res) => {
    try {
      const { questions } = req.body;
      
      if (!Array.isArray(questions)) {
        return res.status(400).json({ error: "Questions must be an array" });
      }

      // Update order indices for all questions using direct SQL to avoid syntax errors
      for (const question of questions) {
        await db
          .update(questionsTable)
          .set({ orderIndex: question.orderIndex })
          .where(eq(questionsTable.id, question.id));
      }

      res.json({ success: true, message: "Questions reordered successfully" });
    } catch (error) {
      console.error("Error reordering questions:", error);
      res.status(500).json({ error: "Failed to reorder questions" });
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
      const userType = req.query.userType as string || 'admin';
      const userIdParam = req.query.userId as string;
      const userId = userIdParam ? parseInt(userIdParam) : 1;
      
      console.log(`FinalSpaces API: ${userType} user ${userId} requesting data`);
      
      // Validate userId
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      let finalSpaces;
      if (userType === 'admin') {
        // Admin sees all FinalSpaces
        finalSpaces = await storage.getAllFinalSpaces();
        console.log(`Admin sees ${finalSpaces.length} total FinalSpaces`);
      } else if (userType === 'funeral_home') {
        // Funeral home sees their own FinalSpaces (using userId as funeralHomeId)
        finalSpaces = await storage.getFinalSpacesByFuneralHome(userId);
        console.log(`Funeral home ${userId} sees ${finalSpaces.length} FinalSpaces`);
      } else if (userType === 'employee') {
        // Employee sees FinalSpaces they created
        finalSpaces = await storage.getFinalSpacesByCreator(userId, 'employee');
        console.log(`Employee ${userId} sees ${finalSpaces.length} FinalSpaces`);
      } else {
        // Individual users see FinalSpaces they created or collaborate on
        finalSpaces = await storage.getFinalSpacesByCreator(userId, 'individual');
        console.log(`Individual ${userId} sees ${finalSpaces.length} FinalSpaces`);
      }
      
      res.json(finalSpaces);
    } catch (error) {
      console.error('Error fetching final spaces:', error);
      res.status(500).json({ message: "Failed to fetch final spaces" });
    }
  });

  // Memorial page viewer endpoint
  app.get("/api/memorial/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const memorial = await storage.getFinalSpaceBySlug(slug);
      
      if (!memorial) {
        return res.status(404).json({ message: "Memorial not found" });
      }

      // Increment view count
      await storage.updateFinalSpace(memorial.id, { 
        viewCount: (memorial.viewCount || 0) + 1 
      });

      res.json(memorial);
    } catch (error) {
      console.error('Error fetching memorial:', error);
      res.status(500).json({ message: "Failed to fetch memorial" });
    }
  });

  // Individual obituary endpoint for memorial integration
  app.get("/api/obituaries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const obituary = await storage.getObituary(id);
      
      if (!obituary) {
        return res.status(404).json({ message: "Obituary not found" });
      }
      
      res.json(obituary);
    } catch (error) {
      console.error('Error fetching obituary:', error);
      res.status(500).json({ message: "Failed to fetch obituary" });
    }
  });

  // Memorial comments endpoints
  app.get("/api/memorial/:slug/comments", async (req, res) => {
    try {
      const { slug } = req.params;
      const memorial = await storage.getFinalSpaceBySlug(slug);
      
      if (!memorial) {
        return res.status(404).json({ message: "Memorial not found" });
      }

      const comments = await storage.getFinalSpaceComments(memorial.id);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/memorial/:slug/comments", async (req, res) => {
    try {
      const { slug } = req.params;
      const { authorName, authorEmail, content } = req.body;
      
      const memorial = await storage.getFinalSpaceBySlug(slug);
      if (!memorial) {
        return res.status(404).json({ message: "Memorial not found" });
      }

      if (!memorial.allowComments) {
        return res.status(403).json({ message: "Comments not allowed on this memorial" });
      }

      const comment = await storage.createFinalSpaceComment({
        finalSpaceId: memorial.id,
        authorName,
        authorEmail: authorEmail || null,
        content,
        isApproved: true // Auto-approve for now
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.post("/api/final-spaces", async (req, res) => {
    try {
      console.log('Received final space creation request:', req.body);
      
      const data = req.body;
      
      // Generate slug from person name
      const slug = data.personName.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now();

      const validatedData = {
        funeralHomeId: data.funeralHomeId || null,
        createdById: data.createdById || 1,
        createdByType: data.createdByType || 'funeral_home',
        obituaryId: data.obituaryId || null,
        slug,
        personName: data.personName,
        dateOfBirth: data.dateOfBirth || null,
        dateOfDeath: data.dateOfDeath || null,
        description: data.description || null,
        socialMediaLinks: data.socialMediaLinks || null,
        musicPlaylist: data.musicPlaylist || null,
        isPublic: data.isPublic !== false,
        allowComments: data.allowComments !== false,
        images: data.images || [],
        audioFiles: data.audioFiles || [],
        youtubeLinks: data.youtubeLinks || [],
        primaryMediaType: data.primaryMediaType || null,
        primaryMediaId: data.primaryMediaId || null,
        status: data.status || 'published',
        theme: 'classic',
        viewCount: 0
      };

      console.log('Creating final space with validated data:', validatedData);
      
      const finalSpace = await storage.createFinalSpace(validatedData);
      console.log('Created final space:', finalSpace);
      
      res.status(201).json(finalSpace);
    } catch (error) {
      console.error('Error creating final space:', error);
      res.status(400).json({ message: "Failed to create final space" });
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
      console.error('Error fetching final space:', error);
      res.status(500).json({ message: "Failed to fetch final space" });
    }
  });

  app.put("/api/final-spaces/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      console.log('Updating final space:', id, updates);
      
      const updatedSpace = await storage.updateFinalSpace(id, updates);
      res.json(updatedSpace);
    } catch (error) {
      console.error('Error updating final space:', error);
      res.status(500).json({ message: "Failed to update final space" });
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

  // Final Space Collaboration endpoints
  app.get("/api/final-spaces/:id/collaborators", async (req, res) => {
    try {
      const finalSpaceId = parseInt(req.params.id);
      const collaborators = await storage.getFinalSpaceCollaborators(finalSpaceId);
      res.json(collaborators);
    } catch (error) {
      console.error("Error fetching final space collaborators:", error);
      res.status(500).json({ error: "Failed to fetch collaborators" });
    }
  });

  app.post("/api/final-spaces/:id/collaborators", async (req, res) => {
    try {
      const finalSpaceId = parseInt(req.params.id);
      const collaboratorData = { ...req.body, finalSpaceId };
      const collaborator = await storage.createFinalSpaceCollaborator(collaboratorData);
      
      // Send email invitation
      try {
        await NotificationService.sendFinalSpaceCollaborationInvite(
          finalSpaceId,
          collaboratorData.collaboratorEmail,
          collaboratorData.collaboratorName || 'Collaborator',
          'DeathMatters Team' // TODO: Get actual inviter name from session
        );
      } catch (emailError) {
        console.error('Failed to send final space collaboration email:', emailError);
        // Don't fail the request if email fails
      }
      
      res.status(201).json(collaborator);
    } catch (error) {
      console.error("Error adding final space collaborator:", error);
      res.status(500).json({ error: "Failed to add collaborator" });
    }
  });

  app.delete("/api/final-spaces/collaborators/:id", async (req, res) => {
    try {
      const collaboratorId = parseInt(req.params.id);
      await storage.deleteFinalSpaceCollaborator(collaboratorId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing final space collaborator:", error);
      res.status(500).json({ error: "Failed to remove collaborator" });
    }
  });

  // Final Space Collaboration Session endpoints
  app.get("/api/final-space-collaboration/:uuid", async (req, res) => {
    try {
      const { uuid } = req.params;
      const session = await storage.getFinalSpaceCollaborationSession(uuid);
      
      if (!session) {
        return res.status(404).json({ error: "Collaboration session not found" });
      }

      // Update last accessed
      await storage.updateFinalSpaceCollaborationSession(uuid, {
        lastAccessedAt: new Date()
      });

      res.json(session);
    } catch (error) {
      console.error("Error fetching final space collaboration session:", error);
      res.status(500).json({ error: "Failed to fetch collaboration session" });
    }
  });

  app.post("/api/final-space-collaboration", async (req, res) => {
    try {
      const session = await storage.createFinalSpaceCollaborationSession(req.body);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating final space collaboration session:", error);
      res.status(500).json({ error: "Failed to create collaboration session" });
    }
  });

  // Search API endpoint with rate limiting
  app.get('/api/search', searchRateLimit, async (req, res) => {
    try {
      const { q: query, type, dateFrom, dateTo, funeralHomeId } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const searchQuery = `%${query}%`;
      const results = {
        obituaries: [],
        memorials: [],
        total: 0
      };

      // Search obituaries
      if (!type || type === 'obituaries' || type === 'all') {
        const obituaryResults = await db
          .select({
            id: obituaries.id,
            type: sql<string>`'obituary'`,
            title: obituaries.fullName,
            createdAt: obituaries.createdAt,
            funeralHomeId: obituaries.funeralHomeId,
            status: obituaries.status
          })
          .from(obituaries)
          .where(ilike(obituaries.fullName, searchQuery))
          .orderBy(desc(obituaries.createdAt));
        
        results.obituaries = obituaryResults;
      }

      // Search memorials
      if (!type || type === 'memorials' || type === 'all') {
        const memorialResults = await db
          .select({
            id: finalSpaces.id,
            type: sql<string>`'memorial'`,
            title: finalSpaces.personName,
            createdAt: finalSpaces.createdAt,
            funeralHomeId: finalSpaces.funeralHomeId,
            status: finalSpaces.status
          })
          .from(finalSpaces)
          .where(
            or(
              ilike(finalSpaces.personName, searchQuery),
              ilike(finalSpaces.description, searchQuery)
            )
          )
          .orderBy(desc(finalSpaces.createdAt));
        
        results.memorials = memorialResults;
      }

      results.total = results.obituaries.length + results.memorials.length;
      res.json(results);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // PHASE 5: Enhanced Obituary Review API Endpoints

  // Enhanced save with comprehensive validation and version tracking
  app.post('/api/obituary-reviews/:id/save', requireAuth, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const { editedContent, editComment } = req.body;
      const user = req.user as any;

      // Validate input
      if (!editedContent || editedContent.trim().length === 0) {
        return res.status(400).json({ error: 'Content cannot be empty' });
      }

      if (editedContent.length > 10000) {
        return res.status(400).json({ error: 'Content exceeds maximum length of 10,000 characters' });
      }

      // Check if review exists and user has permission
      const existingReview = await storage.getObituaryReview(reviewId);
      if (!existingReview) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Verify user has permission to edit this review
      const hasPermission = existingReview.uploadedBy === user.id || 
                           (user.userType === 'admin') ||
                           (user.userType === 'funeral_home' && existingReview.funeralHomeId === user.id);

      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      // Create edit history entry with incremented version
      const newVersion = (existingReview.currentVersion || 1) + 1;
      
      const edit = await storage.createObituaryReviewEdit({
        reviewId,
        version: newVersion,
        editedContent,
        editType: 'user_edited',
        editedBy: user.id,
        editedByType: user.userType,
        editedByName: user.name || user.username,
        changesSummary: editComment || `Version ${newVersion} - User edit`
      });

      // Update the main review record
      const updatedReview = await storage.updateObituaryReview(reviewId, {
        improvedContent: editedContent,
        currentVersion: newVersion,
        status: 'edited',
        updatedAt: new Date()
      });

      res.json({ 
        success: true, 
        edit, 
        review: updatedReview,
        message: 'Changes saved successfully',
        version: newVersion
      });

    } catch (error) {
      console.error('Error saving obituary review edit:', error);
      res.status(500).json({ error: 'Failed to save changes' });
    }
  });

  // Publish reviewed obituary to main system
  app.post('/api/obituary-reviews/:id/publish', requireAuth, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const { publishToSystem, createMemorial } = req.body;
      const user = req.user as any;

      // Get the review
      const review = await storage.getObituaryReview(reviewId);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Verify user has permission
      const hasPermission = review.uploadedBy === user.id || 
                           (user.userType === 'admin') ||
                           (user.userType === 'funeral_home' && review.funeralHomeId === user.id);

      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const finalContent = review.improvedContent || review.originalContent;

      let createdObituary = null;
      let createdMemorial = null;

      // Create obituary in main system if requested
      if (publishToSystem) {
        const obituaryData = {
          funeralHomeId: review.funeralHomeId || user.id,
          createdById: user.id,
          createdByType: user.userType,
          formData: JSON.stringify({ reviewContent: finalContent }),
          fullName: extractNameFromContent(finalContent),
          status: 'published'
        };

        createdObituary = await storage.createObituary(obituaryData);

        // Create a generated obituary entry
        const generatedData = {
          obituaryId: createdObituary.id,
          aiProvider: 'review_edit',
          version: review.currentVersion || 1,
          content: finalContent
        };

        await storage.createGeneratedObituary(generatedData);
      }

      // Create memorial if requested
      if (createMemorial && createdObituary) {
        const memorialData = {
          funeralHomeId: review.funeralHomeId,
          createdById: user.id,
          createdByType: user.userType,
          obituaryId: createdObituary.id,
          slug: generateSlugFromName(createdObituary.fullName),
          personName: createdObituary.fullName,
          description: finalContent,
          isPublic: true,
          allowComments: true,
          status: 'published',
          theme: 'classic',
          viewCount: 0
        };

        createdMemorial = await storage.createFinalSpace(memorialData);
      }

      // Update review status
      await storage.updateObituaryReview(reviewId, {
        status: 'published',
        publishedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Content published successfully',
        obituary: createdObituary,
        memorial: createdMemorial
      });

    } catch (error) {
      console.error('Error publishing obituary review:', error);
      res.status(500).json({ error: 'Failed to publish content' });
    }
  });

  // Export obituary review in various formats
  app.post('/api/obituary-reviews/:id/export', requireAuth, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const { format = 'docx', includeHistory = false } = req.body;
      const user = req.user as any;

      // Validate format
      if (!['docx', 'pdf'].includes(format)) {
        return res.status(400).json({ error: 'Invalid format. Use "docx" or "pdf"' });
      }

      // Get the review
      const review = await storage.getObituaryReview(reviewId);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Verify user has permission
      const hasPermission = review.uploadedBy === user.id || 
                           (user.userType === 'admin') ||
                           (user.userType === 'funeral_home' && review.funeralHomeId === user.id);

      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const finalContent = review.improvedContent || review.originalContent;
      let exportContent = finalContent;

      // Include edit history if requested
      if (includeHistory) {
        const edits = await storage.getObituaryReviewEdits(reviewId);
        
        if (edits.length > 0) {
          exportContent += '\n\n--- EDIT HISTORY ---\n\n';
          edits.forEach((edit, index) => {
            exportContent += `Version ${edit.version} (${edit.createdAt?.toLocaleDateString()}):\n`;
            exportContent += `Edited by: ${edit.editedByName}\n`;
            if (edit.changesSummary) {
              exportContent += `Changes: ${edit.changesSummary}\n`;
            }
            exportContent += '\n';
          });
        }
      }

      // Generate export
      const exportOptions = {
        format: format as 'docx' | 'pdf',
        content: exportContent,
        title: extractNameFromContent(finalContent) || 'Obituary',
        metadata: {
          author: user.name || user.username,
          subject: 'Reviewed Obituary',
          keywords: ['obituary', 'memorial', 'review'],
          createdAt: new Date()
        }
      };

      const buffer = await ExportService.exportDocument(exportOptions);
      const filename = ExportService.generateFilename(format, exportOptions.title);

      // Set response headers
      res.setHeader('Content-Type', format === 'docx' 
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);

    } catch (error) {
      console.error('Error exporting obituary review:', error);
      res.status(500).json({ error: 'Failed to export document' });
    }
  });

  // Get comprehensive audit trail for a review
  app.get('/api/obituary-reviews/:id/audit', requireAuth, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const user = req.user as any;

      // Get the review
      const review = await storage.getObituaryReview(reviewId);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Verify user has permission
      const hasPermission = review.uploadedBy === user.id || 
                           (user.userType === 'admin') ||
                           (user.userType === 'funeral_home' && review.funeralHomeId === user.id);

      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      // Get all edit history
      const edits = await storage.getObituaryReviewEdits(reviewId);

      // Build comprehensive audit trail
      const auditTrail = {
        review: {
          id: review.id,
          status: review.status,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          uploadedBy: review.uploadedByName,
          currentVersion: review.currentVersion,
          documentMetadata: review.documentMetadata ? JSON.parse(review.documentMetadata) : null
        },
        timeline: [
          {
            action: 'uploaded',
            timestamp: review.createdAt,
            user: review.uploadedByName,
            version: 1,
            details: 'Document uploaded for review'
          },
          ...edits.map(edit => ({
            action: edit.editType,
            timestamp: edit.createdAt,
            user: edit.editedByName,
            version: edit.version,
            details: edit.changesSummary
          }))
        ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
        versions: edits.length + 1,
        totalEdits: edits.length
      };

      res.json(auditTrail);

    } catch (error) {
      console.error('Error fetching audit trail:', error);
      res.status(500).json({ error: 'Failed to fetch audit trail' });
    }
  });

  // Helper methods
  const extractNameFromContent = (content: string): string => {
    // Simple name extraction from obituary content
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();
    
    // Look for patterns like "John Doe" or "In memory of John Doe"
    const nameMatch = firstLine?.match(/(?:In memory of |)([A-Z][a-z]+ [A-Z][a-z]+)/);
    return nameMatch?.[1] || 'Unknown';
  };

  const generateSlugFromName = (name: string): string => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();
  };

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
        },
        {
          name: "Obituary Review",
          description: "AI prompt for reviewing and providing feedback on existing obituaries",
          platform: "claude",
          promptType: "review",
          content: "You are an expert obituary editor with years of experience in creating meaningful, dignified tributes. Your task is to review the provided obituary and provide constructive feedback along with an improved version.\n\nPlease analyze the obituary for:\n- Clarity and readability\n- Emotional tone and dignity\n- Completeness of life story\n- Flow and structure\n- Grammar and style\n- Accuracy and consistency\n\nProvide specific, actionable feedback that helps honor the deceased person's memory while improving the overall quality of the writing."
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