import CryptoJS from 'crypto-js';

// Get encryption key from environment or generate a secure default
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'DeathMatters2025SecureKey!@#$%';

/**
 * Encrypts sensitive data before storing in database
 */
export function encryptSensitiveData(data: string): string {
  if (!data) return data;
  
  try {
    const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return data; // Return original data if encryption fails
  }
}

/**
 * Decrypts sensitive data when retrieving from database
 */
export function decryptSensitiveData(encryptedData: string): string {
  if (!encryptedData) return encryptedData;
  
  try {
    // Check if data is already encrypted (contains special characters)
    if (!encryptedData.includes('/') && !encryptedData.includes('+') && !encryptedData.includes('=')) {
      return encryptedData; // Return as-is if not encrypted
    }
    
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    // If decryption fails, return original data
    return decryptedString || encryptedData;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData; // Return original data if decryption fails
  }
}

/**
 * Encrypts an object's sensitive fields
 */
export function encryptUserSensitiveFields(user: any): any {
  if (!user) return user;
  
  return {
    ...user,
    email: user.email ? encryptSensitiveData(user.email) : user.email,
    name: user.name ? encryptSensitiveData(user.name) : user.name,
    businessName: user.businessName ? encryptSensitiveData(user.businessName) : user.businessName,
    street: user.street ? encryptSensitiveData(user.street) : user.street,
    city: user.city ? encryptSensitiveData(user.city) : user.city,
    phone: user.phone ? encryptSensitiveData(user.phone) : user.phone,
    contactEmail: user.contactEmail ? encryptSensitiveData(user.contactEmail) : user.contactEmail,
  };
}

/**
 * Decrypts an object's sensitive fields
 */
export function decryptUserSensitiveFields(user: any): any {
  if (!user) return user;
  
  return {
    ...user,
    email: user.email ? decryptSensitiveData(user.email) : user.email,
    name: user.name ? decryptSensitiveData(user.name) : user.name,
    businessName: user.businessName ? decryptSensitiveData(user.businessName) : user.businessName,
    street: user.street ? decryptSensitiveData(user.street) : user.street,
    city: user.city ? decryptSensitiveData(user.city) : user.city,
    phone: user.phone ? decryptSensitiveData(user.phone) : user.phone,
    contactEmail: user.contactEmail ? decryptSensitiveData(user.contactEmail) : user.contactEmail,
  };
}

/**
 * Encrypts obituary sensitive data
 */
export function encryptObituarySensitiveFields(obituary: any): any {
  if (!obituary) return obituary;
  
  return {
    ...obituary,
    deceasedName: obituary.deceasedName ? encryptSensitiveData(obituary.deceasedName) : obituary.deceasedName,
    survivingFamily: obituary.survivingFamily ? encryptSensitiveData(obituary.survivingFamily) : obituary.survivingFamily,
    personalStory: obituary.personalStory ? encryptSensitiveData(obituary.personalStory) : obituary.personalStory,
  };
}

/**
 * Decrypts obituary sensitive data
 */
export function decryptObituarySensitiveFields(obituary: any): any {
  if (!obituary) return obituary;
  
  return {
    ...obituary,
    deceasedName: obituary.deceasedName ? decryptSensitiveData(obituary.deceasedName) : obituary.deceasedName,
    survivingFamily: obituary.survivingFamily ? decryptSensitiveData(obituary.survivingFamily) : obituary.survivingFamily,
    personalStory: obituary.personalStory ? decryptSensitiveData(obituary.personalStory) : obituary.personalStory,
  };
}