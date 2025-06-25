import React, { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  Calendar, 
  MessageCircle, 
  Share2, 
  Music, 
  Image as ImageIcon,
  Play,
  Send,
  Eye
} from "lucide-react";
import { format } from "date-fns";

interface FinalSpace {
  id: number;
  slug: string;
  personName: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  description?: string;
  images?: any[];
  audioFiles?: any[];
  youtubeLinks?: any[];
  primaryMediaType?: string;
  primaryMediaId?: string;
  isPublic: boolean;
  allowComments: boolean;
  theme?: string;
  backgroundImage?: string;
  pageLayout?: any;
  customStyles?: any;
  viewCount?: number;
  createdAt: string;
}

interface Comment {
  id: number;
  authorName: string;
  authorEmail?: string;
  content: string;
  createdAt: string;
  isApproved: boolean;
}

export default function MemorialPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newComment, setNewComment] = useState({
    authorName: "",
    authorEmail: "",
    content: ""
  });

  // Fetch memorial space data
  const { data: memorial, isLoading: memorialLoading } = useQuery<FinalSpace>({
    queryKey: ["/api/memorial", slug],
    queryFn: async () => {
      const response = await fetch(`/api/memorial/${slug}`);
      if (!response.ok) throw new Error('Memorial not found');
      return response.json();
    },
    enabled: !!slug,
  });

  // Fetch comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ["/api/memorial", slug, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/memorial/${slug}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
    enabled: !!slug && memorial?.allowComments,
  });

  // Submit comment mutation
  const submitComment = useMutation({
    mutationFn: async (commentData: typeof newComment) => {
      const response = await fetch(`/api/memorial/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData),
      });
      if (!response.ok) throw new Error('Failed to submit comment');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Comment submitted",
        description: "Your memory has been shared successfully"
      });
      setNewComment({ authorName: "", authorEmail: "", content: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/memorial", slug, "comments"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit comment",
        variant: "destructive"
      });
    },
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.authorName.trim() || !newComment.content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide your name and a message",
        variant: "destructive"
      });
      return;
    }
    submitComment.mutate(newComment);
  };

  const shareMemorial = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Memorial link copied to clipboard"
    });
  };

  if (memorialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading memorial...</p>
        </div>
      </div>
    );
  }

  if (!memorial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Memorial Not Found</h3>
            <p className="text-gray-600">
              The memorial page you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      backgroundColor: memorial.customStyles?.backgroundColor || '#f9fafb',
      backgroundImage: memorial.backgroundImage ? `url(${memorial.backgroundImage})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">{memorial.personName}</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={shareMemorial}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {memorial.viewCount || 0} views
              </Badge>
            </div>
          </div>
          
          {(memorial.dateOfBirth || memorial.dateOfDeath) && (
            <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
              <Calendar className="w-4 h-4" />
              <span>
                {memorial.dateOfBirth && format(new Date(memorial.dateOfBirth), 'MMMM d, yyyy')}
                {memorial.dateOfBirth && memorial.dateOfDeath && ' - '}
                {memorial.dateOfDeath && format(new Date(memorial.dateOfDeath), 'MMMM d, yyyy')}
              </span>
            </div>
          )}
        </div>

        {/* Primary Media */}
        {memorial.primaryMediaType && memorial.primaryMediaId && (
          <Card className="mb-8">
            <CardContent className="p-0">
              {memorial.primaryMediaType === 'image' && (
                <img 
                  src={`/uploads/memorial-media/images/${memorial.primaryMediaId}`}
                  alt={memorial.personName}
                  className="w-full h-96 object-cover rounded-lg"
                />
              )}
              {memorial.primaryMediaType === 'youtube' && (
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${memorial.primaryMediaId}`}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {memorial.description && (
          <Card className="mb-8">
            <CardContent className="py-6">
              <p className="text-lg leading-relaxed text-gray-700">
                {memorial.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Media Gallery */}
        {(memorial.images?.length > 0 || memorial.audioFiles?.length > 0 || memorial.youtubeLinks?.length > 0) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Memories & Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Images */}
              {memorial.images?.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {memorial.images.map((image: any, index: number) => (
                    <div key={index} className="aspect-square">
                      <img
                        src={`/uploads/memorial-media/images/${image.filename}`}
                        alt={`Memory ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Audio Files */}
              {memorial.audioFiles?.length > 0 && (
                <div className="space-y-3 mb-6">
                  {memorial.audioFiles.map((audio: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Play className="w-5 h-5 text-gray-600" />
                      <span className="flex-1">{audio.title || `Audio ${index + 1}`}</span>
                      <audio controls className="max-w-xs">
                        <source src={`/uploads/memorial-media/audio/${audio.filename}`} />
                      </audio>
                    </div>
                  ))}
                </div>
              )}

              {/* YouTube Videos */}
              {memorial.youtubeLinks?.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {memorial.youtubeLinks.map((video: any, index: number) => (
                    <div key={index} className="aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${video.videoId}`}
                        title={video.title || `Video ${index + 1}`}
                        className="w-full h-full rounded-lg"
                        allowFullScreen
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Comments/Guestbook */}
        {memorial.allowComments && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Guestbook ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Comment Form */}
              <form onSubmit={handleCommentSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-4">Share a memory or message</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input
                    placeholder="Your name *"
                    value={newComment.authorName}
                    onChange={(e) => setNewComment(prev => ({ ...prev, authorName: e.target.value }))}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Your email (optional)"
                    value={newComment.authorEmail}
                    onChange={(e) => setNewComment(prev => ({ ...prev, authorEmail: e.target.value }))}
                  />
                </div>
                <Textarea
                  placeholder="Share your thoughts, memories, or condolences..."
                  value={newComment.content}
                  onChange={(e) => setNewComment(prev => ({ ...prev, content: e.target.value }))}
                  className="mb-4"
                  rows={4}
                  required
                />
                <Button type="submit" disabled={submitComment.isPending}>
                  <Send className="w-4 h-4 mr-2" />
                  {submitComment.isPending ? "Submitting..." : "Share Memory"}
                </Button>
              </form>

              {/* Comments List */}
              {commentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading messages...</p>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {comment.authorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{comment.authorName}</span>
                          <span className="text-sm text-gray-500">
                            {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Be the first to share a memory.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}