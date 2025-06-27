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
import { ChevronLeft, Save, FileText, Edit3, Download, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, ThumbsUp, AlertTriangle, MessageCircle } from "lucide-react";

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
      // Check if content contains structured phrase feedback
      if (content.trim().startsWith('[') && content.includes('"original"') && content.includes('"improved"')) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return {
            liked: [], // Array structure doesn't contain liked phrases
            improved: parsed.filter(item => item.original && item.improved)
          };
        }
      }
      
      // Check for full structured response
      if (content.trim().startsWith('{') && content.includes('improvedPhrases')) {
        const parsed = JSON.parse(content);
        return {
          liked: parsed.likedPhrases || [],
          improved: parsed.improvedPhrases || []
        };
      }
    } catch {
      // If parsing fails, return empty arrays
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
      return data?.status === 'pending' || data?.status === 'processing' ? 500 : false;
    },
    refetchOnWindowFocus: true,
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
  
  // Parse phrase feedback arrays from database fields first
  const positivePhrases = parsePhrasesArray(review.positivePhrases);
  const phrasesToImprove = parsePhrasesArray(review.phrasesToImprove);
  
  // Extract additional phrase feedback from improvedContent JSON structure
  const contentFeedback = extractPhraseFeedbackFromContent(review.improvedContent);
  
  // Combine feedback from both sources
  const allPositivePhrases = [...positivePhrases, ...contentFeedback.liked];
  const allImprovedPhrases = [...phrasesToImprove, ...contentFeedback.improved];
  
  // Extract clean text from improvedContent (remove JSON structure if present)
  const getCleanUpdatedText = (content: string): string => {
    if (!content) return "";
    
    // Check if content looks like JSON structure (starts with { and contains "original"/"improved")
    if (content.trim().startsWith('{') && (content.includes('"original"') || content.includes('"improved"'))) {
      try {
        const parsed = JSON.parse(content);
        
        // Handle structured feedback with improved phrases
        if (parsed.improvedVersion) {
          return parsed.improvedVersion;
        }
        
        // Handle array of phrase comparisons
        if (Array.isArray(parsed)) {
          // Extract improved text from phrase comparison structure
          return parsed.map((item: any) => item.improved || item.original || '').join(' ');
        }
        
        // Handle simple object with improved field
        if (parsed.improved) {
          return parsed.improved;
        }
        
        // Fallback to original content
        return content;
      } catch {
        // If JSON parsing fails, clean up visible JSON artifacts
        return content
          .replace(/\{"original":\s*"/g, '')
          .replace(/",\s*"improved":\s*"/g, ' → ')
          .replace(/"\}/g, '')
          .replace(/^\{/, '')
          .replace(/\}$/, '')
          .trim();
      }
    }
    
    // If not JSON, return as is
    return content;
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