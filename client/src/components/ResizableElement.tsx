import React, { useState, useRef, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { 
  GripVertical, 
  Move, 
  RotateCcw, 
  Copy, 
  Trash2, 
  Lock, 
  Unlock,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown
} from 'lucide-react';

interface ResizableElementProps {
  id: string;
  type: 'text' | 'image' | 'obituary' | 'media';
  content: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isSelected: boolean;
  isLocked: boolean;
  gridSize: number;
  snapToGrid: boolean;
  onSelect: () => void;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onLayerChange: (direction: 'up' | 'down' | 'top' | 'bottom') => void;
  children: React.ReactNode;
}

export default function ResizableElement({
  id,
  type,
  content,
  position,
  size,
  zIndex,
  isSelected,
  isLocked,
  gridSize,
  snapToGrid,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onLayerChange,
  children
}: ResizableElementProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: isLocked || isResizing,
    data: { type: 'element' }
  });

  const snapToGridValue = useCallback((value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
    if (isLocked) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeHandle(handle);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ width: size.width, height: size.height });
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;
      
      let newWidth = startSize.width;
      let newHeight = startSize.height;
      let newX = position.x;
      let newY = position.y;
      
      switch (handle) {
        case 'nw':
          newWidth = startSize.width - deltaX;
          newHeight = startSize.height - deltaY;
          newX = position.x + deltaX;
          newY = position.y + deltaY;
          break;
        case 'ne':
          newWidth = startSize.width + deltaX;
          newHeight = startSize.height - deltaY;
          newY = position.y + deltaY;
          break;
        case 'sw':
          newWidth = startSize.width - deltaX;
          newHeight = startSize.height + deltaY;
          newX = position.x + deltaX;
          break;
        case 'se':
          newWidth = startSize.width + deltaX;
          newHeight = startSize.height + deltaY;
          break;
        case 'n':
          newHeight = startSize.height - deltaY;
          newY = position.y + deltaY;
          break;
        case 's':
          newHeight = startSize.height + deltaY;
          break;
        case 'w':
          newWidth = startSize.width - deltaX;
          newX = position.x + deltaX;
          break;
        case 'e':
          newWidth = startSize.width + deltaX;
          break;
      }
      
      // Apply minimum size constraints
      newWidth = Math.max(50, newWidth);
      newHeight = Math.max(30, newHeight);
      
      // Snap to grid if enabled
      if (snapToGrid) {
        newWidth = snapToGridValue(newWidth);
        newHeight = snapToGridValue(newHeight);
        newX = snapToGridValue(newX);
        newY = snapToGridValue(newY);
      }
      
      onUpdate({
        size: { width: newWidth, height: newHeight },
        position: { x: newX, y: newY }
      });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isLocked, startPos, startSize, position, size, snapToGrid, snapToGridValue, onUpdate]);

  const handleDragEnd = useCallback((e: any) => {
    if (isLocked) return;
    
    const rect = e.target.getBoundingClientRect();
    const container = e.target.closest('.memorial-canvas');
    const containerRect = container?.getBoundingClientRect();
    
    if (containerRect) {
      let newX = rect.left - containerRect.left;
      let newY = rect.top - containerRect.top;
      
      if (snapToGrid) {
        newX = snapToGridValue(newX);
        newY = snapToGridValue(newY);
      }
      
      onUpdate({
        position: { x: newX, y: newY }
      });
    }
  }, [isLocked, snapToGrid, snapToGridValue, onUpdate]);

  const elementStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    zIndex: isDragging ? 1000 : zIndex,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    cursor: isLocked ? 'default' : 'move',
    userSelect: 'none'
  };

  const resizeHandles = [
    { position: 'nw', cursor: 'nw-resize', style: { top: -4, left: -4 } },
    { position: 'ne', cursor: 'ne-resize', style: { top: -4, right: -4 } },
    { position: 'sw', cursor: 'sw-resize', style: { bottom: -4, left: -4 } },
    { position: 'se', cursor: 'se-resize', style: { bottom: -4, right: -4 } },
    { position: 'n', cursor: 'n-resize', style: { top: -4, left: '50%', transform: 'translateX(-50%)' } },
    { position: 's', cursor: 's-resize', style: { bottom: -4, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'w', cursor: 'w-resize', style: { left: -4, top: '50%', transform: 'translateY(-50%)' } },
    { position: 'e', cursor: 'e-resize', style: { right: -4, top: '50%', transform: 'translateY(-50%)' } }
  ];

  return (
    <div
      ref={setNodeRef}
      style={elementStyle}
      className={`group border-2 transition-all ${
        isSelected 
          ? 'border-blue-500 shadow-lg' 
          : 'border-transparent hover:border-gray-300'
      } ${isLocked ? 'opacity-75' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      {...attributes}
    >
      {/* Element Content */}
      <div className="w-full h-full overflow-hidden relative bg-white rounded">
        {children}
      </div>

      {/* Drag Handle */}
      {isSelected && !isLocked && (
        <div
          {...listeners}
          className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 rounded text-xs cursor-move flex items-center gap-1"
        >
          <GripVertical className="w-3 h-3" />
          {type}
        </div>
      )}

      {/* Resize Handles */}
      {isSelected && !isLocked && (
        <>
          {resizeHandles.map((handle) => (
            <div
              key={handle.position}
              className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm opacity-80 hover:opacity-100"
              style={{
                ...handle.style,
                cursor: handle.cursor
              }}
              onMouseDown={(e) => handleMouseDown(e, handle.position)}
            />
          ))}
        </>
      )}

      {/* Control Panel */}
      {isSelected && (
        <div className="absolute -top-8 right-0 flex gap-1">
          {/* Layer Controls */}
          <div className="bg-gray-800 text-white rounded flex">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white hover:bg-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                onLayerChange('top');
              }}
              title="Bring to Front"
            >
              <ChevronsUp className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white hover:bg-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                onLayerChange('up');
              }}
              title="Bring Forward"
            >
              <ChevronUp className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white hover:bg-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                onLayerChange('down');
              }}
              title="Send Backward"
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white hover:bg-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                onLayerChange('bottom');
              }}
              title="Send to Back"
            >
              <ChevronsDown className="w-3 h-3" />
            </Button>
          </div>

          {/* Action Controls */}
          <div className="bg-gray-800 text-white rounded flex">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white hover:bg-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              title="Duplicate"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Lock Indicator */}
      {isLocked && (
        <div className="absolute top-2 right-2">
          <Lock className="w-4 h-4 text-gray-500" />
        </div>
      )}

      {/* Z-index Indicator */}
      {isSelected && (
        <div className="absolute bottom-1 right-1 bg-gray-800 text-white text-xs px-1 rounded">
          Z: {zIndex}
        </div>
      )}
    </div>
  );
}