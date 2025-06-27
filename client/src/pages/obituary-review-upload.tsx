import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, Upload, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ObituaryReviewUpload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Get the "Obituary Feedback" survey questions
  const { data: surveys = [], isLoading: surveysLoading, error: surveysError } = useQuery<any[]>({
    queryKey: ['/api/surveys'],
    retry: 1
  });

  const obituaryFeedbackSurvey = surveys.find(survey => survey.name === "Obituary Feedback");

  const { data: questions = [], isLoading: questionsLoading, error: questionsError } = useQuery<any[]>({
    queryKey: ['/api/questions'],
    enabled: !!obituaryFeedbackSurvey,
    retry: 1
  });

  const surveyQuestions = questions.filter(q => q.surveyId === obituaryFeedbackSurvey?.id);

  // Debug logging
  console.log("Surveys:", surveys);
  console.log("Obituary Feedback Survey:", obituaryFeedbackSurvey);
  console.log("Questions:", questions);
  console.log("Survey Questions:", surveyQuestions);
  console.log("Surveys Error:", surveysError);
  console.log("Questions Error:", questionsError);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a .docx or .pdf file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadedFile(file);

    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch('/api/process-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process document');
      }

      const result = await response.json();
      setExtractedText(result.text);
      
      toast({
        title: "File Uploaded Successfully",
        description: "Document text has been extracted.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to process the document. Please try again.",
        variant: "destructive",
      });
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle survey answer changes
  const handleAnswerChange = (questionId: number, value: any) => {
    setSurveyAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Render question input based on type
  const renderQuestionInput = (question: any) => {
    const currentValue = surveyAnswers[question.id] || '';

    switch (question.questionType) {
      case 'text':
        return (
          <Input
            value={currentValue}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholderText || "Enter your answer"}
            className="bg-gray-700 border-gray-600 text-white"
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={currentValue}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholderText || "Enter your answer"}
            className="bg-gray-700 border-gray-600 text-white"
            rows={4}
          />
        );

      case 'select':
        const selectOptions = question.answerOptions || [];
        return (
          <Select value={currentValue} onValueChange={(value) => handleAnswerChange(question.id, value)}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        const radioOptions = question.answerOptions || [];
        return (
          <RadioGroup value={currentValue} onValueChange={(value) => handleAnswerChange(question.id, value)}>
            {radioOptions.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="text-gray-300">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        const checkboxOptions = question.answerOptions || [];
        const checkedValues = Array.isArray(currentValue) ? currentValue : [];
        return (
          <div className="space-y-2">
            {checkboxOptions.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={checkedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...checkedValues, option]
                      : checkedValues.filter((v: string) => v !== option);
                    handleAnswerChange(question.id, newValues);
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`} className="text-gray-300">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <Input
            value={currentValue}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholderText || "Enter your answer"}
            className="bg-gray-700 border-gray-600 text-white"
          />
        );
    }
  };

  // Check if all required questions are answered
  const requiredQuestions = surveyQuestions.filter(q => q.isRequired);
  const allRequiredAnswered = requiredQuestions.every(q => {
    const answer = surveyAnswers[q.id];
    return answer !== undefined && answer !== '' && answer !== null;
  });

  const canPreview = allRequiredAnswered && uploadedFile && extractedText;

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/dashboard')}
          className="text-white hover:text-gray-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Upload className="w-5 h-5 mr-2" />
              Upload Existing Obituary for Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            
            {/* Survey Questions Section */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Obituary Feedback Survey
              </h3>
              
              {surveysLoading && (
                <div className="text-gray-400">Loading survey questions...</div>
              )}
              
              {surveysError && (
                <div className="text-red-400">
                  Error loading survey: {surveysError instanceof Error ? surveysError.message : "Unknown error"}
                </div>
              )}
              
              {!surveysLoading && !surveysError && !obituaryFeedbackSurvey && (
                <div className="text-yellow-400">
                  "Obituary Feedback" survey not found. Please ensure the survey exists.
                </div>
              )}
              
              {obituaryFeedbackSurvey && (
                <div>
                  <p className="text-gray-300 mb-4">
                    Please answer these questions about the obituary you're uploading:
                  </p>
                  
                  {questionsLoading && (
                    <div className="text-gray-400">Loading questions...</div>
                  )}
                  
                  {questionsError && (
                    <div className="text-red-400">
                      Error loading questions: {questionsError instanceof Error ? questionsError.message : "Unknown error"}
                    </div>
                  )}
                  
                  {!questionsLoading && !questionsError && surveyQuestions.length === 0 && (
                    <div className="text-yellow-400">
                      No questions found for this survey.
                    </div>
                  )}
                  
                  {surveyQuestions.length > 0 && (
                    <div className="space-y-6">
                      {surveyQuestions
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((question) => (
                          <div key={question.id} className="space-y-2">
                            <Label className="text-gray-300 font-medium">
                              {question.questionText}
                              {question.isRequired && (
                                <span className="text-red-400 ml-1">*</span>
                              )}
                            </Label>
                            {renderQuestionInput(question)}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Document Upload Section */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Upload Document</h3>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                {uploadedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <FileText className="w-12 h-12 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{uploadedFile.name}</p>
                      <p className="text-gray-400 text-sm">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {extractedText && (
                        <Badge className="bg-green-100 text-green-800 mt-2">
                          Text Extracted Successfully
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUploadedFile(null);
                        setExtractedText("");
                        const input = document.getElementById('file-upload') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Upload Different File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-white mb-2">Upload your obituary document</p>
                      <p className="text-gray-400 text-sm mb-4">
                        Supports .docx and .pdf files (max 10MB)
                      </p>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".docx,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <Button 
                          variant="outline" 
                          className="border-gray-600 text-gray-300 hover:bg-gray-700" 
                          disabled={isUploading}
                          type="button"
                        >
                          {isUploading ? 'Processing...' : 'Choose File'}
                        </Button>
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Button */}
            <div className="flex justify-end">
              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogTrigger asChild>
                  <Button 
                    disabled={!canPreview}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Obituary Feedback Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col bg-gray-800 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Preview Obituary Feedback Request</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto space-y-6">
                    {/* Survey Answers Summary */}
                    <div>
                      <h4 className="font-semibold text-white mb-3">Survey Responses</h4>
                      <div className="space-y-3">
                        {surveyQuestions.map((question) => {
                          const answer = surveyAnswers[question.id];
                          if (!answer) return null;
                          
                          return (
                            <div key={question.id} className="bg-gray-700 p-3 rounded">
                              <p className="font-medium text-gray-300 text-sm">{question.questionText}</p>
                              <p className="text-white mt-1">
                                {Array.isArray(answer) ? answer.join(', ') : answer}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Document Preview */}
                    <div>
                      <h4 className="font-semibold text-white mb-3">Document Preview</h4>
                      <div className="bg-gray-700 p-4 rounded max-h-96 overflow-y-auto">
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">
                          {extractedText.length > 1000 
                            ? `${extractedText.substring(0, 1000)}...` 
                            : extractedText}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsPreviewOpen(false)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Go Back
                      </Button>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          // TODO: Implement confirmation and proceed to AI processing
                          toast({
                            title: "Feature Coming Soon",
                            description: "AI processing will be implemented in the next phase.",
                          });
                        }}
                      >
                        Confirm & Proceed
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}