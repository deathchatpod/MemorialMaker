import React, { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useCollaborationSession, useIdentifyCollaborator } from "@/hooks/use-collaboration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import TextHighlighter from "@/components/text-highlighter";
import { Heart, Users } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface GeneratedObituary {
  id: number;
  aiProvider: string;
  version: number;
  content: string;
  tone: string;
  isRevision: boolean;
}

interface TextFeedback {
  selectedText: string;
  feedbackType: 'liked' | 'disliked';
  collaboratorName?: string;
  collaboratorEmail?: string;
}

export default function Collaborate() {
  const [, params] = useRoute("/collaborate/:uuid");
  const uuid = params?.uuid || "";
  const { toast } = useToast();
  
  const [collaboratorName, setCollaboratorName] = useState("");
  const [isIdentified, setIsIdentified] = useState(false);
  const [selectedTexts, setSelectedTexts] = useState<{ [key: number]: TextFeedback[] }>({});

  const { data: collaborationData, isLoading, error } = useCollaborationSession(uuid);
  const identifyMutation = useIdentifyCollaborator();

  // Fetch feedback for all generated obituaries
  const { data: allFeedback } = useQuery({
    queryKey: ["/api/collaborate", uuid, "feedback"],
    queryFn: async () => {
      if (!collaborationData?.generatedObituaries) return {};
      
      const feedbackPromises = collaborationData.generatedObituaries.map(async (obituary: any) => {
        const response = await fetch(`/api/generated-obituaries/${obituary.id}/feedback`);
        const feedback = await response.json();
        return { [obituary.id]: feedback };
      });
      
      const results = await Promise.all(feedbackPromises);
      return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    },
    enabled: !!collaborationData?.generatedObituaries && collaborationData.generatedObituaries.length > 0,
  });

  // Text feedback mutation for collaborators
  const saveFeedbackMutation = useMutation({
    mutationFn: async ({ generatedObituaryId, selectedText, feedbackType }: {
      generatedObituaryId: number;
      selectedText: string;
      feedbackType: 'liked' | 'disliked';
    }) => {
      const response = await fetch(`/api/generated-obituaries/${generatedObituaryId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedText,
          feedbackType,
          collaboratorName,
          collaboratorEmail: collaborationData?.session?.collaboratorEmail
        })
      });
      if (!response.ok) throw new Error('Failed to save feedback');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate feedback cache
      queryClient.invalidateQueries({ queryKey: ["/api/collaborate", uuid, "feedback"] });
      toast({
        title: "Feedback saved",
        description: "Your feedback has been recorded"
      });
    },
  });

  const handleTextSelection = (obituaryId: number, selectedText: string, feedbackType: 'liked' | 'disliked') => {
    saveFeedbackMutation.mutate({
      generatedObituaryId: obituaryId,
      selectedText,
      feedbackType
    });
  };

  useEffect(() => {
    if (collaborationData?.session?.collaboratorName) {
      setCollaboratorName(collaborationData.session.collaboratorName);
      setIsIdentified(true);
    }
  }, [collaborationData]);

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!collaboratorName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to continue",
        variant: "destructive"
      });
      return;
    }

    try {
      await identifyMutation.mutateAsync({ uuid, name: collaboratorName.trim() });
      setIsIdentified(true);
      toast({
        title: "Welcome!",
        description: "You can now provide feedback on the obituary"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to identify. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading collaboration session...</p>
        </div>
      </div>
    );
  }

  if (error || !collaborationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <Heart className="mr-2 h-5 w-5" />
              Access Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This collaboration link is invalid or has expired. Please contact the obituary owner for a new invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isIdentified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Welcome Collaborator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You've been invited to provide feedback on an obituary for <strong>{collaborationData.obituary?.fullName}</strong>. 
              Please enter your name to continue.
            </p>
            <form onSubmit={handleIdentify} className="space-y-4">
              <div>
                <Label htmlFor="collaboratorName">Your Name</Label>
                <Input
                  id="collaboratorName"
                  value={collaboratorName}
                  onChange={(e) => setCollaboratorName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={identifyMutation.isPending}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={identifyMutation.isPending}
              >
                {identifyMutation.isPending ? "Identifying..." : "Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const generatedObituaries = collaborationData.generatedObituaries || [];
  const claudeObituaries = generatedObituaries.filter((o: GeneratedObituary) => o.aiProvider === 'claude');
  const chatgptObituaries = generatedObituaries.filter((o: GeneratedObituary) => o.aiProvider === 'chatgpt');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Heart className="mr-3 h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Obituary Collaboration</h1>
              <p className="text-muted-foreground">
                Welcome {collaboratorName}! Please provide feedback on the obituary for <strong>{collaborationData.obituary?.fullName}</strong>
              </p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">How to provide feedback:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Select text you like by highlighting and clicking the thumbs up</li>
              <li>• Select text you want changed by highlighting and clicking the thumbs down</li>
              <li>• Your feedback will be attributed to your name</li>
              <li>• The family will use your feedback to improve the obituary</li>
            </ul>
          </div>
        </div>

        {/* Obituary Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Obituary for {collaborationData.obituary?.fullName}</CardTitle>
            <p className="text-muted-foreground">
              Review the AI-generated obituaries and select text you like or want changed
            </p>
          </CardHeader>
          <CardContent>
            <VersionManager
              obituaries={collaborationData.generatedObituaries || []}
              feedback={allFeedback || {}}
              onSelectText={handleTextSelection}
              isCollaborator={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}