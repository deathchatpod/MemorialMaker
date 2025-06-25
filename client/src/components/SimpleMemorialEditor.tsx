import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUndoRedo } from "@/hooks/useUndoRedo";
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

export default function SimpleMemorialEditor({ memorial, onSave }: SimpleMemorialEditorProps) {
  const { toast } = useToast();
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
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
      isEnabled: false,
      currentSlide: 0,
      autoPlay: false,
      duration: 3000,
      transition: 'fade'
    }
  };

  // Undo/Redo state management
  const [editorState, undoRedoActions] = useUndoRedo(initialState);
  
  // Extract current state
  const currentSettings = editorState.settings;
  const elements = editorState.elements;
  const slideshowState = editorState.slideshow;

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Helper functions to update state with undo/redo tracking
  const updateSettings = useCallback((newSettings: any) => {
    undoRedoActions.set({
      ...editorState,
      settings: { ...editorState.settings, ...newSettings }
    });
  }, [editorState, undoRedoActions]);

  const updateSlideshow = useCallback((slideshowUpdates: any) => {
    undoRedoActions.set({
      ...editorState,
      slideshow: { ...editorState.slideshow, ...slideshowUpdates }
    });
  }, [editorState, undoRedoActions]);

  const updateElements = useCallback((newElements: any) => {
    undoRedoActions.set({
      ...editorState,
      elements: newElements
    });
  }, [editorState, undoRedoActions]);

  const themes = {
    classic: { name: 'Classic', bg: '#f9fafb', text: '#1f2937', accent: '#3b82f6' },
    modern: { name: 'Modern', bg: '#ffffff', text: '#0f172a', accent: '#8b5cf6' },
    warm: { name: 'Warm', bg: '#fef7ed', text: '#92400e', accent: '#f59e0b' },
    elegant: { name: 'Elegant', bg: '#1f2937', text: '#f9fafb', accent: '#10b981' }
  };

  const updateElement = useCallback((elementId: string, updates: any) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
  }, []);

  const handleThemeChange = (themeName: string) => {
    const theme = themes[themeName as keyof typeof themes];
    setCurrentSettings(prev => ({
      ...prev,
      theme: themeName,
      backgroundColor: theme.bg,
      textColor: theme.text
    }));
  };

  const getDeviceWidth = () => {
    switch (deviceView) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
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
        }
      });
      
      toast({
        title: "Success",
        description: "Memorial design saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to save design changes",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex h-full">
      {/* Main Canvas */}
      <div className="flex-1 p-6 bg-gray-50">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex gap-2">
            <Button
              variant={deviceView === 'desktop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDeviceView('desktop')}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={deviceView === 'tablet' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDeviceView('tablet')}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={deviceView === 'mobile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDeviceView('mobile')}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCustomizationOpen(!isCustomizationOpen)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Customize
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Design
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ maxWidth: getDeviceWidth(), margin: '0 auto' }}>
          <div 
            className="relative min-h-[600px] p-6"
            style={{
              backgroundColor: currentSettings.backgroundColor,
              color: currentSettings.textColor,
              fontFamily: currentSettings.fontFamily,
              fontSize: currentSettings.fontSize
            }}
          >
            {elements.map((element) => (
              <div
                key={element.id}
                className={`absolute cursor-pointer transition-all ${
                  selectedElement === element.id ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{
                  left: `${element.position.x}%`,
                  top: `${element.position.y}px`,
                  width: `${element.size.width}%`,
                  minHeight: `${element.size.height}px`
                }}
                onClick={() => setSelectedElement(element.id)}
                onMouseDown={(e) => {
                  // Enable drag functionality
                  const startY = e.clientY;
                  const startX = e.clientX;
                  const startPos = element.position;
                  
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const deltaX = moveEvent.clientX - startX;
                    const deltaY = moveEvent.clientY - startY;
                    
                    updateElement(element.id, {
                      position: {
                        x: Math.max(0, Math.min(80, startPos.x + (deltaX / 10))),
                        y: Math.max(0, startPos.y + deltaY)
                      }
                    });
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  if (selectedElement === element.id) {
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }
                }}
              >
                {/* Element Controls */}
                {selectedElement === element.id && (
                  <div className="absolute -top-8 left-0 flex gap-1 bg-blue-600 rounded px-2 py-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white hover:bg-blue-700">
                      <Move className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0 text-white hover:bg-blue-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newElement = {
                          ...element,
                          id: `${element.id}_copy_${Date.now()}`,
                          position: { x: element.position.x + 5, y: element.position.y + 20 }
                        };
                        setElements(prev => [...prev, newElement]);
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {/* Element Content */}
                {element.type === 'text' && element.id === 'header' && (
                  <h1 className="text-4xl font-bold text-center mb-4">
                    {element.content}
                  </h1>
                )}
                
                {element.type === 'text' && element.id === 'description' && (
                  <div className="prose max-w-none">
                    <p className="text-lg leading-relaxed">
                      {element.content || 'Click to add memorial description...'}
                    </p>
                  </div>
                )}
                
                {element.type === 'media' && (
                  <div className="grid grid-cols-2 gap-4">
                    {memorial.images?.slice(0, 4).map((img: any, idx: number) => (
                      <div key={idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      </div>
                    )) || (
                      <div className="col-span-2 text-center py-8 text-gray-500">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Media gallery placeholder</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customization Panel */}
      {isCustomizationOpen && (
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Customize Design</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCustomizationOpen(false)}
            >
              ×
            </Button>
          </div>

          <Tabs defaultValue="themes" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="themes">Themes</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="typography">Text</TabsTrigger>
              <TabsTrigger value="visual">Visual</TabsTrigger>
            </TabsList>

            <TabsContent value="themes" className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(themes).map(([key, theme]) => (
                  <Button
                    key={key}
                    variant={currentSettings.theme === key ? 'default' : 'outline'}
                    className="h-auto p-3"
                    onClick={() => handleThemeChange(key)}
                  >
                    <div className="text-center">
                      <div 
                        className="w-8 h-8 rounded mx-auto mb-1 border"
                        style={{ 
                          backgroundColor: theme.bg, 
                          borderColor: theme.accent,
                          borderWidth: currentSettings.theme === key ? '2px' : '1px'
                        }}
                      />
                      <span className="text-xs">{theme.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Click elements in the preview to select and move them. Use the customization panel to adjust colors, fonts, and layout.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <div>
                <Label>Page Width</Label>
                <Select defaultValue="normal">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="narrow">Narrow</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="wide">Wide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
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
                    <SelectItem value="tight">Tight</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="loose">Loose</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="typography" className="space-y-4">
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
                <Label>Border Radius</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="range"
                    min="0"
                    max="20"
                    value={currentSettings.borderRadius}
                    onChange={(e) => setCurrentSettings(prev => ({ ...prev, borderRadius: parseInt(e.target.value) }))}
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
  );
}