import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Survey, Question } from "@shared/schema";

const questionSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  questionType: z.string().min(1, "Question type is required"),
  placeholder: z.string().optional(),
  isRequired: z.boolean().default(false),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
  orderIndex: z.number(),
});

const questionTypes = [
  { value: "text", label: "Text Input" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "date", label: "Date" },
  { value: "radio", label: "Multiple Choice (Single)" },
  { value: "checkbox", label: "Multiple Choice (Multiple)" },
  { value: "select", label: "Dropdown" },
];

export default function SurveyEditor() {
  const [, params] = useRoute("/admin/surveys/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const surveyId = params?.id ? parseInt(params.id) : null;

  const { data: survey } = useQuery<Survey>({
    queryKey: [`/api/surveys/${surveyId}`],
    queryFn: async () => {
      const response = await fetch(`/api/surveys/${surveyId}`);
      if (!response.ok) throw new Error('Failed to fetch survey');
      return response.json();
    },
    enabled: !!surveyId,
  });

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: [`/api/questions`, surveyId],
    queryFn: async () => {
      const response = await fetch(`/api/questions?surveyId=${surveyId}`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
    enabled: !!surveyId,
  });

  const updateSurveyMutation = useMutation({
    mutationFn: async (data: { status: string }) => {
      return await apiRequest('PUT', `/api/surveys/${surveyId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/${surveyId}`] });
      toast({
        title: "Success",
        description: "Survey status updated successfully.",
      });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (questionData: z.infer<typeof questionSchema>) => {
      return await apiRequest('POST', '/api/questions', {
        ...questionData,
        surveyId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions`, surveyId] });
      setIsAddQuestionOpen(false);
      setEditingQuestion(null);
      form.reset();
      toast({
        title: "Success",
        description: "Question saved successfully.",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Question> }) => {
      return await apiRequest('PUT', `/api/questions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions`, surveyId] });
      setEditingQuestion(null);
      form.reset();
      toast({
        title: "Success",
        description: "Question updated successfully.",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      return await apiRequest('DELETE', `/api/questions/${questionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions`, surveyId] });
      toast({
        title: "Success",
        description: "Question deleted successfully.",
      });
    },
  });

  const form = useForm<z.infer<typeof questionSchema>>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      questionText: "",
      questionType: "",
      placeholder: "",
      isRequired: false,
      options: [],
      orderIndex: questions.length + 1,
    },
  });

  const watchedQuestionType = form.watch("questionType");
  const needsOptions = ["radio", "checkbox", "select"].includes(watchedQuestionType);

  React.useEffect(() => {
    if (editingQuestion) {
      form.reset({
        questionText: editingQuestion.questionText,
        questionType: editingQuestion.questionType,
        placeholder: editingQuestion.placeholder || "",
        isRequired: editingQuestion.isRequired,
        options: editingQuestion.options as any[] || [],
        orderIndex: editingQuestion.orderIndex,
      });
    } else {
      form.reset({
        questionText: "",
        questionType: "",
        placeholder: "",
        isRequired: false,
        options: [],
        orderIndex: questions.length + 1,
      });
    }
  }, [editingQuestion, questions.length, form]);

  const onSubmit = (values: z.infer<typeof questionSchema>) => {
    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, data: values });
    } else {
      createQuestionMutation.mutate(values);
    }
  };

  const handleDeleteQuestion = (questionId: number) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      deleteQuestionMutation.mutate(questionId);
    }
  };

  const toggleSurveyStatus = () => {
    const newStatus = survey?.status === 'active' ? 'draft' : 'active';
    updateSurveyMutation.mutate({ status: newStatus });
  };

  if (!survey) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          Loading survey...
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/admin/surveys')}
          className="text-blue-600 hover:text-blue-700 mb-4"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Surveys
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{survey.name}</h2>
            <p className="text-gray-600 mt-1">{survey.description || "No description"}</p>
            <div className="flex items-center mt-2 space-x-4">
              <Badge variant={survey.status === 'active' ? 'default' : 'secondary'}>
                {survey.status}
              </Badge>
              <span className="text-sm text-gray-500">
                Version {survey.version}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={toggleSurveyStatus}
              disabled={updateSurveyMutation.isPending}
            >
              {survey.status === 'active' ? 'Mark as Draft' : 'Publish Survey'}
            </Button>
            
            <Dialog open={isAddQuestionOpen || !!editingQuestion} onOpenChange={(open) => {
              setIsAddQuestionOpen(open);
              if (!open) setEditingQuestion(null);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <i className="fas fa-plus mr-2"></i>
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingQuestion ? 'Edit Question' : 'Add New Question'}
                  </DialogTitle>
                </DialogHeader>
                <QuestionForm
                  form={form}
                  onSubmit={onSubmit}
                  needsOptions={needsOptions}
                  isLoading={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                  onCancel={() => {
                    setIsAddQuestionOpen(false);
                    setEditingQuestion(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Questions ({questions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-question-circle text-4xl mb-4 text-gray-300"></i>
                  <p className="text-lg font-medium mb-2">No questions yet</p>
                  <p>Add your first question to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-gray-500">
                              {index + 1}.
                            </span>
                            <span className="text-sm text-gray-500 uppercase">
                              {question.questionType}
                            </span>
                            {question.isRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium">{question.questionText}</p>
                          {question.placeholder && (
                            <p className="text-sm text-gray-500 mt-1">
                              Placeholder: {question.placeholder}
                            </p>
                          )}
                          {question.options && question.options.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600 mb-1">Options:</p>
                              <ul className="text-sm text-gray-500 list-disc list-inside">
                                {(question.options as any[]).map((option, i) => (
                                  <li key={i}>{option.label}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingQuestion(question)}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteQuestion(question.id)}
                            disabled={deleteQuestionMutation.isPending}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Survey Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  This is how your survey will appear to users.
                </div>
                
                {questions.length > 0 && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-medium mb-4">{survey.name}</h3>
                    <div className="space-y-3">
                      {questions
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .slice(0, 3)
                        .map((question, index) => (
                        <div key={question.id} className="text-sm">
                          <label className="block font-medium text-gray-700">
                            {index + 1}. {question.questionText}
                            {question.isRequired && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>
                          <div className="mt-1">
                            {question.questionType === 'textarea' ? (
                              <div className="w-full h-20 border rounded bg-white"></div>
                            ) : question.questionType === 'radio' ? (
                              <div className="space-y-1">
                                {(question.options as any[] || []).slice(0, 2).map((option, i) => (
                                  <div key={i} className="flex items-center space-x-2">
                                    <div className="w-3 h-3 border border-gray-300 rounded-full"></div>
                                    <span className="text-gray-600">{option.label}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="w-full h-8 border rounded bg-white"></div>
                            )}
                          </div>
                        </div>
                      ))}
                      {questions.length > 3 && (
                        <div className="text-xs text-gray-400 italic">
                          ... and {questions.length - 3} more questions
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function QuestionForm({ 
  form, 
  onSubmit, 
  needsOptions, 
  isLoading, 
  onCancel 
}: {
  form: any;
  onSubmit: (values: any) => void;
  needsOptions: boolean;
  isLoading: boolean;
  onCancel: () => void;
}) {
  const [options, setOptions] = useState<Array<{ label: string; value: string }>>([]);

  React.useEffect(() => {
    const currentOptions = form.getValues("options") || [];
    setOptions(currentOptions.length > 0 ? currentOptions : [{ label: "", value: "" }]);
  }, [form]);

  const addOption = () => {
    setOptions([...options, { label: "", value: "" }]);
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    form.setValue("options", newOptions);
  };

  const updateOption = (index: number, field: "label" | "value", value: string) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    if (field === "label") {
      newOptions[index].value = value.toLowerCase().replace(/\s+/g, "_");
    }
    setOptions(newOptions);
    form.setValue("options", newOptions);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="questionText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Text</FormLabel>
              <FormControl>
                <Input placeholder="Enter your question" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="questionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {questionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="placeholder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placeholder Text (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter placeholder text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isRequired"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Required Question</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {needsOptions && (
          <div>
            <FormLabel>Answer Options</FormLabel>
            <div className="space-y-2 mt-2">
              {options.map((option, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    placeholder="Option label"
                    value={option.label}
                    onChange={(e) => updateOption(index, "label", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                    disabled={options.length === 1}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addOption}>
                <i className="fas fa-plus mr-1"></i>
                Add Option
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Question"}
          </Button>
        </div>
      </form>
    </Form>
  );
}