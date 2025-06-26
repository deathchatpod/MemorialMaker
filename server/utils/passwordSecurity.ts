import bcrypt from 'bcrypt';

// Password complexity requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

// Account lockout settings
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

/**
 * Validates password complexity requirements
 */
export function validatePasswordComplexity(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }
  
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generates a secure password hash
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Increased from default for better security
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verifies password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Account lockout tracking
 */
interface LoginAttempt {
  email: string;
  attemptTime: Date;
  successful: boolean;
}

// In-memory storage for login attempts (in production, use Redis or database)
const loginAttempts: Map<string, LoginAttempt[]> = new Map();

/**
 * Records a login attempt
 */
export function recordLoginAttempt(email: string, successful: boolean): void {
  const attempts = loginAttempts.get(email) || [];
  
  // Clean up old attempts (older than lockout duration)
  const cutoffTime = new Date(Date.now() - LOCKOUT_DURATION_MINUTES * 60 * 1000);
  const recentAttempts = attempts.filter(attempt => attempt.attemptTime > cutoffTime);
  
  // Add new attempt
  recentAttempts.push({
    email,
    attemptTime: new Date(),
    successful
  });
  
  loginAttempts.set(email, recentAttempts);
}

/**
 * Checks if account is locked due to failed attempts
 */
export function isAccountLocked(email: string): { locked: boolean; remainingTime?: number } {
  const attempts = loginAttempts.get(email) || [];
  
  // Clean up old attempts
  const cutoffTime = new Date(Date.now() - LOCKOUT_DURATION_MINUTES * 60 * 1000);
  const recentAttempts = attempts.filter(attempt => attempt.attemptTime > cutoffTime);
  
  // Count failed attempts
  const failedAttempts = recentAttempts.filter(attempt => !attempt.successful);
  
  if (failedAttempts.length >= MAX_LOGIN_ATTEMPTS) {
    const oldestFailedAttempt = failedAttempts[0];
    const unlockTime = new Date(oldestFailedAttempt.attemptTime.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
    const remainingTime = Math.max(0, unlockTime.getTime() - Date.now());
    
    return {
      locked: remainingTime > 0,
      remainingTime: Math.ceil(remainingTime / (60 * 1000)) // Convert to minutes
    };
  }
  
  return { locked: false };
}

/**
 * Resets login attempts for successful login
 */
export function resetLoginAttempts(email: string): void {
  loginAttempts.delete(email);
}

/**
 * Gets remaining failed attempts before lockout
 */
export function getRemainingAttempts(email: string): number {
  const attempts = loginAttempts.get(email) || [];
  const cutoffTime = new Date(Date.now() - LOCKOUT_DURATION_MINUTES * 60 * 1000);
  const recentFailedAttempts = attempts.filter(attempt => 
    attempt.attemptTime > cutoffTime && !attempt.successful
  );
  
  return Math.max(0, MAX_LOGIN_ATTEMPTS - recentFailedAttempts.length);
}

/**
 * Password strength meter
 */
export function getPasswordStrength(password: string): { score: number; feedback: string[] } {
  let score = 0;
  const feedback: string[] = [];
  
  // Length scoring
  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');
  
  if (password.length >= 12) score += 1;
  else if (password.length >= 8) feedback.push('Consider using 12+ characters for better security');
  
  // Character variety scoring
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');
  
  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Add numbers');
  
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else feedback.push('Add special characters');
  
  // Pattern detection
  if (!/(.)\1{2,}/.test(password)) score += 1;
  else feedback.push('Avoid repeating characters');
  
  return { score, feedback };
}