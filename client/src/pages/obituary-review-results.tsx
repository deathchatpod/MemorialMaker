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
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Save, FileText, Edit3, Download, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ObituaryReview {
  id: number;
  originalFilename: string;
  extractedText: string;
  improvedContent?: string;
  additionalFeedback?: string;
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

  // Fetch obituary review
  const { data: review, isLoading: reviewLoading } = useQuery<ObituaryReview>({
    queryKey: [`/api/obituary-reviews/${id}`],
  });

  // Fetch edit history
  const { data: edits = [], isLoading: editsLoading } = useQuery<ObituaryReviewEdit[]>({
    queryKey: [`/api/obituary-reviews/${id}/edits`],
  });

  // Initialize edited content
  useEffect(() => {
    if (review && !editedContent) {
      const latestEdit = edits[0];
      setEditedContent(latestEdit?.editedContent || review.improvedContent || review.extractedText);
    }
  }, [review, edits, editedContent]);

  // Save edit mutation
  const saveEditMutation = useMutation({
    mutationFn: async ({ editedContent, editComment }: { editedContent: string; editComment?: string }) => {
      return apiRequest(`/api/obituary-reviews/${id}/edits`, {
        method: "POST",
        body: { editedContent, editComment },
      });
    },
    onSuccess: () => {
      toast({
        title: "Changes Saved",
        description: "Your edits have been saved successfully.",
      });
      setIsEditing(false);
      setEditComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/obituary-reviews/${id}/edits`] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: "Failed to save your changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Publish to system mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/obituary-reviews/${id}/publish`, {
        method: "POST",
      });
    },
    onSuccess: (newObituary) => {
      toast({
        title: "Published Successfully",
        description: "Obituary has been published to the main system.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/obituary-reviews/${id}`] });
    },
    onError: (error) => {
      toast({
        title: "Publish Failed",
        description: "Failed to publish obituary. Please try again.",
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

  const handlePublish = () => {
    if (window.confirm("Are you sure you want to publish this obituary to the main system? This action cannot be undone.")) {
      publishMutation.mutate();
    }
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

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/dashboard")}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Obituary Review Results</h1>
              <div className="flex items-center space-x-2 mt-1">
                {getStatusIcon(review.status)}
                <Badge variant={review.status === 'completed' ? 'default' : 'secondary'}>
                  {review.status}
                </Badge>
                {review.aiProvider && (
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    {review.aiProvider}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
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
                onClick={handlePublish}
                disabled={publishMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {publishMutation.isPending ? "Publishing..." : "Publish to System"}
              </Button>
            )}
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger value="original" className="data-[state=active]:bg-gray-700">
              Original Content
            </TabsTrigger>
            <TabsTrigger value="improved" className="data-[state=active]:bg-gray-700">
              Final Version
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-gray-700">
              Survey Responses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="original" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Original Document: {review.originalFilename}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full rounded border border-gray-600 p-4">
                  <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                    {review.extractedText}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="improved" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Edit3 className="h-5 w-5 mr-2" />
                    Final Version {latestEdit && `(v${latestEdit.version})`}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {!isEditing ? (
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => {
                            setIsEditing(false);
                            setEditedContent(currentContent);
                            setEditComment("");
                          }}
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={saveEditMutation.isPending}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saveEditMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      placeholder="Edit the obituary content..."
                      className="min-h-96 bg-gray-700 border-gray-600 text-gray-100 resize-none"
                    />
                    <Textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      placeholder="Add a comment about your changes (optional)..."
                      className="h-20 bg-gray-700 border-gray-600 text-gray-100"
                    />
                  </>
                ) : (
                  <ScrollArea className="h-96 w-full rounded border border-gray-600 p-4">
                    <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                      {currentContent}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Version History */}
            {edits.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Version History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {edits.map((edit) => (
                      <div key={edit.id} className="border border-gray-600 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            Version {edit.version}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {new Date(edit.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {edit.editComment && (
                          <p className="text-gray-300 text-sm">{edit.editComment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Survey Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full">
                  <div className="space-y-4">
                    {review.surveyResponses && formatSurveyResponses(review.surveyResponses)}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {review.additionalFeedback && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">AI Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                    {review.additionalFeedback}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Status Information */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Created:</span>
                <span className="text-gray-200 ml-2">
                  {new Date(review.createdAt).toLocaleString()}
                </span>
              </div>
              {review.processedAt && (
                <div>
                  <span className="text-gray-400">Processed:</span>
                  <span className="text-gray-200 ml-2">
                    {new Date(review.processedAt).toLocaleString()}
                  </span>
                </div>
              )}
              {review.isPublishedToSystem && (
                <div>
                  <span className="text-gray-400">Status:</span>
                  <Badge className="ml-2 bg-green-600">Published to System</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}