import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, Music, Youtube, MessageSquare, X } from "lucide-react";

interface CommunityContributionProps {
  finalSpaceId: number;
  currentUser?: {
    id: number;
    name: string;
    email: string;
    userType: string;
  };
}

export function CommunityContribution({ finalSpaceId, currentUser }: CommunityContributionProps) {
  const [contributionType, setContributionType] = useState<'image' | 'audio' | 'youtube' | 'text'>('image');
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [contributorName, setContributorName] = useState(currentUser?.name || '');
  const [contributorEmail, setContributorEmail] = useState(currentUser?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createContributionMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch(`/api/final-spaces/${finalSpaceId}/community-contributions`, {
        method: 'POST',
        body: data,
      });
      if (!response.ok) {
        throw new Error('Failed to create contribution');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contribution Added",
        description: "Your contribution has been shared with the memorial.",
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: [`/api/final-spaces/${finalSpaceId}/community-contributions`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add contribution",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFile(null);
    setYoutubeUrl('');
    setTextContent('');
    if (!currentUser) {
      setContributorName('');
      setContributorEmail('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contributorName || !contributorEmail) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and email address.",
        variant: "destructive",
      });
      return;
    }

    if (contributionType === 'image' && !file) {
      toast({
        title: "No Image Selected",
        description: "Please select an image to upload.",
        variant: "destructive",
      });
      return;
    }

    if (contributionType === 'audio' && !file) {
      toast({
        title: "No Audio Selected",
        description: "Please select an audio file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (contributionType === 'youtube' && !youtubeUrl) {
      toast({
        title: "No YouTube URL",
        description: "Please provide a YouTube video URL.",
        variant: "destructive",
      });
      return;
    }

    if (contributionType === 'text' && !textContent.trim()) {
      toast({
        title: "No Text Content",
        description: "Please enter your message.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('contributionType', contributionType);
    formData.append('contributorId', currentUser?.id?.toString() || '0');
    formData.append('contributorType', currentUser?.userType || 'individual');
    formData.append('contributorName', contributorName);
    formData.append('contributorEmail', contributorEmail);
    
    if (contributionType === 'image' && file) {
      formData.append('image', file);
    } else if (contributionType === 'audio' && file) {
      formData.append('audio', file);
    } else if (contributionType === 'youtube') {
      formData.append('youtubeUrl', youtubeUrl);
    } else if (contributionType === 'text') {
      formData.append('textContent', textContent);
    }

    formData.append('position', JSON.stringify({}));

    try {
      await createContributionMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size and type
      const maxSize = contributionType === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024; // 5MB for images, 50MB for audio
      const allowedTypes = contributionType === 'image' 
        ? ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
        : ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a'];

      if (selectedFile.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `File size must be less than ${contributionType === 'image' ? '5MB' : '50MB'}.`,
          variant: "destructive",
        });
        return;
      }

      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid File Type",
          description: `Please select a valid ${contributionType} file.`,
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Share a Memory
        </CardTitle>
        <p className="text-gray-300 text-sm">
          Add a photo, audio recording, video, or written memory to honor this person's legacy.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contributor Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contributorName" className="text-gray-200">Your Name</Label>
              <Input
                id="contributorName"
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                placeholder="Enter your name"
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="contributorEmail" className="text-gray-200">Your Email</Label>
              <Input
                id="contributorEmail"
                type="email"
                value={contributorEmail}
                onChange={(e) => setContributorEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
          </div>

          {/* Contribution Type Selection */}
          <div>
            <Label className="text-gray-200">Type of Contribution</Label>
            <Select value={contributionType} onValueChange={(value: any) => setContributionType(value)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="image" className="text-gray-100">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Photo
                  </div>
                </SelectItem>
                <SelectItem value="audio" className="text-gray-100">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Audio Recording
                  </div>
                </SelectItem>
                <SelectItem value="youtube" className="text-gray-100">
                  <div className="flex items-center gap-2">
                    <Youtube className="h-4 w-4" />
                    YouTube Video
                  </div>
                </SelectItem>
                <SelectItem value="text" className="text-gray-100">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Written Memory
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contribution Content */}
          {(contributionType === 'image' || contributionType === 'audio') && (
            <div>
              <Label className="text-gray-200">
                {contributionType === 'image' ? 'Select Photo' : 'Select Audio File'}
              </Label>
              <div className="mt-2">
                {!file ? (
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    <Input
                      type="file"
                      accept={contributionType === 'image' ? 'image/*' : 'audio/*'}
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-400">
                        Click to upload {contributionType === 'image' ? 'an image' : 'an audio file'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {contributionType === 'image' 
                          ? 'JPG, PNG, GIF up to 5MB' 
                          : 'MP3, WAV, M4A up to 50MB (3 minutes recommended)'}
                      </p>
                    </Label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                    <span className="text-white text-sm">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {contributionType === 'youtube' && (
            <div>
              <Label htmlFor="youtubeUrl" className="text-gray-200">YouTube Video URL</Label>
              <Input
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Share a video that reminds you of this person or captures a special memory.
              </p>
            </div>
          )}

          {contributionType === 'text' && (
            <div>
              <Label htmlFor="textContent" className="text-gray-200">Your Memory</Label>
              <Textarea
                id="textContent"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Share a special memory, story, or message about this person..."
                className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                maxLength={1000}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {textContent.length}/1000 characters
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? "Sharing..." : "Share Memory"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}