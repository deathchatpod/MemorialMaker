import passport from "passport";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { adminUsers, funeralHomes, employees, sessions } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import { 
  validatePasswordComplexity, 
  hashPassword, 
  verifyPassword, 
  recordLoginAttempt, 
  isAccountLocked, 
  resetLoginAttempts, 
  getRemainingAttempts 
} from './utils/passwordSecurity';
import { encryptUserSensitiveFields, decryptUserSensitiveFields } from './utils/encryption';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Google OAuth Strategy - temporarily disabled
// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID!,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//   callbackURL: "/auth/google/callback"
// }, async (accessToken, refreshToken, profile, done) => {
//   // Google OAuth implementation will be added later
// }));

// Local Strategy for password login
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    // Check admin users
    const adminUser = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
    if (adminUser.length > 0) {
      const isValid = await bcrypt.compare(password, adminUser[0].password);
      if (isValid) {
        return done(null, { ...adminUser[0], userType: 'admin' });
      }
    }

    // Check funeral homes
    const funeralHome = await db.select().from(funeralHomes).where(eq(funeralHomes.email, email)).limit(1);
    if (funeralHome.length > 0 && funeralHome[0].password) {
      const isValid = await bcrypt.compare(password, funeralHome[0].password);
      if (isValid) {
        return done(null, { ...funeralHome[0], userType: 'funeral_home' });
      }
    }

    // Check employees
    const employee = await db.select().from(employees).where(eq(employees.email, email)).limit(1);
    if (employee.length > 0 && employee[0].password) {
      const isValid = await bcrypt.compare(password, employee[0].password);
      if (isValid) {
        return done(null, { ...employee[0], userType: 'employee' });
      }
    }

    return done(null, false);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, { id: user.id, userType: user.userType });
});

passport.deserializeUser(async (data: any, done) => {
  try {
    let user;
    switch (data.userType) {
      case 'admin':
        user = await db.select().from(adminUsers).where(eq(adminUsers.id, data.id)).limit(1);
        break;
      case 'funeral_home':
        user = await db.select().from(funeralHomes).where(eq(funeralHomes.id, data.id)).limit(1);
        break;
      case 'employee':
        user = await db.select().from(employees).where(eq(employees.id, data.id)).limit(1);
        break;
      default:
        return done(new Error("Invalid user type"));
    }

    if (user && user.length > 0) {
      done(null, { ...user[0], userType: data.userType });
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error);
  }
});

// Authentication middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && (req.user as any).userType === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
};

export const requireFuneralHomeOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    const userType = (req.user as any).userType;
    if (userType === 'admin' || userType === 'funeral_home') {
      return next();
    }
  }
  res.status(403).json({ message: "Funeral home or admin access required" });
};

// Hash password utility
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

// Generate JWT token
export const generateJWT = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Verify JWT token
export const verifyJWT = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};

export default passport;