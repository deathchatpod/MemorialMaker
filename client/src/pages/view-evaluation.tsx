import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, Calendar, User } from 'lucide-react';
import { format, isValid } from 'date-fns';

interface SurveyResponse {
  id: number;
  surveyId: number;
  responses: any;
  responseType: string;
  completedById: number;
  completedByType: string;
  funeralHomeId?: number;
  createdAt?: string;
  submittedAt?: string;
}

interface Question {
  id: number;
  surveyId: number;
  questionText: string;
  questionType: string;
  options: string[];
}

export default function ViewEvaluation() {
  const [, params] = useRoute("/view-evaluation/:id");
  const [, setLocation] = useLocation();
  const evaluationId = parseInt(params?.id || "0");

  // Get current user context from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const currentUserId = parseInt(urlParams.get('userId') || '1');
  const currentUserType = urlParams.get('userType') || 'admin';
  const currentFuneralHomeId = urlParams.get('funeralHomeId') ? parseInt(urlParams.get('funeralHomeId')!) : undefined;

  // Safe date formatting function
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Unknown Date';
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'MMMM d, yyyy') : 'Invalid Date';
  };

  // Fetch the evaluation
  const { data: evaluation, isLoading: evaluationLoading } = useQuery<SurveyResponse>({
    queryKey: ['/api/survey-responses', evaluationId],
    queryFn: async () => {
      const response = await fetch(`/api/survey-responses/${evaluationId}`);
      if (!response.ok) throw new Error('Failed to fetch evaluation');
      return response.json();
    },
    enabled: !!evaluationId,
  });

  // Fetch all questions to match responses
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
    queryFn: async () => {
      const response = await fetch('/api/questions');
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
  });

  const handleBack = () => {
    const params = new URLSearchParams({
      userId: currentUserId.toString(),
      userType: currentUserType,
    });
    if (currentFuneralHomeId) {
      params.append('funeralHomeId', currentFuneralHomeId.toString());
    }
    setLocation(`/?${params}`);
  };

  const getQuestionText = (questionId: number) => {
    const question = questions.find(q => q.id === questionId);
    return question ? question.questionText : `Question ${questionId}`;
  };

  const formatResponse = (questionId: number, response: any) => {
    const question = questions.find(q => q.id === questionId);
    
    if (!response || (Array.isArray(response) && response.length === 0)) {
      return <span className="text-muted-foreground italic">No response</span>;
    }

    if (Array.isArray(response)) {
      return response.join(', ');
    }

    if (typeof response === 'boolean') {
      return response ? 'Yes' : 'No';
    }

    return response.toString();
  };

  if (evaluationLoading || questionsLoading) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading evaluation...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!evaluation) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Evaluation Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The requested evaluation could not be found.
              </p>
              <Button onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Evaluations
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button 
        variant="ghost" 
        onClick={handleBack}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Return to Evaluations
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Pre Need Evaluation Results
              </CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(evaluation.submittedAt || evaluation.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {evaluation.completedByType} {evaluation.completedById}
                </span>
              </div>
            </div>
            <Badge variant="secondary">Completed</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {evaluation.responses && Object.entries(evaluation.responses).map(([questionId, response], index) => (
              <div key={questionId}>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Question {index + 1}
                  </h4>
                  <p className="text-base font-medium">
                    {getQuestionText(parseInt(questionId))}
                  </p>
                  <div className="bg-muted/50 p-3 rounded-md">
                    {formatResponse(parseInt(questionId), response)}
                  </div>
                </div>
                {index < Object.entries(evaluation.responses).length - 1 && (
                  <Separator className="mt-6" />
                )}
              </div>
            ))}
            
            {(!evaluation.responses || Object.keys(evaluation.responses).length === 0) && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No responses recorded for this evaluation.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}