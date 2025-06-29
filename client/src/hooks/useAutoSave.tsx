import { useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveOptions {
  data: any;
  saveEndpoint: string;
  delay?: number;
  maxRetries?: number;
  retryDelay?: number;
  enabled?: boolean;
  onSaveSuccess?: (data: any) => void;
  onSaveError?: (error: any) => void;
}

export function useAutoSave({
  data,
  saveEndpoint,
  delay = 3000, // 3 seconds
  maxRetries = 3,
  retryDelay = 1000,
  enabled = true,
  onSaveSuccess,
  onSaveError
}: AutoSaveOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const retryCountRef = useRef(0);

  const saveMutation = useMutation({
    mutationFn: async (saveData: any) => {
      const response = await fetch(saveEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });
      
      if (!response.ok) {
        throw new Error(`Save failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      retryCountRef.current = 0;
      lastSavedRef.current = JSON.stringify(data);
      
      // Show subtle success indicator
      toast({
        title: "Draft saved",
        description: "Your changes have been automatically saved.",
        duration: 2000,
        variant: "default"
      });
      
      onSaveSuccess?.(result);
    },
    onError: (error) => {
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        
        // Exponential backoff retry
        setTimeout(() => {
          if (enabled) {
            saveMutation.mutate(data);
          }
        }, retryDelay * Math.pow(2, retryCountRef.current - 1));
        
        toast({
          title: "Save retry",
          description: `Retrying save (attempt ${retryCountRef.current}/${maxRetries})...`,
          duration: 2000,
          variant: "default"
        });
      } else {
        toast({
          title: "Auto-save failed",
          description: "Unable to save draft. Please save manually.",
          duration: 5000,
          variant: "destructive"
        });
        
        onSaveError?.(error);
        retryCountRef.current = 0;
      }
    }
  });

  const scheduleAutoSave = useCallback(() => {
    if (!enabled) return;
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Check if data has changed
    const currentDataStr = JSON.stringify(data);
    if (currentDataStr === lastSavedRef.current) {
      return; // No changes to save
    }
    
    // Schedule new save
    timeoutRef.current = setTimeout(() => {
      if (!saveMutation.isPending) {
        saveMutation.mutate(data);
      }
    }, delay);
  }, [data, delay, enabled, saveMutation]);

  // Auto-save when data changes
  useEffect(() => {
    scheduleAutoSave();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [scheduleAutoSave]);

  // Manual save function
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (!saveMutation.isPending) {
      saveMutation.mutate(data);
    }
  }, [data, saveMutation]);

  // Get save status
  const getSaveStatus = useCallback(() => {
    if (saveMutation.isPending) return 'saving';
    if (retryCountRef.current > 0) return 'retrying';
    if (JSON.stringify(data) !== lastSavedRef.current) return 'unsaved';
    return 'saved';
  }, [data, saveMutation.isPending]);

  return {
    saveNow,
    isSaving: saveMutation.isPending,
    saveStatus: getSaveStatus(),
    lastSaved: lastSavedRef.current ? new Date() : null
  };
}