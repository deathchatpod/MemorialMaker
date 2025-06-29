import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

interface UseRetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  onError?: (error: Error, attempt: number) => void;
}

export function useRetry<T>(
  asyncFunction: () => Promise<T>,
  options: UseRetryOptions = {}
) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onError
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { toast } = useToast();

  const executeWithRetry = useCallback(async (): Promise<T> => {
    setIsRetrying(true);
    setAttempt(0);

    for (let currentAttempt = 1; currentAttempt <= maxAttempts; currentAttempt++) {
      setAttempt(currentAttempt);

      try {
        const result = await asyncFunction();
        setIsRetrying(false);
        return result;
      } catch (error) {
        const err = error as Error;
        onError?.(err, currentAttempt);

        if (currentAttempt === maxAttempts) {
          setIsRetrying(false);
          toast({
            title: "Operation Failed",
            description: `Failed after ${maxAttempts} attempts: ${err.message}`,
            variant: "destructive",
          });
          throw err;
        }

        // Exponential backoff with jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, currentAttempt - 1) + Math.random() * 1000,
          maxDelay
        );

        if (currentAttempt < maxAttempts) {
          toast({
            title: "Retrying Operation",
            description: `Attempt ${currentAttempt} failed. Retrying in ${Math.round(delay / 1000)}s...`,
          });
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    setIsRetrying(false);
    throw new Error('All retry attempts failed');
  }, [asyncFunction, maxAttempts, baseDelay, maxDelay, onError, toast]);

  return {
    executeWithRetry,
    isRetrying,
    attempt
  };
}