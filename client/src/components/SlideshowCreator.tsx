import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Plus, 
  Trash2,
  Image as ImageIcon,
  Settings,
  Eye
} from 'lucide-react';

interface SlideshowPhoto {
  id: string;
  url: string;
  caption?: string;
  duration?: number;
}

interface SlideshowSettings {
  autoPlay: boolean;
  duration: number;
  transition: 'fade' | 'slide' | 'zoom';
  showCaptions: boolean;
  loop: boolean;
}

interface SlideshowCreatorProps {
  photos: SlideshowPhoto[];
  onPhotosChange: (photos: SlideshowPhoto[]) => void;
  onSettingsChange: (settings: SlideshowSettings) => void;
  initialSettings?: SlideshowSettings;
}

export default function SlideshowCreator({ 
  photos, 
  onPhotosChange, 
  onSettingsChange,
  initialSettings
}: SlideshowCreatorProps) {
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState<SlideshowSettings>(
    initialSettings || {
      autoPlay: false,
      duration: 3000,
      transition: 'fade',
      showCaptions: true,
      loop: true
    }
  );

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || photos.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => {
        const next = prev + 1;
        if (next >= photos.length) {
          return settings.loop ? 0 : prev;
        }
        return next;
      });
    }, settings.duration);

    return () => clearInterval(interval);
  }, [isPlaying, photos.length, settings.duration, settings.loop]);

  const handleSettingsUpdate = useCallback((newSettings: Partial<SlideshowSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    onSettingsChange(updated);
  }, [settings, onSettingsChange]);

  const addPhoto = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;

      const newPhotos: SlideshowPhoto[] = [];
      
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newPhoto: SlideshowPhoto = {
            id: `photo_${Date.now()}_${index}`,
            url: event.target?.result as string,
            caption: file.name.replace(/\.[^/.]+$/, ""),
            duration: settings.duration
          };
          
          newPhotos.push(newPhoto);
          
          if (newPhotos.length === files.length) {
            onPhotosChange([...photos, ...newPhotos]);
            toast({
              title: "Photos Added",
              description: `${newPhotos.length} photo(s) added to slideshow`
            });
          }
        };
        reader.readAsDataURL(file);
      });
    };
    
    input.click();
  }, [photos, onPhotosChange, settings.duration, toast]);

  const removePhoto = useCallback((photoId: string) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    onPhotosChange(updatedPhotos);
    
    if (currentSlide >= updatedPhotos.length && updatedPhotos.length > 0) {
      setCurrentSlide(updatedPhotos.length - 1);
    }
  }, [photos, onPhotosChange, currentSlide]);

  const updatePhotoCaption = useCallback((photoId: string, caption: string) => {
    const updatedPhotos = photos.map(photo => 
      photo.id === photoId ? { ...photo, caption } : photo
    );
    onPhotosChange(updatedPhotos);
  }, [photos, onPhotosChange]);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => {
      const next = prev + 1;
      return next >= photos.length ? (settings.loop ? 0 : prev) : next;
    });
  }, [photos.length, settings.loop]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => {
      const next = prev - 1;
      return next < 0 ? (settings.loop ? photos.length - 1 : 0) : next;
    });
  }, [photos.length, settings.loop]);

  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Create Your Memorial Slideshow</h3>
          <p className="text-gray-600 mb-4">Add photos to create a beautiful slideshow for the memorial</p>
          <Button onClick={addPhoto} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Photos
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentPhoto = photos[currentSlide];

  return (
    <div className="space-y-6">
      {/* Slideshow Preview */}
      <Card>
        <CardContent className="p-0">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {currentPhoto && (
              <>
                <img
                  src={currentPhoto.url}
                  alt={currentPhoto.caption || `Slide ${currentSlide + 1}`}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${
                    settings.transition === 'fade' ? 'opacity-100' : ''
                  }`}
                />
                {settings.showCaptions && currentPhoto.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                    <p className="text-center">{currentPhoto.caption}</p>
                  </div>
                )}
              </>
            )}
            
            {/* Slideshow Controls Overlay */}
            <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="sm"
                onClick={prevSlide}
                disabled={!settings.loop && currentSlide === 0}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={togglePlayback}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={nextSlide}
                disabled={!settings.loop && currentSlide === photos.length - 1}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Slide Indicator */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {currentSlide + 1} of {photos.length}
              </span>
              <div className="flex gap-1">
                {photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentSlide ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slideshow Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Slideshow Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Slide Duration (seconds)</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={settings.duration / 1000}
                onChange={(e) => handleSettingsUpdate({ 
                  duration: parseInt(e.target.value) * 1000 
                })}
              />
            </div>
            
            <div>
              <Label>Transition Effect</Label>
              <Select
                value={settings.transition}
                onValueChange={(value: 'fade' | 'slide' | 'zoom') => 
                  handleSettingsUpdate({ transition: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fade">Fade</SelectItem>
                  <SelectItem value="slide">Slide</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoplay"
                checked={settings.autoPlay}
                onCheckedChange={(checked) => 
                  handleSettingsUpdate({ autoPlay: !!checked })
                }
              />
              <Label htmlFor="autoplay">Auto-play on load</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="loop"
                checked={settings.loop}
                onCheckedChange={(checked) => 
                  handleSettingsUpdate({ loop: !!checked })
                }
              />
              <Label htmlFor="loop">Loop slideshow</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="captions"
                checked={settings.showCaptions}
                onCheckedChange={(checked) => 
                  handleSettingsUpdate({ showCaptions: !!checked })
                }
              />
              <Label htmlFor="captions">Show captions</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Photos ({photos.length})
            </span>
            <Button onClick={addPhoto} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add More
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div key={photo.id} className="relative group">
                <div 
                  className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
                    index === currentSlide ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  onClick={() => setCurrentSlide(index)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `Photo ${index + 1}`}
                    className="w-full h-24 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
                </div>
                
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto(photo.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
                
                <Input
                  value={photo.caption || ''}
                  onChange={(e) => updatePhotoCaption(photo.id, e.target.value)}
                  placeholder="Add caption..."
                  className="mt-2 text-xs"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}