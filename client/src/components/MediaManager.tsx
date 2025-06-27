import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import MediaUploader from './MediaUploader';
import { 
  Music, 
  Share2, 
  Undo, 
  Redo, 
  Play, 
  Pause, 
  Volume2,
  ExternalLink,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';

interface MediaFile {
  id: string;
  url: string;
  filename: string;
  title?: string;
  type: 'image' | 'audio' | 'youtube';
}

interface MediaManagerProps {
  memorial: any;
  onMediaUpdate: (updates: any) => void;
}

export default function MediaManager({ memorial, onMediaUpdate }: MediaManagerProps) {
  const { toast } = useToast();
  
  // Initial state for undo/redo
  const initialState = {
    images: memorial.images || [],
    audioFiles: memorial.audioFiles || [],
    youtubeLinks: memorial.youtubeLinks || [],
    socialMediaLinks: memorial.socialMediaLinks || [],
    musicPlaylist: memorial.musicPlaylist || '',
    primaryMediaType: memorial.primaryMediaType || null,
    primaryMediaId: memorial.primaryMediaId || null
  };

  // Undo/Redo state management
  const [mediaState, undoRedoActions] = useUndoRedo(initialState);
  
  const [editingSocialLink, setEditingSocialLink] = useState<string>('');
  const [newSocialLink, setNewSocialLink] = useState<string>('');

  // Update parent component when media state changes
  useEffect(() => {
    onMediaUpdate(mediaState);
  }, [mediaState, onMediaUpdate]);

  // Helper function to update media state with undo/redo tracking
  const updateMediaState = useCallback((updates: any) => {
    undoRedoActions.set({
      ...mediaState,
      ...updates
    });
  }, [mediaState, undoRedoActions]);

  // Handle media changes from MediaUploader
  const handleMediaChange = useCallback((media: {
    images: MediaFile[];
    audioFiles: MediaFile[];
    youtubeLinks: MediaFile[];
    primaryMedia: MediaFile | null;
  }) => {
    updateMediaState({
      images: media.images,
      audioFiles: media.audioFiles,
      youtubeLinks: media.youtubeLinks,
      primaryMediaType: media.primaryMedia?.type || null,
      primaryMediaId: media.primaryMedia?.id || null
    });
  }, [updateMediaState]);

  // Social media link management
  const addSocialMediaLink = useCallback(() => {
    if (!newSocialLink.trim()) return;
    
    try {
      new URL(newSocialLink);
    } catch {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL',
        variant: 'destructive'
      });
      return;
    }

    const updatedLinks = [...mediaState.socialMediaLinks, newSocialLink.trim()];
    updateMediaState({ socialMediaLinks: updatedLinks });
    setNewSocialLink('');
    
    toast({
      title: 'Social Media Link Added',
      description: 'Link has been added to the memorial'
    });
  }, [newSocialLink, mediaState.socialMediaLinks, updateMediaState, toast]);

  const removeSocialMediaLink = useCallback((index: number) => {
    const updatedLinks = mediaState.socialMediaLinks.filter((_: any, i: number) => i !== index);
    updateMediaState({ socialMediaLinks: updatedLinks });
  }, [mediaState.socialMediaLinks, updateMediaState]);

  const updateMusicPlaylist = useCallback((playlist: string) => {
    updateMediaState({ musicPlaylist: playlist });
  }, [updateMediaState]);

  // Get social media platform name from URL
  const getSocialPlatform = (url: string) => {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      if (domain.includes('facebook')) return 'Facebook';
      if (domain.includes('instagram')) return 'Instagram';
      if (domain.includes('twitter') || domain.includes('x.com')) return 'Twitter/X';
      if (domain.includes('linkedin')) return 'LinkedIn';
      if (domain.includes('youtube')) return 'YouTube';
      if (domain.includes('tiktok')) return 'TikTok';
      return 'Website';
    } catch {
      return 'Link';
    }
  };

  // Embedded YouTube player component
  const YouTubeEmbed = ({ url, title }: { url: string, title?: string }) => {
    const getYouTubeId = (url: string) => {
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = url.match(regex);
      return match ? match[1] : null;
    };

    const videoId = getYouTubeId(url);
    if (!videoId) return null;

    return (
      <div className="aspect-video rounded-lg overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title || 'YouTube video'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Undo/Redo Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Media & Content Management</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undoRedoActions.undo}
                disabled={!undoRedoActions.canUndo}
                className="gap-2"
              >
                <Undo className="w-4 h-4" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={undoRedoActions.redo}
                disabled={!undoRedoActions.canRedo}
                className="gap-2"
              >
                <Redo className="w-4 h-4" />
                Redo
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="media" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="media">Photos & Videos</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="music">Music Playlist</TabsTrigger>
            </TabsList>

            <TabsContent value="media" className="space-y-4">
              <MediaUploader 
                onMediaChange={handleMediaChange}
                initialImages={mediaState.images}
                initialAudioFiles={mediaState.audioFiles}
                initialYoutubeLinks={mediaState.youtubeLinks}
              />
              
              {/* YouTube Video Previews */}
              {mediaState.youtubeLinks.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">YouTube Videos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mediaState.youtubeLinks.map((video: any) => (
                      <div key={video.id} className="space-y-2">
                        <YouTubeEmbed url={video.url} title={video.title} />
                        <p className="text-sm font-medium">{video.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="audio" className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Audio Files</h4>
                {mediaState.audioFiles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No audio files uploaded yet</p>
                ) : (
                  <div className="space-y-3">
                    {mediaState.audioFiles.map((audio: any) => (
                      <div key={audio.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Volume2 className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{audio.title || audio.filename}</p>
                            <p className="text-sm text-gray-500">{audio.filename}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <audio controls className="h-8">
                            <source src={audio.url} />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              <div>
                <Label htmlFor="new-social-link">Add Social Media Link</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="new-social-link"
                    value={newSocialLink}
                    onChange={(e) => setNewSocialLink(e.target.value)}
                    placeholder="https://facebook.com/memorial-page"
                    className="flex-1"
                  />
                  <Button onClick={addSocialMediaLink} disabled={!newSocialLink.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {mediaState.socialMediaLinks.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Social Media Links</Label>
                  {mediaState.socialMediaLinks.map((link: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Share2 className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{getSocialPlatform(link)}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{link}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(link, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeSocialMediaLink(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="music" className="space-y-4">
              <div>
                <Label htmlFor="music-playlist">Music Playlist URL</Label>
                <div className="space-y-2 mt-1">
                  <Input
                    id="music-playlist"
                    value={mediaState.musicPlaylist}
                    onChange={(e) => updateMusicPlaylist(e.target.value)}
                    placeholder="https://open.spotify.com/playlist/... or YouTube Music, Apple Music, etc."
                  />
                  <p className="text-sm text-gray-500">
                    Add a link to a music playlist from Spotify, YouTube Music, Apple Music, or other streaming services
                  </p>
                </div>

                {mediaState.musicPlaylist && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Music className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="font-medium">Music Playlist</p>
                        <p className="text-sm text-gray-600 truncate">{mediaState.musicPlaylist}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(mediaState.musicPlaylist, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}