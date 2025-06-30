import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveOptions {
  delay?: number;
  onSave?: (data: any) => Promise<void>;
  enabled?: boolean;
}

export function useAutoSave<T>(
  data: T,
  options: AutoSaveOptions = {}
) {
  const { delay = 3000, onSave, enabled = true } = options;
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<T>(data);
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !onSave || isSavingRef.current) {
      return;
    }

    // Check if data has actually changed
    const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
    
    if (!hasChanged) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(async () => {
      try {
        isSavingRef.current = true;
        await onSave(data);
        previousDataRef.current = data;
        
        toast({
          title: "Auto-saved",
          description: "Your changes have been automatically saved",
          duration: 2000,
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast({
          title: "Auto-save failed",
          description: "Failed to save changes automatically",
          variant: "destructive",
          duration: 3000,
        });
      } finally {
        isSavingRef.current = false;
      }
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, onSave, enabled, toast]);

  // Manual save function
  const saveNow = async () => {
    if (!onSave || isSavingRef.current) {
      return;
    }

    try {
      isSavingRef.current = true;
      
      // Clear auto-save timeout since we're saving manually
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      await onSave(data);
      previousDataRef.current = data;
      
      toast({
        title: "Saved",
        description: "Your changes have been saved",
        duration: 2000,
      });
    } catch (error) {
      console.error('Manual save failed:', error);
      toast({
        title: "Save failed",
        description: "Failed to save changes",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      isSavingRef.current = false;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveNow,
    isSaving: isSavingRef.current
  };
}