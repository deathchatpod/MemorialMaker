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
import { insertObituarySchema, insertGeneratedObituarySchema, insertTextFeedbackSchema, insertQuestionSchema, insertPromptTemplateSchema, insertFinalSpaceSchema, insertFinalSpaceCommentSchema, insertObituaryCollaboratorSchema, insertCollaborationSessionSchema, obituaryCollaborators, collaborationSessions, finalSpaceCollaborators, questions as questionsTable, insertObituaryReviewSchema } from "@shared/schema";
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

    // Create AI prompt for obituary feedback with structured response
    const prompt = `You are an expert obituary editor providing constructive feedback. Your role is to improve ONLY the writing quality, tone, grammar, and flow - you must NOT add any new facts, details, or information that wasn't in the original.

Original Obituary Content:
${review.extractedText}

Survey Context (if provided):
${JSON.stringify(review.surveyResponses, null, 2)}

CRITICAL REQUIREMENTS:
1. DO NOT ADD any new facts, anecdotes, details, or information not present in the original
2. DO NOT invent specific activities, places, or experiences (like "visiting beaches" or "vending machines")
3. ONLY improve: writing style, tone, grammar, sentence structure, flow, and readability
4. PRESERVE every fact, name, date, location, and detail from the original exactly as written
5. Focus improvements on: clarity, emotional resonance, better word choice, smoother transitions
6. If information seems incomplete, note it in feedback but do NOT fill in missing details

Please analyze the original text and respond with a JSON object containing:
{
  "likedPhrases": ["exact phrase from original", "another exact phrase"],
  "improvedPhrases": [
    {"original": "exact phrase from original text", "improved": "your improved version using ONLY original facts"},
    {"original": "another phrase", "improved": "improved version with NO new details"}
  ],
  "improvedVersion": "COMPLETE improved obituary text with ONLY original facts presented with better writing",
  "generalFeedback": "Brief assessment focusing on writing improvements made (grammar, tone, flow, clarity)"
}

Rules:
- "likedPhrases": Extract 3-8 exact phrases from the original text that are well-written
- "improvedPhrases": Show original vs improved versions that enhance ONLY the writing, not the facts
- "improvedVersion": All original information with improved writing quality - NO new facts added
- "generalFeedback": Focus on writing improvements, not content additions
- NEVER add fictional details, specific activities, or embellishments not in the original

Respond ONLY with valid JSON, no other text or markup.`;

    // Call Claude API with increased token limit for complete responses

    const startTime = Date.now();
    
    const response = await Promise.race([
      anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000, // Reduced for faster processing
        messages: [{
          role: "user",
          content: prompt
        }]
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Claude API timeout after 30 seconds')), 30000)
      )
    ]) as any;
    
    const processingTime = Date.now() - startTime;


    const contentBlock = response.content[0];
    const aiResponse = contentBlock.type === 'text' ? contentBlock.text : '';
    
    // Parse the structured JSON response
    let parsedResponse;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```[a-z]*\s*/, '').replace(/\s*```$/, '');
      }
      
      parsedResponse = JSON.parse(cleanResponse);
      
      // Ensure we have the expected structure
      if (!parsedResponse.likedPhrases) parsedResponse.likedPhrases = [];
      if (!parsedResponse.improvedPhrases) parsedResponse.improvedPhrases = [];
      if (!parsedResponse.improvedVersion) parsedResponse.improvedVersion = review.extractedText;
      if (!parsedResponse.generalFeedback) parsedResponse.generalFeedback = 'AI processing completed successfully.';
      
    } catch (error) {

      // Fallback to old parsing method
      const parts = aiResponse.split('FEEDBACK:');
      parsedResponse = {
        improvedVersion: parts[0]?.replace('IMPROVED VERSION:', '').trim() || aiResponse,
        generalFeedback: parts[1]?.trim() || 'AI processing completed successfully.',
        likedPhrases: [],
        improvedPhrases: []
      };
    }

    // Update review with AI results including structured phrase feedback
    await storage.updateObituaryReview(reviewId, {
      status: 'completed',
      improvedContent: parsedResponse.improvedVersion || parsedResponse.editedText || aiResponse,
      additionalFeedback: parsedResponse.generalFeedback || parsedResponse.feedback || 'AI processing completed successfully.',
      positivePhrases: JSON.stringify(parsedResponse.likedPhrases || []),
      phrasesToImprove: JSON.stringify(parsedResponse.improvedPhrases || []),
      processedAt: new Date()
    });


  } catch (error) {

    
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

  // User endpoint (main frontend endpoint)
  app.get("/api/user", async (req, res) => {
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
      
      // Calculate age from dates if available, otherwise use provided age
      let calculatedAge = formData.age;
      if (formData.dateOfBirth && formData.dateOfDeath) {
        const birthDate = new Date(formData.dateOfBirth);
        const deathDate = new Date(formData.dateOfDeath);
        if (!isNaN(birthDate.getTime()) && !isNaN(deathDate.getTime()) && deathDate >= birthDate) {
          calculatedAge = Math.floor((deathDate.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        }
      }
      
      // Ensure age is valid
      if (calculatedAge !== undefined) {
        calculatedAge = Math.max(0, Math.min(150, calculatedAge));
      }
      
      const validatedData = insertObituarySchema.parse({
        funeralHomeId: 1, // Default for testing
        createdById: 1,
        createdByType: 'funeral_home',
        fullName: formData.fullName,
        age: calculatedAge,
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

      
      // Enhanced error handling with detailed user feedback
      if (error instanceof Error) {
        // Check for specific validation errors
        if (error.message.includes('age')) {
          return res.status(400).json({ 
            message: "Age validation failed",
            details: [
              "Age must be between 0 and 150 years",
              "If providing birth and death dates, age will be calculated automatically",
              "Please verify your date entries are correct"
            ]
          });
        }
        
        if (error.message.includes('date')) {
          return res.status(400).json({ 
            message: "Date validation failed",
            details: [
              "Birth date must be before death date",
              "Death date cannot be in the future",
              "Please use valid date formats (YYYY-MM-DD)"
            ]
          });
        }
        
        if (error.message.includes('required') || error.message.includes('fullName')) {
          return res.status(400).json({ 
            message: "Required field validation failed",
            details: [
              "Full name is required and must be at least 2 characters",
              "Please ensure all required fields are completed",
              "Check that tone and age category are selected"
            ]
          });
        }
      }
      
      res.status(500).json({ 
        message: "Unable to create obituary due to server error",
        details: [
          "Please try again in a few moments",
          "If the problem persists, contact support",
          "Your form data has not been lost - you can try submitting again"
        ]
      });
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
      
      // Get user information for API tracking
      const userId = obituary.createdById || 1;
      const userType = obituary.createdByType || 'admin';
      
      // Generate obituaries from both AI services with tracking
      const [claudeResults, chatgptResults] = await Promise.all([
        generateObituariesWithClaude(formData, userId, userType),
        generateObituariesWithChatGPT(formData, userId, userType)
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
        collaboratorEmail: email,
        invitedBy: 1, // Default admin user for testing
        invitedByType: 'admin',
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

  // My Collaborations endpoint that matches frontend expectations
  app.get("/api/my-collaborations", async (req, res) => {
    try {
      const { userEmail, userId, userType } = req.query;
      
      if (!userEmail || !userId || !userType) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      let collaborations = [];
      
      // Get obituary collaborations where user is invited
      const obituaryCollabs = await db.select()
        .from(obituaryCollaborators)
        .where(eq(obituaryCollaborators.collaboratorEmail, userEmail as string));
      
      for (const collab of obituaryCollabs) {
        const obituary = await storage.getObituary(collab.obituaryId);
        const sessions = await db.select()
          .from(collaborationSessions)
          .where(eq(collaborationSessions.obituaryId, collab.obituaryId));
        
        if (obituary) {
          collaborations.push({
            id: collab.id,
            name: obituary.fullName,
            type: 'Obituary',
            status: collab.status || 'pending',
            invitedBy: collab.invitedByType === 'admin' ? 'Admin User' : 
                     collab.invitedByType === 'funeral_home' ? 'Funeral Home' : 
                     collab.invitedByType === 'employee' ? 'Employee' : 'Unknown',
            createdAt: collab.createdAt,
            entityId: obituary.id,
            collaborationUuid: sessions[0]?.uuid
          });
        }
      }
      
      // Get FinalSpace collaborations
      try {
        const finalSpaceCollabs = await db.select()
          .from(finalSpaceCollaborators)
          .where(eq(finalSpaceCollaborators.collaboratorEmail, userEmail as string));
        
        for (const collab of finalSpaceCollabs || []) {
          const finalSpace = await storage.getFinalSpace(collab.finalSpaceId);
          if (finalSpace) {
            collaborations.push({
              id: collab.id,
              name: finalSpace.personName || 'Memorial Space',
              type: 'FinalSpace',
              status: collab.status || 'pending',
              invitedBy: collab.invitedByType === 'admin' ? 'Admin User' : 
                       collab.invitedByType === 'funeral_home' ? 'Funeral Home' : 
                       collab.invitedByType === 'employee' ? 'Employee' : 'Unknown',
              createdAt: collab.createdAt,
              entityId: finalSpace.id
            });
          }
        }
      } catch (error) {
        // Continue without FinalSpace collaborations if there's an error
        console.log("Error fetching FinalSpace collaborations:", error);
      }
      
      res.json(collaborations);
    } catch (error) {
      console.error("Error fetching my collaborations:", error);
      res.status(500).json({ error: "Failed to fetch collaborations" });
    }
  });

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
          .where(eq(obituaryCollaborators.collaboratorEmail, userEmail));
        
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
      const successfulCalls = apiCalls.filter(call => call.status === 'completed' || call.status === 'success').length;

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

  // Create new version of existing template
  app.post("/api/prompt-templates/versions", async (req, res) => {
    try {
      const template = await storage.createPromptTemplateVersion(req.body);
      res.json(template);
    } catch (error) {
      console.error('Error creating template version:', error);
      res.status(400).json({ message: "Failed to create template version" });
    }
  });

  // Get version history for a template type
  app.get("/api/prompt-templates/:platform/:promptType/versions", async (req, res) => {
    try {
      const { platform, promptType } = req.params;
      const versions = await storage.getPromptTemplateVersions(platform, promptType);
      res.json(versions);
    } catch (error) {
      console.error('Error fetching template versions:', error);
      res.status(500).json({ message: "Failed to fetch template versions" });
    }
  });

  // Make a template version primary
  app.put("/api/prompt-templates/:id/make-primary", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.makePrimaryPromptTemplate(id);
      res.json(template);
    } catch (error) {
      console.error('Error making template primary:', error);
      res.status(400).json({ message: "Failed to make template primary" });
    }
  });

  // Get documents for a template
  app.get("/api/prompt-templates/:id/documents", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const documents = await storage.getPromptTemplateDocuments(templateId);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching template documents:', error);
      res.status(500).json({ message: "Failed to fetch template documents" });
    }
  });

  // Upload document for a template
  app.post("/api/prompt-templates/:id/documents", upload.single('document'), async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Extract text content based on file type
      let content = '';
      if (file.mimetype === 'text/plain') {
        content = file.buffer.toString('utf-8');
      } else if (file.mimetype === 'application/pdf') {
        const pdfParse = await import('pdf-parse');
        const data = await pdfParse.default(file.buffer);
        content = data.text;
      } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        content = result.value;
      }

      const document = await storage.createPromptTemplateDocument({
        promptTemplateId: templateId,
        filename: `${Date.now()}-${file.originalname}`,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        content: content,
        uploadedBy: parseInt(req.body.uploadedBy || '1'),
        uploadedByName: req.body.uploadedByName || 'Admin'
      });

      res.json(document);
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Delete document
  app.delete("/api/prompt-templates/documents/:id", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      await storage.deletePromptTemplateDocument(documentId);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Final Spaces endpoints
  app.get("/api/final-spaces", async (req, res) => {
    try {
      const userType = req.query.userType as string || 'admin';
      const userIdParam = req.query.userId as string;
      const userId = userIdParam ? parseInt(userIdParam) : 1;
      
      // Handle FinalSpaces data filtering by user type
      
      // Validate userId
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      let finalSpaces;
      if (userType === 'admin') {
        // Admin sees all FinalSpaces
        finalSpaces = await storage.getAllFinalSpaces();
        // Admin access to all FinalSpaces
      } else if (userType === 'funeral_home') {
        // Funeral home sees their own FinalSpaces (using userId as funeralHomeId)
        finalSpaces = await storage.getFinalSpacesByFuneralHome(userId);
        // Funeral home filtered access
      } else if (userType === 'employee') {
        // Employee sees FinalSpaces they created
        finalSpaces = await storage.getFinalSpacesByCreator(userId, 'employee');
        // Employee filtered access
      } else {
        // Individual users see FinalSpaces they created or collaborate on
        finalSpaces = await storage.getFinalSpacesByCreator(userId, 'individual');
        // Individual collaboration access
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
      // Process final space creation request
      
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
        hasGravePlot: data.hasGravePlot || false,
        cemeteryName: data.cemeteryName || null,
        cemeteryUrl: data.cemeteryUrl || null,
        cemeteryAddress: data.cemeteryAddress || null,
        plotNumber: data.plotNumber || null,
        images: data.images || [],
        audioFiles: data.audioFiles || [],
        youtubeLinks: data.youtubeLinks || [],
        primaryMediaType: data.primaryMediaType || null,
        primaryMediaId: data.primaryMediaId || null,
        status: data.status || 'published',
        theme: 'classic',
        viewCount: 0
      };

      // Create final space with validated data
      
      const finalSpace = await storage.createFinalSpace(validatedData);
      // Final space created successfully
      
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
      
      // Update final space with provided data
      
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

  // Get individual survey response by response ID
  app.get("/api/survey-response/:id", async (req, res) => {
    try {
      const responseId = parseInt(req.params.id);
      if (isNaN(responseId)) {
        return res.status(400).json({ message: "Invalid response ID" });
      }

      const response = await storage.getSurveyResponse(responseId);
      if (!response) {
        return res.status(404).json({ message: "Survey response not found" });
      }

      res.json(response);
    } catch (error) {
      console.error("Error fetching survey response:", error);
      res.status(500).json({ message: "Failed to fetch survey response" });
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

  // Get survey responses by type (pre_need_evaluation or pre_need_basics)
  app.get("/api/survey-responses/type/:responseType", async (req, res) => {
    try {
      const { responseType } = req.params;
      const { userId, userType, funeralHomeId } = req.query;
      
      const responses = await storage.getSurveyResponsesByType(
        responseType,
        userId ? parseInt(userId as string) : undefined,
        userType as string,
        funeralHomeId ? parseInt(funeralHomeId as string) : undefined
      );
      
      res.json(responses);
    } catch (error) {
      console.error("Error fetching survey responses by type:", error);
      res.status(500).json({ message: "Failed to fetch survey responses" });
    }
  });

  // Delete survey response
  app.delete("/api/survey-responses/:id", async (req, res) => {
    try {
      const responseId = parseInt(req.params.id);
      await storage.deleteSurveyResponse(responseId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting survey response:", error);
      res.status(500).json({ message: "Failed to delete survey response" });
    }
  });

  // Pre Need Basics Collaborators endpoints
  app.get("/api/pre-need-basics-collaborators/:id/collaborators", async (req, res) => {
    try {
      const surveyResponseId = parseInt(req.params.id);
      const collaborators = await storage.getPreNeedBasicsCollaborators(surveyResponseId);
      res.json(collaborators);
    } catch (error) {
      console.error("Error fetching Pre Need Basics collaborators:", error);
      res.status(500).json({ message: "Failed to fetch collaborators" });
    }
  });

  app.post("/api/pre-need-basics-collaborators/:id/collaborators", async (req, res) => {
    try {
      const surveyResponseId = parseInt(req.params.id);
      const collaboratorData = {
        surveyResponseId,
        collaboratorEmail: req.body.collaboratorEmail,
        name: req.body.collaboratorName || req.body.name,
        status: "pending",
        invitedBy: req.body.invitedBy,
        invitedByType: req.body.invitedByType,
      };
      
      const collaborator = await storage.createPreNeedBasicsCollaborator(collaboratorData);
      res.status(201).json(collaborator);
    } catch (error) {
      console.error("Error creating Pre Need Basics collaborator:", error);
      res.status(500).json({ message: "Failed to invite collaborator" });
    }
  });

  app.delete("/api/pre-need-basics-collaborators/:id", async (req, res) => {
    try {
      const collaboratorId = parseInt(req.params.id);
      await storage.deletePreNeedBasicsCollaborator(collaboratorId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting Pre Need Basics collaborator:", error);
      res.status(500).json({ message: "Failed to remove collaborator" });
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
          'DeathMatters Team'
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
      const results: {
        obituaries: any[];
        memorials: any[];
        total: number;
      } = {
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

  // Revision with selected feedback endpoint
  app.post('/api/obituary-reviews/:id/revise-with-feedback', requireAuth, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const { positivePhrases, phrasesToImprove, originalText, aiProvider } = req.body;
      const user = req.user as any;

      // Get the review to validate it exists
      const review = await storage.getObituaryReview(reviewId);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Build a targeted prompt using only selected feedback
      let revisionPrompt = `Please revise this obituary text incorporating ONLY the following specific feedback:\n\n`;
      revisionPrompt += `Original Text:\n${originalText}\n\n`;

      if (positivePhrases && positivePhrases.length > 0) {
        revisionPrompt += `Phrases to preserve and emphasize:\n`;
        positivePhrases.forEach((phrase: string, index: number) => {
          revisionPrompt += `${index + 1}. "${phrase}"\n`;
        });
        revisionPrompt += `\n`;
      }

      if (phrasesToImprove && phrasesToImprove.length > 0) {
        revisionPrompt += `Phrases to improve:\n`;
        phrasesToImprove.forEach((phraseObj: any, index: number) => {
          if (typeof phraseObj === 'object' && phraseObj.original && phraseObj.improved) {
            revisionPrompt += `${index + 1}. Change "${phraseObj.original}" to "${phraseObj.improved}"\n`;
          } else {
            revisionPrompt += `${index + 1}. Improve: "${phraseObj}"\n`;
          }
        });
        revisionPrompt += `\n`;
      }

      revisionPrompt += `Instructions:
- Apply ONLY the specific feedback listed above
- Preserve all factual information and memorial details
- Maintain the original structure and length
- Do not add any fictional elements
- Return only the revised obituary text without additional commentary`;

      // Process with selected AI provider
      let improvedContent = '';
      if (aiProvider === 'claude') {
        const claudeService = await import('./services/claude');
        improvedContent = await claudeService.processWithClaude(revisionPrompt, user.id, user.userType);
      } else if (aiProvider === 'chatgpt') {
        const aiService = await import('./services/ai');
        improvedContent = await aiService.processWithChatGPT(revisionPrompt, user.id, user.userType);
      } else {
        return res.status(400).json({ error: 'Invalid AI provider' });
      }

      // Update the review with the new revision
      await storage.updateObituaryReview(reviewId, {
        improvedContent,
        aiProvider,
        processedAt: new Date()
      });

      res.json({ 
        success: true, 
        message: 'Revision completed with selected feedback',
        improvedContent 
      });

    } catch (error) {
      console.error('Error processing revision with feedback:', error);
      res.status(500).json({ error: 'Failed to process revision' });
    }
  });

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
      const hasPermission = existingReview.createdById === user.id || 
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
      const hasPermission = review.createdById === user.id || 
                           (user.userType === 'admin') ||
                           (user.userType === 'funeral_home' && review.funeralHomeId === user.id);

      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const finalContent = review.improvedContent || review.extractedText;

      let createdObituary = null;
      let createdMemorial = null;

      // Create obituary in main system if requested
      if (publishToSystem) {
        // Create proper form data structure based on review content
        const extractedName = extractNameFromContent(finalContent);
        const formData = {
          fullName: extractedName,
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

        const obituaryData = {
          funeralHomeId: review.funeralHomeId || user.id,
          createdById: user.id,
          createdByType: user.userType,
          formData: formData,
          fullName: extractedName,
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
        isPublishedToSystem: true
      });

      res.json({
        success: true,
        message: 'Content published successfully',
        obituary: createdObituary,
        memorial: createdMemorial
      });

    } catch (error) {

      res.status(500).json({ 
        error: 'Failed to publish content',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  // Reprocess obituary review with improved settings
  app.post('/api/obituary-reviews/:id/reprocess', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const review = await storage.getObituaryReview(id);
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }

      // Start async processing with improved prompt and token limits
      processObituaryReviewAsync(id);

      res.json({ 
        message: "Reprocessing started with improved settings for complete content preservation.",
        status: "processing"
      });

    } catch (error) {
      console.error("Error reprocessing obituary review:", error);
      res.status(500).json({ error: "Failed to start reprocessing." });
    }
  });

  // Update obituary review text (original or updated)
  app.put("/api/obituary-reviews/:id/text", requireAuth, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const { textType, content } = req.body;
      const user = req.user as any;

      // Get the review
      const review = await storage.getObituaryReview(reviewId);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Verify user has permission
      const hasPermission = review.createdById === user.id || 
                           (user.userType === 'admin') ||
                           (user.userType === 'funeral_home' && review.funeralHomeId === user.id);

      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      // Update the appropriate text field
      const updateData: any = {};
      if (textType === 'original') {
        updateData.extractedText = content;
      } else if (textType === 'updated') {
        updateData.improvedContent = content;
      } else {
        return res.status(400).json({ error: 'Invalid text type. Must be "original" or "updated"' });
      }

      // Update the review
      const updatedReview = await storage.updateObituaryReview(reviewId, updateData);

      res.json({
        success: true,
        message: `${textType === 'original' ? 'Original' : 'Updated'} obituary text saved successfully`,
        review: updatedReview
      });

    } catch (error) {
      console.error('Error updating obituary review text:', error);
      res.status(500).json({ 
        error: 'Failed to save obituary text',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      });
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
        content: exportContent || 'No content available',
        title: extractNameFromContent(finalContent || '') || 'Obituary',
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
          documentMetadata: review.documentMetadata ? JSON.parse(review.documentMetadata as string) : null
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

  // Community Contributions API endpoints
  app.get("/api/final-spaces/:id/community-contributions", async (req, res) => {
    try {
      const finalSpaceId = parseInt(req.params.id);
      const contributions = await storage.getCommunityContributions(finalSpaceId);
      
      // Include comments for each contribution
      const contributionsWithComments = await Promise.all(
        contributions.map(async (contribution) => {
          const comments = await storage.getCommunityContributionComments(contribution.id);
          return { ...contribution, comments };
        })
      );
      
      res.json(contributionsWithComments);
    } catch (error) {
      console.error("Error fetching community contributions:", error);
      res.status(500).json({ error: "Failed to fetch community contributions" });
    }
  });

  app.post("/api/final-spaces/:id/community-contributions", upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ]), validateFileUpload, async (req, res) => {
    try {
      const finalSpaceId = parseInt(req.params.id);
      const { 
        contributionType, 
        contributorId, 
        contributorType, 
        contributorName, 
        contributorEmail,
        youtubeUrl,
        textContent,
        position 
      } = req.body;

      // Validate contribution type
      if (!['image', 'audio', 'youtube', 'text'].includes(contributionType)) {
        return res.status(400).json({ error: 'Invalid contribution type' });
      }

      let mediaPath = null;
      let originalFileName = null;

      // Handle file uploads
      if (req.files) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (contributionType === 'image' && files.image) {
          mediaPath = files.image[0].path;
          originalFileName = files.image[0].originalname;
        } else if (contributionType === 'audio' && files.audio) {
          mediaPath = files.audio[0].path;
          originalFileName = files.audio[0].originalname;
        }
      }

      const contributionData = {
        finalSpaceId,
        contributorId: parseInt(contributorId),
        contributorType,
        contributorName,
        contributorEmail,
        contributionType,
        mediaPath,
        youtubeUrl: contributionType === 'youtube' ? youtubeUrl : null,
        textContent: contributionType === 'text' ? textContent : null,
        originalFileName,
        position: position ? JSON.parse(position) : {},
      };

      const contribution = await storage.createCommunityContribution(contributionData);
      res.json(contribution);
    } catch (error) {
      console.error("Error creating community contribution:", error);
      res.status(500).json({ error: "Failed to create community contribution" });
    }
  });

  app.put("/api/community-contributions/:id", requireAuth, async (req, res) => {
    try {
      const contributionId = parseInt(req.params.id);
      const updates = req.body;
      const user = req.user as any;

      const contribution = await storage.getCommunityContribution(contributionId);
      if (!contribution) {
        return res.status(404).json({ error: 'Contribution not found' });
      }

      // Check if user has permission to update (creator or admin)
      const hasPermission = contribution.contributorId === user.id || user.userType === 'admin';
      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const updatedContribution = await storage.updateCommunityContribution(contributionId, updates);
      res.json(updatedContribution);
    } catch (error) {
      console.error("Error updating community contribution:", error);
      res.status(500).json({ error: "Failed to update community contribution" });
    }
  });

  app.delete("/api/community-contributions/:id", requireAuth, async (req, res) => {
    try {
      const contributionId = parseInt(req.params.id);
      const user = req.user as any;

      const contribution = await storage.getCommunityContribution(contributionId);
      if (!contribution) {
        return res.status(404).json({ error: 'Contribution not found' });
      }

      // Check if user has permission to delete (creator or admin)
      const hasPermission = contribution.contributorId === user.id || user.userType === 'admin';
      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      await storage.deleteCommunityContribution(contributionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting community contribution:", error);
      res.status(500).json({ error: "Failed to delete community contribution" });
    }
  });

  app.post("/api/community-contributions/:id/comments", async (req, res) => {
    try {
      const contributionId = parseInt(req.params.id);
      const { commenterName, commenterEmail, commentText } = req.body;

      if (!commenterName || !commenterEmail || !commentText) {
        return res.status(400).json({ error: 'Name, email, and comment text are required' });
      }

      const commentData = {
        contributionId,
        commenterName,
        commenterEmail,
        commentText,
      };

      const comment = await storage.createCommunityContributionComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.delete("/api/community-contribution-comments/:id", requireAuth, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const user = req.user as any;

      // Only admin users can delete comments
      if (user.userType !== 'admin') {
        return res.status(403).json({ error: 'Permission denied' });
      }

      await storage.deleteCommunityContributionComment(commentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Customer Feedback API endpoints
  app.get("/api/customer-feedback", requireAuth, requireAdmin, async (req, res) => {
    try {
      const feedback = await storage.getCustomerFeedback();
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching customer feedback:", error);
      res.status(500).json({ error: "Failed to fetch customer feedback" });
    }
  });

  app.get("/api/customer-feedback/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const feedbackId = parseInt(req.params.id);
      const feedback = await storage.getCustomerFeedbackById(feedbackId);
      
      if (!feedback) {
        return res.status(404).json({ error: "Feedback not found" });
      }
      
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching customer feedback:", error);
      res.status(500).json({ error: "Failed to fetch customer feedback" });
    }
  });

  app.post("/api/customer-feedback", requireAuth, upload.single('screenshot'), async (req, res) => {
    try {
      const user = req.user as any;
      const { category, subject, description } = req.body;

      // Validate required fields
      if (!category || !subject || !description) {
        return res.status(400).json({ error: "Category, subject, and description are required" });
      }

      // Validate category
      const validCategories = ["Bug/App Crashing", "New Feature Request", "General Feedback", "General Question"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }

      // Handle screenshot upload
      let screenshotUrl = null;
      if (req.file) {
        screenshotUrl = req.file.path;
      }

      const feedbackData = {
        userId: user.id,
        userType: user.userType,
        userName: user.fullName || user.businessName || user.name,
        category,
        subject: subject.trim().substring(0, 255), // Ensure max length
        description: description.trim(),
        screenshotUrl,
        status: "Needs Work"
      };

      const newFeedback = await storage.createCustomerFeedback(feedbackData);
      res.json(newFeedback);
    } catch (error) {
      console.error("Error creating customer feedback:", error);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  app.put("/api/customer-feedback/:id/status", requireAuth, requireAdmin, async (req, res) => {
    try {
      const feedbackId = parseInt(req.params.id);
      const { status } = req.body;

      // Validate status
      const validStatuses = ["Needs Work", "In Process", "Resolved"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const updatedFeedback = await storage.updateCustomerFeedbackStatus(feedbackId, status);
      
      if (!updatedFeedback) {
        return res.status(404).json({ error: "Feedback not found" });
      }

      res.json(updatedFeedback);
    } catch (error) {
      console.error("Error updating feedback status:", error);
      res.status(500).json({ error: "Failed to update feedback status" });
    }
  });

  // Notification preferences routes
  app.get("/api/notification-preferences", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const preferences = await storage.getNotificationPreferences(user.id, user.userType);
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ error: "Failed to fetch notification preferences" });
    }
  });

  app.put("/api/notification-preferences", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const preferencesData = req.body;
      
      const updatedPreferences = await storage.updateNotificationPreferences(user.id, user.userType, preferencesData);
      res.json(updatedPreferences);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ error: "Failed to update notification preferences" });
    }
  });

  // Error logging endpoint for client-side error reporting
  app.post('/api/error-logs', async (req, res) => {
    try {
      const { message, stack, componentStack, timestamp, userAgent, url } = req.body;
      
      // Log error to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Client Error Report:', {
          message,
          stack,
          componentStack,
          timestamp,
          userAgent,
          url
        });
      }
      
      // In production, you could store these in a database or send to error reporting service
      // For now, we'll just acknowledge receipt
      res.json({ success: true, message: 'Error logged successfully' });
    } catch (error) {
      console.error('Failed to log client error:', error);
      res.status(500).json({ error: 'Failed to log error' });
    }
  });

  // Auto-save draft obituary endpoint
  app.post('/api/obituaries/draft', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { draftData, obituaryId } = req.body;
      
      // For now, use existing obituary storage with draft status
      let draft;
      if (obituaryId) {
        // Update existing obituary
        draft = await storage.updateObituary(obituaryId, {
          ...draftData,
          status: 'draft'
        });
      } else {
        // Create new draft obituary
        draft = await storage.createObituary({
          ...draftData,
          createdById: user.id,
          createdByType: user.userType,
          funeralHomeId: user.userType === 'funeral_home' ? user.id : user.funeralHomeId,
          status: 'draft'
        });
      }
      
      res.json({ success: true, draft });
    } catch (error) {
      console.error('Auto-save error:', error);
      res.status(500).json({ error: 'Failed to save draft' });
    }
  });

  // Global search endpoint
  app.get('/api/search', searchRateLimit, requireAuth, async (req, res) => {
    try {
      const { q, type = 'all', dateRange = 'all', funeralHome = 'all' } = req.query;
      const user = req.user as any;
      
      if (!q || (q as string).trim().length < 3) {
        return res.json([]);
      }
      
      const searchTerm = (q as string).trim();
      const results: any[] = [];
      
      // Build date filter
      let dateFilter = undefined;
      const now = new Date();
      if (dateRange === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = gte(obituaries.createdAt, today);
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = gte(obituaries.createdAt, weekAgo);
      } else if (dateRange === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        dateFilter = gte(obituaries.createdAt, monthAgo);
      } else if (dateRange === 'year') {
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        dateFilter = gte(obituaries.createdAt, yearAgo);
      }
      
      // Search obituaries
      if (type === 'all' || type === 'obituary') {
        let obituaryQuery = db.select().from(obituaries)
          .where(
            and(
              or(
                ilike(obituaries.fullName, `%${searchTerm}%`),
                sql`CAST(${obituaries.formData} AS TEXT) ILIKE ${'%' + searchTerm + '%'}`
              ),
              dateFilter,
              funeralHome !== 'all' ? eq(obituaries.funeralHomeId, parseInt(funeralHome as string)) : undefined
            )
          )
          .limit(10);
          
        const obituaryResults = await obituaryQuery;
        
        results.push(...obituaryResults.map(obit => ({
          id: obit.id,
          type: 'obituary',
          title: obit.fullName || 'Untitled Obituary',
          description: `Obituary created on ${new Date(obit.createdAt).toLocaleDateString()}`,
          date: obit.createdAt,
          funeralHome: `Funeral Home ${obit.funeralHomeId}`,
          url: `/obituary/${obit.id}/generated`
        })));
      }
      
      // Search memorials
      if (type === 'all' || type === 'memorial') {
        let memorialQuery = db.select().from(finalSpaces)
          .where(
            and(
              or(
                ilike(finalSpaces.personName, `%${searchTerm}%`),
                ilike(finalSpaces.description, `%${searchTerm}%`)
              ),
              dateFilter ? gte(finalSpaces.createdAt, dateFilter) : undefined,
              funeralHome !== 'all' ? eq(finalSpaces.funeralHomeId, parseInt(funeralHome as string)) : undefined
            )
          )
          .limit(10);
          
        const memorialResults = await memorialQuery;
        
        results.push(...memorialResults.map(memorial => ({
          id: memorial.id,
          type: 'memorial',
          title: memorial.personName || 'Untitled Memorial',
          description: memorial.description || 'Memorial space for remembrance',
          date: memorial.createdAt,
          funeralHome: `Funeral Home ${memorial.funeralHomeId}`,
          url: `/memorial/${memorial.slug}`
        })));
      }
      
      // Search obituaries
      if (type === 'all' || type === 'obituary') {
        let obituaryQuery = db.select().from(obituaries)
          .where(
            and(
              or(
                ilike(obituaries.fullName, `%${searchTerm}%`),
                ilike(obituaries.location, `%${searchTerm}%`)
              ),
              dateFilter ? gte(obituaries.createdAt, dateFilter) : undefined,
              funeralHome !== 'all' ? eq(obituaries.funeralHomeId, parseInt(funeralHome as string)) : undefined
            )
          )
          .limit(10);
          
        const obituaryResults = await obituaryQuery;
        
        results.push(...obituaryResults.map(obituary => ({
          id: obituary.id,
          type: 'obituary',
          title: obituary.fullName || 'Untitled Obituary',
          description: obituary.biography?.substring(0, 100) + '...' || 'Obituary document',
          date: obituary.createdAt,
          funeralHome: `Funeral Home ${obituary.funeralHomeId}`,
          url: `/obituary/${obituary.id}/generated`
        })));
      }
      
      // Sort by date (most recent first)
      results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      res.json(results.slice(0, 20)); // Limit to 20 total results
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeDefaultData() {
  try {
    // Initialize default data
    
    // Initialize default prompt templates
    await initializeDefaultPromptTemplates();
    
    // Initialize default questions
    await initializeDefaultQuestions();
    
    // Initialize default API pricing
    await initializeDefaultApiPricing();
    
    // Default data initialization complete
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
          platform: "claude" as const,
          promptType: "base" as const,
          content: "You are an expert obituary writer. Create a respectful, heartfelt obituary based on the provided information. Focus on celebrating the person's life, achievements, and relationships. Use a {{tone}} tone throughout.",
          createdBy: 1,
          createdByName: "System",
          isPrimary: true,
          version: 1,
          changelog: "Initial system prompt"
        },
        {
          name: "Claude Revision Prompt", 
          platform: "claude" as const,
          promptType: "revision" as const,
          content: "Revise the obituary based on the feedback provided. Incorporate the liked elements and improve or replace the disliked elements while maintaining the overall structure and respectful tone.",
          createdBy: 1,
          createdByName: "System",
          isPrimary: true,
          version: 1,
          changelog: "Initial system prompt"
        },
        {
          name: "ChatGPT Base Prompt",
          platform: "chatgpt" as const, 
          promptType: "base" as const,
          content: "Create a meaningful obituary that honors the memory of {{fullName}}. Use a {{tone}} tone and include their life story, accomplishments, and the love they shared with family and friends.",
          createdBy: 1,
          createdByName: "System",
          isPrimary: true,
          version: 1,
          changelog: "Initial system prompt"
        },
        {
          name: "ChatGPT Revision Prompt",
          platform: "chatgpt" as const,
          promptType: "revision" as const, 
          content: "Please revise this obituary based on the feedback. Keep the elements that were liked and improve or rewrite the parts that were marked for change. Maintain dignity and respect throughout.",
          createdBy: 1,
          createdByName: "System",
          isPrimary: true,
          version: 1,
          changelog: "Initial system prompt"
        }
      ];

      for (const template of defaultTemplates) {
        await storage.createPromptTemplate(template);
      }
      
      // Default prompt templates initialized
    }
  } catch (error) {
    console.error("Error initializing prompt templates:", error);
  }
}

async function initializeDefaultQuestions() {
  try {
    // Skip survey creation since it's now handled by database initialization
    // Question initialization handled by database setup
  } catch (error) {
    console.error("Error initializing questions:", error);
  }
}

async function initializeDefaultApiPricing() {
  try {
    const existingPricing = await storage.getApiPricing();
    
    if (existingPricing.length === 0) {
      const defaultPricing = [
        {
          provider: 'claude',
          model: 'claude-3-5-sonnet-20241022',
          inputCostPer1M: '3.000000',
          outputCostPer1M: '15.000000',
          isActive: true
        },
        {
          provider: 'openai',
          model: 'gpt-4o',
          inputCostPer1M: '10.000000',
          outputCostPer1M: '30.000000',
          isActive: true
        },
        {
          provider: 'openai',
          model: 'gpt-4o-mini',
          inputCostPer1M: '0.150000',
          outputCostPer1M: '0.600000',
          isActive: true
        }
      ];

      for (const pricing of defaultPricing) {
        await storage.createApiPricing(pricing);
      }
      
      // Default API pricing initialized
    }
  } catch (error) {
    console.error("Error initializing API pricing:", error);
  }
}

