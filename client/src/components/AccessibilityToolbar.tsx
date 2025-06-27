import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAccessibility } from './AccessibilityProvider';
import { 
  Eye, 
  Type, 
  Volume2, 
  Settings, 
  ChevronDown, 
  ChevronUp,
  Contrast,
  MousePointer,
  Keyboard
} from 'lucide-react';

export function AccessibilityToolbar() {
  const { settings, updateSettings, announceToScreenReader } = useAccessibility();
  const [isExpanded, setIsExpanded] = useState(false);

  const fontSizes = [
    { value: 'small', label: 'Small', size: '14px' },
    { value: 'medium', label: 'Medium', size: '16px' },
    { value: 'large', label: 'Large', size: '18px' },
    { value: 'xlarge', label: 'Extra Large', size: '20px' }
  ] as const;

  const handleFontSizeChange = (size: typeof settings.fontSize) => {
    updateSettings({ fontSize: size });
    announceToScreenReader(`Font size changed to ${size}`);
  };

  const handleHighContrastToggle = () => {
    const newValue = !settings.highContrast;
    updateSettings({ highContrast: newValue });
    announceToScreenReader(`High contrast mode ${newValue ? 'enabled' : 'disabled'}`);
  };

  const handleReduceMotionToggle = () => {
    const newValue = !settings.reduceMotion;
    updateSettings({ reduceMotion: newValue });
    announceToScreenReader(`Reduce motion ${newValue ? 'enabled' : 'disabled'}`);
  };

  const handleScreenReaderToggle = () => {
    const newValue = !settings.screenReader;
    updateSettings({ screenReader: newValue });
    announceToScreenReader(`Screen reader announcements ${newValue ? 'enabled' : 'disabled'}`);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const readPageContent = () => {
    const mainContent = document.querySelector('main')?.textContent || 
                      document.querySelector('[role="main"]')?.textContent ||
                      document.body.textContent;
    
    if (mainContent) {
      speakText(mainContent.slice(0, 1000) + (mainContent.length > 1000 ? '... Content truncated' : ''));
      announceToScreenReader('Reading page content');
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50" role="complementary" aria-label="Accessibility tools">
      <Card className="w-80 shadow-lg border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" aria-hidden="true" />
              <span className="font-medium text-sm">Accessibility</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse accessibility toolbar" : "Expand accessibility toolbar"}
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>

          {isExpanded && (
            <div className="space-y-4">
              {/* Font Size Controls */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Type className="h-3 w-3" aria-hidden="true" />
                  <span className="text-xs font-medium">Font Size</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {fontSizes.map((size) => (
                    <Button
                      key={size.value}
                      variant={settings.fontSize === size.value ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleFontSizeChange(size.value)}
                      aria-pressed={settings.fontSize === size.value}
                      style={{ fontSize: size.size }}
                    >
                      {size.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Visual Controls */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Contrast className="h-3 w-3" aria-hidden="true" />
                  <span className="text-xs font-medium">Visual</span>
                </div>
                
                <Button
                  variant={settings.highContrast ? "default" : "outline"}
                  size="sm"
                  className="w-full h-8 text-xs justify-start"
                  onClick={handleHighContrastToggle}
                  aria-pressed={settings.highContrast}
                >
                  High Contrast Mode
                  {settings.highContrast && <Badge variant="secondary" className="ml-auto text-xs">ON</Badge>}
                </Button>

                <Button
                  variant={settings.reduceMotion ? "default" : "outline"}
                  size="sm"
                  className="w-full h-8 text-xs justify-start"
                  onClick={handleReduceMotionToggle}
                  aria-pressed={settings.reduceMotion}
                >
                  <MousePointer className="h-3 w-3 mr-1" aria-hidden="true" />
                  Reduce Motion
                  {settings.reduceMotion && <Badge variant="secondary" className="ml-auto text-xs">ON</Badge>}
                </Button>
              </div>

              <Separator />

              {/* Audio/Screen Reader Controls */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-3 w-3" aria-hidden="true" />
                  <span className="text-xs font-medium">Audio</span>
                </div>

                <Button
                  variant={settings.screenReader ? "default" : "outline"}
                  size="sm"
                  className="w-full h-8 text-xs justify-start"
                  onClick={handleScreenReaderToggle}
                  aria-pressed={settings.screenReader}
                >
                  <Keyboard className="h-3 w-3 mr-1" aria-hidden="true" />
                  Screen Reader Mode
                  {settings.screenReader && <Badge variant="secondary" className="ml-auto text-xs">ON</Badge>}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={readPageContent}
                  aria-label="Read page content aloud"
                >
                  <Volume2 className="h-3 w-3 mr-1" aria-hidden="true" />
                  Read Page Aloud
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-2">Quick Actions</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>• Press Tab to navigate</div>
                  <div>• Press Enter to activate</div>
                  <div>• Press Esc to close dialogs</div>
                </div>
              </div>
            </div>
          )}

          {/* Always visible toggle */}
          {!isExpanded && (
            <div className="flex gap-1">
              {settings.highContrast && <Badge variant="secondary" className="text-xs">HC</Badge>}
              {settings.screenReader && <Badge variant="secondary" className="text-xs">SR</Badge>}
              {settings.fontSize !== 'medium' && (
                <Badge variant="secondary" className="text-xs">
                  {settings.fontSize.charAt(0).toUpperCase()}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}