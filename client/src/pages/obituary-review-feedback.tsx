import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, MessageSquare, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReviewData {
  surveyResponses: Record<string, any>;
  extractedText: string;
  filename: string;
  uploadedAt: string;
}

export default function ObituaryReviewFeedback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get review data from URL parameters or localStorage
  const reviewData = JSON.parse(localStorage.getItem('obituaryReviewData') || '{}') as ReviewData;
  
  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please provide your feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Here you would typically save the feedback to the database
      // For now, we'll just show a success message
      
      toast({
        title: "Feedback Submitted",
        description: "Your obituary review feedback has been submitted successfully.",
      });
      
      // Clear the stored data
      localStorage.removeItem('obituaryReviewData');
      
      // Navigate back to dashboard
      setTimeout(() => {
        setLocation('/dashboard');
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!reviewData.extractedText) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <p className="text-white">No review data found. Please start a new review.</p>
              <Button 
                onClick={() => setLocation('/dashboard')}
                className="mt-4"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <FileText className="w-5 h-5 mr-2" />
                  Obituary Review
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                    {reviewData.filename}
                  </Badge>
                  <Badge variant="outline" className="border-gray-600 text-gray-400">
                    Uploaded: {new Date(reviewData.uploadedAt).toLocaleDateString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="original" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-700">
                    <TabsTrigger value="original" className="data-[state=active]:bg-gray-600 text-white">
                      Original Text
                    </TabsTrigger>
                    <TabsTrigger value="suggestions" className="data-[state=active]:bg-gray-600 text-white">
                      AI Suggestions
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="original" className="mt-4">
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                      <h3 className="text-lg font-semibold text-white mb-3">Extracted Document Text</h3>
                      <div className="bg-gray-800 p-4 rounded border border-gray-600 max-h-96 overflow-y-auto">
                        <pre className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                          {reviewData.extractedText}
                        </pre>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="suggestions" className="mt-4">
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                      <h3 className="text-lg font-semibold text-white mb-3">AI-Generated Improvements</h3>
                      <div className="bg-gray-800 p-4 rounded border border-gray-600">
                        <p className="text-gray-400 italic">
                          AI suggestions will be generated based on your feedback preferences and displayed here.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Survey Responses & Feedback */}
          <div className="space-y-6">
            {/* Survey Responses Summary */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Your Feedback Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(reviewData.surveyResponses || {}).map(([questionId, answer]) => {
                  // You would fetch the actual question text here
                  const questionText = getQuestionText(questionId);
                  if (!answer) return null;
                  
                  return (
                    <div key={questionId} className="bg-gray-700 p-3 rounded">
                      <p className="font-medium text-gray-300 text-sm mb-1">{questionText}</p>
                      <p className="text-white text-sm">
                        {Array.isArray(answer) ? answer.join(', ') : answer}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Feedback Input */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Additional Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Provide additional comments, specific areas for improvement, or any other feedback..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white min-h-32"
                  rows={6}
                />
                <Button 
                  onClick={handleSubmitFeedback}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get question text by ID
function getQuestionText(questionId: string): string {
  const questionMap: Record<string, string> = {
    '101': 'What is your overall impression of this obituary?',
    '102': 'How would you rate the tone of this obituary?',
    '103': 'What would you like to focus on improving?',
    // Add more mappings as needed
  };
  
  return questionMap[questionId] || `Question ${questionId}`;
}