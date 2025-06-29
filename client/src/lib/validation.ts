import { z } from 'zod';
import DOMPurify from 'dompurify';

// XSS Prevention
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
}

export function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Enhanced validation schemas
export const emailSchema = z.string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required')
  .max(254, 'Email is too long');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')
  .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name contains invalid characters');

export const phoneSchema = z.string()
  .regex(/^[\+]?[1-9]?[\d\s\-\(\)]{10,15}$/, 'Please enter a valid phone number')
  .optional()
  .or(z.literal(''));

export const urlSchema = z.string()
  .url('Please enter a valid URL')
  .max(500, 'URL is too long')
  .optional()
  .or(z.literal(''));

export const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date (YYYY-MM-DD)')
  .refine((date) => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }, 'Please enter a valid date');

export const textAreaSchema = z.string()
  .max(5000, 'Text is too long (maximum 5000 characters)')
  .transform(sanitizeText);

export const htmlContentSchema = z.string()
  .max(10000, 'Content is too long (maximum 10000 characters)')
  .transform(sanitizeHtml);

// File validation
export const fileTypeValidation = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
};

export const fileSizeLimit = {
  image: 10 * 1024 * 1024, // 10MB
  document: 25 * 1024 * 1024, // 25MB
  audio: 50 * 1024 * 1024 // 50MB
};

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

// Rate limiting client-side
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// CSRF Token handling
export function getCsrfToken(): string | null {
  const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
  return meta?.content || null;
}

export function addCsrfToken(headers: Record<string, string>): Record<string, string> {
  const token = getCsrfToken();
  if (token) {
    headers['X-CSRF-Token'] = token;
  }
  return headers;
}