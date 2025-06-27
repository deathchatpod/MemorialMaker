import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import TextHighlighter from "@/components/text-highlighter";
import ObituaryEditor from "@/components/obituary-editor";
import CollaborationManager from "@/components/CollaborationManager";
import VersionManager from "@/components/version-manager";
import { RefreshCw, ChevronDown, ChevronUp, Clock, Users, MessageSquare, Eye, EyeOff } from "lucide-react";

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
  const [feedbackInclusion, setFeedbackInclusion] = useState<{ [key: string]: boolean }>({});
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [activeTab, setActiveTab] = useState<string>('latest');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: generatedObituaries = [], isLoading } = useQuery<GeneratedObituary[]>({
    queryKey: ["/api/obituaries", obituaryId, "generated"],
    queryFn: async () => {
      const response = await fetch(`/api/obituaries/${obituaryId}/generated`);
      if (!response.ok) throw new Error('Failed to fetch generated obituaries');
      return response.json();
    },
    enabled: !!obituaryId,
    refetchInterval: generatedObituaries.length === 0 ? 3000 : false, // Poll every 3 seconds if no obituaries yet
  });

  // Check if obituaries are still being generated
  const isGenerating = !isLoading && generatedObituaries.length === 0;

  // Fetch feedback for all generated obituaries
  const { data: allFeedback } = useQuery({
    queryKey: ["/api/obituaries", obituaryId, "feedback"],
    queryFn: async () => {
      if (!generatedObituaries.length) return {};
      
      const feedbackPromises = generatedObituaries.map(async (obituary: any) => {
        const response = await fetch(`/api/generated-obituaries/${obituary.id}/feedback`);
        const feedback = await response.json();
        return { [obituary.id]: feedback };
      });
      
      const results = await Promise.all(feedbackPromises);
      return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    },
    enabled: generatedObituaries.length > 0,
  });

  // Save feedback mutation
  const saveFeedbackMutation = useMutation({
    mutationFn: async ({ generatedObituaryId, selectedText, feedbackType }: { 
      generatedObituaryId: number, 
      selectedText: string, 
      feedbackType: 'liked' | 'disliked' 
    }) => {
      const response = await fetch(`/api/generated-obituaries/${generatedObituaryId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedText, feedbackType })
      });
      if (!response.ok) throw new Error('Failed to save feedback');
      return response.json();
    },
    onSuccess: () => {
      setShowFeedbackDialog(true);
      setFeedbackMessage('Your feedback has been saved successfully.');
      queryClient.invalidateQueries({ queryKey: ["/api/obituaries", obituaryId, "feedback"] });
    },
    onError: () => {
      setShowFeedbackDialog(true);
      setFeedbackMessage('Failed to save feedback. Please try again.');
    }
  });

  // Revision mutation
  const createRevision = useMutation({
    mutationFn: async ({ aiProvider }: { aiProvider: string }) => {
      const response = await fetch(`/api/obituaries/${obituaryId}/revise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiProvider })
      });
      if (!response.ok) throw new Error('Failed to create revision');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/obituaries", obituaryId, "generated"] });
      setShowFeedbackDialog(true);
      setFeedbackMessage('New revision generated based on feedback.');
    },
    onError: () => {
      setShowFeedbackDialog(true);
      setFeedbackMessage('Failed to create revision. Please try again.');
    }
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
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to generate revisions. Please try again.";
      toast({
        title: "Cannot Generate Revision",
        description: errorMessage,
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
    // Save feedback via API
    saveFeedbackMutation.mutate({
      generatedObituaryId: obituaryId,
      selectedText,
      feedbackType
    });

    const currentFeedback = selectedTexts[obituaryId] || [];
    const existingIndex = currentFeedback.findIndex(f => f.selectedText === selectedText);
    
    let newFeedback;
    if (existingIndex >= 0) {
      if (currentFeedback[existingIndex].feedbackType === feedbackType) {
        // Remove if same type selected again
        newFeedback = currentFeedback.filter(f => f.selectedText !== selectedText);
      } else {
        // Update type if different type selected
        newFeedback = currentFeedback.map(f => 
          f.selectedText === selectedText ? { ...f, feedbackType } : f
        );
      }
    } else {
      // Add new feedback
      newFeedback = [...currentFeedback, { selectedText, feedbackType }];
      // Default new feedback to included
      const feedbackKey = `${obituaryId}-${selectedText}`;
      setFeedbackInclusion(prev => ({ ...prev, [feedbackKey]: true }));
    }
    
    setSelectedTexts(prev => ({ ...prev, [obituaryId]: newFeedback }));
  };

  const handleFeedbackInclusionChange = (obituaryId: number, text: string, included: boolean) => {
    const feedbackKey = `${obituaryId}-${text}`;
    setFeedbackInclusion(prev => ({ ...prev, [feedbackKey]: included }));
  };

  const getIncludedFeedback = () => {
    const allFeedback = Object.values(selectedTexts).flat();
    return allFeedback.filter(feedback => {
      const feedbackKey = `${Object.keys(selectedTexts).find(key => 
        selectedTexts[parseInt(key)]?.includes(feedback)
      )}-${feedback.selectedText}`;
      return feedbackInclusion[feedbackKey] !== false; // Default to true if not set
    });
  };

  const clearFeedback = () => {
    setSelectedTexts({});
    setFeedbackInclusion({});
    toast({
      title: "Feedback Cleared",
      description: "All text selections have been cleared.",
    });
  };

  const generateRevisions = () => {
    const includedFeedback = getIncludedFeedback();
    const liked = includedFeedback.filter(f => f.feedbackType === 'liked').map(f => f.selectedText);
    const disliked = includedFeedback.filter(f => f.feedbackType === 'disliked').map(f => f.selectedText);

    if (liked.length === 0 && disliked.length === 0) {
      toast({
        title: "No Feedback",
        description: "Please provide feedback or edits",
        variant: "destructive",
      });
      return;
    }

    // Check if revisions already exist
    const claudeRevision = generatedObituaries.find(o => o.aiProvider === 'claude' && o.isRevision);
    const chatgptRevision = generatedObituaries.find(o => o.aiProvider === 'chatgpt' && o.isRevision);

    // Generate revisions for providers that don't already have them
    if (!claudeRevision) {
      generateRevisionMutation.mutate({ aiProvider: 'claude', feedback: { liked, disliked } });
    }
    if (!chatgptRevision) {
      generateRevisionMutation.mutate({ aiProvider: 'chatgpt', feedback: { liked, disliked } });
    }

    if (claudeRevision && chatgptRevision) {
      toast({
        title: "Revisions Already Generated",
        description: "Only one revision per AI provider is allowed. You can edit the existing revisions directly.",
        variant: "destructive",
      });
    }
  };

  const getTotalFeedbackCounts = () => {
    const allFeedback = Object.values(selectedTexts).flat();
    const includedFeedback = getIncludedFeedback();
    return {
      liked: allFeedback.filter(f => f.feedbackType === 'liked').length,
      disliked: allFeedback.filter(f => f.feedbackType === 'disliked').length,
      includedLiked: includedFeedback.filter(f => f.feedbackType === 'liked').length,
      includedDisliked: includedFeedback.filter(f => f.feedbackType === 'disliked').length
    };
  };

  const getRevisionStatus = () => {
    const claudeRevision = generatedObituaries.find(o => o.aiProvider === 'claude' && o.isRevision);
    const chatgptRevision = generatedObituaries.find(o => o.aiProvider === 'chatgpt' && o.isRevision);
    return {
      claudeHasRevision: !!claudeRevision,
      chatgptHasRevision: !!chatgptRevision,
      bothHaveRevisions: !!claudeRevision && !!chatgptRevision
    };
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

  // Check if we have both providers with feedback for revision button
  const claudeVersions = generatedObituaries.filter((o: any) => o.aiProvider === 'claude');
  const chatgptVersions = generatedObituaries.filter((o: any) => o.aiProvider === 'chatgpt');
  const canRevise = claudeVersions.length > 0 && chatgptVersions.length > 0;

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
  const revisionStatus = getRevisionStatus();

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground">Generated Obituaries</h2>
        <p className="text-muted-foreground mt-1">
          Review the AI-generated obituaries and select text you like or dislike for refinement
        </p>
      </div>

      {/* Collaboration Manager */}
      <div className="mb-8">
        <CollaborationManager obituaryId={obituaryId} />
      </div>

      {/* Generated Obituaries with Version Management */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Generated Obituaries</CardTitle>
              <p className="text-muted-foreground">
                Review the AI-generated obituaries and select text you like or dislike for refinement
              </p>
            </div>
            {canRevise && (
              <div className="flex gap-2">
                <Button
                  onClick={() => createRevision.mutate({ aiProvider: 'claude' })}
                  disabled={createRevision.isPending}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Revise Claude
                </Button>
                <Button
                  onClick={() => createRevision.mutate({ aiProvider: 'chatgpt' })}
                  disabled={createRevision.isPending}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Revise ChatGPT
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <VersionManager
            obituaries={generatedObituaries}
            feedback={allFeedback || {}}
            onSelectText={handleTextSelection}
            isCollaborator={false}
          />
        </CardContent>
      </Card>

      <AlertDialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Feedback Notification</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {feedbackMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setShowFeedbackDialog(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
