import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  X, 
  Maximize2,
  Download,
  Share2
} from "lucide-react";

interface MediaItem {
  id: string;
  type: 'image' | 'audio' | 'youtube';
  url: string;
  filename?: string;
  title?: string;
  isPrimary?: boolean;
}

interface MediaGalleryProps {
  media: MediaItem[];
  className?: string;
  showControls?: boolean;
  autoPlay?: boolean;
  primaryMediaFirst?: boolean;
}

export default function MediaGallery({ 
  media, 
  className = "", 
  showControls = true,
  autoPlay = false,
  primaryMediaFirst = true 
}: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Sort media with primary first if enabled
  const sortedMedia = primaryMediaFirst 
    ? [...media].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
    : media;

  const currentMedia = sortedMedia[currentIndex];

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedMedia.length);
  };

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev - 1 + sortedMedia.length) % sortedMedia.length);
  };

  const shareMedia = () => {
    if (navigator.share && currentMedia) {
      navigator.share({
        title: currentMedia.title || 'Memorial Media',
        url: currentMedia.url
      });
    } else {
      navigator.clipboard.writeText(currentMedia.url);
    }
  };

  if (!media.length) {
    return (
      <Card className={`${className} bg-gray-50`}>
        <CardContent className="flex items-center justify-center h-64 text-gray-500">
          No media available
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`${className} overflow-hidden`}>
        <CardContent className="p-0">
          <div className="relative">
            {/* Main Media Display */}
            <div className="aspect-video bg-black flex items-center justify-center">
              {currentMedia.type === 'image' && (
                <img
                  src={currentMedia.url}
                  alt={currentMedia.title || `Memory ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onClick={() => setShowFullscreen(true)}
                />
              )}
              
              {currentMedia.type === 'youtube' && (
                <iframe
                  src={`https://www.youtube.com/embed/${currentMedia.url}?autoplay=${autoPlay ? 1 : 0}`}
                  className="w-full h-full"
                  allowFullScreen
                  title={currentMedia.title || `Video ${currentIndex + 1}`}
                />
              )}
              
              {currentMedia.type === 'audio' && (
                <div className="w-full p-8 flex flex-col items-center justify-center text-white">
                  <div className="text-6xl mb-4">🎵</div>
                  <h3 className="text-lg font-medium mb-4 text-center">
                    {currentMedia.title || currentMedia.filename || `Audio ${currentIndex + 1}`}
                  </h3>
                  <audio
                    controls
                    className="w-full max-w-md"
                    autoPlay={autoPlay}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  >
                    <source src={currentMedia.url} />
                  </audio>
                </div>
              )}
            </div>

            {/* Media Controls */}
            {showControls && sortedMedia.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
                  onClick={prevMedia}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
                  onClick={nextMedia}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Top Controls */}
            <div className="absolute top-2 right-2 flex gap-2">
              {currentMedia.isPrimary && (
                <Badge variant="secondary" className="bg-blue-500 text-white">
                  Featured
                </Badge>
              )}
              
              {showControls && (
                <div className="flex gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-black/50 hover:bg-black/70 text-white border-0 p-2"
                    onClick={shareMedia}
                  >
                    <Share2 className="w-3 h-3" />
                  </Button>
                  
                  {currentMedia.type === 'image' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-black/50 hover:bg-black/70 text-white border-0 p-2"
                      onClick={() => setShowFullscreen(true)}
                    >
                      <Maximize2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Media Counter */}
            {sortedMedia.length > 1 && (
              <div className="absolute bottom-2 left-2">
                <Badge variant="secondary" className="bg-black/50 text-white">
                  {currentIndex + 1} / {sortedMedia.length}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail Navigation */}
      {showControls && sortedMedia.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {sortedMedia.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 relative rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {item.type === 'image' && (
                <img
                  src={item.url}
                  alt={item.title || `Thumbnail ${index + 1}`}
                  className="w-16 h-16 object-cover"
                />
              )}
              
              {item.type === 'youtube' && (
                <div className="w-16 h-16 bg-red-600 flex items-center justify-center text-white text-xs">
                  ▶
                </div>
              )}
              
              {item.type === 'audio' && (
                <div className="w-16 h-16 bg-purple-600 flex items-center justify-center text-white text-xs">
                  🎵
                </div>
              )}
              
              {item.isPrimary && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full transform translate-x-1 -translate-y-1"></div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      {showFullscreen && currentMedia.type === 'image' && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={currentMedia.url}
              alt={currentMedia.title || `Memory ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white border-0"
              onClick={() => setShowFullscreen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}