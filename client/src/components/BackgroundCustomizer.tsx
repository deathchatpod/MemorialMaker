import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
<parameter name="file_text">import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Palette, 
  Image as ImageIcon, 
  Gradient,
  Upload,
  RotateCcw,
  Eye
} from 'lucide-react';

interface BackgroundSettings {
  type: 'solid' | 'gradient' | 'image';
  solidColor: string;
  gradientType: 'linear' | 'radial';
  gradientDirection: number;
  gradientColors: string[];
  gradientStops: number[];
  imageUrl: string;
  imageSize: 'cover' | 'contain' | 'stretch' | 'repeat';
  imagePosition: 'center' | 'top' | 'bottom' | 'left' | 'right';
  opacity: number;
  overlayColor: string;
  overlayOpacity: number;
}

interface BackgroundCustomizerProps {
  settings: BackgroundSettings;
  onSettingsChange: (settings: BackgroundSettings) => void;
}

const MEMORIAL_COLORS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1',
  '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b',
  '#0f172a', '#1e1b4b', '#312e81', '#3730a3', '#4338ca',
  '#5b21b6', '#7c2d12', '#92400e', '#b45309', '#d97706',
  '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#059669', '#0d9488', '#0891b2', '#0284c7', '#2563eb'
];

const GRADIENT_PRESETS = [
  { name: 'Gentle Gray', colors: ['#f8fafc', '#e2e8f0'], direction: 180 },
  { name: 'Memorial Blue', colors: ['#dbeafe', '#bfdbfe'], direction: 135 },
  { name: 'Peaceful Green', colors: ['#dcfce7', '#bbf7d0'], direction: 180 },
  { name: 'Warm Beige', colors: ['#fef7ed', '#fed7aa'], direction: 225 },
  { name: 'Soft Purple', colors: ['#f3e8ff', '#ddd6fe'], direction: 135 },
  { name: 'Classic White', colors: ['#ffffff', '#f9fafb'], direction: 180 }
];

export function BackgroundCustomizer({ settings, onSettingsChange }: BackgroundCustomizerProps) {
  const [previewMode, setPreviewMode] = useState(false);

  const updateSettings = (updates: Partial<BackgroundSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const addGradientColor = () => {
    if (settings.gradientColors.length < 5) {
      updateSettings({
        gradientColors: [...settings.gradientColors, '#ffffff'],
        gradientStops: [...settings.gradientStops, 100]
      });
    }
  };

  const removeGradientColor = (index: number) => {
    if (settings.gradientColors.length > 2) {
      const newColors = settings.gradientColors.filter((_, i) => i !== index);
      const newStops = settings.gradientStops.filter((_, i) => i !== index);
      updateSettings({
        gradientColors: newColors,
        gradientStops: newStops
      });
    }
  };

  const updateGradientColor = (index: number, color: string) => {
    const newColors = [...settings.gradientColors];
    newColors[index] = color;
    updateSettings({ gradientColors: newColors });
  };

  const applyGradientPreset = (preset: typeof GRADIENT_PRESETS[0]) => {
    updateSettings({
      type: 'gradient',
      gradientColors: preset.colors,
      gradientDirection: preset.direction,
      gradientStops: [0, 100]
    });
  };

  const generateGradientCSS = () => {
    if (settings.type !== 'gradient') return '';
    
    const colorStops = settings.gradientColors.map((color, index) => {
      const stop = settings.gradientStops[index] || (index / (settings.gradientColors.length - 1)) * 100;
      return `${color} ${stop}%`;
    }).join(', ');

    if (settings.gradientType === 'radial') {
      return `radial-gradient(circle, ${colorStops})`;
    } else {
      return `linear-gradient(${settings.gradientDirection}deg, ${colorStops})`;
    }
  };

  const generateBackgroundCSS = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      opacity: settings.opacity
    };

    switch (settings.type) {
      case 'solid':
        return {
          ...baseStyle,
          backgroundColor: settings.solidColor
        };
      case 'gradient':
        return {
          ...baseStyle,
          background: generateGradientCSS()
        };
      case 'image':
        return {
          ...baseStyle,
          backgroundImage: `url(${settings.imageUrl})`,
          backgroundSize: settings.imageSize,
          backgroundPosition: settings.imagePosition,
          backgroundRepeat: settings.imageSize === 'repeat' ? 'repeat' : 'no-repeat'
        };
      default:
        return baseStyle;
    }
  };

  return (
    <Card className="w-full bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Palette className="h-5 w-5" />
            Background Customizer
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Background Type Selector */}
        <Tabs value={settings.type} onValueChange={(value) => updateSettings({ type: value as any })}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="solid">Solid Color</TabsTrigger>
            <TabsTrigger value="gradient">Gradient</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>

          {/* Solid Color Tab */}
          <TabsContent value="solid" className="space-y-4">
            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={settings.solidColor}
                  onChange={(e) => updateSettings({ solidColor: e.target.value })}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={settings.solidColor}
                  onChange={(e) => updateSettings({ solidColor: e.target.value })}
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
              
              {/* Color Palette */}
              <div className="grid grid-cols-10 gap-1 mt-2">
                {MEMORIAL_COLORS.map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400"
                    style={{ backgroundColor: color }}
                    onClick={() => updateSettings({ solidColor: color })}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Gradient Tab */}
          <TabsContent value="gradient" className="space-y-4">
            {/* Gradient Type */}
            <div className="space-y-2">
              <Label>Gradient Type</Label>
              <Select 
                value={settings.gradientType} 
                onValueChange={(value) => updateSettings({ gradientType: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Direction (for linear gradients) */}
            {settings.gradientType === 'linear' && (
              <div className="space-y-2">
                <Label>Direction: {settings.gradientDirection}°</Label>
                <Slider
                  value={[settings.gradientDirection]}
                  onValueChange={([value]) => updateSettings({ gradientDirection: value })}
                  min={0}
                  max={360}
                  step={15}
                />
              </div>
            )}

            {/* Gradient Colors */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Gradient Colors</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={addGradientColor}
                  disabled={settings.gradientColors.length >= 5}
                >
                  Add Color
                </Button>
              </div>
              
              <div className="space-y-2">
                {settings.gradientColors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={color}
                      onChange={(e) => updateGradientColor(index, e.target.value)}
                      className="w-12 h-8 p-1"
                    />
                    <Input
                      type="text"
                      value={color}
                      onChange={(e) => updateGradientColor(index, e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-8">
                      {settings.gradientStops[index] || Math.round((index / (settings.gradientColors.length - 1)) * 100)}%
                    </span>
                    {settings.gradientColors.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGradientColor(index)}
                        className="w-8 h-8 p-0 text-red-500"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Gradient Presets */}
            <div className="space-y-2">
              <Label>Quick Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                {GRADIENT_PRESETS.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => applyGradientPreset(preset)}
                    className="text-xs h-8"
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Image Tab */}
          <TabsContent value="image" className="space-y-4">
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                type="url"
                value={settings.imageUrl}
                onChange={(e) => updateSettings({ imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Image Size</Label>
                <Select 
                  value={settings.imageSize} 
                  onValueChange={(value) => updateSettings({ imageSize: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="contain">Contain</SelectItem>
                    <SelectItem value="stretch">Stretch</SelectItem>
                    <SelectItem value="repeat">Repeat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Position</Label>
                <Select 
                  value={settings.imagePosition} 
                  onValueChange={(value) => updateSettings({ imagePosition: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Image Overlay */}
            <div className="space-y-2">
              <Label>Overlay Color & Opacity</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={settings.overlayColor}
                  onChange={(e) => updateSettings({ overlayColor: e.target.value })}
                  className="w-16 h-8 p-1"
                />
                <div className="flex-1">
                  <Slider
                    value={[settings.overlayOpacity]}
                    onValueChange={([value]) => updateSettings({ overlayOpacity: value })}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </div>
                <span className="text-sm w-12">{Math.round(settings.overlayOpacity * 100)}%</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Global Opacity */}
        <div className="space-y-2">
          <Label>Background Opacity: {Math.round(settings.opacity * 100)}%</Label>
          <Slider
            value={[settings.opacity]}
            onValueChange={([value]) => updateSettings({ opacity: value })}
            min={0.1}
            max={1}
            step={0.1}
          />
        </div>

        {/* Preview */}
        {previewMode && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="w-full h-32 border rounded-lg relative overflow-hidden"
              style={generateBackgroundCSS()}
            >
              {settings.type === 'image' && settings.overlayOpacity > 0 && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: settings.overlayColor,
                    opacity: settings.overlayOpacity
                  }}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-gray-700 font-medium">Memorial Background</span>
              </div>
            </div>
          </div>
        )}

        {/* Reset Button */}
        <Button
          variant="outline"
          onClick={() => updateSettings({
            type: 'solid',
            solidColor: '#ffffff',
            gradientType: 'linear',
            gradientDirection: 180,
            gradientColors: ['#ffffff', '#f1f5f9'],
            gradientStops: [0, 100],
            imageUrl: '',
            imageSize: 'cover',
            imagePosition: 'center',
            opacity: 1,
            overlayColor: '#000000',
            overlayOpacity: 0
          })}
          className="w-full"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Default
        </Button>
      </CardContent>
    </Card>
  );
}

export default BackgroundCustomizer;