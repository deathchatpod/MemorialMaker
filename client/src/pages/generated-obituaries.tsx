import { useState, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { UserContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import TextHighlighter from "@/components/text-highlighter";
import ObituaryEditor from "@/components/obituary-editor";
import CollaborationManager from "@/components/collaboration-manager";

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

export default function GeneratedObituaries() {
  const [, params] = useRoute("/obituary/:id/generated");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const obituaryId = parseInt(params?.id || "0");
  
  const [selectedTexts, setSelectedTexts] = useState<{ [key: number]: TextFeedback[] }>({});
  const [editingObituary, setEditingObituary] = useState<GeneratedObituary | null>(null);

  const { data: generatedObituaries = [], isLoading } = useQuery<GeneratedObituary[]>({
    queryKey: ["/api/obituaries", obituaryId, "generated"],
    queryFn: async () => {
      const response = await fetch(`/api/obituaries/${obituaryId}/generated`);
      if (!response.ok) throw new Error('Failed to fetch generated obituaries');
      return response.json();
    },
    enabled: !!obituaryId,
  });

  const generateRevisionMutation = useMutation({
    mutationFn: async ({ aiProvider, feedback }: { aiProvider: string, feedback: { liked: string[]; disliked: string[] } }) => {
      return await apiRequest('POST', `/api/obituaries/${obituaryId}/revise`, {
        aiProvider,
        feedback,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/obituaries", obituaryId, "generated"] });
      toast({
        title: "Success",
        description: "Revised obituaries generated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate revisions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const downloadPDFMutation = useMutation({
    mutationFn: async (generatedObituaryId: number) => {
      const response = await fetch(`/api/obituaries/${obituaryId}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ generatedObituaryId }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `obituary_${generatedObituaryId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "PDF downloaded successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    },
  });

  const claudeObituaries = generatedObituaries.filter(o => o.aiProvider === 'claude');
  const chatgptObituaries = generatedObituaries.filter(o => o.aiProvider === 'chatgpt');

  const handleTextSelection = (obituaryId: number, selectedText: string, feedbackType: 'liked' | 'disliked') => {
    setSelectedTexts(prev => ({
      ...prev,
      [obituaryId]: [
        ...(prev[obituaryId] || []),
        { selectedText, feedbackType }
      ]
    }));
  };

  const clearFeedback = () => {
    setSelectedTexts({});
    toast({
      title: "Feedback Cleared",
      description: "All text selections have been cleared.",
    });
  };

  const generateRevisions = () => {
    const allFeedback = Object.values(selectedTexts).flat();
    const liked = allFeedback.filter(f => f.feedbackType === 'liked').map(f => f.selectedText);
    const disliked = allFeedback.filter(f => f.feedbackType === 'disliked').map(f => f.selectedText);

    if (liked.length === 0 && disliked.length === 0) {
      toast({
        title: "No Feedback",
        description: "Please select some text first to generate revisions.",
        variant: "destructive",
      });
      return;
    }

    // Generate revisions for both AI providers
    generateRevisionMutation.mutate({ aiProvider: 'claude', feedback: { liked, disliked } });
    generateRevisionMutation.mutate({ aiProvider: 'chatgpt', feedback: { liked, disliked } });
  };

  const getTotalFeedbackCounts = () => {
    const allFeedback = Object.values(selectedTexts).flat();
    const liked = allFeedback.filter(f => f.feedbackType === 'liked').length;
    const disliked = allFeedback.filter(f => f.feedbackType === 'disliked').length;
    return { liked, disliked };
  };

  if (isLoading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
          <p className="text-lg text-gray-600">Loading generated obituaries...</p>
        </div>
      </main>
    );
  }

  if (editingObituary) {
    return (
      <ObituaryEditor
        obituary={editingObituary}
        onSave={(updatedContent) => {
          setEditingObituary({ ...editingObituary, content: updatedContent });
          toast({
            title: "Saved",
            description: "Obituary content updated successfully.",
          });
        }}
        onClose={() => setEditingObituary(null)}
        onDownload={() => downloadPDFMutation.mutate(editingObituary.id)}
      />
    );
  }

  const feedbackCounts = getTotalFeedbackCounts();

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/')}
          className="text-primary hover:text-blue-700 mb-4"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Dashboard
        </Button>
        <h2 className="text-2xl font-semibold text-gray-900">Generated Obituaries</h2>
        <p className="text-gray-600 mt-1">
          Review the AI-generated obituaries and select text you like or dislike for refinement
        </p>
      </div>

      {/* Collaboration Manager */}
      <div className="mb-8">
        <CollaborationManager obituaryId={obituaryId} />
      </div>

      {/* AI Service Tabs */}
      <Card className="mb-8">
        <Tabs defaultValue="claude" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="claude" className="flex items-center">
              <i className="fas fa-robot mr-2"></i>
              Claude AI ({claudeObituaries.length} versions)
            </TabsTrigger>
            <TabsTrigger value="chatgpt" className="flex items-center">
              <i className="fas fa-brain mr-2"></i>
              ChatGPT ({chatgptObituaries.length} versions)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="claude" className="mt-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {claudeObituaries.map((obituary) => (
                  <Card key={obituary.id} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-900">
                          {obituary.isRevision ? 'Revised Version' : `Version ${obituary.version}`} - {obituary.tone}
                        </h4>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingObituary(obituary)}
                          className="text-primary hover:text-blue-700"
                        >
                          <i className="fas fa-edit mr-1"></i>
                          Edit
                        </Button>
                      </div>
                      
                      <TextHighlighter
                        content={obituary.content}
                        onTextSelect={(text, type) => handleTextSelection(obituary.id, text, type)}
                        selectedTexts={selectedTexts[obituary.id] || []}
                      />

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            <span className="text-green-600">
                              {(selectedTexts[obituary.id] || []).filter(f => f.feedbackType === 'liked').length} liked
                            </span>
                            {' • '}
                            <span className="text-red-600">
                              {(selectedTexts[obituary.id] || []).filter(f => f.feedbackType === 'disliked').length} disliked
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => downloadPDFMutation.mutate(obituary.id)}
                            className="text-primary hover:text-blue-700"
                          >
                            Download PDF
                          </Button>
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {chatgptObituaries.map((obituary) => (
                  <Card key={obituary.id} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-900">
                          {obituary.isRevision ? 'Revised Version' : `Version ${obituary.version}`} - {obituary.tone}
                        </h4>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingObituary(obituary)}
                          className="text-primary hover:text-blue-700"
                        >
                          <i className="fas fa-edit mr-1"></i>
                          Edit
                        </Button>
                      </div>
                      
                      <TextHighlighter
                        content={obituary.content}
                        onTextSelect={(text, type) => handleTextSelection(obituary.id, text, type)}
                        selectedTexts={selectedTexts[obituary.id] || []}
                      />

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            <span className="text-green-600">
                              {(selectedTexts[obituary.id] || []).filter(f => f.feedbackType === 'liked').length} liked
                            </span>
                            {' • '}
                            <span className="text-red-600">
                              {(selectedTexts[obituary.id] || []).filter(f => f.feedbackType === 'disliked').length} disliked
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => downloadPDFMutation.mutate(obituary.id)}
                            className="text-primary hover:text-blue-700"
                          >
                            Download PDF
                          </Button>
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

      {/* Feedback Summary & Actions */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Feedback</h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              Select text in the obituaries above to mark what you like or want to change. Your feedback will be used to create refined versions.
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <span className="text-sm font-medium text-green-600 mr-2">Liked phrases:</span>
                <Badge variant="secondary">{feedbackCounts.liked} selected</Badge>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-red-600 mr-2">Want to change:</span>
                <Badge variant="secondary">{feedbackCounts.disliked} selected</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={clearFeedback}
          disabled={feedbackCounts.liked === 0 && feedbackCounts.disliked === 0}
        >
          Clear All Feedback
        </Button>
        <div className="space-x-4">
          <Button 
            onClick={generateRevisions}
            disabled={generateRevisionMutation.isPending || (feedbackCounts.liked === 0 && feedbackCounts.disliked === 0)}
            className="bg-primary text-white hover:bg-blue-700"
          >
            {generateRevisionMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Generating...
              </>
            ) : (
              <>
                <i className="fas fa-sync-alt mr-2"></i>
                Generate Revisions
              </>
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
