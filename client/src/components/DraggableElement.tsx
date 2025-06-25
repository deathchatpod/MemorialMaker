import React, { useState, useRef } from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Draggable from 'react-draggable';
import { Button } from "@/components/ui/button";
import { 
  GripVertical, 
  Edit3, 
  Trash2, 
  Move,
  RotateCcw,
  Copy,
  Lock,
  Unlock
} from "lucide-react";

interface DraggableElementProps {
  id: string;
  type: 'text' | 'image' | 'obituary' | 'media';
  content: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isSelected: boolean;
  isLocked: boolean;
  onSelect: () => void;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  customizationSettings: any;
  children: React.ReactNode;
}

export default function DraggableElement({
  id,
  type,
  content,
  position,
  size,
  isSelected,
  isLocked,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  customizationSettings,
  children
}: DraggableElementProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : isSelected ? 100 : 1,
  };

  const handleDrag = (e: any, data: any) => {
    if (!isLocked) {
      onUpdate({
        position: { x: data.x, y: data.y }
      });
    }
  };

  const handleResize = (direction: string, delta: { x: number; y: number }) => {
    if (isLocked) return;
    
    const newSize = { ...size };
    const newPosition = { ...position };

    switch (direction) {
      case 'se': // Southeast
        newSize.width = Math.max(100, size.width + delta.x);
        newSize.height = Math.max(50, size.height + delta.y);
        break;
      case 'sw': // Southwest
        newSize.width = Math.max(100, size.width - delta.x);
        newSize.height = Math.max(50, size.height + delta.y);
        newPosition.x = position.x + delta.x;
        break;
      case 'ne': // Northeast
        newSize.width = Math.max(100, size.width + delta.x);
        newSize.height = Math.max(50, size.height - delta.y);
        newPosition.y = position.y + delta.y;
        break;
      case 'nw': // Northwest
        newSize.width = Math.max(100, size.width - delta.x);
        newSize.height = Math.max(50, size.height - delta.y);
        newPosition.x = position.x + delta.x;
        newPosition.y = position.y + delta.y;
        break;
    }

    onUpdate({ size: newSize, position: newPosition });
  };

  const elementStyle = {
    fontFamily: customizationSettings.typography?.bodyFont || 'Arial',
    fontSize: `${customizationSettings.typography?.fontSize || 16}px`,
    lineHeight: customizationSettings.typography?.lineHeight || 1.6,
    color: customizationSettings.typography?.bodyColor || '#343a40',
    borderRadius: `${customizationSettings.elements?.borderRadius || 8}px`,
    boxShadow: customizationSettings.elements?.shadowIntensity 
      ? `0 4px 6px rgba(0, 0, 0, ${customizationSettings.elements.shadowIntensity})`
      : 'none',
  };

  return (
    <Draggable
      position={position}
      onDrag={handleDrag}
      disabled={isLocked || isDragging}
      handle=".drag-handle"
    >
      <div
        ref={setNodeRef}
        style={{ ...style, ...elementStyle }}
        className={`absolute border-2 transition-all ${
          isSelected 
            ? 'border-blue-500 shadow-lg' 
            : 'border-transparent hover:border-gray-300'
        } ${isLocked ? 'opacity-75' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {/* Element Content */}
        <div
          style={{
            width: `${size.width}px`,
            height: `${size.height}px`,
            minHeight: '50px',
            overflow: 'hidden'
          }}
          className="relative"
        >
          {children}
        </div>

        {/* Controls Overlay (only when selected) */}
        {isSelected && (
          <>
            {/* Control Toolbar */}
            <div className="absolute -top-10 left-0 flex gap-1 bg-white shadow-lg rounded-md p-1 border">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 drag-handle cursor-move"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="w-3 h-3" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
              >
                <Copy className="w-3 h-3" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ isLocked: !isLocked });
                }}
              >
                {isLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            {/* Resize Handles (only if not locked) */}
            {!isLocked && (
              <>
                {/* Corner resize handles */}
                <div
                  className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizing(true);
                    // Add resize logic here
                  }}
                />
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizing(true);
                    // Add resize logic here
                  }}
                />
                <div
                  className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizing(true);
                    // Add resize logic here
                  }}
                />
                <div
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizing(true);
                    // Add resize logic here
                  }}
                />
              </>
            )}
          </>
        )}

        {/* Type Badge */}
        <div className="absolute top-1 right-1">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">
            {type}
          </div>
        </div>

        {/* Lock Indicator */}
        {isLocked && (
          <div className="absolute top-1 left-1">
            <Lock className="w-4 h-4 text-gray-500" />
          </div>
        )}
      </div>
    </Draggable>
  );
}