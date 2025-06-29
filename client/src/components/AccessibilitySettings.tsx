import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAccessibility } from './AccessibilityProvider';
import { 
  Type, 
  Volume2, 
  Contrast,
  MousePointer,
  Keyboard
} from 'lucide-react';

export function AccessibilitySettings() {
  const { settings, updateSettings, announceToScreenReader } = useAccessibility();

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

  return (
    <div className="space-y-6">
      {/* Font Size Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-gray-400" />
          <Label className="text-gray-100 font-medium">Font Size</Label>
        </div>
        <p className="text-sm text-gray-400">
          Adjust text size for better readability across the platform
        </p>
        <div className="flex flex-wrap gap-2">
          {fontSizes.map((size) => (
            <Button
              key={size.value}
              variant={settings.fontSize === size.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleFontSizeChange(size.value)}
              className={`
                ${settings.fontSize === size.value 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                }
              `}
              style={{ fontSize: size.size }}
            >
              {size.label}
            </Button>
          ))}
        </div>
        <div className="text-xs text-gray-500">
          Current size: {fontSizes.find(s => s.value === settings.fontSize)?.size}
        </div>
      </div>

      <Separator className="bg-gray-700" />

      {/* High Contrast Mode */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Contrast className="w-4 h-4 text-gray-400" />
              <Label className="text-gray-100 font-medium">High Contrast Mode</Label>
            </div>
            <p className="text-sm text-gray-400">
              Enhance text visibility with higher contrast colors
            </p>
          </div>
          <Switch
            checked={settings.highContrast}
            onCheckedChange={handleHighContrastToggle}
            aria-label="Toggle high contrast mode"
          />
        </div>
        {settings.highContrast && (
          <Badge variant="outline" className="bg-yellow-900/20 border-yellow-700 text-yellow-300">
            High contrast mode active
          </Badge>
        )}
      </div>

      <Separator className="bg-gray-700" />

      {/* Reduce Motion */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-gray-400" />
              <Label className="text-gray-100 font-medium">Reduce Motion</Label>
            </div>
            <p className="text-sm text-gray-400">
              Minimize animations and transitions for motion sensitivity
            </p>
          </div>
          <Switch
            checked={settings.reduceMotion}
            onCheckedChange={handleReduceMotionToggle}
            aria-label="Toggle reduced motion"
          />
        </div>
        {settings.reduceMotion && (
          <Badge variant="outline" className="bg-green-900/20 border-green-700 text-green-300">
            Reduced motion active
          </Badge>
        )}
      </div>

      <Separator className="bg-gray-700" />

      {/* Screen Reader Support */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-gray-400" />
              <Label className="text-gray-100 font-medium">Screen Reader Announcements</Label>
            </div>
            <p className="text-sm text-gray-400">
              Enable audio announcements for important interface changes
            </p>
          </div>
          <Switch
            checked={settings.screenReader}
            onCheckedChange={handleScreenReaderToggle}
            aria-label="Toggle screen reader announcements"
          />
        </div>
        {settings.screenReader && (
          <Badge variant="outline" className="bg-blue-900/20 border-blue-700 text-blue-300">
            Screen reader announcements enabled
          </Badge>
        )}
      </div>

      <Separator className="bg-gray-700" />

      {/* Keyboard Navigation Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-gray-400" />
          <Label className="text-gray-100 font-medium">Keyboard Navigation</Label>
        </div>
        <div className="text-sm text-gray-400 space-y-2">
          <p>Use these keyboard shortcuts to navigate the platform:</p>
          <ul className="space-y-1 text-xs">
            <li><kbd className="bg-gray-700 px-1 rounded">Tab</kbd> - Move to next interactive element</li>
            <li><kbd className="bg-gray-700 px-1 rounded">Shift + Tab</kbd> - Move to previous interactive element</li>
            <li><kbd className="bg-gray-700 px-1 rounded">Enter</kbd> - Activate buttons and links</li>
            <li><kbd className="bg-gray-700 px-1 rounded">Space</kbd> - Toggle switches and checkboxes</li>
            <li><kbd className="bg-gray-700 px-1 rounded">Esc</kbd> - Close modals and menus</li>
          </ul>
        </div>
      </div>

      {/* Screen Reader Region for Announcements */}
      <div
        id="accessibility-announcements"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
    </div>
  );
}