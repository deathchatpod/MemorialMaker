import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Save, FileText, Edit3, Download, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, ThumbsUp, AlertTriangle } from "lucide-react";

interface ObituaryReview {
  id: number;
  originalFilename: string;
  extractedText: string;
  improvedContent?: string;
  additionalFeedback?: string;
  positivePhrases?: string; // JSON array
  phrasesToImprove?: string; // JSON array
  surveyResponses: Record<string, any>;
  status: string;
  aiProvider?: string;
  createdAt: string;
  processedAt?: string;
  isPublishedToSystem?: boolean;
  finalObituaryId?: number;
}

interface ObituaryReviewEdit {
  id: number;
  reviewId: number;
  version: number;
  editedContent: string;
  editComment?: string;
  editedBy: number;
  editedByType: string;
  createdAt: string;
}

export default function ObituaryReviewResults() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("original");
  const [editedContent, setEditedContent] = useState("");
  const [editComment, setEditComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(true);
  
  // State persistence for feedback section
  useEffect(() => {
    const savedState = localStorage.getItem(`obituary-feedback-${id}`);
    if (savedState) {
      setFeedbackOpen(JSON.parse(savedState));
    }
  }, [id]);
  
  useEffect(() => {
    localStorage.setItem(`obituary-feedback-${id}`, JSON.stringify(feedbackOpen));
  }, [feedbackOpen, id]);

  // Helper functions for phrase feedback
  const parsePhrasesArray = (jsonString: string | undefined): string[] => {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  };

  const getSurveyQuestionText = (key: string): string => {
    // Map response keys to readable question text
    const questionMap: Record<string, string> = {
      'Full Name': 'Full Name of Deceased',
      'Date of Death': 'Date of Death',
      'Age at Death': 'Age at Death',
      'Place of Birth': 'Place of Birth',
      'Education': 'Education Background',
      'Career': 'Career/Profession',
      'Family Information': 'Family Information',
      'Hobbies': 'Hobbies and Interests',
      'Special Achievements': 'Special Achievements',
      'Personality': 'Personality Traits',
      'Memorial Service': 'Memorial Service Details',
      'Additional Information': 'Additional Information'
    };
    return questionMap[key] || key;
  };

  // Fetch obituary review with polling for processing status
  const { data: review, isLoading: reviewLoading, error: reviewError } = useQuery<ObituaryReview>({
    queryKey: [`/api/obituary-reviews/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/obituary-reviews/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: (data) => {
      // Poll every 1 second if status is pending or processing for faster updates
      return data?.status === 'pending' || data?.status === 'processing' ? 1000 : false;
    },
  });



  // Fetch edit history
  const { data: edits = [], isLoading: editsLoading } = useQuery<ObituaryReviewEdit[]>({
    queryKey: [`/api/obituary-reviews/${id}/edits`],
    queryFn: async () => {
      const response = await fetch(`/api/obituary-reviews/${id}/edits`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  // Initialize edited content
  useEffect(() => {
    if (review && !editedContent) {
      const latestEdit = edits[0];
      setEditedContent(latestEdit?.editedContent || review.improvedContent || review.extractedText);
    }
  }, [review, edits, editedContent]);

  // Enhanced save edit mutation with comprehensive validation
  const saveEditMutation = useMutation({
    mutationFn: async ({ editedContent, editComment }: { editedContent: string; editComment?: string }) => {
      return apiRequest(`/api/obituary-reviews/${id}/save`, {
        method: "POST",
        body: JSON.stringify({ editedContent, editComment }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Changes Saved",
        description: `Version ${data.version} saved successfully.`,
      });
      setIsEditing(false);
      setEditComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/obituary-reviews/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/obituary-reviews/${id}/edits`] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save your changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Enhanced publish to system mutation with options
  const publishMutation = useMutation({
    mutationFn: async ({ publishToSystem = true, createMemorial = false }: { publishToSystem?: boolean; createMemorial?: boolean }) => {
      return apiRequest(`/api/obituary-reviews/${id}/publish`, {
        method: "POST",
        body: JSON.stringify({ publishToSystem, createMemorial }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Published Successfully",
        description: data.memorial ? "Obituary published and memorial created." : "Obituary published to the main system.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/obituary-reviews/${id}`] });
    },
    onError: (error) => {
      toast({
        title: "Publish Failed",
        description: error.message || "Failed to publish obituary. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Export mutation with format options
  const exportMutation = useMutation({
    mutationFn: async ({ format, includeHistory }: { format: 'docx' | 'pdf'; includeHistory?: boolean }) => {
      const response = await fetch(`/api/obituary-reviews/${id}/export`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // if using token auth
        },
        body: JSON.stringify({ format, includeHistory })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `obituary.${format}`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Export Complete",
        description: "Document downloaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!editedContent.trim()) {
      toast({
        title: "Content Required",
        description: "Please add content before saving.",
        variant: "destructive",
      });
      return;
    }

    saveEditMutation.mutate({ editedContent, editComment });
  };

  const handlePublish = (options: { publishToSystem?: boolean; createMemorial?: boolean } = {}) => {
    if (window.confirm("Are you sure you want to publish this obituary? This action cannot be undone.")) {
      publishMutation.mutate(options);
    }
  };

  const handleExport = (format: 'docx' | 'pdf', includeHistory: boolean = false) => {
    exportMutation.mutate({ format, includeHistory });
  };

  const downloadAsDoc = () => {
    const content = editedContent || review?.improvedContent || review?.extractedText || "";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `obituary-review-${id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSurveyResponses = (responses: Record<string, any>) => {
    return Object.entries(responses).map(([question, answer]) => (
      <div key={question} className="mb-3">
        <p className="text-sm font-medium text-gray-300">{question}</p>
        <p className="text-gray-100 mt-1">{String(answer)}</p>
      </div>
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-orange-400" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  if (reviewLoading || editsLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-300">Loading review...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="text-center text-gray-300">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <h2 className="text-xl font-semibold mb-2">Review Not Found</h2>
                <p className="text-gray-400">The obituary review you're looking for doesn't exist.</p>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/dashboard")}
                  className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const latestEdit = edits[0];
  const currentContent = latestEdit?.editedContent || review.improvedContent || review.extractedText;
  
  // Parse phrase feedback arrays
  const positivePhrases = parsePhrasesArray(review.positivePhrases);
  const phrasesToImprove = parsePhrasesArray(review.phrasesToImprove);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Obituary Review Results</h1>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusIcon(review.status)}
              <Badge variant={review.status === 'completed' ? 'default' : 'secondary'}>
                {review.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Collapsible Obituary Feedback Section - Above Content */}
        <Collapsible open={feedbackOpen} onOpenChange={setFeedbackOpen}>
          <CollapsibleTrigger asChild>
            <Card className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Obituary Feedback</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {(positivePhrases.length > 0 || phrasesToImprove.length > 0) && (
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {positivePhrases.length + phrasesToImprove.length} insights
                      </Badge>
                    )}
                    {feedbackOpen ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4">
            
            {/* Phrase Feedback */}
            {(positivePhrases.length > 0 || phrasesToImprove.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Positive Phrases */}
                {positivePhrases.length > 0 && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-green-400 flex items-center space-x-2 text-lg">
                        <ThumbsUp className="h-4 w-4" />
                        <span>We liked these phrases</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {positivePhrases.map((phrase, index) => (
                        <div key={index} className="p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                          <p className="text-gray-100 text-sm italic">"{phrase}"</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                
                {/* Phrases to Improve */}
                {phrasesToImprove.length > 0 && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-orange-400 flex items-center space-x-2 text-lg">
                        <Edit3 className="h-4 w-4" />
                        <span>We'd like to improve these phrases</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {phrasesToImprove.map((phrase, index) => (
                        <div key={index} className="p-3 bg-orange-900/20 border border-orange-700/30 rounded-lg">
                          <p className="text-gray-100 text-sm italic">"{phrase}"</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* General Feedback */}
            {review.additionalFeedback && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">General Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-100 leading-relaxed">{review.additionalFeedback}</p>
                </CardContent>
              </Card>
            )}

            {/* Survey Responses */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Survey Responses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(review.surveyResponses).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-600 pb-3 last:border-b-0">
                    <p className="text-sm font-medium text-gray-300 mb-1">
                      {getSurveyQuestionText(key)}
                    </p>
                    <p className="text-gray-100">{String(value)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Main Content Box - After Feedback */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Obituary Content</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-96 w-full rounded border border-gray-600 p-4">
              <div className="text-gray-100 whitespace-pre-wrap leading-relaxed">
                {currentContent || "No content available"}
              </div>
            </ScrollArea>
            
            {/* Action Buttons under content - only show when completed */}
            {review.status === 'completed' && (
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-600">
                <Button
                  variant="outline"
                  onClick={downloadAsDoc}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                {!review.isPublishedToSystem && (
                  <Button
                    onClick={() => handlePublish()}
                    disabled={publishMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {publishMutation.isPending ? "Publishing..." : "Publish to System"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}