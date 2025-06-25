import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skull } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ConditionalSurveyForm from "@/components/ConditionalSurveyForm";
import type { Survey, Question, UserType } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user type from URL params for survey context
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType');
  const selectedUserType = (() => {
    const typeMapping = {
      'admin': 'Admin',
      'funeral_home': 'Funeral Home',
      'employee': 'Employee', 
      'individual': 'Individual'
    };
    return typeMapping[userTypeParam] || 'Funeral Home';
  })();



  // Fetch all surveys to find "Home Page" survey
  const { data: surveys = [] } = useQuery<Survey[]>({
    queryKey: ["/api/surveys"],
    queryFn: async () => {
      const response = await fetch('/api/surveys');
      if (!response.ok) throw new Error('Failed to fetch surveys');
      return response.json();
    },
  });

  // Fetch all questions
  const { data: allQuestions = [] } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
    queryFn: async () => {
      const response = await fetch('/api/questions');
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
  });

  // Fetch user types for dropdown
  const { data: userTypes = [] } = useQuery<UserType[]>({
    queryKey: ["/api/user-types"],
    queryFn: async () => {
      const response = await fetch('/api/user-types');
      if (!response.ok) throw new Error('Failed to fetch user types');
      return response.json();
    },
  });

  // Find "Home Page" survey
  const homePageSurvey = surveys.find(survey => survey.name === "Home Page");
  // Get questions for the home page survey
  const questions = homePageSurvey 
    ? allQuestions.filter(q => q.surveyId === homePageSurvey.id)
    : [];

  const submitSurveyMutation = useMutation({
    mutationFn: async (formData: Record<string, any>) => {
      if (!homePageSurvey) {
        throw new Error("Survey not found");
      }

      const userType = userTypes.find(ut => ut.name === selectedUserType);
      if (!userType) {
        throw new Error("Invalid user type");
      }

      return await apiRequest("POST", "/api/survey-responses", {
        surveyId: homePageSurvey.id,
        userTypeId: userType.id,
        responses: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Survey Submitted",
        description: "Thank you for your feedback!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/survey-responses'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit survey. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSurveySubmit = (formData: Record<string, any>) => {
    submitSurveyMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <Skull className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to DeathMatters</h2>
          <p className="text-lg text-gray-600 mb-8">
            Creating meaningful tributes and lasting memories through AI-powered obituary generation.
          </p>
        </div>

        {/* Display Survey */}
        {homePageSurvey && questions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {homePageSurvey.name}
              </CardTitle>
              {homePageSurvey.description && (
                <p className="text-gray-600">{homePageSurvey.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <ConditionalSurveyForm
                questions={questions}
                onSubmit={handleSurveySubmit}
                isLoading={submitSurveyMutation.isPending}
                userType={selectedUserType}
              />
            </CardContent>
          </Card>
        )}

        {/* Always show placeholder when no survey */}
        {(!homePageSurvey || questions.length === 0) && (
          <Card className="mb-8">
            <CardContent className="py-8 text-center">
              <div>
                <Label className="text-base font-medium">Viewing as: {selectedUserType}</Label>
                <p className="text-sm text-gray-500 mt-1">
                  Use the header dropdown to switch between user types for testing
                </p>
              </div>
              <p className="text-gray-500 mt-4">
                Survey content will appear here when an admin publishes a "Home Page" survey.
              </p>
            </CardContent>
          </Card>
        )}


      </main>


    </div>
  );
}