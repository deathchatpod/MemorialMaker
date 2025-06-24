import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Survey, Question } from "@shared/schema";

const createSurveySchema = z.object({
  name: z.string().min(1, "Survey name is required"),
  description: z.string().optional(),
  createdById: z.number(),
});

interface SurveyWithQuestionCount extends Survey {
  questionCount: number;
  createdByName: string;
}

export default function SurveyManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: surveys = [], isLoading } = useQuery<SurveyWithQuestionCount[]>({
    queryKey: ["/api/surveys"],
    queryFn: async () => {
      const [surveysResponse, questionsResponse] = await Promise.all([
        fetch('/api/surveys'),
        fetch('/api/questions')
      ]);
      
      if (!surveysResponse.ok) throw new Error('Failed to fetch surveys');
      if (!questionsResponse.ok) throw new Error('Failed to fetch questions');
      
      const surveys: Survey[] = await surveysResponse.json();
      const questions: Question[] = await questionsResponse.json();
      
      return surveys.map(survey => ({
        ...survey,
        questionCount: questions.filter(q => q.surveyId === survey.id).length,
        createdByName: "Admin User" // Simplified for now
      }));
    },
  });

  const createSurveyMutation = useMutation({
    mutationFn: async (surveyData: z.infer<typeof createSurveySchema>) => {
      return await apiRequest('POST', '/api/surveys', surveyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Survey created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create survey.",
        variant: "destructive",
      });
    },
  });

  const deleteSurveyMutation = useMutation({
    mutationFn: async (surveyId: number) => {
      return await apiRequest('DELETE', `/api/surveys/${surveyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({
        title: "Success",
        description: "Survey deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete survey.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof createSurveySchema>>({
    resolver: zodResolver(createSurveySchema),
    defaultValues: {
      name: "",
      description: "",
      createdById: 2, // Default admin user ID
    },
  });

  const onSubmit = (values: z.infer<typeof createSurveySchema>) => {
    createSurveyMutation.mutate(values);
  };

  const handleDelete = (surveyId: number) => {
    if (window.confirm("Are you sure you want to delete this survey? This action cannot be undone.")) {
      deleteSurveyMutation.mutate(surveyId);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/')}
          className="text-blue-600 hover:text-blue-700 mb-4"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Dashboard
        </Button>
        
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Platform Surveys</h2>
            <p className="text-gray-600 mt-1">Manage surveys and questions for your platform</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <i className="fas fa-plus mr-2"></i>
                Create Survey
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Survey</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Survey Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter survey name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter survey description (optional)" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createSurveyMutation.isPending}>
                      {createSurveyMutation.isPending ? "Creating..." : "Create Survey"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Surveys</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Loading surveys...
            </div>
          ) : surveys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-survey text-4xl mb-4 text-gray-300"></i>
              <p className="text-lg font-medium mb-2">No surveys yet</p>
              <p>Create your first survey to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Date Edited</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surveys.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell className="font-medium">{survey.name}</TableCell>
                    <TableCell>
                      {new Date(survey.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(survey.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{survey.createdByName}</TableCell>
                    <TableCell>{survey.questionCount}</TableCell>
                    <TableCell>
                      <Badge variant={survey.status === 'active' ? 'default' : 'secondary'}>
                        {survey.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/admin/surveys/${survey.id}/edit`)}
                        >
                          <i className="fas fa-edit mr-1"></i>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(survey.id)}
                          disabled={deleteSurveyMutation.isPending}
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}