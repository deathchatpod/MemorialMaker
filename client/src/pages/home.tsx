import React from "react";
import { Skull } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user type from URL params for survey context
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType');
  const selectedUserType = (() => {
    const typeMapping: Record<string, string> = {
      'admin': 'Admin',
      'funeral_home': 'Funeral Home',
      'employee': 'Employee', 
      'individual': 'Individual'
    };
    return typeMapping[userTypeParam || 'funeral_home'] || 'Funeral Home';
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
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <header className="text-center mb-8">
          <Skull className="h-16 w-16 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to DeathMatters</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Creating meaningful tributes and lasting memories through AI-powered obituary generation.
          </p>
        </header>

        {/* Display Survey */}
        {homePageSurvey && questions.length > 0 && (
          <section aria-labelledby="survey-heading">
            <Card className="mb-8 bg-card border-border">
              <CardHeader>
                <CardTitle id="survey-heading" className="text-xl font-semibold text-foreground">
                  {homePageSurvey.name}
                </CardTitle>
                {homePageSurvey.description && (
                  <p className="text-muted-foreground">{homePageSurvey.description}</p>
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
          </section>
        )}




      </main>


    </div>
  );
}