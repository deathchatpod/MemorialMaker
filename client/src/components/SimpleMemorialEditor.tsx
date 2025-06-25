import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
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
  Copy
} from "lucide-react";

interface SimpleMemorialEditorProps {
  memorial: any;
  onSave: (updates: any) => void;
}

export default function SimpleMemorialEditor({ memorial, onSave }: SimpleMemorialEditorProps) {
  const { toast } = useToast();
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [currentSettings, setCurrentSettings] = useState({
    theme: memorial.theme || 'classic',
    backgroundColor: memorial.customStyles?.backgroundColor || '#f9fafb',
    textColor: memorial.customStyles?.textColor || '#1f2937',
    fontFamily: memorial.customStyles?.fontFamily || 'Inter',
    fontSize: memorial.customStyles?.fontSize || 16,
    spacing: memorial.customStyles?.spacing || 'normal',
    borderRadius: memorial.customStyles?.borderRadius || 8,
    shadowIntensity: memorial.customStyles?.shadowIntensity || 2
  });

  const [elements, setElements] = useState([
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
  ]);

  const [selectedElement, setSelectedElement] = useState<string | null>(null);

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
              >
                {/* Element Controls */}
                {selectedElement === element.id && (
                  <div className="absolute -top-8 left-0 flex gap-1 bg-blue-600 rounded px-2 py-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white hover:bg-blue-700">
                      <Move className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white hover:bg-blue-700">
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
                        <img 
                          src={img.url || `/uploads/memorial-media/images/${img.filename}`}
                          alt={img.title || 'Memorial photo'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
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
                        className="w-8 h-8 rounded mx-auto mb-1"
                        style={{ backgroundColor: theme.bg, border: '1px solid #e5e7eb' }}
                      />
                      <span className="text-xs">{theme.name}</span>
                    </div>
                  </Button>
                ))}
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
                <Slider
                  value={[currentSettings.spacing === 'tight' ? 1 : currentSettings.spacing === 'normal' ? 2 : 3]}
                  onValueChange={([value]) => {
                    const spacing = value === 1 ? 'tight' : value === 2 ? 'normal' : 'loose';
                    setCurrentSettings(prev => ({ ...prev, spacing }));
                  }}
                  max={3}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
            </TabsContent>

            <TabsContent value="typography" className="space-y-4">
              <div>
                <Label>Font Family</Label>
                <Select 
                  value={currentSettings.fontFamily} 
                  onValueChange={(value) => setCurrentSettings(prev => ({ ...prev, fontFamily: value }))}
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
                <Slider
                  value={[currentSettings.fontSize]}
                  onValueChange={([value]) => setCurrentSettings(prev => ({ ...prev, fontSize: value }))}
                  max={24}
                  min={12}
                  step={1}
                  className="w-full"
                />
                <span className="text-sm text-gray-500">{currentSettings.fontSize}px</span>
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
                    onChange={(e) => setCurrentSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-16 h-8 p-1"
                  />
                </div>
              </div>
              
              <div>
                <Label>Border Radius</Label>
                <Slider
                  value={[currentSettings.borderRadius]}
                  onValueChange={([value]) => setCurrentSettings(prev => ({ ...prev, borderRadius: value }))}
                  max={20}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <span className="text-sm text-gray-500">{currentSettings.borderRadius}px</span>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}