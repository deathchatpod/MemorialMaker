import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  ChevronUp, 
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Trash2,
  Copy
} from 'lucide-react';

interface MemorialElement {
  id: string;
  type: 'text' | 'image' | 'obituary' | 'media';
  content: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isLocked: boolean;
  isVisible: boolean;
  name?: string;
}

interface LayerManagerProps {
  elements: MemorialElement[];
  selectedElementId: string | null;
  onElementSelect: (id: string) => void;
  onElementUpdate: (id: string, updates: Partial<MemorialElement>) => void;
  onElementDelete: (id: string) => void;
  onElementDuplicate: (id: string) => void;
  onLayerChange: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
}

export function LayerManager({
  elements,
  selectedElementId,
  onElementSelect,
  onElementUpdate,
  onElementDelete,
  onElementDuplicate,
  onLayerChange
}: LayerManagerProps) {
  
  // Sort elements by z-index (highest first)
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);
  
  const getElementName = (element: MemorialElement) => {
    if (element.name) return element.name;
    
    switch (element.type) {
      case 'text':
        const textContent = element.content?.text || '';
        return textContent.length > 20 ? `${textContent.substring(0, 20)}...` : textContent || 'Text Element';
      case 'image':
        return 'Image Element';
      case 'obituary':
        return 'Obituary Content';
      case 'media':
        return 'Media Gallery';
      default:
        return 'Element';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'image': return '🖼️';
      case 'obituary': return '📄';
      case 'media': return '🎬';
      default: return '📦';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'image': return 'bg-green-100 text-green-800';
      case 'obituary': return 'bg-purple-100 text-purple-800';
      case 'media': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Layers className="h-5 w-5" />
          Layer Manager
          <Badge variant="secondary">{elements.length} elements</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          <div className="p-3 space-y-2">
            {sortedElements.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No elements in this memorial
              </div>
            ) : (
              sortedElements.map((element) => (
                <div
                  key={element.id}
                  className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${
                    selectedElementId === element.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onElementSelect(element.id)}
                >
                  {/* Type Icon */}
                  <div className="text-lg">{getTypeIcon(element.type)}</div>
                  
                  {/* Element Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {getElementName(element)}
                      </span>
                      <Badge variant="outline" className={`text-xs ${getTypeColor(element.type)}`}>
                        {element.type}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Z: {element.zIndex} • {element.size.width}×{element.size.height}px
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-1">
                    {/* Visibility Toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onElementUpdate(element.id, { isVisible: !element.isVisible });
                      }}
                      title={element.isVisible ? 'Hide' : 'Show'}
                    >
                      {element.isVisible ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-gray-400" />
                      )}
                    </Button>

                    {/* Lock Toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onElementUpdate(element.id, { isLocked: !element.isLocked });
                      }}
                      title={element.isLocked ? 'Unlock' : 'Lock'}
                    >
                      {element.isLocked ? (
                        <Lock className="w-3 h-3 text-red-500" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                    </Button>

                    {/* Layer Controls */}
                    <div className="flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerChange(element.id, 'up');
                        }}
                        title="Move Up"
                        disabled={element.zIndex >= Math.max(...elements.map(e => e.zIndex))}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerChange(element.id, 'down');
                        }}
                        title="Move Down"
                        disabled={element.zIndex <= Math.min(...elements.map(e => e.zIndex))}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Action Controls */}
                    <div className="flex border-l pl-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onElementDuplicate(element.id);
                        }}
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          onElementDelete(element.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Layer Actions */}
        {selectedElementId && elements.length > 0 && (
          <div className="border-t p-3 space-y-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Layer Actions
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLayerChange(selectedElementId, 'top')}
                className="flex items-center gap-1"
              >
                <ChevronsUp className="w-3 h-3" />
                To Front
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLayerChange(selectedElementId, 'bottom')}
                className="flex items-center gap-1"
              >
                <ChevronsDown className="w-3 h-3" />
                To Back
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LayerManager;