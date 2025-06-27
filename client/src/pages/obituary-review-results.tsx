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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Save, FileText, Edit3, Download, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, ThumbsUp, AlertTriangle, MessageCircle, RefreshCw } from "lucide-react";

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
  
  // Confirmation modal states
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  
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
  const parsePhrasesArray = (jsonString: string | undefined): any[] => {
    if (!jsonString) return [];
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Enhanced function to extract phrase feedback from improvedContent JSON structure
  const extractPhraseFeedbackFromContent = (content: string | undefined): { liked: any[], improved: any[] } => {
    if (!content) return { liked: [], improved: [] };
    
    try {
      let cleanContent = content.trim();
      
      // Remove code block markers if present
      cleanContent = cleanContent
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '');
      
      // Parse the JSON content
      const parsed = JSON.parse(cleanContent);
      
      // Handle full structured response with separate fields
      if (parsed.likedPhrases || parsed.improvedPhrases) {
        return {
          liked: Array.isArray(parsed.likedPhrases) ? parsed.likedPhrases : [],
          improved: Array.isArray(parsed.improvedPhrases) ? parsed.improvedPhrases : []
        };
      }
      
      // Handle array of phrase comparison objects
      if (Array.isArray(parsed)) {
        return {
          liked: [], // Arrays typically don't separate liked vs improved
          improved: parsed.filter(item => 
            typeof item === 'object' && 
            item !== null && 
            (item.original || item.improved)
          )
        };
      }
      
      // Handle nested structure where phrases are within another object
      if (parsed.feedback && (parsed.feedback.likedPhrases || parsed.feedback.improvedPhrases)) {
        return {
          liked: Array.isArray(parsed.feedback.likedPhrases) ? parsed.feedback.likedPhrases : [],
          improved: Array.isArray(parsed.feedback.improvedPhrases) ? parsed.feedback.improvedPhrases : []
        };
      }
      
    } catch (parseError) {
      // If main parsing fails, try to extract from partial JSON structures
      try {
        // Look for likedPhrases array in the content
        const likedMatch = content.match(/"likedPhrases":\s*\[(.*?)\]/s);
        const improvedMatch = content.match(/"improvedPhrases":\s*\[(.*?)\]/s);
        
        const liked = likedMatch ? JSON.parse(`[${likedMatch[1]}]`) : [];
        const improved = improvedMatch ? JSON.parse(`[${improvedMatch[1]}]`) : [];
        
        return { liked, improved };
      } catch {
        // Final fallback - return empty arrays
      }
    }
    
    return { liked: [], improved: [] };
  };

  // Fetch questions to map IDs to question text
  const { data: questions = [] } = useQuery({
    queryKey: ['/api/questions'],
    queryFn: async () => {
      const response = await fetch('/api/questions', {
        credentials: 'include'
      });
      return response.json();
    },
  });

  const getSurveyQuestionText = (key: string): string => {
    // First try to find by question ID
    const questionId = parseInt(key);
    if (!isNaN(questionId)) {
      const question = questions.find((q: any) => q.id === questionId);
      if (question) {
        return question.questionText;
      }
    }
    
    // Fallback to text-based mapping
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
      // Poll every 500ms if status is pending or processing for faster updates
      // Continue polling for a few more cycles after completion to ensure UI updates
      return data?.status === 'pending' || data?.status === 'processing' ? 500 : 2000;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
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

  // Handle status changes and force UI updates
  useEffect(() => {
    if (review?.status === 'completed' && (review.improvedContent || review.additionalFeedback)) {
      // Force a re-render when processing completes by invalidating queries
      queryClient.invalidateQueries({ queryKey: [`/api/obituary-reviews/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/obituary-reviews/${id}/edits`] });
      
      // Show success notification
      toast({
        title: "Processing Complete",
        description: "Your obituary review has been completed and feedback is now available.",
      });
    }
  }, [review?.status, review?.improvedContent, review?.additionalFeedback, id, queryClient, toast]);

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

  // Reprocess obituary with improved settings
  const reprocessMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/obituary-reviews/${id}/reprocess`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Reprocessing Started",
        description: "Using improved settings to preserve all memorial details. This may take a moment.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/obituary-reviews/${id}`] });
    },
    onError: (error) => {
      toast({
        title: "Reprocessing Failed",
        description: error.message || "Failed to start reprocessing. Please try again.",
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
    publishMutation.mutate(options);
  };

  const handleExport = (format: 'docx' | 'pdf', includeHistory: boolean = false) => {
    exportMutation.mutate({ format, includeHistory });
  };

  const downloadAsDoc = () => {
    const content = activeTab === "updated" 
      ? getCleanUpdatedText(review?.improvedContent || "")
      : review?.extractedText || "";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `obituary-review-${id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Confirmation modal handlers
  const handleDownloadClick = () => {
    setShowDownloadConfirm(true);
  };

  const handlePublishClick = () => {
    setShowPublishConfirm(true);
  };

  const confirmDownload = () => {
    downloadAsDoc();
    setShowDownloadConfirm(false);
  };

  const confirmPublish = () => {
    handlePublish({ publishToSystem: true });
    setShowPublishConfirm(false);
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
  
  // Parse phrase feedback arrays from database fields first
  const positivePhrases = parsePhrasesArray(review.positivePhrases);
  const phrasesToImprove = parsePhrasesArray(review.phrasesToImprove);
  
  // Extract additional phrase feedback from improvedContent JSON structure
  const contentFeedback = extractPhraseFeedbackFromContent(review.improvedContent);
  
  // Combine feedback from both sources
  const allPositivePhrases = [...positivePhrases, ...contentFeedback.liked];
  const allImprovedPhrases = [...phrasesToImprove, ...contentFeedback.improved];
  
  // Extract clean text from improvedContent (remove ALL JSON structure)
  const getCleanUpdatedText = (content: string): string => {
    if (!content) return "";
    
    // Remove any leading/trailing whitespace and quotes
    let cleanContent = content.trim();
    
    // First, try to remove code block markers if present
    if (cleanContent.includes('```json') || cleanContent.includes('```')) {
      cleanContent = cleanContent
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '');
    }

    // Handle full JSON responses from Claude
    if (cleanContent.startsWith('{') || cleanContent.startsWith('[')) {
      try {
        const parsed = JSON.parse(cleanContent);
        
        // Handle structured response with improvedVersion field
        if (parsed.improvedVersion) {
          return cleanTextArtifacts(parsed.improvedVersion);
        }
        
        // Handle structured response with improvedContent field
        if (parsed.improvedContent) {
          return cleanTextArtifacts(parsed.improvedContent);
        }
        
        // Handle structured response with editedText field
        if (parsed.editedText) {
          return cleanTextArtifacts(parsed.editedText);
        }
        
        // Handle array of phrase objects - extract the full improved text if available
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Look for a complete improved text in the first item
          if (parsed[0].improvedText) {
            return cleanTextArtifacts(parsed[0].improvedText);
          }
          // Otherwise, don't try to reconstruct from individual phrases
          return "Unable to extract clean text from phrase-level feedback.";
        }
        
        // If it's an object but no recognized field, return error
        return "Unable to extract clean obituary text from response.";
        
      } catch (parseError) {
        // JSON parsing failed, try regex extraction
        
        // Try to extract improvedVersion using regex as fallback
        const improvedVersionMatch = cleanContent.match(/"improvedVersion":\s*"([^"]*(?:\\.[^"]*)*)"/s);
        if (improvedVersionMatch) {
          const extracted = improvedVersionMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\t/g, '\t');
          return cleanTextArtifacts(extracted);
        }
        
        // Last resort: aggressive text cleanup
        const aggressiveClean = cleanContent
          .replace(/\{[^}]*"likedPhrases"[^}]*\}/g, '')
          .replace(/\{[^}]*"improvedPhrases"[^}]*\}/g, '')
          .replace(/^\s*\{/, '')
          .replace(/\}\s*$/, '')
          .replace(/^"/, '')
          .replace(/"$/, '')
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"');
        return cleanTextArtifacts(aggressiveClean);
      }
    }
    
    // If content doesn't start with JSON markers, clean up any JSON artifacts
    if (cleanContent.includes('"likedPhrases"') || cleanContent.includes('"improvedPhrases"')) {
      const cleaned = cleanContent
        .replace(/\{[^}]*"likedPhrases"[^}]*\}/g, '')
        .replace(/\{[^}]*"improvedPhrases"[^}]*\}/g, '')
        .replace(/```json/g, '')
        .replace(/```/g, '');
      return cleanTextArtifacts(cleaned);
    }
    
    // Return cleaned content
    return cleanTextArtifacts(cleanContent);
  };

  // Helper function to clean text artifacts and truncation issues
  const cleanTextArtifacts = (text: string): string => {
    if (!text) return "";
    
    let cleaned = text.trim();
    
    // Remove trailing backslashes and incomplete sentences
    cleaned = cleaned.replace(/\\+$/, '');
    
    // Remove incomplete sentences that end abruptly (common with truncation)
    // Look for sentences that end with incomplete words or strange characters
    const lines = cleaned.split('\n');
    const cleanedLines = lines.filter((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) return true;
      
      // If it's the last line and seems incomplete, check for truncation
      if (index === lines.length - 1) {
        // Remove lines that end with backslashes, incomplete words, or seem cut off
        if (trimmedLine.endsWith('\\') || 
            trimmedLine.endsWith(' \\') ||
            trimmedLine.match(/\s[a-z]+$/i) && trimmedLine.length < 20) {
          return false;
        }
      }
      
      return true;
    });
    
    cleaned = cleanedLines.join('\n').trim();
    
    // Remove any remaining JSON artifacts
    cleaned = cleaned
      .replace(/^[\{\[\"]|[\}\]\"]$/g, '')
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\');
    
    return cleaned;
  };
  
  const cleanUpdatedText = getCleanUpdatedText(review.improvedContent || "");

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
              {review.status === 'processing' && (
                <div className="flex items-center space-x-2 text-sm text-yellow-400">
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>Processing your obituary review...</span>
                </div>
              )}
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
          <CollapsibleContent>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 space-y-4 text-xs">
                
                {/* General Feedback */}
                <div>
                  <h4 className="text-blue-400 font-medium text-xs mb-2 flex items-center space-x-1">
                    <MessageCircle className="h-3 w-3" />
                    <span>General Feedback</span>
                  </h4>
                  {review.status === 'processing' ? (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-yellow-400 animate-spin" />
                      <p className="text-gray-100 text-xs leading-relaxed">
                        Reviewing the obituary and feedback request. A response will be completed shortly.
                      </p>
                    </div>
                  ) : review.additionalFeedback ? (
                    <p className="text-gray-100 text-xs leading-relaxed whitespace-pre-wrap">
                      {review.additionalFeedback === 'AI processing completed successfully.' 
                        ? 'Obituary review and feedback preparation completed successfully.'
                        : review.additionalFeedback}
                    </p>
                  ) : (
                    <p className="text-gray-400 text-xs">No feedback available yet.</p>
                  )}
                </div>

                {/* Phrase Feedback */}
                {(allPositivePhrases.length > 0 || allImprovedPhrases.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    {/* Positive Phrases */}
                    {allPositivePhrases.length > 0 && (
                      <div>
                        <h4 className="text-green-400 font-medium text-xs mb-2 flex items-center space-x-1">
                          <ThumbsUp className="h-3 w-3" />
                          <span>We liked these phrases</span>
                        </h4>
                        <div className="space-y-1">
                          {allPositivePhrases.map((phrase, index) => (
                            <div key={index} className="p-2 bg-green-900/20 border border-green-700/30 rounded">
                              <p className="text-gray-100 text-xs italic">"{phrase}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Phrases to Improve */}
                    {allImprovedPhrases.length > 0 && (
                      <div>
                        <h4 className="text-orange-400 font-medium text-xs mb-2 flex items-center space-x-1">
                          <Edit3 className="h-3 w-3" />
                          <span>We improved these phrases</span>
                        </h4>
                        <div className="space-y-2">
                          {allImprovedPhrases.map((phraseObj, index) => {
                            // Handle both string and object formats for backward compatibility
                            const isObject = typeof phraseObj === 'object' && phraseObj !== null && phraseObj.original && phraseObj.improved;
                            return (
                              <div key={index} className="p-2 bg-orange-900/20 border border-orange-700/30 rounded space-y-1">
                                {isObject ? (
                                  <>
                                    <div className="text-gray-400 text-xs">Original:</div>
                                    <p className="text-gray-100 text-xs italic">"{phraseObj.original}"</p>
                                    <div className="text-gray-400 text-xs">Improved:</div>
                                    <p className="text-green-300 text-xs italic">"{phraseObj.improved}"</p>
                                  </>
                                ) : (
                                  <p className="text-gray-100 text-xs italic">"{phraseObj}"</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Initial Request (Survey Responses) */}
                <div>
                  <h4 className="text-purple-400 font-medium text-xs mb-2 flex items-center space-x-1">
                    <FileText className="h-3 w-3" />
                    <span>Initial Request</span>
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(review.surveyResponses).map(([key, value]) => (
                      <div key={key} className="pb-2 border-b border-gray-600 last:border-b-0 last:pb-0">
                        <p className="font-medium text-gray-300 mb-1 text-xs">
                          {getSurveyQuestionText(key)}
                        </p>
                        <p className="text-gray-100 text-xs">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specific Content Feedback - Only show if we have phrase feedback */}
                {(positivePhrases.length > 0 || phrasesToImprove.length > 0) && review.status === 'completed' && (
                  <div>
                    <h4 className="text-orange-400 font-medium text-xs mb-2 flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Specific Content Feedback</span>
                    </h4>
                    <div className="space-y-3">
                      
                      {/* Phrases Claude Liked */}
                      {positivePhrases.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-green-400 font-medium text-xs flex items-center space-x-1">
                            <ThumbsUp className="h-3 w-3" />
                            <span>Phrases Kept (up to 10)</span>
                          </h5>
                          <div className="space-y-1">
                            {positivePhrases.slice(0, 10).map((phrase, index) => (
                              <div key={index} className="bg-green-900/20 border border-green-700/30 rounded px-2 py-1">
                                <p className="text-green-200 text-xs">"{phrase}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Phrases Claude Improved */}
                      {phrasesToImprove.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-yellow-400 font-medium text-xs flex items-center space-x-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Phrases Improved (up to 10)</span>
                          </h5>
                          <div className="space-y-2">
                            {phrasesToImprove.slice(0, 10).map((phraseData, index) => {
                              // Handle both string and object formats
                              const original = typeof phraseData === 'string' ? phraseData : phraseData.original || phraseData;
                              const improved = typeof phraseData === 'object' ? phraseData.improved : null;
                              
                              return (
                                <div key={index} className="bg-yellow-900/20 border border-yellow-700/30 rounded p-2 space-y-1">
                                  <div>
                                    <span className="text-yellow-300 text-xs font-medium">Original: </span>
                                    <span className="text-yellow-200 text-xs">"{original}"</span>
                                  </div>
                                  {improved && (
                                    <div>
                                      <span className="text-yellow-300 text-xs font-medium">Improved: </span>
                                      <span className="text-yellow-100 text-xs">"{improved}"</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Main Content Box with Tabs - After Feedback */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Obituary Content</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-700">
                <TabsTrigger value="original" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                  Original Obituary Text
                </TabsTrigger>
                <TabsTrigger value="updated" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                  Updated Obituary Text
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="original" className="mt-4">
                <ScrollArea className="h-96 w-full rounded border border-gray-600 p-4">
                  <div className="text-gray-100 whitespace-pre-wrap leading-relaxed">
                    {review.extractedText || "No original content available"}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="updated" className="mt-4">
                <ScrollArea className="h-96 w-full rounded border border-gray-600 p-4">
                  <div className="text-gray-100 whitespace-pre-wrap leading-relaxed">
                    {cleanUpdatedText || currentContent || "No updated content available"}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
            
            {/* Action Buttons under content */}
            {review.status === 'completed' && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-600">
                <Button
                  variant="outline"
                  onClick={() => reprocessMutation.mutate()}
                  disabled={reprocessMutation.isPending}
                  className="border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${reprocessMutation.isPending ? 'animate-spin' : ''}`} />
                  {reprocessMutation.isPending ? "Reprocessing..." : "Reprocess"}
                </Button>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleDownloadClick}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  {!review.isPublishedToSystem && (
                    <Button
                      onClick={handlePublishClick}
                      disabled={publishMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {publishMutation.isPending ? "Publishing..." : "Publish to System"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Download Confirmation Modal */}
      <AlertDialog open={showDownloadConfirm} onOpenChange={setShowDownloadConfirm}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Download Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              You are downloading the {activeTab === "updated" ? "Updated" : "Original"} Obituary Text.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Confirm Download
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Confirmation Modal */}
      <AlertDialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Publish Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              You are publishing the {activeTab === "updated" ? "Updated" : "Original"} Obituary Text.
              {review?.isPublishedToSystem && (
                <div className="mt-2 text-yellow-400">
                  You are also overwriting an earlier version of this obituary.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmPublish}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}