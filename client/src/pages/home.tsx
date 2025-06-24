import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
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

  // Check if user is authenticated
  const { data: authenticatedUser } = useQuery({
    queryKey: ['/auth/user'],
    queryFn: async () => {
      const response = await fetch('/auth/user');
      if (!response.ok) throw new Error('Not authenticated');
      return response.json();
    },
    retry: false,
  });

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
  console.log("Home Page Survey:", homePageSurvey);
  console.log("All surveys:", surveys);

  // Get questions for the home page survey
  const questions = homePageSurvey 
    ? allQuestions.filter(q => q.surveyId === homePageSurvey.id)
    : [];
  console.log("Filtered questions for survey", homePageSurvey?.id, ":", questions);

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

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Writing</h3>
              <p className="text-gray-600">
                Our advanced AI helps create personalized, meaningful obituaries that capture a life's essence.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Collaborative Creation</h3>
              <p className="text-gray-600">
                Family and friends can collaborate together to ensure every important detail is included.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Memorial Spaces</h3>
              <p className="text-gray-600">
                Create lasting digital memorials where loved ones can share memories and condolences.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          {authenticatedUser ? (
            <div className="space-y-4">
              <p className="text-lg text-gray-600">Welcome back! Ready to continue your work?</p>
              <div className="flex justify-center space-x-4">
                <Link href="/dashboard">
                  <Button size="lg">Go to Dashboard</Button>
                </Link>
                <Button variant="outline" size="lg" onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg text-gray-600">Ready to create meaningful tributes?</p>
              <div className="flex justify-center space-x-4">
                <Link href="/login">
                  <Button size="lg">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="lg">Create Account</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Skull className="h-6 w-6 text-gray-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">DeathMatters</span>
            </div>
            <p className="text-gray-500">
              Creating meaningful tributes and preserving memories with compassion and technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}