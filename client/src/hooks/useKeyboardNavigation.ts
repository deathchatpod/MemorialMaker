import { useEffect, useCallback } from 'react';

interface KeyboardNavigationOptions {
  enabled?: boolean;
  focusableSelector?: string;
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: (shift: boolean) => void;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    enabled = true,
    focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onEscape?.();
        break;
      
      case 'Enter':
        if (event.target === document.activeElement) {
          onEnter?.();
        }
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        onArrowUp?.();
        break;
      
      case 'ArrowDown':
        event.preventDefault();
        onArrowDown?.();
        break;
      
      case 'ArrowLeft':
        event.preventDefault();
        onArrowLeft?.();
        break;
      
      case 'ArrowRight':
        event.preventDefault();
        onArrowRight?.();
        break;
      
      case 'Tab':
        onTab?.(event.shiftKey);
        break;
    }
  }, [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab]);

  const focusFirst = useCallback(() => {
    const focusableElements = document.querySelectorAll(focusableSelector);
    const first = focusableElements[0] as HTMLElement;
    first?.focus();
  }, [focusableSelector]);

  const focusLast = useCallback(() => {
    const focusableElements = document.querySelectorAll(focusableSelector);
    const last = focusableElements[focusableElements.length - 1] as HTMLElement;
    last?.focus();
  }, [focusableSelector]);

  const focusNext = useCallback(() => {
    const focusableElements = Array.from(document.querySelectorAll(focusableSelector)) as HTMLElement[];
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    focusableElements[nextIndex]?.focus();
  }, [focusableSelector]);

  const focusPrevious = useCallback(() => {
    const focusableElements = Array.from(document.querySelectorAll(focusableSelector)) as HTMLElement[];
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    focusableElements[prevIndex]?.focus();
  }, [focusableSelector]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  return {
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious
  };
}