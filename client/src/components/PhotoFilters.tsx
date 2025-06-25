import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Image as ImageIcon, 
  RotateCcw,
  Eye,
  Palette,
  Sun,
  Contrast,
  Droplets
} from 'lucide-react';

interface PhotoFilterSettings {
  // Basic filters
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  
  // Advanced filters
  blur: number;
  sepia: number;
  grayscale: number;
  invert: number;
  opacity: number;
  
  // Color filters
  tint: string;
  tintIntensity: number;
  
  // Vintage/Memorial effects
  vintage: number;
  vignette: number;
  noise: number;
  
  // Blend modes
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light';
}

interface PhotoFiltersProps {
  settings: PhotoFilterSettings;
  onSettingsChange: (settings: PhotoFilterSettings) => void;
  previewImage?: string;
}

const FILTER_PRESETS = [
  {
    name: 'Original',
    settings: {
      brightness: 100, contrast: 100, saturation: 100, hue: 0,
      blur: 0, sepia: 0, grayscale: 0, invert: 0, opacity: 100,
      tint: '#ffffff', tintIntensity: 0, vintage: 0, vignette: 0, noise: 0,
      blendMode: 'normal' as const
    }
  },
  {
    name: 'Memorial',
    settings: {
      brightness: 95, contrast: 110, saturation: 80, hue: 0,
      blur: 0, sepia: 15, grayscale: 0, invert: 0, opacity: 100,
      tint: '#f4f1e8', tintIntensity: 10, vintage: 20, vignette: 15, noise: 0,
      blendMode: 'soft-light' as const
    }
  },
  {
    name: 'Vintage',
    settings: {
      brightness: 90, contrast: 120, saturation: 70, hue: 10,
      blur: 0, sepia: 40, grayscale: 0, invert: 0, opacity: 100,
      tint: '#d4af37', tintIntensity: 15, vintage: 50, vignette: 25, noise: 5,
      blendMode: 'overlay' as const
    }
  },
  {
    name: 'Sepia',
    settings: {
      brightness: 95, contrast: 105, saturation: 60, hue: 0,
      blur: 0, sepia: 80, grayscale: 0, invert: 0, opacity: 100,
      tint: '#8b4513', tintIntensity: 5, vintage: 30, vignette: 20, noise: 0,
      blendMode: 'normal' as const
    }
  },
  {
    name: 'Black & White',
    settings: {
      brightness: 105, contrast: 115, saturation: 0, hue: 0,
      blur: 0, sepia: 0, grayscale: 100, invert: 0, opacity: 100,
      tint: '#ffffff', tintIntensity: 0, vintage: 0, vignette: 10, noise: 0,
      blendMode: 'normal' as const
    }
  },
  {
    name: 'Soft Focus',
    settings: {
      brightness: 110, contrast: 90, saturation: 90, hue: 0,
      blur: 2, sepia: 0, grayscale: 0, invert: 0, opacity: 100,
      tint: '#ffffff', tintIntensity: 5, vintage: 0, vignette: 5, noise: 0,
      blendMode: 'soft-light' as const
    }
  }
];

export function PhotoFilters({ 
  settings, 
  onSettingsChange, 
  previewImage = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop'
}: PhotoFiltersProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [previewMode, setPreviewMode] = useState(true);

  const updateSettings = (updates: Partial<PhotoFilterSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const applyPreset = (preset: typeof FILTER_PRESETS[0]) => {
    onSettingsChange(preset.settings);
  };

  const generateFilterCSS = () => {
    const filters = [
      `brightness(${settings.brightness}%)`,
      `contrast(${settings.contrast}%)`,
      `saturate(${settings.saturation}%)`,
      `hue-rotate(${settings.hue}deg)`,
      `blur(${settings.blur}px)`,
      `sepia(${settings.sepia}%)`,
      `grayscale(${settings.grayscale}%)`,
      `invert(${settings.invert}%)`,
      `opacity(${settings.opacity}%)`
    ];

    return {
      filter: filters.join(' '),
      mixBlendMode: settings.blendMode
    };
  };

  const generateOverlayStyle = () => {
    if (settings.tintIntensity === 0 && settings.vintage === 0 && settings.vignette === 0) {
      return null;
    }

    const overlays = [];
    
    // Tint overlay
    if (settings.tintIntensity > 0) {
      overlays.push({
        background: settings.tint,
        opacity: settings.tintIntensity / 100,
        mixBlendMode: 'multiply' as const
      });
    }

    // Vintage overlay
    if (settings.vintage > 0) {
      overlays.push({
        background: 'radial-gradient(circle, transparent 0%, rgba(139, 69, 19, 0.3) 100%)',
        opacity: settings.vintage / 100,
        mixBlendMode: 'overlay' as const
      });
    }

    // Vignette overlay
    if (settings.vignette > 0) {
      overlays.push({
        background: 'radial-gradient(circle, transparent 30%, rgba(0, 0, 0, 0.7) 100%)',
        opacity: settings.vignette / 100,
        mixBlendMode: 'multiply' as const
      });
    }

    return overlays;
  };

  const resetFilters = () => {
    onSettingsChange(FILTER_PRESETS[0].settings);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Photo Filters
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Hide' : 'Show'} Preview
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Filter Presets */}
        <div className="space-y-2">
          <Label>Quick Presets</Label>
          <div className="grid grid-cols-2 gap-2">
            {FILTER_PRESETS.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                className="text-xs"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Filter Controls */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="text-xs">
              <Sun className="w-3 h-3 mr-1" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="effects" className="text-xs">
              <Droplets className="w-3 h-3 mr-1" />
              Effects
            </TabsTrigger>
            <TabsTrigger value="creative" className="text-xs">
              <Palette className="w-3 h-3 mr-1" />
              Creative
            </TabsTrigger>
          </TabsList>

          {/* Basic Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Brightness: {settings.brightness}%</Label>
                <Slider
                  value={[settings.brightness]}
                  onValueChange={([value]) => updateSettings({ brightness: value })}
                  min={0}
                  max={200}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Contrast: {settings.contrast}%</Label>
                <Slider
                  value={[settings.contrast]}
                  onValueChange={([value]) => updateSettings({ contrast: value })}
                  min={0}
                  max={200}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Saturation: {settings.saturation}%</Label>
                <Slider
                  value={[settings.saturation]}
                  onValueChange={([value]) => updateSettings({ saturation: value })}
                  min={0}
                  max={200}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Hue: {settings.hue}°</Label>
                <Slider
                  value={[settings.hue]}
                  onValueChange={([value]) => updateSettings({ hue: value })}
                  min={-180}
                  max={180}
                  step={5}
                />
              </div>
            </div>
          </TabsContent>

          {/* Effects Tab */}
          <TabsContent value="effects" className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Blur: {settings.blur}px</Label>
                <Slider
                  value={[settings.blur]}
                  onValueChange={([value]) => updateSettings({ blur: value })}
                  min={0}
                  max={10}
                  step={0.5}
                />
              </div>

              <div className="space-y-2">
                <Label>Sepia: {settings.sepia}%</Label>
                <Slider
                  value={[settings.sepia]}
                  onValueChange={([value]) => updateSettings({ sepia: value })}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Grayscale: {settings.grayscale}%</Label>
                <Slider
                  value={[settings.grayscale]}
                  onValueChange={([value]) => updateSettings({ grayscale: value })}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Opacity: {settings.opacity}%</Label>
                <Slider
                  value={[settings.opacity]}
                  onValueChange={([value]) => updateSettings({ opacity: value })}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            </div>
          </TabsContent>

          {/* Creative Tab */}
          <TabsContent value="creative" className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Vintage Effect: {settings.vintage}%</Label>
                <Slider
                  value={[settings.vintage]}
                  onValueChange={([value]) => updateSettings({ vintage: value })}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Vignette: {settings.vignette}%</Label>
                <Slider
                  value={[settings.vignette]}
                  onValueChange={([value]) => updateSettings({ vignette: value })}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Color Tint</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.tint}
                    onChange={(e) => updateSettings({ tint: e.target.value })}
                    className="w-12 h-8 rounded border"
                  />
                  <div className="flex-1">
                    <Slider
                      value={[settings.tintIntensity]}
                      onValueChange={([value]) => updateSettings({ tintIntensity: value })}
                      min={0}
                      max={50}
                      step={1}
                    />
                  </div>
                  <span className="text-sm w-12">{settings.tintIntensity}%</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview */}
        {previewMode && (
          <div className="space-y-2">
            <Label>Filter Preview</Label>
            <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={previewImage}
                alt="Filter preview"
                className="w-full h-full object-cover"
                style={generateFilterCSS()}
              />
              
              {/* Overlay effects */}
              {generateOverlayStyle()?.map((overlay, index) => (
                <div
                  key={index}
                  className="absolute inset-0 pointer-events-none"
                  style={overlay}
                />
              ))}
              
              {/* Filter info badge */}
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="bg-black/50 text-white">
                  {FILTER_PRESETS.find(p => 
                    JSON.stringify(p.settings) === JSON.stringify(settings)
                  )?.name || 'Custom'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* CSS Output for Developers */}
        <div className="space-y-2">
          <Label>CSS Filter Code</Label>
          <div className="p-3 bg-gray-50 rounded-md text-sm font-mono text-gray-700 max-h-20 overflow-y-auto">
            filter: {generateFilterCSS().filter};<br/>
            mix-blend-mode: {settings.blendMode};
          </div>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          onClick={resetFilters}
          className="w-full"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset All Filters
        </Button>
      </CardContent>
    </Card>
  );
}

export default PhotoFilters;