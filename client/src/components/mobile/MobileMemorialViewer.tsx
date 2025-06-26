import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Share2, Heart, MessageCircle, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Media {
  url: string;
  filename: string;
  title?: string;
  isPrimary?: boolean;
}

interface FinalSpace {
  id: number;
  personName: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  description?: string;
  images: Media[];
  audioFiles: Media[];
  youtubeLinks: Media[];
  viewCount: number;
  allowComments: boolean;
}

interface MobileMemorialViewerProps {
  finalSpace: FinalSpace;
  onToggleComments: () => void;
  commentsVisible: boolean;
  className?: string;
}

export default function MobileMemorialViewer({ 
  finalSpace, 
  onToggleComments, 
  commentsVisible,
  className = '' 
}: MobileMemorialViewerProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  // Combine all media for swipe gallery
  const allMedia = [
    ...finalSpace.images.map(img => ({ ...img, type: 'image' })),
    ...finalSpace.youtubeLinks.map(video => ({ ...video, type: 'youtube' })),
    ...finalSpace.audioFiles.map(audio => ({ ...audio, type: 'audio' }))
  ];

  const nextMedia = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Memorial for ${finalSpace.personName}`,
          text: `Remember ${finalSpace.personName}`,
          url: window.location.href,
        });
      } catch (error) {
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Touch gesture handling for swipe navigation
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && allMedia.length > 1) {
      nextMedia();
    }
    if (isRightSwipe && allMedia.length > 1) {
      prevMedia();
    }
  };

  return (
    <div className={`mobile-memorial-viewer ${className}`}>
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{finalSpace.personName}</h1>
            {finalSpace.dateOfBirth && finalSpace.dateOfDeath && (
              <p className="text-sm text-gray-600">
                {finalSpace.dateOfBirth} - {finalSpace.dateOfDeath}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Media Gallery with swipe support */}
      {allMedia.length > 0 && (
        <div className="relative">
          <div
            className="overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div 
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}
            >
              {allMedia.map((media, index) => (
                <div key={index} className="w-full flex-shrink-0 p-4">
                  {media.type === 'image' && (
                    <img
                      src={media.url}
                      alt={media.filename}
                      className="w-full h-64 object-cover rounded-lg"
                      loading="lazy"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation and indicators */}
          {allMedia.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-2"
                onClick={prevMedia}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-2"
                onClick={nextMedia}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="flex justify-center space-x-1 py-2">
                {allMedia.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentMediaIndex ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                    onClick={() => setCurrentMediaIndex(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Description */}
      {finalSpace.description && (
        <Card className="m-4">
          <CardContent className="p-4">
            <p className="text-gray-700 leading-relaxed">{finalSpace.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Comments toggle */}
      {finalSpace.allowComments && (
        <div className="sticky bottom-0 bg-white border-t p-4">
          <Button
            onClick={onToggleComments}
            className="w-full"
            variant={commentsVisible ? "secondary" : "default"}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {commentsVisible ? 'Hide Comments' : 'Show Comments'}
          </Button>
        </div>
      )}
    </div>
  );
}