import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "./auth";
import { storage } from "./storage";
import { hashPassword, requireAuth, requireAdmin } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Configure session middleware
  const PgSession = connectPgSimple(session);
  app.use(session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Basic health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.post('/auth/login', async (req, res) => {
    try {
      const { username: email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user by email
      const user = await storage.getUserByUsername(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Create session
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed' });
        }
        return res.json({ 
          message: 'Login successful',
          user: { id: user.id, username: user.username, userType: user.userType }
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // User routes
  app.get('/api/user', requireAuth, async (req, res) => {
    res.json(req.user);
  });

  // Initialize default data
  async function initializeDefaultData() {
    try {
      console.log("Initializing default data...");
      
      // Check if admin user exists
      const existingAdmin = await storage.getUserByUsername('admin@deathmatters.com');
      if (!existingAdmin) {
        const hashedPassword = await hashPassword('admin123');
        await storage.createUser({
          username: 'admin@deathmatters.com',
          password: hashedPassword,
          userType: 'admin',
          firstName: 'John',
          lastName: 'Admin'
        });
        console.log("Default admin user created");
      }
      
      console.log("Default data initialized successfully");
    } catch (error) {
      console.error("Error initializing default data:", error);
    }
  }

  await initializeDefaultData();

  // Create and return server
  const server = createServer(app);
  return server;
}