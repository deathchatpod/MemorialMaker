import { useEffect, useRef, useCallback } from 'react';
import { useToast } from './use-toast';

interface UseAutoSaveOptions {
  onSave: (data: any) => Promise<void>;
  interval?: number; // ms
  enabled?: boolean;
  key?: string; // localStorage key
}

export function useAutoSave<T>(
  data: T,
  options: UseAutoSaveOptions
) {
  const {
    onSave,
    interval = 30000, // 30 seconds
    enabled = true,
    key = 'autosave'
  } = options;

  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  const isSavingRef = useRef(false);

  // Save to localStorage
  const saveToStorage = useCallback((value: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, [key]);

  // Load from localStorage
  const loadFromStorage = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return null;
    }
  }, [key]);

  // Clear from localStorage
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }, [key]);

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (isSavingRef.current || !enabled) return;

    const currentData = JSON.stringify(data);
    if (currentData === lastSavedRef.current) return;

    isSavingRef.current = true;
    
    try {
      await onSave(data);
      lastSavedRef.current = currentData;
      saveToStorage(data);
      
      toast({
        title: "Auto-saved",
        description: "Your changes have been saved automatically.",
        duration: 2000,
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: "Auto-save failed",
        description: "Failed to save changes automatically. Please save manually.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      isSavingRef.current = false;
    }
  }, [data, onSave, enabled, saveToStorage, toast]);

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(performAutoSave, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [performAutoSave, interval, enabled]);

  // Manual save function
  const saveNow = useCallback(async () => {
    await performAutoSave();
  }, [performAutoSave]);

  return {
    saveNow,
    loadFromStorage,
    clearStorage,
    isSaving: isSavingRef.current
  };
}