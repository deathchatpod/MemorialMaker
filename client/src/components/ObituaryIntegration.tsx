import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  MapPin,
  Heart,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

interface Obituary {
  id: number;
  personName: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  content: string;
  serviceDate?: string;
  serviceLocation?: string;
  createdAt: string;
  status: string;
}

interface ObituaryIntegrationProps {
  obituary?: Obituary;
  className?: string;
  showFullContent?: boolean;
  isResizable?: boolean;
  onResize?: (width: number, height: number) => void;
  style?: React.CSSProperties;
}

export default function ObituaryIntegration({ 
  obituary, 
  className = "",
  showFullContent = false,
  isResizable = false,
  onResize,
  style = {}
}: ObituaryIntegrationProps) {
  const [isExpanded, setIsExpanded] = useState(showFullContent);
  const [isResizing, setIsResizing] = useState(false);

  if (!obituary) {
    return (
      <Card className={`${className} border-dashed border-gray-300`} style={style}>
        <CardContent className="flex items-center justify-center h-32 text-gray-500">
          <div className="text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No obituary linked</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const truncatedContent = obituary.content.length > 200 
    ? obituary.content.substring(0, 200) + "..."
    : obituary.content;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isResizable) return;
    
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = (e.currentTarget as HTMLElement).offsetWidth;
    const startHeight = (e.currentTarget as HTMLElement).offsetHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      const newHeight = startHeight + (e.clientY - startY);
      onResize?.(Math.max(200, newWidth), Math.max(150, newHeight));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Card 
      className={`${className} ${isResizing ? 'select-none' : ''} ${isResizable ? 'resize-handle' : ''}`} 
      style={style}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-blue-600" />
            Obituary
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {obituary.status}
            </Badge>
            {!showFullContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 px-2"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* Person Details */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">{obituary.personName}</h3>
          
          {(obituary.dateOfBirth || obituary.dateOfDeath) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                {obituary.dateOfBirth && format(new Date(obituary.dateOfBirth), 'MMMM d, yyyy')}
                {obituary.dateOfBirth && obituary.dateOfDeath && ' - '}
                {obituary.dateOfDeath && format(new Date(obituary.dateOfDeath), 'MMMM d, yyyy')}
              </span>
            </div>
          )}
          
          {obituary.serviceDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Heart className="w-4 h-4" />
              <span>Service: {format(new Date(obituary.serviceDate), 'MMMM d, yyyy')}</span>
            </div>
          )}
          
          {obituary.serviceLocation && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{obituary.serviceLocation}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Obituary Content */}
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {isExpanded || showFullContent ? obituary.content : truncatedContent}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-xs text-gray-500">
            Created {format(new Date(obituary.createdAt), 'MMM d, yyyy')}
          </div>
          
          <div className="flex gap-2">
            {!isExpanded && !showFullContent && obituary.content.length > 200 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="text-xs"
              >
                Read More
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/obituary/${obituary.id}/generated`, '_blank')}
              className="text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View Full
            </Button>
          </div>
        </div>
      </CardContent>
      
      {/* Resize Handle */}
      {isResizable && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize opacity-30 hover:opacity-60"
          onMouseDown={handleMouseDown}
        >
          <div className="w-full h-full bg-gray-400 transform rotate-45 translate-x-1 translate-y-1"></div>
        </div>
      )}
    </Card>
  );
}