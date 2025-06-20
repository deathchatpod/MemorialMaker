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
      toast({
        title: "Feedback saved",
        description: "Your feedback has been recorded"
      });
    },
  });

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

  const handleTextSelection = (obituaryId: number, text: string, type: 'liked' | 'disliked') => {
    const currentFeedback = selectedTexts[obituaryId] || [];
    const existingIndex = currentFeedback.findIndex(f => f.selectedText === text);
    
    let newFeedback;
    if (existingIndex >= 0) {
      if (currentFeedback[existingIndex].feedbackType === type) {
        // Remove if same type selected again
        newFeedback = currentFeedback.filter(f => f.selectedText !== text);
      } else {
        // Update type if different type selected
        newFeedback = currentFeedback.map(f => 
          f.selectedText === text ? { ...f, feedbackType: type } : f
        );
      }
    } else {
      // Add new feedback
      newFeedback = [...currentFeedback, { 
        selectedText: text, 
        feedbackType: type,
        collaboratorName,
        collaboratorEmail: collaborationData?.session?.collaboratorEmail
      }];
    }
    
    setSelectedTexts(prev => ({ ...prev, [obituaryId]: newFeedback }));
    
    // Save to backend
    saveFeedbackMutation.mutate({
      generatedObituaryId: obituaryId,
      selectedText: text,
      feedbackType: type
    });
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
          <Tabs defaultValue="claude" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="claude">
                Claude AI ({claudeObituaries.length} versions)
              </TabsTrigger>
              <TabsTrigger value="chatgpt">
                ChatGPT ({chatgptObituaries.length} versions)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="claude" className="mt-0">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {claudeObituaries.map((obituary: GeneratedObituary) => (
                    <Card key={obituary.id} className="border border-gray-200">
                      <CardContent className="p-6">
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900">
                            {obituary.isRevision ? 'Revised Version' : `Version ${obituary.version}`} - {obituary.tone}
                          </h4>
                        </div>
                        
                        <TextHighlighter
                          content={obituary.content}
                          onTextSelect={(text, type) => handleTextSelection(obituary.id, text, type)}
                          selectedTexts={selectedTexts[obituary.id] || []}
                        />

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            <span className="text-green-600">
                              {(selectedTexts[obituary.id] || []).filter(f => f.feedbackType === 'liked').length} liked
                            </span>
                            {' • '}
                            <span className="text-red-600">
                              {(selectedTexts[obituary.id] || []).filter(f => f.feedbackType === 'disliked').length} want changed
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="chatgpt" className="mt-0">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {chatgptObituaries.map((obituary: GeneratedObituary) => (
                    <Card key={obituary.id} className="border border-gray-200">
                      <CardContent className="p-6">
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900">
                            {obituary.isRevision ? 'Revised Version' : `Version ${obituary.version}`} - {obituary.tone}
                          </h4>
                        </div>
                        
                        <TextHighlighter
                          content={obituary.content}
                          onTextSelect={(text, type) => handleTextSelection(obituary.id, text, type)}
                          selectedTexts={selectedTexts[obituary.id] || []}
                        />

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            <span className="text-green-600">
                              {(selectedTexts[obituary.id] || []).filter(f => f.feedbackType === 'liked').length} liked
                            </span>
                            {' • '}
                            <span className="text-red-600">
                              {(selectedTexts[obituary.id] || []).filter(f => f.feedbackType === 'disliked').length} want changed
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}