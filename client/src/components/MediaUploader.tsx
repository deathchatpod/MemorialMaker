import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Image, Music, Video, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MediaFile {
  id: string;
  file?: File;
  url: string;
  filename: string;
  title?: string;
  type: 'image' | 'audio' | 'youtube';
  isPrimary?: boolean;
}

interface MediaUploaderProps {
  onMediaChange: (media: {
    images: MediaFile[];
    audioFiles: MediaFile[];
    youtubeLinks: MediaFile[];
    primaryMedia: MediaFile | null;
  }) => void;
  initialImages?: MediaFile[];
  initialAudioFiles?: MediaFile[];
  initialYoutubeLinks?: MediaFile[];
}

export default function MediaUploader({ 
  onMediaChange, 
  initialImages = [], 
  initialAudioFiles = [], 
  initialYoutubeLinks = [] 
}: MediaUploaderProps) {
  const [images, setImages] = useState<MediaFile[]>(initialImages);
  const [audioFiles, setAudioFiles] = useState<MediaFile[]>(initialAudioFiles);
  const [youtubeLinks, setYoutubeLinks] = useState<MediaFile[]>(initialYoutubeLinks);
  const [primaryMedia, setPrimaryMedia] = useState<MediaFile | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const { toast } = useToast();

  const updateParent = useCallback((newImages: MediaFile[], newAudio: MediaFile[], newYoutube: MediaFile[], newPrimary: MediaFile | null) => {
    onMediaChange({
      images: newImages,
      audioFiles: newAudio,
      youtubeLinks: newYoutube,
      primaryMedia: newPrimary
    });
  }, [onMediaChange]);

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 25 - images.length);
    const validFiles = newFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Error', description: 'Please upload only image files', variant: 'destructive' });
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'Error', description: 'Image files must be under 10MB', variant: 'destructive' });
        return false;
      }
      return true;
    });

    const newImages = validFiles.map(file => ({
      id: Date.now() + Math.random().toString(),
      file,
      url: URL.createObjectURL(file),
      filename: file.name,
      type: 'image' as const
    }));

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    updateParent(updatedImages, audioFiles, youtubeLinks, primaryMedia);
  };

  const handleAudioUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 10 - audioFiles.length);
    const validFiles = newFiles.filter(file => {
      if (!file.type.startsWith('audio/')) {
        toast({ title: 'Error', description: 'Please upload only audio files', variant: 'destructive' });
        return false;
      }
      if (file.size > 16 * 1024 * 1024) {
        toast({ title: 'Error', description: 'Audio files must be under 16MB', variant: 'destructive' });
        return false;
      }
      return true;
    });

    const newAudioFiles = validFiles.map(file => ({
      id: Date.now() + Math.random().toString(),
      file,
      url: URL.createObjectURL(file),
      filename: file.name,
      title: file.name.replace(/\.[^/.]+$/, ''), // Suggest filename without extension
      type: 'audio' as const
    }));

    const updatedAudio = [...audioFiles, ...newAudioFiles];
    setAudioFiles(updatedAudio);
    updateParent(images, updatedAudio, youtubeLinks, primaryMedia);
  };

  const addYoutubeLink = () => {
    if (!youtubeUrl.trim()) return;
    if (youtubeLinks.length >= 5) {
      toast({ title: 'Error', description: 'Maximum 5 YouTube links allowed', variant: 'destructive' });
      return;
    }

    // Basic YouTube URL validation
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    if (!youtubeRegex.test(youtubeUrl)) {
      toast({ title: 'Error', description: 'Please enter a valid YouTube URL', variant: 'destructive' });
      return;
    }

    const newYoutubeLink: MediaFile = {
      id: Date.now().toString(),
      url: youtubeUrl,
      filename: youtubeUrl,
      title: `YouTube Video ${youtubeLinks.length + 1}`,
      type: 'youtube'
    };

    const updatedYoutube = [...youtubeLinks, newYoutubeLink];
    setYoutubeLinks(updatedYoutube);
    setYoutubeUrl('');
    updateParent(images, audioFiles, updatedYoutube, primaryMedia);
  };

  const removeMedia = (type: 'image' | 'audio' | 'youtube', id: string) => {
    let updatedImages = images;
    let updatedAudio = audioFiles;
    let updatedYoutube = youtubeLinks;
    let updatedPrimary = primaryMedia;

    if (type === 'image') {
      updatedImages = images.filter(img => img.id !== id);
      setImages(updatedImages);
    } else if (type === 'audio') {
      updatedAudio = audioFiles.filter(audio => audio.id !== id);
      setAudioFiles(updatedAudio);
    } else if (type === 'youtube') {
      updatedYoutube = youtubeLinks.filter(link => link.id !== id);
      setYoutubeLinks(updatedYoutube);
    }

    // Remove from primary if it was the primary media
    if (primaryMedia?.id === id) {
      updatedPrimary = null;
      setPrimaryMedia(null);
    }

    updateParent(updatedImages, updatedAudio, updatedYoutube, updatedPrimary);
  };

  const setPrimary = (media: MediaFile) => {
    setPrimaryMedia(media);
    updateParent(images, audioFiles, youtubeLinks, media);
  };

  const updateAudioTitle = (id: string, title: string) => {
    const updatedAudio = audioFiles.map(audio =>
      audio.id === id ? { ...audio, title } : audio
    );
    setAudioFiles(updatedAudio);
    updateParent(images, updatedAudio, youtubeLinks, primaryMedia);
  };

  const updateYoutubeTitle = (id: string, title: string) => {
    const updatedYoutube = youtubeLinks.map(link =>
      link.id === id ? { ...link, title } : link
    );
    setYoutubeLinks(updatedYoutube);
    updateParent(images, audioFiles, updatedYoutube, primaryMedia);
  };

  const allMedia = [...images, ...audioFiles, ...youtubeLinks];

  return (
    <div className="space-y-6">
      {/* Primary Media Selection */}
      {allMedia.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Star className="w-5 h-5" />
              Primary Media Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Select one item to be displayed as the hero content at the top of the memorial space.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allMedia.map(media => (
                <div
                  key={media.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    primaryMedia?.id === media.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPrimary(media)}
                >
                  <div className="flex items-center gap-2">
                    {media.type === 'image' && <Image className="w-4 h-4" />}
                    {media.type === 'audio' && <Music className="w-4 h-4" />}
                    {media.type === 'youtube' && <Video className="w-4 h-4" />}
                    <span className="text-sm font-medium truncate">
                      {media.title || media.filename}
                    </span>
                    {primaryMedia?.id === media.id && (
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Images (up to 25)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-upload">Upload Images</Label>
              <Input
                id="image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                disabled={images.length >= 25}
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPG, PNG, GIF. Max 10MB per file. {images.length}/25 uploaded.
              </p>
            </div>
            
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map(image => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMedia('image', image.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <p className="text-xs text-gray-600 mt-1 truncate">{image.filename}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audio Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Audio Files (up to 10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="audio-upload">Upload Audio Files</Label>
              <Input
                id="audio-upload"
                type="file"
                multiple
                accept="audio/*"
                onChange={(e) => handleAudioUpload(e.target.files)}
                disabled={audioFiles.length >= 10}
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: MP3, WAV, M4A. Max 16MB per file. {audioFiles.length}/10 uploaded.
              </p>
            </div>
            
            {audioFiles.length > 0 && (
              <div className="space-y-3">
                {audioFiles.map(audio => (
                  <div key={audio.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Music className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <Input
                        value={audio.title || ''}
                        onChange={(e) => updateAudioTitle(audio.id, e.target.value)}
                        placeholder="Enter display title for this audio"
                        className="mb-2"
                      />
                      <p className="text-xs text-gray-500">{audio.filename}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeMedia('audio', audio.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* YouTube Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            YouTube Videos (up to 5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Paste YouTube URL here"
                disabled={youtubeLinks.length >= 5}
              />
              <Button
                onClick={addYoutubeLink}
                disabled={youtubeLinks.length >= 5 || !youtubeUrl.trim()}
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              {youtubeLinks.length}/5 YouTube links added.
            </p>
            
            {youtubeLinks.length > 0 && (
              <div className="space-y-3">
                {youtubeLinks.map(link => (
                  <div key={link.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Video className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <Input
                        value={link.title || ''}
                        onChange={(e) => updateYoutubeTitle(link.id, e.target.value)}
                        placeholder="Enter display title for this video"
                        className="mb-2"
                      />
                      <p className="text-xs text-gray-500 truncate">{link.url}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeMedia('youtube', link.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}