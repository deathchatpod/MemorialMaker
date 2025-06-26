import React, { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import MediaGallery from "@/components/MediaGallery";
import ObituaryIntegration from "@/components/ObituaryIntegration";
import { 
  Heart, 
  Calendar, 
  MessageCircle, 
  Share2, 
  Music, 
  Image as ImageIcon,
  Play,
  Send,
  Eye,
  Edit,
  ArrowLeft,
  FileText
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
  
  // Get current user from URL params for edit permissions
  const urlParams = new URLSearchParams(window.location.search);
  const currentUserType = urlParams.get('userType') || 'admin';
  const currentUserId = parseInt(urlParams.get('userId') || '1');
  
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

  // Fetch linked obituary if available
  const { data: linkedObituary } = useQuery({
    queryKey: ["/api/obituaries", memorial?.obituaryId],
    queryFn: async () => {
      if (!memorial?.obituaryId) return null;
      const response = await fetch(`/api/obituaries/${memorial.obituaryId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!memorial?.obituaryId,
  });

  // Responsive design state
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading memorial...</p>
        </div>
      </div>
    );
  }

  if (!memorial) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto bg-card border-border">
          <CardContent className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Memorial Not Found</h3>
            <p className="text-muted-foreground">
              The memorial page you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isMobile ? 'px-2 py-4' : 'px-4 py-8'}`} style={{
      backgroundColor: memorial.customStyles?.backgroundColor || '#f9fafb',
      backgroundImage: memorial.backgroundImage ? `url(${memorial.backgroundImage})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <div className={`container mx-auto ${isMobile ? 'max-w-full px-2' : 'max-w-4xl px-6'}`}>
        {/* Header */}
        <div className={`${isMobile ? 'text-center mb-6' : 'text-center mb-8'}`}>
          <div className={`${isMobile ? 'flex flex-col gap-4 mb-4' : 'flex justify-between items-start mb-4'}`}>
            {!isMobile && (
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            )}
            
            <div className={`${isMobile ? 'order-1' : 'text-center flex-1'}`}>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-gray-900 mb-2`}>
                {memorial.personName}
              </h1>
            </div>
            
            <div className={`${isMobile ? 'flex flex-wrap justify-center gap-2 order-2' : 'flex gap-2'}`}>
              {/* Show edit button if user has permission */}
              {(currentUserType === 'admin' || 
                (currentUserType === 'funeral_home' && memorial.funeralHomeId === currentUserId) ||
                (currentUserType === 'employee' && memorial.createdById === currentUserId && memorial.createdByType === 'employee')) && (
                <Link href={`/final-spaces/${memorial.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={shareMemorial}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {memorial.viewCount || 0} views
              </Badge>
            </div>
            
            {isMobile && (
              <Link href="/dashboard" className="order-3">
                <Button variant="outline" size="sm" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            )}
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
          <Card className="mb-8 bg-card border-border">
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

        {/* Obituary Integration */}
        {linkedObituary && (
          <div className="mb-8">
            <ObituaryIntegration 
              obituary={linkedObituary}
              showFullContent={false}
              className="border-l-4 border-l-blue-500"
            />
          </div>
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
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="w-6 h-6" />
              Memories & Media
            </h2>
            <MediaGallery 
              media={[
                ...(memorial.images?.map((img: any) => ({
                  id: img.id || img.filename,
                  type: 'image' as const,
                  url: img.url || `/uploads/memorial-media/images/${img.filename}`,
                  filename: img.filename,
                  title: img.title,
                  isPrimary: memorial.primaryMediaType === 'image' && memorial.primaryMediaId === img.id
                })) || []),
                ...(memorial.audioFiles?.map((audio: any) => ({
                  id: audio.id || audio.filename,
                  type: 'audio' as const,
                  url: audio.url || `/uploads/memorial-media/audio/${audio.filename}`,
                  filename: audio.filename,
                  title: audio.title,
                  isPrimary: memorial.primaryMediaType === 'audio' && memorial.primaryMediaId === audio.id
                })) || []),
                ...(memorial.youtubeLinks?.map((video: any) => ({
                  id: video.id || video.videoId,
                  type: 'youtube' as const,
                  url: video.videoId || video.url,
                  title: video.title,
                  isPrimary: memorial.primaryMediaType === 'youtube' && memorial.primaryMediaId === video.id
                })) || [])
              ]}
              showControls={true}
              primaryMediaFirst={true}
              className="w-full"
            />
          </div>
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
              <form onSubmit={handleCommentSubmit} className={`mb-8 p-4 bg-gray-50 rounded-lg`}>
                <h4 className="font-medium mb-4">Share a memory or message</h4>
                <div className={`${isMobile ? 'grid grid-cols-1 gap-4 mb-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'}`}>
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
                  rows={isMobile ? 3 : 4}
                  required
                />
                <Button type="submit" disabled={submitComment.isPending} className={isMobile ? 'w-full' : ''}>
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
                <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
                  {comments.map((comment) => (
                    <div key={comment.id} className={`${isMobile ? 'flex gap-3' : 'flex gap-4'}`}>
                      <Avatar className={isMobile ? 'w-8 h-8' : 'w-10 h-10'}>
                        <AvatarFallback>
                          {comment.authorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className={`${isMobile ? 'flex flex-col gap-1 mb-2' : 'flex items-center gap-2 mb-2'}`}>
                          <span className="font-medium truncate">{comment.authorName}</span>
                          <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                            {format(new Date(comment.createdAt), isMobile ? 'MMM d' : 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className={`text-gray-700 leading-relaxed ${isMobile ? 'text-sm' : ''}`}>
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} mx-auto mb-4 opacity-50`} />
                  <p className={isMobile ? 'text-sm' : ''}>No messages yet. Be the first to share a memory.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}