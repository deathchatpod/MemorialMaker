import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { FileText, AlertCircle } from 'lucide-react';
import ConditionalSurveyForm from '@/components/ConditionalSurveyForm';
import { apiRequest } from '@/lib/queryClient';

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
  placeholder: string | null;
  isRequired: boolean;
  options: unknown;
  orderIndex: number;
  conditionalQuestionId: number | null;
  conditionalValue: string | null;
  conditionalOperator: string | null;
  createdAt: Date;
}

export default function TakePreNeedBasics() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user context from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const currentUserId = parseInt(urlParams.get('userId') || '1');
  const currentUserType = urlParams.get('userType') || 'admin';
  const currentFuneralHomeId = urlParams.get('funeralHomeId') ? parseInt(urlParams.get('funeralHomeId')!) : undefined;

  // Fetch current user information for auto-fill
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user', currentUserId, currentUserType],
    queryFn: async () => {
      let endpoint = '';
      if (currentUserType === 'admin') {
        endpoint = `/api/admin-users/${currentUserId}`;
      } else if (currentUserType === 'funeral_home') {
        endpoint = `/api/funeral-homes/${currentUserId}`;
      } else if (currentUserType === 'employee') {
        endpoint = `/api/employees/${currentUserId}`;
      } else if (currentUserType === 'individual') {
        endpoint = `/api/individuals/${currentUserId}`;
      }
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
  });

  // Fetch Pre Need Basics survey
  const { data: survey, isLoading: surveyLoading } = useQuery<Survey>({
    queryKey: ['/api/surveys', 'pre-need-basics'],
    queryFn: async () => {
      const response = await fetch('/api/surveys');
      if (!response.ok) throw new Error('Failed to fetch surveys');
      const surveys = await response.json();
      const preNeedBasics = surveys.find((s: Survey) => s.name === 'Pre Need Basics');
      if (!preNeedBasics) throw new Error('Pre Need Basics survey not found');
      return preNeedBasics;
    },
  });

  // Fetch questions for the Pre Need Basics survey
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions', survey?.id],
    queryFn: async () => {
      if (!survey?.id) return [];
      const response = await fetch(`/api/questions?surveyId=${survey.id}`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
    enabled: !!survey?.id,
  });

  // Check if user has already completed Pre Need Basics (for individuals only)
  const { data: existingBasics } = useQuery({
    queryKey: ['/api/survey-responses/pre-need-basics', currentUserId, currentUserType],
    queryFn: async () => {
      if (currentUserType !== 'individual') return null;
      
      const response = await fetch('/api/survey-responses/type/pre_need_basics');
      if (!response.ok) return null;
      
      const responses = await response.json();
      return responses.find((r: any) => 
        r.completedById === currentUserId && 
        r.completedByType === currentUserType &&
        r.surveyId === survey?.id
      );
    },
    enabled: currentUserType === 'individual' && !!survey?.id,
  });

  // Submit survey response
  const submitMutation = useMutation({
    mutationFn: async (formData: Record<string, any>) => {
      const responseData = {
        surveyId: survey!.id,
        responses: formData,
        responseType: 'pre_need_basics',
        completedById: currentUserId,
        completedByType: currentUserType,
        funeralHomeId: currentFuneralHomeId,
      };

      return await apiRequest('POST', '/api/survey-responses', responseData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Pre Need Basics completed successfully!",
      });
      
      // Navigate back to dashboard
      const params = new URLSearchParams({
        userId: currentUserId.toString(),
        userType: currentUserType,
      });
      if (currentFuneralHomeId) {
        params.append('funeralHomeId', currentFuneralHomeId.toString());
      }
      setLocation(`/dashboard?${params}&section=pre-need`);
    },
    onError: (error) => {
      console.error('Error submitting Pre Need Basics:', error);
      toast({
        title: "Error",
        description: "Failed to submit Pre Need Basics. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (formData: Record<string, any>) => {
    submitMutation.mutate(formData);
  };

  // Show loading state
  if (surveyLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-300">Loading Pre Need Basics...</p>
        </div>
      </div>
    );
  }

  // Show error if survey not found
  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Survey Not Available</h3>
              <p className="text-gray-400 mb-4">
                The Pre Need Basics survey is not currently available.
              </p>
              <Button 
                onClick={() => setLocation('/dashboard')}
                variant="outline"
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show completion message for individuals who already completed
  if (currentUserType === 'individual' && existingBasics) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Already Completed</h3>
              <p className="text-gray-400 mb-4">
                You have already completed the Pre Need Basics survey. Individual users can only complete this once.
              </p>
              <Button 
                onClick={() => {
                  const params = new URLSearchParams({
                    userId: currentUserId.toString(),
                    userType: currentUserType,
                  });
                  setLocation(`/dashboard?${params}&section=pre-need`);
                }}
                variant="outline"
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <FileText className="w-5 h-5 mr-2" />
              Pre Need Basics
            </CardTitle>
            {survey.description && (
              <p className="text-gray-400 mt-2">{survey.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <Alert className="mb-6 bg-blue-900/20 border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                This comprehensive guide helps your family navigate important matters by focusing on where to find information and key contacts.
                {currentUserType === 'individual' && (
                  <span className="block mt-1 font-medium">
                    Note: Individual users can only complete this survey once per account.
                  </span>
                )}
              </AlertDescription>
            </Alert>

            <ConditionalSurveyForm
              questions={questions}
              onSubmit={handleSubmit}
              isSubmitting={submitMutation.isPending}
              currentUser={currentUser}
              autoFillForSelf={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}