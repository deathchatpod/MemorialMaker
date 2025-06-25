import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Square, 
  RotateCcw,
  Eye,
  Circle
} from 'lucide-react';

interface BorderShadowSettings {
  // Border settings
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  borderColor: string;
  borderRadius: number;
  
  // Shadow settings
  shadowType: 'none' | 'drop' | 'inner' | 'glow';
  shadowColor: string;
  shadowBlur: number;
  shadowSpread: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  
  // Advanced shadow
  multipleShadows: boolean;
  shadowLayers: Array<{
    color: string;
    blur: number;
    spread: number;
    offsetX: number;
    offsetY: number;
    opacity: number;
    inset: boolean;
  }>;
}

interface BorderShadowControlsProps {
  settings: BorderShadowSettings;
  onSettingsChange: (settings: BorderShadowSettings) => void;
  elementType?: string;
}

const BORDER_PRESETS = [
  { name: 'None', width: 0, style: 'none', color: '#000000', radius: 0 },
  { name: 'Thin Border', width: 1, style: 'solid', color: '#e2e8f0', radius: 4 },
  { name: 'Medium Border', width: 2, style: 'solid', color: '#cbd5e1', radius: 8 },
  { name: 'Thick Border', width: 4, style: 'solid', color: '#94a3b8', radius: 12 },
  { name: 'Dashed', width: 2, style: 'dashed', color: '#64748b', radius: 4 },
  { name: 'Memorial Frame', width: 3, style: 'solid', color: '#374151', radius: 16 }
];

const SHADOW_PRESETS = [
  { 
    name: 'None', 
    type: 'none', 
    color: '#000000', 
    blur: 0, 
    spread: 0, 
    offsetX: 0, 
    offsetY: 0, 
    opacity: 0 
  },
  { 
    name: 'Subtle', 
    type: 'drop', 
    color: '#000000', 
    blur: 4, 
    spread: 0, 
    offsetX: 0, 
    offsetY: 2, 
    opacity: 0.1 
  },
  { 
    name: 'Soft', 
    type: 'drop', 
    color: '#000000', 
    blur: 8, 
    spread: 0, 
    offsetX: 0, 
    offsetY: 4, 
    opacity: 0.15 
  },
  { 
    name: 'Medium', 
    type: 'drop', 
    color: '#000000', 
    blur: 12, 
    spread: 2, 
    offsetX: 0, 
    offsetY: 6, 
    opacity: 0.2 
  },
  { 
    name: 'Strong', 
    type: 'drop', 
    color: '#000000', 
    blur: 16, 
    spread: 4, 
    offsetX: 0, 
    offsetY: 8, 
    opacity: 0.25 
  },
  { 
    name: 'Glow', 
    type: 'glow', 
    color: '#3b82f6', 
    blur: 12, 
    spread: 0, 
    offsetX: 0, 
    offsetY: 0, 
    opacity: 0.5 
  }
];

export function BorderShadowControls({ 
  settings, 
  onSettingsChange, 
  elementType = 'element' 
}: BorderShadowControlsProps) {
  
  const updateSettings = (updates: Partial<BorderShadowSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const applyBorderPreset = (preset: typeof BORDER_PRESETS[0]) => {
    updateSettings({
      borderWidth: preset.width,
      borderStyle: preset.style as any,
      borderColor: preset.color,
      borderRadius: preset.radius
    });
  };

  const applyShadowPreset = (preset: typeof SHADOW_PRESETS[0]) => {
    updateSettings({
      shadowType: preset.type as any,
      shadowColor: preset.color,
      shadowBlur: preset.blur,
      shadowSpread: preset.spread,
      shadowOffsetX: preset.offsetX,
      shadowOffsetY: preset.offsetY,
      shadowOpacity: preset.opacity
    });
  };

  const generateBoxShadow = () => {
    if (settings.shadowType === 'none') return 'none';
    
    const rgba = hexToRgba(settings.shadowColor, settings.shadowOpacity);
    const inset = settings.shadowType === 'inner' ? 'inset ' : '';
    
    if (settings.shadowType === 'glow') {
      return `${inset}0 0 ${settings.shadowBlur}px ${settings.shadowSpread}px ${rgba}`;
    }
    
    return `${inset}${settings.shadowOffsetX}px ${settings.shadowOffsetY}px ${settings.shadowBlur}px ${settings.shadowSpread}px ${rgba}`;
  };

  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const previewStyle: React.CSSProperties = {
    width: '100%',
    height: '80px',
    borderWidth: `${settings.borderWidth}px`,
    borderStyle: settings.borderStyle,
    borderColor: settings.borderColor,
    borderRadius: `${settings.borderRadius}px`,
    boxShadow: generateBoxShadow(),
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: '#64748b'
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Square className="h-5 w-5" />
          Border & Shadow Effects
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Border Controls */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Square className="h-4 w-4" />
            <h4 className="font-medium">Border Settings</h4>
          </div>
          
          {/* Border Width */}
          <div className="space-y-2">
            <Label>Border Width: {settings.borderWidth}px</Label>
            <Slider
              value={[settings.borderWidth]}
              onValueChange={([value]) => updateSettings({ borderWidth: value })}
              min={0}
              max={20}
              step={1}
            />
          </div>

          {/* Border Style & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Border Style</Label>
              <Select 
                value={settings.borderStyle} 
                onValueChange={(value) => updateSettings({ borderStyle: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Border Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.borderColor}
                  onChange={(e) => updateSettings({ borderColor: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={settings.borderColor}
                  onChange={(e) => updateSettings({ borderColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Border Radius */}
          <div className="space-y-2">
            <Label>Border Radius: {settings.borderRadius}px</Label>
            <Slider
              value={[settings.borderRadius]}
              onValueChange={([value]) => updateSettings({ borderRadius: value })}
              min={0}
              max={50}
              step={1}
            />
          </div>

          {/* Border Presets */}
          <div className="space-y-2">
            <Label>Border Presets</Label>
            <div className="grid grid-cols-3 gap-2">
              {BORDER_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => applyBorderPreset(preset)}
                  className="text-xs"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Shadow Controls */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4" />
            <h4 className="font-medium">Shadow Settings</h4>
          </div>

          {/* Shadow Type */}
          <div className="space-y-2">
            <Label>Shadow Type</Label>
            <Select 
              value={settings.shadowType} 
              onValueChange={(value) => updateSettings({ shadowType: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="drop">Drop Shadow</SelectItem>
                <SelectItem value="inner">Inner Shadow</SelectItem>
                <SelectItem value="glow">Glow Effect</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.shadowType !== 'none' && (
            <>
              {/* Shadow Color & Opacity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shadow Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.shadowColor}
                      onChange={(e) => updateSettings({ shadowColor: e.target.value })}
                      className="w-12 h-8 p-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Opacity: {Math.round(settings.shadowOpacity * 100)}%</Label>
                  <Slider
                    value={[settings.shadowOpacity]}
                    onValueChange={([value]) => updateSettings({ shadowOpacity: value })}
                    min={0}
                    max={1}
                    step={0.05}
                  />
                </div>
              </div>

              {/* Shadow Blur & Spread */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Blur: {settings.shadowBlur}px</Label>
                  <Slider
                    value={[settings.shadowBlur]}
                    onValueChange={([value]) => updateSettings({ shadowBlur: value })}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Spread: {settings.shadowSpread}px</Label>
                  <Slider
                    value={[settings.shadowSpread]}
                    onValueChange={([value]) => updateSettings({ shadowSpread: value })}
                    min={-20}
                    max={20}
                    step={1}
                  />
                </div>
              </div>

              {/* Shadow Offset (not for glow) */}
              {settings.shadowType !== 'glow' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Offset X: {settings.shadowOffsetX}px</Label>
                    <Slider
                      value={[settings.shadowOffsetX]}
                      onValueChange={([value]) => updateSettings({ shadowOffsetX: value })}
                      min={-30}
                      max={30}
                      step={1}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Offset Y: {settings.shadowOffsetY}px</Label>
                    <Slider
                      value={[settings.shadowOffsetY]}
                      onValueChange={([value]) => updateSettings({ shadowOffsetY: value })}
                      min={-30}
                      max={30}
                      step={1}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Shadow Presets */}
          <div className="space-y-2">
            <Label>Shadow Presets</Label>
            <div className="grid grid-cols-3 gap-2">
              {SHADOW_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => applyShadowPreset(preset)}
                  className="text-xs"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div style={previewStyle}>
            {elementType} Preview
          </div>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          onClick={() => updateSettings({
            borderWidth: 0,
            borderStyle: 'none',
            borderColor: '#000000',
            borderRadius: 0,
            shadowType: 'none',
            shadowColor: '#000000',
            shadowBlur: 0,
            shadowSpread: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            shadowOpacity: 0.25,
            multipleShadows: false,
            shadowLayers: []
          })}
          className="w-full"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Effects
        </Button>
      </CardContent>
    </Card>
  );
}

export default BorderShadowControls;