import React, { useState, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ResizableElement from "./ResizableElement";
import CustomizationPanel from "./CustomizationPanel";
import TypographyControls from "./TypographyControls";
import BackgroundCustomizer from "./BackgroundCustomizer";
import BorderShadowControls from "./BorderShadowControls";
import PhotoFilters from "./PhotoFilters";
import MediaGallery from "./MediaGallery";
import ObituaryIntegration from "./ObituaryIntegration";
import { GridSystem, GridOverlay } from "./GridSystem";
import { LayerManager } from "./LayerManager";
import { 
  Settings, 
  Eye, 
  Save, 
  Plus, 
  Grid, 
  Type, 
  Image as ImageIcon,
  FileText,
  Smartphone,
  Monitor,
  Tablet,
  Layers,
  Move,
  Palette
} from "lucide-react";

interface MemorialElement {
  id: string;
  type: 'text' | 'image' | 'obituary' | 'media';
  content: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isLocked: boolean;
  isVisible: boolean;
  zIndex: number;
  name?: string;
}

interface MemorialEditorProps {
  memorial: any;
  onSave: (updates: any) => void;
}

const defaultCustomizationSettings = {
  theme: 'classic',
  layout: {
    type: 'flexible',
    maxWidth: 1200,
    spacing: 24
  },
  typography: {
    headingFont: 'Georgia',
    bodyFont: 'Arial',
    fontSize: 16,
    lineHeight: 1.6,
    headingColor: '#343a40',
    bodyColor: '#6c757d'
  },
  background: {
    color: '#ffffff',
    pattern: 'none',
    opacity: 1
  },
  elements: {
    borderRadius: 8,
    shadowIntensity: 0.1
  }
};

const deviceSizes = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1200, height: 800 }
};

export default function MemorialEditor({ memorial, onSave }: MemorialEditorProps) {
  const [elements, setElements] = useState<MemorialElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [customizationSettings, setCustomizationSettings] = useState(
    memorial.customStyles || defaultCustomizationSettings
  );
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [devicePreview, setDevicePreview] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [activeTab, setActiveTab] = useState('elements');
  
  // Grid system state
  const [gridEnabled, setGridEnabled] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [gridOpacity, setGridOpacity] = useState(0.3);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [positioningMode, setPositioningMode] = useState<'free' | 'grid' | 'snap'>('snap');
  
  // Phase 4 Visual customization state
  const [typographySettings, setTypographySettings] = useState({
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
  });
  
  const [backgroundSettings, setBackgroundSettings] = useState({
    type: 'solid' as const,
    solidColor: '#ffffff',
    gradientType: 'linear' as const,
    gradientDirection: 180,
    gradientColors: ['#ffffff', '#f1f5f9'],
    gradientStops: [0, 100],
    imageUrl: '',
    imageSize: 'cover' as const,
    imagePosition: 'center' as const,
    opacity: 1,
    overlayColor: '#000000',
    overlayOpacity: 0
  });
  
  const [borderShadowSettings, setBorderShadowSettings] = useState({
    borderWidth: 0,
    borderStyle: 'none' as const,
    borderColor: '#000000',
    borderRadius: 0,
    shadowType: 'none' as const,
    shadowColor: '#000000',
    shadowBlur: 0,
    shadowSpread: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowOpacity: 0.25,
    multipleShadows: false,
    shadowLayers: []
  });
  
  const [photoFilterSettings, setPhotoFilterSettings] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sepia: 0,
    grayscale: 0,
    invert: 0,
    opacity: 100,
    tint: '#ffffff',
    tintIntensity: 0,
    vintage: 0,
    vignette: 0,
    noise: 0,
    blendMode: 'normal' as const
  });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Initialize elements from memorial data
  React.useEffect(() => {
    const initialElements: MemorialElement[] = [];
    let yOffset = 50;

    // Add main content as text element
    if (memorial.description) {
      initialElements.push({
        id: 'description',
        type: 'text',
        content: { text: memorial.description, style: 'body' },
        position: { x: 50, y: yOffset },
        size: { width: 600, height: 120 },
        isLocked: false,
        isVisible: true,
        zIndex: 1
      });
      yOffset += 150;
    }

    // Add obituary if linked
    if (memorial.obituaryId) {
      initialElements.push({
        id: 'obituary',
        type: 'obituary',
        content: { obituaryId: memorial.obituaryId },
        position: { x: 50, y: yOffset },
        size: { width: 700, height: 300 },
        isLocked: false,
        isVisible: true,
        zIndex: 2
      });
      yOffset += 350;
    }

    // Add media gallery if media exists
    if (memorial.images?.length > 0 || memorial.audioFiles?.length > 0 || memorial.youtubeLinks?.length > 0) {
      initialElements.push({
        id: 'media',
        type: 'media',
        content: {
          images: memorial.images || [],
          audioFiles: memorial.audioFiles || [],
          youtubeLinks: memorial.youtubeLinks || [],
          primaryMediaType: memorial.primaryMediaType,
          primaryMediaId: memorial.primaryMediaId
        },
        position: { x: 50, y: yOffset },
        size: { width: 800, height: 400 },
        isLocked: false,
        isVisible: true,
        zIndex: 3
      });
    }

    setElements(initialElements);
  }, [memorial]);

  const handleElementUpdate = useCallback((id: string, updates: Partial<MemorialElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, []);

  const handleElementDelete = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  }, [selectedElementId]);

  const handleElementDuplicate = useCallback((id: string) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElement: MemorialElement = {
        ...element,
        id: `${element.type}-${Date.now()}`,
        position: { x: element.position.x + 20, y: element.position.y + 20 },
        zIndex: Math.max(...elements.map(e => e.zIndex)) + 1
      };
      setElements(prev => [...prev, newElement]);
    }
  }, [elements]);

  const handleLayerChange = useCallback((id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    setElements(prev => {
      const element = prev.find(el => el.id === id);
      if (!element) return prev;

      const allZIndexes = prev.map(e => e.zIndex).sort((a, b) => a - b);
      let newZIndex = element.zIndex;

      switch (direction) {
        case 'up':
          const nextUp = allZIndexes.find(z => z > element.zIndex);
          if (nextUp !== undefined) {
            newZIndex = nextUp + 1;
          }
          break;
        case 'down':
          const nextDown = [...allZIndexes].reverse().find(z => z < element.zIndex);
          if (nextDown !== undefined) {
            newZIndex = Math.max(1, nextDown - 1);
          }
          break;
        case 'top':
          newZIndex = Math.max(...allZIndexes) + 1;
          break;
        case 'bottom':
          newZIndex = 1;
          // Shift all other elements up
          return prev.map(el => ({
            ...el,
            zIndex: el.id === id ? 1 : (el.zIndex >= 1 ? el.zIndex + 1 : el.zIndex)
          }));
      }

      return prev.map(el => el.id === id ? { ...el, zIndex: newZIndex } : el);
    });
  }, []);

  const addNewElement = useCallback((type: MemorialElement['type']) => {
    const newElement: MemorialElement = {
      id: `${type}-${Date.now()}`,
      type,
      content: type === 'text' ? { text: 'New text element' } : {},
      position: { x: 100, y: 100 },
      size: { width: 300, height: 150 },
      isLocked: false,
      isVisible: true,
      zIndex: Math.max(...elements.map(e => e.zIndex), 0) + 1
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  }, [elements]);

  // Remove duplicate functions - using the ones defined earlier

  const addNewElement = (type: MemorialElement['type']) => {
    const newElement: MemorialElement = {
      id: `${type}-${Date.now()}`,
      type,
      content: getDefaultContent(type),
      position: { x: 100, y: 100 },
      size: getDefaultSize(type),
      isLocked: false,
      zIndex: Math.max(...elements.map(el => el.zIndex), 0) + 1
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  };

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'text':
        return { text: 'Enter your text here...', style: 'body' };
      case 'image':
        return { url: '', alt: 'Image', caption: '' };
      case 'obituary':
        return { obituaryId: memorial.obituaryId };
      case 'media':
        return { images: [], audioFiles: [], youtubeLinks: [] };
      default:
        return {};
    }
  };

  const getDefaultSize = (type: string) => {
    switch (type) {
      case 'text':
        return { width: 400, height: 100 };
      case 'image':
        return { width: 300, height: 200 };
      case 'obituary':
        return { width: 600, height: 300 };
      case 'media':
        return { width: 700, height: 400 };
      default:
        return { width: 200, height: 100 };
    }
  };

  const renderElementContent = (element: MemorialElement) => {
    switch (element.type) {
      case 'text':
        return (
          <div 
            className="p-4 h-full overflow-auto"
            style={{
              fontFamily: customizationSettings.typography.bodyFont,
              fontSize: `${customizationSettings.typography.fontSize}px`,
              lineHeight: customizationSettings.typography.lineHeight,
              color: customizationSettings.typography.bodyColor,
            }}
          >
            {element.content.text}
          </div>
        );
      case 'obituary':
        return (
          <div className="h-full">
            <ObituaryIntegration 
              obituary={memorial.linkedObituary}
              showFullContent={false}
              className="h-full"
            />
          </div>
        );
      case 'media':
        return (
          <div className="h-full">
            <MediaGallery 
              media={[
                ...(element.content.images?.map((img: any) => ({
                  id: img.id,
                  type: 'image' as const,
                  url: img.url,
                  title: img.title
                })) || []),
                ...(element.content.audioFiles?.map((audio: any) => ({
                  id: audio.id,
                  type: 'audio' as const,
                  url: audio.url,
                  title: audio.title
                })) || []),
                ...(element.content.youtubeLinks?.map((video: any) => ({
                  id: video.id,
                  type: 'youtube' as const,
                  url: video.url,
                  title: video.title
                })) || [])
              ]}
              showControls={true}
              className="h-full"
            />
          </div>
        );
      default:
        return <div className="p-4">Element content</div>;
    }
  };

  const handleSave = async () => {
    try {
      const updates = {
        customStyles: customizationSettings,
        pageLayout: {
          elements: elements,
          settings: customizationSettings
        }
      };
      await onSave(updates);
      toast({
        title: "Success",
        description: "Memorial customization saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save customization",
        variant: "destructive"
      });
    }
  };

  const canvasStyle = {
    backgroundColor: customizationSettings.background.color,
    backgroundOpacity: customizationSettings.background.opacity,
    maxWidth: `${customizationSettings.layout.maxWidth}px`,
    minHeight: '800px',
    margin: '0 auto',
    position: 'relative' as const,
    overflow: 'hidden'
  };

  const renderElementContent = useCallback((element: MemorialElement) => {
    if (!element.isVisible) return null;

    switch (element.type) {
      case 'text':
        return (
          <div className="p-4 h-full overflow-auto">
            <p className="text-gray-800">{element.content?.text || 'Text element'}</p>
          </div>
        );
      case 'image':
        return (
          <div className="h-full bg-gray-100 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        );
      case 'obituary':
        return <ObituaryIntegration obituaryId={element.content?.obituaryId} />;
      case 'media':
        return <MediaGallery media={element.content} />;
      default:
        return <div className="h-full bg-gray-100" />;
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Editor Toolbar */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Memorial Editor</h1>
            <div className="flex gap-2">
              <Button
                variant={previewMode === 'edit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('edit')}
              >
                Edit
              </Button>
              <Button
                variant={previewMode === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('preview')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Device Preview Buttons */}
            <div className="flex gap-1 mr-4">
              <Button
                variant={devicePreview === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDevicePreview('mobile')}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
              <Button
                variant={devicePreview === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDevicePreview('tablet')}
              >
                <Tablet className="w-4 h-4" />
              </Button>
              <Button
                variant={devicePreview === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDevicePreview('desktop')}
              >
                <Monitor className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCustomizationOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Customize
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Status Bar */}
        {previewMode === 'edit' && (
          <div className="border-t bg-gray-50 px-4 py-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>{elements.length} elements</span>
                {selectedElementId && (
                  <span>Selected: {elements.find(el => el.id === selectedElementId)?.type}</span>
                )}
                <span>Grid: {gridSize}px {snapToGrid ? '(snap)' : '(free)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updates = {
                      customStyles: customizationSettings,
                      elements: elements
                    };
                    onSave(updates);
                    toast({ title: "Memorial saved successfully" });
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Editor Area */}
      <div className="flex">
        {/* Canvas */}
        <div className="flex-1 p-8">
          <div
            style={{
              width: devicePreview !== 'desktop' ? `${deviceSizes[devicePreview].width}px` : '100%',
              height: devicePreview !== 'desktop' ? `${deviceSizes[devicePreview].height}px` : 'auto',
              minHeight: devicePreview !== 'desktop' ? `${deviceSizes[devicePreview].height}px` : '800px',
              position: 'relative',
              backgroundColor: customizationSettings.background?.color || '#ffffff'
            }}
            className="bg-white shadow-lg memorial-canvas overflow-hidden"
            onClick={() => setSelectedElementId(null)}
            ref={canvasRef}
          >
            {/* Grid Overlay */}
            {gridEnabled && showGrid && previewMode === 'edit' && (
              <GridOverlay
                size={gridSize}
                opacity={gridOpacity}
                show={showGrid}
                canvasWidth={devicePreview !== 'desktop' ? deviceSizes[devicePreview].width : 1200}
                canvasHeight={devicePreview !== 'desktop' ? deviceSizes[devicePreview].height : 800}
              />
            )}

            {previewMode === 'edit' ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
              >
                {elements
                  .filter(el => el.isVisible)
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map((element) => (
                    <ResizableElement
                      key={element.id}
                      id={element.id}
                      type={element.type}
                      content={element.content}
                      position={element.position}
                      size={element.size}
                      zIndex={element.zIndex}
                      isSelected={selectedElementId === element.id}
                      isLocked={element.isLocked}
                      gridSize={gridSize}
                      snapToGrid={snapToGrid && positioningMode !== 'free'}
                      onSelect={() => setSelectedElementId(element.id)}
                      onUpdate={(updates) => handleElementUpdate(element.id, updates)}
                      onDelete={() => handleElementDelete(element.id)}
                      onDuplicate={() => handleElementDuplicate(element.id)}
                      onLayerChange={(direction) => handleLayerChange(element.id, direction)}
                    >
                      {renderElementContent(element)}
                    </ResizableElement>
                  ))}
              </DndContext>
            ) : (
              // Preview Mode - Render without drag controls
              <div className="relative w-full h-full">
                {elements
                  .filter(el => el.isVisible)
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map((element) => (
                    <div
                      key={element.id}
                      style={{
                        position: 'absolute',
                        left: `${element.position.x}px`,
                        top: `${element.position.y}px`,
                        width: `${element.size.width}px`,
                        height: `${element.size.height}px`,
                        zIndex: element.zIndex
                      }}
                      className="overflow-hidden bg-white rounded shadow-sm"
                    >
                      {renderElementContent(element)}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Customization Panel */}
        <CustomizationPanel
          isOpen={isCustomizationOpen}
          onClose={() => setIsCustomizationOpen(false)}
          currentSettings={customizationSettings}
          onSettingsChange={setCustomizationSettings}
          onSave={handleSave}
          onPreview={() => setPreviewMode('preview')}
        />
      </div>
    </div>
  );
}