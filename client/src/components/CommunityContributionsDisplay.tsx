import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Image, Music, Youtube, MessageSquare, User, Calendar, MessageCircle, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CommunityContribution {
  id: number;
  contributionType: 'image' | 'audio' | 'youtube' | 'text';
  contributorName: string;
  contributorEmail: string;
  mediaPath?: string;
  youtubeUrl?: string;
  textContent?: string;
  originalFileName?: string;
  createdAt: string;
  comments: CommunityContributionComment[];
}

interface CommunityContributionComment {
  id: number;
  contributionId: number;
  commenterName: string;
  commenterEmail: string;
  commentText: string;
  createdAt: string;
}

interface CommunityContributionsDisplayProps {
  finalSpaceId: number;
  currentUser?: {
    id: number;
    name: string;
    email: string;
    userType: string;
  };
}

export function CommunityContributionsDisplay({ finalSpaceId, currentUser }: CommunityContributionsDisplayProps) {
  const [showCommentForm, setShowCommentForm] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commenterName, setCommenterName] = useState(currentUser?.name || "");
  const [commenterEmail, setCommenterEmail] = useState(currentUser?.email || "");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contributions = [], isLoading } = useQuery({
    queryKey: [`/api/final-spaces/${finalSpaceId}/community-contributions`],
    queryFn: async () => {
      const response = await fetch(`/api/final-spaces/${finalSpaceId}/community-contributions`);
      if (!response.ok) {
        throw new Error('Failed to fetch contributions');
      }
      return response.json();
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ contributionId, commentData }: { contributionId: number; commentData: any }) => {
      const response = await fetch(`/api/community-contributions/${contributionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData),
      });
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Comment Added",
        description: "Your comment has been added to this contribution.",
      });
      setCommentText("");
      setShowCommentForm(null);
      if (!currentUser) {
        setCommenterName("");
        setCommenterEmail("");
      }
      queryClient.invalidateQueries({ queryKey: [`/api/final-spaces/${finalSpaceId}/community-contributions`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = async (contributionId: number) => {
    if (!commentText.trim() || !commenterName.trim() || !commenterEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide your name, email, and comment.",
        variant: "destructive",
      });
      return;
    }

    const commentData = {
      commenterName,
      commenterEmail,
      commentText: commentText.trim(),
    };

    await addCommentMutation.mutateAsync({ contributionId, commentData });
  };

  const renderContribution = (contribution: CommunityContribution) => {
    return (
      <Card key={contribution.id} className="bg-gray-800 border-gray-700 mb-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {contribution.contributionType === 'image' && <Image className="h-5 w-5 text-blue-400" />}
              {contribution.contributionType === 'audio' && <Music className="h-5 w-5 text-green-400" />}
              {contribution.contributionType === 'youtube' && <Youtube className="h-5 w-5 text-red-400" />}
              {contribution.contributionType === 'text' && <MessageSquare className="h-5 w-5 text-purple-400" />}
              <div>
                <CardTitle className="text-white text-lg">{contribution.contributorName}</CardTitle>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Calendar className="h-4 w-4" />
                  {formatDistanceToNow(new Date(contribution.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Contribution Content */}
          {contribution.contributionType === 'image' && contribution.mediaPath && (
            <div className="mb-4">
              <img
                src={`/${contribution.mediaPath}`}
                alt={contribution.originalFileName || "Community contribution"}
                className="max-w-full h-auto rounded-lg"
                style={{ maxHeight: "400px" }}
              />
            </div>
          )}

          {contribution.contributionType === 'audio' && contribution.mediaPath && (
            <div className="mb-4">
              <audio
                controls
                className="w-full"
                src={`/${contribution.mediaPath}`}
              >
                Your browser does not support the audio element.
              </audio>
              {contribution.originalFileName && (
                <p className="text-gray-400 text-sm mt-2">{contribution.originalFileName}</p>
              )}
            </div>
          )}

          {contribution.contributionType === 'youtube' && contribution.youtubeUrl && (
            <div className="mb-4">
              <div className="aspect-video">
                <iframe
                  src={getYouTubeEmbedUrl(contribution.youtubeUrl)}
                  title="YouTube video"
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {contribution.contributionType === 'text' && contribution.textContent && (
            <div className="mb-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-100 whitespace-pre-wrap">{contribution.textContent}</p>
              </div>
            </div>
          )}

          {/* Comments Section */}
          {contribution.comments && contribution.comments.length > 0 && (
            <div className="mb-4">
              <h4 className="text-gray-200 font-medium mb-2 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Comments ({contribution.comments.length})
              </h4>
              <div className="space-y-2">
                {contribution.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-200 font-medium text-sm">{comment.commenterName}</span>
                      <span className="text-gray-400 text-xs">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{comment.commentText}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Comment Form */}
          {showCommentForm === contribution.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="commenterName" className="text-gray-200 text-sm">Your Name</Label>
                  <Input
                    id="commenterName"
                    value={commenterName}
                    onChange={(e) => setCommenterName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="commenterEmail" className="text-gray-200 text-sm">Your Email</Label>
                  <Input
                    id="commenterEmail"
                    type="email"
                    value={commenterEmail}
                    onChange={(e) => setCommenterEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="commentText" className="text-gray-200 text-sm">Your Comment</Label>
                <Textarea
                  id="commentText"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts about this contribution..."
                  className="bg-gray-700 border-gray-600 text-white"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{commentText.length}/500 characters</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSubmitComment(contribution.id)}
                  disabled={addCommentMutation.isPending}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                </Button>
                <Button
                  onClick={() => setShowCommentForm(null)}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowCommentForm(contribution.id)}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      let videoId = "";

      if (urlObj.hostname === "youtu.be") {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.hostname === "www.youtube.com" || urlObj.hostname === "youtube.com") {
        videoId = urlObj.searchParams.get("v") || "";
      }

      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    } catch {
      return url;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400">Loading community contributions...</div>
      </div>
    );
  }

  if (contributions.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 text-gray-500 mx-auto mb-3" />
        <h3 className="text-gray-300 text-lg font-medium mb-2">No Community Contributions Yet</h3>
        <p className="text-gray-500 text-sm">
          Be the first to share a memory, photo, or tribute for this memorial.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white text-xl font-semibold">
          Community Contributions ({contributions.length})
        </h3>
      </div>
      <div>
        {contributions.map(renderContribution)}
      </div>
    </div>
  );
}