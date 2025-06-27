import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  announceToScreenReader: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibility-settings');
    return saved ? JSON.parse(saved) : {
      fontSize: 'medium',
      highContrast: false,
      reduceMotion: false,
      screenReader: false
    };
  });

  const [announcementElement, setAnnouncementElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    
    // Apply font size to root
    const root = document.documentElement;
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge');
    root.classList.add(`font-${settings.fontSize}`);
    
    // Apply high contrast mode
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply reduce motion
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [settings]);

  useEffect(() => {
    // Create screen reader announcement element
    const element = document.createElement('div');
    element.setAttribute('aria-live', 'polite');
    element.setAttribute('aria-atomic', 'true');
    element.className = 'sr-only';
    element.style.position = 'absolute';
    element.style.left = '-10000px';
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.overflow = 'hidden';
    
    document.body.appendChild(element);
    setAnnouncementElement(element);
    
    return () => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, []);

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const announceToScreenReader = (message: string) => {
    if (announcementElement && settings.screenReader) {
      announcementElement.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        if (announcementElement) {
          announcementElement.textContent = '';
        }
      }, 1000);
    }
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, announceToScreenReader }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}