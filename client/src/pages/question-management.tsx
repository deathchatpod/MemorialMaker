import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
// UserContext removed
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Question } from "@shared/schema";

interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export default function QuestionManagement() {
  const { currentUser } = useContext(UserContext);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("basic");

  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
    queryFn: async () => {
      const response = await fetch('/api/questions');
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (questionData: Partial<Question>) => {
      return await apiRequest('POST', '/api/questions', questionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Success",
        description: "Question created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create question.",
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Question> }) => {
      return await apiRequest('PUT', `/api/questions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Success",
        description: "Question updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update question.",
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Success",
        description: "Question deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete question.",
        variant: "destructive",
      });
    },
  });

  // Redirect if not admin
  if (currentUser.userType !== 'admin') {
    setLocation('/');
    return null;
  }

  const categories = [
    { value: "basic", label: "Basic Info" },
    { value: "biography", label: "Biography" },
    { value: "family", label: "Family" },
    { value: "characteristics", label: "Characteristics" },
    { value: "hobbies", label: "Hobbies" },
  ];

  const questionsByCategory = categories.reduce((acc, category) => {
    acc[category.value] = questions.filter(q => q.category === category.value);
    return acc;
  }, {} as Record<string, Question[]>);

  const QuestionItem = ({ question }: { question: Question }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
      questionText: question.questionText,
      isRequired: question.isRequired,
      placeholder: question.placeholder || '',
      options: question.options as QuestionOption[] || [],
    });

    const handleSave = () => {
      updateQuestionMutation.mutate({
        id: question.id,
        data: {
          questionText: editData.questionText,
          isRequired: editData.isRequired,
          placeholder: editData.placeholder || null,
          options: editData.options.length > 0 ? editData.options : null,
        },
      });
      setIsEditing(false);
    };

    const addOption = () => {
      setEditData({
        ...editData,
        options: [...editData.options, { value: '', label: '', description: '' }],
      });
    };

    const updateOption = (index: number, field: string, value: string) => {
      const updatedOptions = [...editData.options];
      updatedOptions[index] = { ...updatedOptions[index], [field]: value };
      setEditData({ ...editData, options: updatedOptions });
    };

    const removeOption = (index: number) => {
      const updatedOptions = editData.options.filter((_, i) => i !== index);
      setEditData({ ...editData, options: updatedOptions });
    };

    return (
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editData.questionText}
                  onChange={(e) => setEditData({ ...editData, questionText: e.target.value })}
                  className="font-medium text-gray-900 mb-2"
                />
              ) : (
                <h4 className="font-medium text-gray-900">{question.questionText}</h4>
              )}
              <div className="text-sm text-gray-500">
                {question.questionType} - {question.isRequired ? 'Required' : 'Optional'}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={editData.isRequired}
                    onCheckedChange={(checked) => setEditData({ ...editData, isRequired: !!checked })}
                  />
                  <label className="text-sm text-gray-700">Required</label>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Checkbox checked={question.isRequired} disabled />
                  <label className="text-sm text-gray-700">Required</label>
                </div>
              )}
              {isEditing ? (
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleSave}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <i className="fas fa-edit"></i>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => deleteQuestionMutation.mutate(question.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {isEditing && question.placeholder && (
            <Input
              value={editData.placeholder}
              onChange={(e) => setEditData({ ...editData, placeholder: e.target.value })}
              placeholder="Placeholder text"
              className="mb-3"
            />
          )}

          {/* Options for radio/checkbox questions */}
          {(question.questionType === 'radio' || question.questionType === 'checkbox') && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Answer Options:</div>
              {isEditing ? (
                <div className="space-y-2">
                  {editData.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={option.label}
                        onChange={(e) => updateOption(index, 'label', e.target.value)}
                        placeholder="Option label"
                        className="flex-1"
                      />
                      <Input
                        value={option.description || ''}
                        onChange={(e) => updateOption(index, 'description', e.target.value)}
                        placeholder="Description (optional)"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={addOption}>
                    <i className="fas fa-plus mr-1"></i>
                    Add Option
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {(question.options as QuestionOption[] || []).map((option, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {option.label}
                      {option.description && (
                        <span className="text-gray-500"> - {option.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const NewQuestionForm = ({ category }: { category: string }) => {
    const [formData, setFormData] = useState({
      questionText: '',
      questionType: 'text',
      isRequired: false,
      placeholder: '',
      options: [] as QuestionOption[],
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.questionText.trim()) return;

      const maxSortOrder = Math.max(...(questionsByCategory[category]?.map(q => q.sortOrder) || [0]));

      createQuestionMutation.mutate({
        category,
        questionText: formData.questionText,
        questionType: formData.questionType,
        isRequired: formData.isRequired,
        placeholder: formData.placeholder || null,
        options: formData.options.length > 0 ? formData.options : null,
        sortOrder: maxSortOrder + 1,
      });

      setFormData({
        questionText: '',
        questionType: 'text',
        isRequired: false,
        placeholder: '',
        options: [],
      });
    };

    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Question text"
                value={formData.questionText}
                onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                required
              />
              <Select 
                value={formData.questionType} 
                onValueChange={(value) => setFormData({ ...formData, questionType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Input</SelectItem>
                  <SelectItem value="number">Number Input</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                  <SelectItem value="radio">Radio Buttons</SelectItem>
                  <SelectItem value="checkbox">Checkboxes</SelectItem>
                  <SelectItem value="date">Date Input</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              placeholder="Placeholder text (optional)"
              value={formData.placeholder}
              onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
            />

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.isRequired}
                onCheckedChange={(checked) => setFormData({ ...formData, isRequired: !!checked })}
              />
              <label className="text-sm text-gray-700">Required field</label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="submit" disabled={createQuestionMutation.isPending}>
                {createQuestionMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus mr-2"></i>
                    Add Question
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
          <p className="text-lg text-gray-600">Loading questions...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/')}
          className="text-primary hover:text-blue-700 mb-4"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Dashboard
        </Button>
        <h2 className="text-2xl font-semibold text-gray-900">Question Management</h2>
        <p className="text-gray-600 mt-1">Edit form questions and available answer options</p>
      </div>

      <Card>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid w-full grid-cols-5 gap-2 p-2">
            {categories.map((category) => (
              <TabsTrigger key={category.value} value={category.value} className="px-4 py-2">
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.value} value={category.value} className="mt-0">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {questionsByCategory[category.value]?.map((question) => (
                    <QuestionItem key={question.id} question={question} />
                  ))}

                  <NewQuestionForm category={category.value} />
                </div>
              </CardContent>
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      <div className="flex justify-end mt-8">
        <Button 
          onClick={() => {
            toast({
              title: "Success",
              description: "All changes have been saved successfully.",
            });
          }}
          className="bg-primary text-white hover:bg-blue-700"
        >
          Save All Changes
        </Button>
      </div>
    </main>
  );
}
