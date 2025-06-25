import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { 
  Settings, 
  Save, 
  Plus, 
  Type, 
  Image as ImageIcon,
  FileText,
  Undo,
  Redo,
  Play
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
}

interface MemorialEditorProps {
  memorial: any;
  onSave: (updates: any) => void;
}

const defaultCustomizationSettings = {
  theme: 'classic',
  layout: { type: 'flexible', maxWidth: 1200, spacing: 24 },
  typography: {
    headingFont: 'Georgia',
    bodyFont: 'Arial',
    fontSize: 16,
    lineHeight: 1.6,
    headingColor: '#343a40',
    bodyColor: '#6c757d'
  },
  background: { color: '#ffffff', pattern: 'none', opacity: 1 },
  elements: { borderRadius: 8, shadowIntensity: 0.1 }
};

export default function MemorialEditor({ memorial, onSave }: MemorialEditorProps) {
  const { toast } = useToast();
  
  // Initialize undo/redo with clean state
  const initialEditorState = {
    elements: [],
    customizationSettings: memorial.customStyles || defaultCustomizationSettings,
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

  const [editorState, undoRedoActions] = useUndoRedo(initialEditorState);
  const { elements, customizationSettings } = editorState;
  const { set: pushState, undo, redo, canUndo, canRedo } = undoRedoActions;

  // Local state
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');

  // Update functions that integrate with undo/redo
  const setElements = useCallback((newElements: MemorialElement[] | ((prev: MemorialElement[]) => MemorialElement[])) => {
    const updatedElements = typeof newElements === 'function' ? newElements(elements as MemorialElement[]) : newElements;
    pushState({ ...editorState, elements: updatedElements });
  }, [elements, editorState, pushState]);

  const setCustomizationSettings = useCallback((newSettings: any) => {
    pushState({ ...editorState, customizationSettings: newSettings });
  }, [editorState, pushState]);

  // Element management functions
  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'text':
        return { text: 'New text element', style: 'font-size: 16px; color: #333;' };
      case 'image':
        return { url: '/placeholder-image.jpg', alt: 'Memorial image' };
      case 'obituary':
        return { obituaryId: memorial.id };
      case 'media':
        return { images: [], audioFiles: [], youtubeLinks: [] };
      default:
        return {};
    }
  };

  const getDefaultSize = (type: string) => {
    switch (type) {
      case 'text':
        return { width: 300, height: 100 };
      case 'image':
        return { width: 400, height: 300 };
      case 'obituary':
        return { width: 600, height: 400 };
      case 'media':
        return { width: 500, height: 350 };
      default:
        return { width: 200, height: 150 };
    }
  };

  const addNewElement = useCallback((type: MemorialElement['type']) => {
    const elementArray = elements as MemorialElement[];
    const newElement: MemorialElement = {
      id: `${type}-${Date.now()}`,
      type,
      content: getDefaultContent(type),
      position: { x: 100, y: 100 },
      size: getDefaultSize(type),
      zIndex: Math.max(...elementArray.map(e => e.zIndex), 0) + 1,
      isVisible: true,
      isLocked: false
    };
    setElements(prev => [...(prev as MemorialElement[]), newElement]);
    setSelectedElementId(newElement.id);
  }, [elements, setElements]);

  const handleElementUpdate = useCallback((id: string, updates: Partial<MemorialElement>) => {
    setElements(prev => (prev as MemorialElement[]).map(el => el.id === id ? { ...el, ...updates } : el));
  }, [setElements]);

  const handleElementDelete = useCallback((id: string) => {
    setElements(prev => (prev as MemorialElement[]).filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  }, [selectedElementId, setElements]);

  const renderElementContent = (element: MemorialElement) => {
    switch (element.type) {
      case 'text':
        return (
          <div className="p-4 h-full overflow-auto">
            <p className="text-gray-800">{element.content?.text || 'Text element'}</p>
          </div>
        );
      case 'image':
        return (
          <div className="h-full bg-gray-100 flex items-center justify-center rounded">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        );
      case 'obituary':
        return (
          <div className="p-4 h-full bg-blue-50 rounded">
            <p className="text-sm text-blue-800">Obituary Content</p>
          </div>
        );
      case 'media':
        return (
          <div className="h-full bg-purple-50 flex items-center justify-center rounded">
            <Play className="w-8 h-8 text-purple-400" />
          </div>
        );
      default:
        return <div>Unknown element type</div>;
    }
  };

  const handleSave = async () => {
    try {
      const updates = {
        customStyles: customizationSettings,
        elements: elements
      };
      onSave(updates);
      toast({
        title: "Success",
        description: "Memorial saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to save memorial",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Memorial Design Editor</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(previewMode === 'edit' ? 'preview' : 'edit')}
          >
            {previewMode === 'edit' ? 'Preview' : 'Edit'}
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        {previewMode === 'edit' && (
          <div className="w-64 border-r bg-gray-50 p-4">
            <Tabs defaultValue="elements" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="elements">Elements</TabsTrigger>
                <TabsTrigger value="layers">Layers</TabsTrigger>
              </TabsList>
              
              <TabsContent value="elements" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Add Elements</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addNewElement('text')}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <Type className="w-4 h-4 mb-1" />
                      <span className="text-xs">Text</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addNewElement('image')}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <ImageIcon className="w-4 h-4 mb-1" />
                      <span className="text-xs">Image</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addNewElement('obituary')}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <FileText className="w-4 h-4 mb-1" />
                      <span className="text-xs">Obituary</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addNewElement('media')}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <Play className="w-4 h-4 mb-1" />
                      <span className="text-xs">Media</span>
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="layers" className="space-y-2">
                <div className="space-y-1">
                  {(elements as MemorialElement[]).map(element => (
                    <div
                      key={element.id}
                      className={`p-2 rounded cursor-pointer flex items-center gap-2 ${
                        selectedElementId === element.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                      } ${!element.isVisible ? 'opacity-50' : ''}`}
                      onClick={() => setSelectedElementId(element.id)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {element.type === 'text' && <Type className="w-4 h-4" />}
                        {element.type === 'image' && <ImageIcon className="w-4 h-4" />}
                        {element.type === 'obituary' && <FileText className="w-4 h-4" />}
                        {element.type === 'media' && <Play className="w-4 h-4" />}
                        <span className="text-sm">
                          {element.type} #{element.id.split('-')[1]}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleElementDelete(element.id);
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Main Canvas */}
        <div className="flex-1 p-4">
          <div 
            className="relative bg-white border rounded-lg overflow-hidden mx-auto"
            style={{ 
              minHeight: '600px',
              maxWidth: customizationSettings.layout.maxWidth,
              backgroundColor: customizationSettings.background.color
            }}
          >
            {(elements as MemorialElement[])
              .filter(el => el.isVisible)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((element) => (
                <div
                  key={element.id}
                  className={`absolute border-2 rounded ${
                    selectedElementId === element.id 
                      ? 'border-blue-500' 
                      : 'border-transparent hover:border-gray-300'
                  } ${previewMode === 'edit' ? 'cursor-move' : ''}`}
                  style={{
                    left: `${element.position.x}px`,
                    top: `${element.position.y}px`,
                    width: `${element.size.width}px`,
                    height: `${element.size.height}px`,
                    zIndex: element.zIndex
                  }}
                  onClick={() => previewMode === 'edit' && setSelectedElementId(element.id)}
                >
                  {renderElementContent(element)}
                  
                  {/* Edit controls */}
                  {previewMode === 'edit' && selectedElementId === element.id && (
                    <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <span>{element.type}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 text-white hover:bg-blue-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleElementDelete(element.id);
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              
            {(elements as MemorialElement[]).length === 0 && (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Add elements to start designing your memorial</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {previewMode === 'edit' && (
        <div className="border-t bg-gray-50 px-4 py-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>{(elements as MemorialElement[]).length} elements</span>
              {selectedElementId && (
                <span>Selected: {(elements as MemorialElement[]).find((el: MemorialElement) => el.id === selectedElementId)?.type}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>Undo/Redo: {canUndo ? '✓' : '✗'} / {canRedo ? '✓' : '✗'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}