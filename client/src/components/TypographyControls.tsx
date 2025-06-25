import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Type, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Palette,
  RotateCcw
} from 'lucide-react';

interface TypographySettings {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  textAlign: string;
  lineHeight: number;
  letterSpacing: number;
  color: string;
  textShadow: string;
}

interface TypographyControlsProps {
  elementId?: string;
  settings: TypographySettings;
  onSettingsChange: (settings: TypographySettings) => void;
  previewText?: string;
}

const FONT_FAMILIES = [
  { name: 'System Default', value: 'system-ui' },
  { name: 'Serif', value: 'Times, serif' },
  { name: 'Sans Serif', value: 'Arial, sans-serif' },
  { name: 'Playfair Display', value: '"Playfair Display", serif' },
  { name: 'Merriweather', value: '"Merriweather", serif' },
  { name: 'Lora', value: '"Lora", serif' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif' },
  { name: 'Roboto', value: '"Roboto", sans-serif' },
  { name: 'Lato', value: '"Lato", sans-serif' },
  { name: 'Montserrat', value: '"Montserrat", sans-serif' },
  { name: 'Crimson Text', value: '"Crimson Text", serif' },
  { name: 'Cormorant Garamond', value: '"Cormorant Garamond", serif' }
];

const FONT_WEIGHTS = [
  { name: 'Light', value: '300' },
  { name: 'Normal', value: '400' },
  { name: 'Medium', value: '500' },
  { name: 'Semi-bold', value: '600' },
  { name: 'Bold', value: '700' },
  { name: 'Extra Bold', value: '800' }
];

const MEMORIAL_COLORS = [
  { name: 'Deep Black', value: '#000000' },
  { name: 'Charcoal', value: '#2d2d2d' },
  { name: 'Dark Gray', value: '#4a5568' },
  { name: 'Medium Gray', value: '#718096' },
  { name: 'Light Gray', value: '#a0aec0' },
  { name: 'Warm White', value: '#f7fafc' },
  { name: 'Deep Blue', value: '#2b6cb0' },
  { name: 'Navy', value: '#2c5282' },
  { name: 'Deep Purple', value: '#553c9a' },
  { name: 'Burgundy', value: '#742a2a' },
  { name: 'Forest Green', value: '#276749' },
  { name: 'Golden Brown', value: '#b7791f' }
];

export function TypographyControls({ 
  elementId, 
  settings, 
  onSettingsChange, 
  previewText = "In Loving Memory" 
}: TypographyControlsProps) {
  
  const updateSetting = (key: keyof TypographySettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const toggleBold = () => {
    const newWeight = settings.fontWeight === '700' ? '400' : '700';
    updateSetting('fontWeight', newWeight);
  };

  const toggleItalic = () => {
    const newStyle = settings.fontStyle === 'italic' ? 'normal' : 'italic';
    updateSetting('fontStyle', newStyle);
  };

  const toggleUnderline = () => {
    const newDecoration = settings.textDecoration === 'underline' ? 'none' : 'underline';
    updateSetting('textDecoration', newDecoration);
  };

  const setAlignment = (align: string) => {
    updateSetting('textAlign', align);
  };

  const resetToDefaults = () => {
    const defaults: TypographySettings = {
      fontFamily: 'system-ui',
      fontSize: 16,
      fontWeight: '400',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left',
      lineHeight: 1.5,
      letterSpacing: 0,
      color: '#000000',
      textShadow: 'none'
    };
    onSettingsChange(defaults);
  };

  const previewStyle: React.CSSProperties = {
    fontFamily: settings.fontFamily,
    fontSize: `${settings.fontSize}px`,
    fontWeight: settings.fontWeight,
    fontStyle: settings.fontStyle,
    textDecoration: settings.textDecoration,
    textAlign: settings.textAlign as any,
    lineHeight: settings.lineHeight,
    letterSpacing: `${settings.letterSpacing}px`,
    color: settings.color,
    textShadow: settings.textShadow,
    padding: '16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    marginTop: '16px'
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Typography Controls
            {elementId && <Badge variant="outline">{elementId}</Badge>}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Font Family */}
        <div className="space-y-2">
          <Label>Font Family</Label>
          <Select value={settings.fontFamily} onValueChange={(value) => updateSetting('fontFamily', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size and Weight */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Font Size: {settings.fontSize}px</Label>
            <Slider
              value={[settings.fontSize]}
              onValueChange={([value]) => updateSetting('fontSize', value)}
              min={8}
              max={72}
              step={1}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label>Font Weight</Label>
            <Select value={settings.fontWeight} onValueChange={(value) => updateSetting('fontWeight', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_WEIGHTS.map((weight) => (
                  <SelectItem key={weight.value} value={weight.value} style={{ fontWeight: weight.value }}>
                    {weight.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Style Controls */}
        <div className="space-y-2">
          <Label>Text Style</Label>
          <div className="flex gap-2">
            <Button
              variant={settings.fontWeight === '700' ? 'default' : 'outline'}
              size="sm"
              onClick={toggleBold}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={settings.fontStyle === 'italic' ? 'default' : 'outline'}
              size="sm"
              onClick={toggleItalic}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant={settings.textDecoration === 'underline' ? 'default' : 'outline'}
              size="sm"
              onClick={toggleUnderline}
            >
              <Underline className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Text Alignment */}
        <div className="space-y-2">
          <Label>Text Alignment</Label>
          <div className="flex gap-2">
            <Button
              variant={settings.textAlign === 'left' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAlignment('left')}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={settings.textAlign === 'center' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAlignment('center')}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant={settings.textAlign === 'right' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAlignment('right')}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Line Height and Letter Spacing */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Line Height: {settings.lineHeight}</Label>
            <Slider
              value={[settings.lineHeight]}
              onValueChange={([value]) => updateSetting('lineHeight', value)}
              min={0.8}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label>Letter Spacing: {settings.letterSpacing}px</Label>
            <Slider
              value={[settings.letterSpacing]}
              onValueChange={([value]) => updateSetting('letterSpacing', value)}
              min={-2}
              max={10}
              step={0.5}
              className="w-full"
            />
          </div>
        </div>

        {/* Text Color */}
        <div className="space-y-2">
          <Label>Text Color</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={settings.color}
              onChange={(e) => updateSetting('color', e.target.value)}
              className="w-16 h-10 p-1 border rounded"
            />
            <Input
              type="text"
              value={settings.color}
              onChange={(e) => updateSetting('color', e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
          <div className="grid grid-cols-6 gap-2 mt-2">
            {MEMORIAL_COLORS.map((color) => (
              <button
                key={color.value}
                className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400"
                style={{ backgroundColor: color.value }}
                onClick={() => updateSetting('color', color.value)}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Text Shadow */}
        <div className="space-y-2">
          <Label>Text Shadow</Label>
          <Select value={settings.textShadow} onValueChange={(value) => updateSetting('textShadow', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="1px 1px 2px rgba(0,0,0,0.3)">Subtle</SelectItem>
              <SelectItem value="2px 2px 4px rgba(0,0,0,0.4)">Medium</SelectItem>
              <SelectItem value="3px 3px 6px rgba(0,0,0,0.5)">Strong</SelectItem>
              <SelectItem value="0 0 10px rgba(255,255,255,0.8)">Glow</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div style={previewStyle}>
            {previewText}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TypographyControls;