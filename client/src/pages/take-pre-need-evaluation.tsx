import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { FileText, AlertCircle } from 'lucide-react';
import { ConditionalSurveyForm } from '@/components/conditional-survey-form';

interface Survey {
  id: number;
  name: string;
  description: string;
  status: string;
}

interface Question {
  id: number;
  surveyId: number;
  questionText: string;
  questionType: string;
  placeholder?: string;
  isRequired: boolean;
  options: string[];
  orderIndex: number;
  conditionalQuestionId?: number;
  conditionalValue?: string;
  conditionalOperator?: string;
}

export default function TakePreNeedEvaluation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get current user context from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const currentUserId = parseInt(urlParams.get('userId') || '1');
  const currentUserType = urlParams.get('userType') || 'admin';
  const currentFuneralHomeId = urlParams.get('funeralHomeId') ? parseInt(urlParams.get('funeralHomeId')!) : undefined;

  // Find the Individual Needs Assessment Survey
  const { data: surveys = [], isLoading: surveysLoading } = useQuery<Survey[]>({
    queryKey: ['/api/surveys'],
    queryFn: async () => {
      const response = await fetch('/api/surveys');
      if (!response.ok) throw new Error('Failed to fetch surveys');
      return response.json();
    },
  });

  const needsAssessmentSurvey = surveys.find(s => 
    s.name === 'Individual Need Assessment Survey' && s.status === 'active'
  );

  // Fetch questions for the needs assessment survey
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions', needsAssessmentSurvey?.id],
    queryFn: async () => {
      const response = await fetch('/api/questions');
      if (!response.ok) throw new Error('Failed to fetch questions');
      const allQuestions = await response.json();
      return allQuestions.filter((q: Question) => q.surveyId === needsAssessmentSurvey?.id);
    },
    enabled: !!needsAssessmentSurvey,
  });

  // Submit evaluation mutation
  const submitEvaluation = useMutation({
    mutationFn: async (responses: any) => {
      const response = await fetch('/api/survey-responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surveyId: needsAssessmentSurvey!.id,
          responses,
          responseType: 'pre_need_evaluation',
          completedById: currentUserId,
          completedByType: currentUserType,
          funeralHomeId: currentFuneralHomeId,
        }),
      });
      if (!response.ok) throw new Error('Failed to submit evaluation');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Evaluation Completed",
        description: "Your pre-need evaluation has been submitted successfully"
      });
      // Navigate back to dashboard
      const params = new URLSearchParams({
        userId: currentUserId.toString(),
        userType: currentUserType,
      });
      if (currentFuneralHomeId) {
        params.append('funeralHomeId', currentFuneralHomeId.toString());
      }
      setLocation(`/?${params}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit evaluation. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (responses: any) => {
    submitEvaluation.mutate(responses);
  };

  const handleCancel = () => {
    const params = new URLSearchParams({
      userId: currentUserId.toString(),
      userType: currentUserType,
    });
    if (currentFuneralHomeId) {
      params.append('funeralHomeId', currentFuneralHomeId.toString());
    }
    setLocation(`/?${params}`);
  };

  if (surveysLoading || questionsLoading) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading evaluation form...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!needsAssessmentSurvey) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              No Active Survey Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The Individual Needs Assessment Survey is not currently active. Please contact your administrator to activate the survey before taking a pre-need evaluation.
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex gap-4">
              <Button variant="outline" onClick={handleCancel}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pre Need Evaluation</h1>
        <p className="text-gray-600">
          Complete this comprehensive assessment to help us understand your funeral planning needs and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {needsAssessmentSurvey.name}
          </CardTitle>
          {needsAssessmentSurvey.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {needsAssessmentSurvey.description}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ConditionalSurveyForm
            questions={questions}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={submitEvaluation.isPending}
            submitButtonText="Submit Evaluation"
            cancelButtonText="Cancel"
          />
        </CardContent>
      </Card>
    </main>
  );
}