import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateObituariesWithClaude, generateObituariesWithChatGPT, generateRevisedObituary, type ObituaryFormData } from "./services/ai";
import { generateObituaryPDF } from "./services/pdf";
import { insertObituarySchema, insertGeneratedObituarySchema, insertTextFeedbackSchema, insertQuestionSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

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
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
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
