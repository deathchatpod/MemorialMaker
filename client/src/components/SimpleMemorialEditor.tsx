import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import SlideshowCreator from "./SlideshowCreator";
import { 
  Settings, 
  Eye, 
  Save, 
  Palette,
  Type,
  Layout,
  Smartphone,
  Monitor,
  Tablet,
  Move,
  RotateCcw,
  Copy,
  Image as ImageIcon,
  Undo,
  Redo,
  Play,
  Pause,
  SkipBack,
  SkipForward
} from "lucide-react";

interface SimpleMemorialEditorProps {
  memorial: any;
  onSave: (updates: any) => void;
}

export default function SimpleMemorialEditorFixed({ memorial, onSave }: SimpleMemorialEditorProps) {
  const { toast } = useToast();
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showSlideshow, setShowSlideshow] = useState(false);
  
  // Initial state for undo/redo
  const initialState = {
    settings: {
      theme: memorial.theme || 'classic',
      backgroundColor: memorial.customStyles?.backgroundColor || '#f9fafb',
      textColor: memorial.customStyles?.textColor || '#1f2937',
      fontFamily: memorial.customStyles?.fontFamily || 'Inter',
      fontSize: memorial.customStyles?.fontSize || 16,
      spacing: memorial.customStyles?.spacing || 'normal',
      borderRadius: memorial.customStyles?.borderRadius || 8,
      shadowIntensity: memorial.customStyles?.shadowIntensity || 2
    },
    elements: [
      {
        id: 'header',
        type: 'text',
        content: memorial.personName,
        position: { x: 0, y: 0 },
        size: { width: 100, height: 80 },
        isLocked: false
      },
      {
        id: 'description',
        type: 'text', 
        content: memorial.description || '',
        position: { x: 0, y: 100 },
        size: { width: 100, height: 120 },
        isLocked: false
      },
      {
        id: 'media',
        type: 'media',
        content: memorial.images || [],
        position: { x: 0, y: 240 },
        size: { width: 100, height: 200 },
        isLocked: false
      }
    ],
    slideshow: {
      photos: memorial.images?.map((img: any, index: number) => ({
        id: `photo_${index}`,
        url: img.url || img,
        caption: img.caption || `Photo ${index + 1}`
      })) || [],
      settings: {
        autoPlay: false,
        duration: 3000,
        transition: 'fade' as const,
        showCaptions: true,
        loop: true
      }
    }
  };

  // Undo/Redo state management
  const [editorState, undoRedoActions] = useUndoRedo(initialState);
  
  // Extract current state
  const currentSettings = editorState.settings;
  const elements = editorState.elements;
  const slideshowState = editorState.slideshow;

  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  // Helper functions to update state with undo/redo tracking
  const updateSettings = useCallback((newSettings: any) => {
    undoRedoActions.set({
      ...editorState,
      settings: { ...editorState.settings, ...newSettings }
    });
  }, [editorState, undoRedoActions]);

  const updateElements = useCallback((newElements: any) => {
    undoRedoActions.set({
      ...editorState,
      elements: newElements
    });
  }, [editorState, undoRedoActions]);

  const updateSlideshow = useCallback((slideshowUpdates: any) => {
    undoRedoActions.set({
      ...editorState,
      slideshow: { ...editorState.slideshow, ...slideshowUpdates }
    });
  }, [editorState, undoRedoActions]);

  const themes = {
    classic: { name: 'Classic', bg: '#f9fafb', text: '#1f2937', accent: '#3b82f6' },
    modern: { name: 'Modern', bg: '#ffffff', text: '#0f172a', accent: '#8b5cf6' },
    warm: { name: 'Warm', bg: '#fef7ed', text: '#92400e', accent: '#f59e0b' },
    elegant: { name: 'Elegant', bg: '#1f2937', text: '#f9fafb', accent: '#10b981' }
  };

  const handleThemeChange = (themeName: string) => {
    const theme = themes[themeName as keyof typeof themes];
    updateSettings({
      theme: themeName,
      backgroundColor: theme.bg,
      textColor: theme.text
    });
  };

  const handleSave = async () => {
    try {
      await onSave({
        theme: currentSettings.theme,
        customStyles: {
          backgroundColor: currentSettings.backgroundColor,
          textColor: currentSettings.textColor,
          fontFamily: currentSettings.fontFamily,
          fontSize: currentSettings.fontSize,
          spacing: currentSettings.spacing,
          borderRadius: currentSettings.borderRadius,
          shadowIntensity: currentSettings.shadowIntensity
        },
        pageLayout: {
          elements: elements
        },
        slideshow: slideshowState
      });
      
      toast({
        title: "Memorial Saved",
        description: "Your memorial design has been saved successfully."
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "There was an error saving your memorial.",
        variant: "destructive"
      });
    }
  };

  const deviceSizes = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1200, height: 800 }
  };

  const currentDevice = deviceSizes[deviceView];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Undo/Redo */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-foreground">Memorial Editor</h1>
            
            {/* Undo/Redo Controls */}
            <div className="flex items-center gap-2 border-l border-border pl-4">
              <Button
                variant="outline"
                size="sm"
                onClick={undoRedoActions.undo}
                disabled={!undoRedoActions.canUndo}
                className="gap-2"
              >
                <Undo className="w-4 h-4" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={undoRedoActions.redo}
                disabled={!undoRedoActions.canRedo}
                className="gap-2"
              >
                <Redo className="w-4 h-4" />
                Redo
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Device Preview Toggle */}
            <div className="flex items-center border border-border rounded-lg p-1 bg-muted">
              <Button
                variant={deviceView === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDeviceView('mobile')}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
              <Button
                variant={deviceView === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDeviceView('tablet')}
              >
                <Tablet className="w-4 h-4" />
              </Button>
              <Button
                variant={deviceView === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDeviceView('desktop')}
              >
                <Monitor className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setIsCustomizationOpen(!isCustomizationOpen)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Customize
            </Button>
            
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Save Memorial
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Editor Area */}
        <div className="flex-1 p-6">
          <div className="flex justify-center">
            <div 
              className="bg-card rounded-lg shadow-lg overflow-hidden transition-all duration-300 border border-border"
              style={{
                width: currentDevice.width,
                minHeight: currentDevice.height,
                backgroundColor: currentSettings.backgroundColor,
                color: currentSettings.textColor,
                fontFamily: currentSettings.fontFamily,
                fontSize: `${currentSettings.fontSize}px`
              }}
            >
              {/* Memorial Content */}
              <div className="p-8">
                <div className="space-y-6">
                  {elements.map((element) => (
                    <div
                      key={element.id}
                      className={`relative group cursor-pointer border-2 transition-colors ${
                        selectedElement === element.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-transparent hover:border-muted-foreground/30'
                      }`}
                      onClick={() => setSelectedElement(element.id)}
                      style={{
                        borderRadius: `${currentSettings.borderRadius}px`
                      }}
                    >
                      {/* Element Content */}
                      {element.type === 'text' && element.id === 'header' && (
                        <h1 className="text-4xl font-bold text-center mb-4">
                          {element.content}
                        </h1>
                      )}
                      
                      {element.type === 'text' && element.id === 'description' && (
                        <div className="prose max-w-none">
                          <p className="text-lg leading-relaxed">
                            {element.content}
                          </p>
                        </div>
                      )}
                      
                      {element.type === 'media' && (
                        <div className="space-y-4">
                          {!showSlideshow && element.content?.length > 0 && (
                            <div className="grid grid-cols-2 gap-4">
                              {element.content.slice(0, 4).map((image: any, index: number) => (
                                <div key={index} className="aspect-square rounded-lg overflow-hidden">
                                  <img
                                    src={image.url || image}
                                    alt={`Memorial photo ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {element.content?.length > 0 && (
                            <div className="flex justify-center">
                              <Button
                                variant="outline"
                                onClick={() => setShowSlideshow(!showSlideshow)}
                                className="gap-2"
                              >
                                {showSlideshow ? <Eye className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {showSlideshow ? 'Show Gallery' : 'View Slideshow'}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Slideshow Section */}
          {showSlideshow && slideshowState.photos.length > 0 && (
            <div className="mt-8">
              <SlideshowCreator
                photos={slideshowState.photos}
                onPhotosChange={(photos) => updateSlideshow({ photos })}
                onSettingsChange={(settings) => updateSlideshow({ settings })}
                initialSettings={slideshowState.settings}
              />
            </div>
          )}
        </div>

        {/* Customization Panel */}
        {isCustomizationOpen && (
          <div className="w-80 bg-white border-l p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Customization</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCustomizationOpen(false)}
              >
                ×
              </Button>
            </div>

            <Tabs defaultValue="theme" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="theme">Theme</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="visual">Visual</TabsTrigger>
              </TabsList>

              <TabsContent value="theme" className="space-y-4">
                <div>
                  <Label>Theme Style</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(themes).map(([key, theme]) => (
                      <Card
                        key={key}
                        className={`cursor-pointer transition-colors ${
                          currentSettings.theme === key ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleThemeChange(key)}
                      >
                        <CardContent className="p-3">
                          <div
                            className="w-full h-8 rounded mb-2"
                            style={{ backgroundColor: theme.bg }}
                          />
                          <div className="text-sm font-medium">{theme.name}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="layout" className="space-y-4">
                <div>
                  <Label>Element Spacing</Label>
                  <Select 
                    value={currentSettings.spacing} 
                    onValueChange={(value) => updateSettings({ spacing: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="spacious">Spacious</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Font Family</Label>
                  <Select 
                    value={currentSettings.fontFamily} 
                    onValueChange={(value) => updateSettings({ fontFamily: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Font Size</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="range"
                      min="12"
                      max="24"
                      value={currentSettings.fontSize}
                      onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500 w-12">{currentSettings.fontSize}px</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="visual" className="space-y-4">
                <div>
                  <Label>Background Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: currentSettings.backgroundColor }}
                    />
                    <Input
                      type="color"
                      value={currentSettings.backgroundColor}
                      onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                      className="w-16 h-8 p-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Text Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: currentSettings.textColor }}
                    />
                    <Input
                      type="color"
                      value={currentSettings.textColor}
                      onChange={(e) => updateSettings({ textColor: e.target.value })}
                      className="w-16 h-8 p-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Border Radius</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="range"
                      min="0"
                      max="20"
                      value={currentSettings.borderRadius}
                      onChange={(e) => updateSettings({ borderRadius: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500 w-12">{currentSettings.borderRadius}px</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}