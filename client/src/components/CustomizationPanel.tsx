import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SketchPicker } from 'react-color';
import { 
  Palette,
  Type,
  Layout,
  Image as ImageIcon,
  Settings,
  Eye,
  Undo2,
  Redo2,
  Save,
  Download
} from "lucide-react";

interface CustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: any;
  onSettingsChange: (settings: any) => void;
  onSave: () => void;
  onPreview: () => void;
}

const fontFamilies = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Crimson Text', label: 'Crimson Text' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lora', label: 'Lora' },
  { value: 'Montserrat', label: 'Montserrat' }
];

const backgroundPatterns = [
  { value: 'none', label: 'None' },
  { value: 'dots', label: 'Dots' },
  { value: 'lines', label: 'Lines' },
  { value: 'crosses', label: 'Crosses' },
  { value: 'waves', label: 'Waves' }
];

const themes = [
  { value: 'classic', label: 'Classic', colors: ['#f8f9fa', '#343a40', '#007bff'] },
  { value: 'elegant', label: 'Elegant', colors: ['#1a1a1a', '#f5f5f5', '#d4af37'] },
  { value: 'modern', label: 'Modern', colors: ['#ffffff', '#2c3e50', '#3498db'] },
  { value: 'warm', label: 'Warm', colors: ['#fdf6e3', '#8b4513', '#ff6b35'] },
  { value: 'nature', label: 'Nature', colors: ['#f0f8f0', '#2d5016', '#4caf50'] }
];

export default function CustomizationPanel({
  isOpen,
  onClose,
  currentSettings,
  onSettingsChange,
  onSave,
  onPreview
}: CustomizationPanelProps) {
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([currentSettings]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const updateSetting = (category: string, key: string, value: any) => {
    const newSettings = {
      ...currentSettings,
      [category]: {
        ...currentSettings[category],
        [key]: value
      }
    };
    
    // Add to history for undo/redo
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSettings);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    onSettingsChange(newSettings);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      onSettingsChange(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      onSettingsChange(history[historyIndex + 1]);
    }
  };

  const applyTheme = (theme: any) => {
    const newSettings = {
      ...currentSettings,
      theme: theme.value,
      background: {
        ...currentSettings.background,
        color: theme.colors[0]
      },
      typography: {
        ...currentSettings.typography,
        bodyColor: theme.colors[1],
        headingColor: theme.colors[1]
      }
    };
    onSettingsChange(newSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 overflow-y-auto border-l">
      <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Customize Memorial</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button onClick={onPreview} variant="outline" size="sm" className="flex-1">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={onSave} size="sm" className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>

        <Tabs defaultValue="themes" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="themes">Themes</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="typography">Type</TabsTrigger>
            <TabsTrigger value="visual">Visual</TabsTrigger>
          </TabsList>

          {/* Themes Tab */}
          <TabsContent value="themes" className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Memorial Themes</Label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                {themes.map((theme) => (
                  <Card
                    key={theme.value}
                    className={`cursor-pointer transition-all bg-card border-border ${
                      currentSettings.theme === theme.value ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => applyTheme(theme)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{theme.label}</div>
                          <div className="flex gap-1 mt-1">
                            {theme.colors.map((color, i) => (
                              <div
                                key={i}
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        {currentSettings.theme === theme.value && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Page Layout</Label>
              <Select
                value={currentSettings.layout?.type || 'flexible'}
                onValueChange={(value) => updateSetting('layout', 'type', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flexible">Flexible Layout</SelectItem>
                  <SelectItem value="grid">Grid Layout</SelectItem>
                  <SelectItem value="fixed">Fixed Layout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Content Width</Label>
              <Slider
                value={[currentSettings.layout?.maxWidth || 1200]}
                onValueChange={([value]) => updateSetting('layout', 'maxWidth', value)}
                max={1920}
                min={800}
                step={50}
                className="mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">
                {currentSettings.layout?.maxWidth || 1200}px
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Element Spacing</Label>
              <Slider
                value={[currentSettings.layout?.spacing || 24]}
                onValueChange={([value]) => updateSetting('layout', 'spacing', value)}
                max={64}
                min={8}
                step={4}
                className="mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">
                {currentSettings.layout?.spacing || 24}px
              </div>
            </div>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Heading Font</Label>
              <Select
                value={currentSettings.typography?.headingFont || 'Georgia'}
                onValueChange={(value) => updateSetting('typography', 'headingFont', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilies.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Body Font</Label>
              <Select
                value={currentSettings.typography?.bodyFont || 'Arial'}
                onValueChange={(value) => updateSetting('typography', 'bodyFont', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilies.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Font Size</Label>
              <Slider
                value={[currentSettings.typography?.fontSize || 16]}
                onValueChange={([value]) => updateSetting('typography', 'fontSize', value)}
                max={24}
                min={12}
                step={1}
                className="mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">
                {currentSettings.typography?.fontSize || 16}px
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Line Height</Label>
              <Slider
                value={[currentSettings.typography?.lineHeight || 1.6]}
                onValueChange={([value]) => updateSetting('typography', 'lineHeight', value)}
                max={2.5}
                min={1.0}
                step={0.1}
                className="mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">
                {currentSettings.typography?.lineHeight || 1.6}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Text Colors</Label>
              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <Label className="text-xs">Headings</Label>
                  <Button
                    variant="outline"
                    className="w-full h-8 p-0 mt-1"
                    style={{ backgroundColor: currentSettings.typography?.headingColor || '#343a40' }}
                    onClick={() => setActiveColorPicker('headingColor')}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Body</Label>
                  <Button
                    variant="outline"
                    className="w-full h-8 p-0 mt-1"
                    style={{ backgroundColor: currentSettings.typography?.bodyColor || '#6c757d' }}
                    onClick={() => setActiveColorPicker('bodyColor')}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Visual Tab */}
          <TabsContent value="visual" className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Background</Label>
              <div className="space-y-3 mt-2">
                <div>
                  <Label className="text-xs">Color</Label>
                  <Button
                    variant="outline"
                    className="w-full h-8 p-0 mt-1"
                    style={{ backgroundColor: currentSettings.background?.color || '#ffffff' }}
                    onClick={() => setActiveColorPicker('backgroundColor')}
                  />
                </div>
                
                <div>
                  <Label className="text-xs">Pattern</Label>
                  <Select
                    value={currentSettings.background?.pattern || 'none'}
                    onValueChange={(value) => updateSetting('background', 'pattern', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {backgroundPatterns.map((pattern) => (
                        <SelectItem key={pattern.value} value={pattern.value}>
                          {pattern.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Opacity</Label>
                  <Slider
                    value={[currentSettings.background?.opacity || 1]}
                    onValueChange={([value]) => updateSetting('background', 'opacity', value)}
                    max={1}
                    min={0.1}
                    step={0.1}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Element Styling</Label>
              <div className="space-y-3 mt-2">
                <div>
                  <Label className="text-xs">Border Radius</Label>
                  <Slider
                    value={[currentSettings.elements?.borderRadius || 8]}
                    onValueChange={([value]) => updateSetting('elements', 'borderRadius', value)}
                    max={32}
                    min={0}
                    step={2}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Shadow Intensity</Label>
                  <Slider
                    value={[currentSettings.elements?.shadowIntensity || 0.1]}
                    onValueChange={([value]) => updateSetting('elements', 'shadowIntensity', value)}
                    max={0.5}
                    min={0}
                    step={0.05}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Color Picker Modal */}
        {activeColorPicker && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Choose Color</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveColorPicker(null)}
                >
                  ×
                </Button>
              </div>
              <SketchPicker
                color={
                  activeColorPicker === 'backgroundColor'
                    ? currentSettings.background?.color || '#ffffff'
                    : activeColorPicker === 'headingColor'
                    ? currentSettings.typography?.headingColor || '#343a40'
                    : currentSettings.typography?.bodyColor || '#6c757d'
                }
                onChange={(color) => {
                  if (activeColorPicker === 'backgroundColor') {
                    updateSetting('background', 'color', color.hex);
                  } else if (activeColorPicker === 'headingColor') {
                    updateSetting('typography', 'headingColor', color.hex);
                  } else if (activeColorPicker === 'bodyColor') {
                    updateSetting('typography', 'bodyColor', color.hex);
                  }
                }}
              />
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveColorPicker(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setActiveColorPicker(null)}
                  className="flex-1"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}