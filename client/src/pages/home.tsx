import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Skull } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Survey, Question, UserType } from "@shared/schema";

export default function Home() {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedUserType, setSelectedUserType] = useState("");
  const { toast } = useToast();

  // Fetch the "Home Page" survey
  const { data: surveys } = useQuery<Survey[]>({
    queryKey: ["/api/surveys"],
  });

  const homePageSurvey = surveys?.find(s => s.name === "Home Page" && s.status === "active");

  // Fetch questions for the home page survey
  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
    select: (data) => data.filter(q => q.surveyId === homePageSurvey?.id),
    enabled: !!homePageSurvey,
  });

  // Fetch user types
  const { data: userTypes = [] } = useQuery<UserType[]>({
    queryKey: ["/api/user-types"],
  });

  const submitSurveyMutation = useMutation({
    mutationFn: async () => {
      if (!homePageSurvey || !selectedUserType) {
        throw new Error("Survey or user type not selected");
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
        title: "Thank you!",
        description: "Your information has been submitted successfully.",
      });
      setFormData({});
      setSelectedUserType("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit your information. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (questionId: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserType) {
      toast({
        title: "Please select user type",
        description: "Please select what type of user you are before submitting.",
        variant: "destructive",
      });
      return;
    }
    submitSurveyMutation.mutate();
  };

  const renderQuestion = (question: Question) => {
    const questionId = question.id;
    const value = formData[questionId] || "";

    switch (question.questionType) {
      case "text":
        return (
          <Input
            value={value}
            onChange={(e) => handleInputChange(questionId, e.target.value)}
            placeholder="Your answer..."
          />
        );

      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(questionId, e.target.value)}
            placeholder="Your answer..."
            rows={3}
          />
        );

      case "select":
        const selectOptions = question.options as string[] || [];
        return (
          <Select
            value={value}
            onValueChange={(val) => handleInputChange(questionId, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "radio":
        const radioOptions = question.options as string[] || [];
        return (
          <RadioGroup
            value={value}
            onValueChange={(val) => handleInputChange(questionId, val)}
          >
            {radioOptions.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${questionId}-${index}`} />
                <Label htmlFor={`${questionId}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "checkbox":
        const checkboxOptions = question.options as string[] || [];
        const selectedOptions = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {checkboxOptions.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${questionId}-${index}`}
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleInputChange(questionId, [...selectedOptions, option]);
                    } else {
                      handleInputChange(questionId, selectedOptions.filter((o: string) => o !== option));
                    }
                  }}
                />
                <Label htmlFor={`${questionId}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleInputChange(questionId, e.target.value)}
            placeholder="Your answer..."
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Skull className="h-8 w-8 text-gray-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">DeathMatters</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline">Log In</Button>
              </Link>
              <Link href="/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Survey Content Above Login/Signup */}
        {homePageSurvey && questions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                {homePageSurvey.name}
              </CardTitle>
              {homePageSurvey.description && (
                <p className="text-gray-600 text-center">
                  {homePageSurvey.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* User Type Selection */}
                <div>
                  <Label className="text-base font-medium">I am a...</Label>
                  <Select
                    value={selectedUserType}
                    onValueChange={setSelectedUserType}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select your user type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {userTypes.map((userType) => (
                        <SelectItem key={userType.id} value={userType.name}>
                          {userType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Survey Questions */}
                {questions.map((question) => (
                  <div key={question.id}>
                    <Label className="text-base font-medium">
                      {question.questionText}
                      {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <div className="mt-2">
                      {renderQuestion(question)}
                    </div>
                  </div>
                ))}

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={submitSurveyMutation.isPending}
                >
                  {submitSurveyMutation.isPending ? "Submitting..." : "Submit"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Welcome Card with Login/Signup */}
        <Card>
          <CardContent className="py-12 text-center">
            <Skull className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to DeathMatters</h2>
            <p className="text-gray-600 mb-6">
              Creating meaningful tributes and lasting memories through AI-powered obituary generation.
            </p>
            <div className="space-x-4">
              <Link href="/login">
                <Button variant="outline">Log In</Button>
              </Link>
              <Link href="/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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