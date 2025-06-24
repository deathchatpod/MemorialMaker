import React, { useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
// UserContext removed
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePromptTemplates, useUpdatePromptTemplate } from "@/hooks/use-prompt-templates";
import type { Question, PromptTemplate } from "@shared/schema";
import TeamManagement from "./team-management";
import EmployeeAccount from "./employee-account";
import AccountInformation from "./account-information";

interface Obituary {
  id: number;
  fullName: string;
  age?: number;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  
  // Get current user from authentication or URL params for testing
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType');
  
  // Try to get authenticated user first, fall back to URL param for testing
  const { data: authenticatedUser } = useQuery({
    queryKey: ['/auth/user'],
    queryFn: async () => {
      const response = await fetch('/auth/user');
      if (!response.ok) throw new Error('Not authenticated');
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const currentUser = (() => {
    // Use authenticated user if available
    if (authenticatedUser) {
      return {
        id: authenticatedUser.id,
        username: authenticatedUser.name,
        userType: authenticatedUser.userType
      };
    }
    
    // Fall back to URL param for testing
    if (userTypeParam === 'admin') {
      return { id: 2, username: 'John Admin', userType: 'admin' };
    } else if (userTypeParam === 'employee') {
      return { id: 3, username: 'Mike Johnson', userType: 'employee' };
    } else if (userTypeParam === 'individual') {
      return { id: 4, username: 'Sarah Wilson', userType: 'individual' };
    } else {
      return { id: 1, username: 'Jane Smith', userType: 'funeral_home' };
    }
  })();

  console.log('Dashboard rendering for user type:', currentUser.userType);


  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('obituaries');
  const [activeCategory, setActiveCategory] = useState("basic");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: obituaries = [], isLoading } = useQuery<Obituary[]>({
    queryKey: ["/api/obituaries", currentUser.id, currentUser.userType],
    queryFn: async () => {
      let endpoint = `/api/obituaries?userId=${currentUser.id}&userType=${currentUser.userType}`;
      
      // For individual users, only fetch obituaries they are collaborators on
      if (currentUser.userType === 'individual') {
        endpoint = `/api/obituaries/collaborations?userId=${currentUser.id}`;
      }
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch obituaries');
      return response.json();
    },
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
    queryFn: async () => {
      const response = await fetch('/api/questions');
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
    enabled: activeSection === 'questions',
  });

  const { data: promptTemplates = [], isLoading: promptsLoading } = usePromptTemplates();
  const updatePromptTemplateMutation = useUpdatePromptTemplate();

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Question> }) => {
      return await apiRequest('PUT', `/api/questions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setEditingQuestion(null);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'generated':
        return <Badge className="bg-yellow-100 text-yellow-800">Generated</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const menuItems = [
    {
      id: 'obituaries',
      label: 'Obituary Generator',
      icon: 'fas fa-file-alt',
      userTypes: ['individual', 'funeral_home', 'employee', 'admin']
    },
    {
      id: 'finalspaces',
      label: 'FinalSpaces',
      icon: 'fas fa-heart',
      userTypes: ['individual', 'funeral_home', 'employee', 'admin'],
      href: '/final-spaces'
    },
    {
      id: 'surveys',
      label: 'Platform Surveys',
      icon: 'fas fa-poll-h',
      userTypes: ['admin'],
      href: '/admin/surveys'
    },
    {
      id: 'prompts',
      label: 'Prompt Templates',
      icon: 'fas fa-code',
      userTypes: ['admin']
    },
    {
      id: 'user-management',
      label: 'Funeral Home Management',
      icon: 'fas fa-building',
      userTypes: ['admin']
    }
  ];

  const filteredMenuItems = React.useMemo(() => {
    if (!currentUser?.userType) {
      console.log('No user type, returning empty menu');
      return [];
    }

    console.log('Filtering menu items for user type:', currentUser.userType);

    const filtered = menuItems.filter(item => {
      // Direct match for user type
      if (item.userTypes.includes(currentUser.userType)) {
        return true;
      }

      // No backward compatibility mapping needed - use explicit userTypes only

      return false;
    });

    console.log('Filtered menu items:', filtered.map(item => item.label));
    return filtered;
  }, [currentUser]);



  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const renderObituariesSection = () => (
    <Card>
      <CardContent className="p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Recent Obituaries</h3>
            <Link href="/obituary/new">
              <Button className="bg-primary text-white hover:bg-blue-700">
                <i className="fas fa-plus mr-2"></i>
                New Obituary
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <i className="fas fa-spinner fa-spin mr-2"></i>
            Loading obituaries...
          </div>
        ) : obituaries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <i className="fas fa-file-alt text-4xl mb-4 text-gray-300"></i>
            <p className="text-lg font-medium mb-2">No obituaries yet</p>
            <p className="text-sm">Create your first obituary to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {obituaries.map((obituary) => (
                  <tr key={obituary.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {obituary.fullName}
                      </div>
                      {obituary.age && (
                        <div className="text-sm text-gray-500">Age {obituary.age}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(obituary.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(obituary.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      {obituary.status === 'generated' || obituary.status === 'completed' ? (
                        <Link href={`/obituary/${obituary.id}/generated`}>
                          <button className="text-primary hover:text-blue-700">
                            View
                          </button>
                        </Link>
                      ) : (
                        <Link href={`/obituary/new?id=${obituary.id}`}>
                          <button className="text-primary hover:text-blue-700">
                            Continue
                          </button>
                        </Link>
                      )}
                      <button className="text-gray-400 hover:text-gray-600">
                        {obituary.status === 'completed' ? 'Download' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderQuestionsSection = () => {
    // Only render for admin users
    if (currentUser?.userType !== 'admin') {
      return <div>Access denied. Admin privileges required.</div>;
    }

    const categories = Array.from(new Set(questions.map(q => q.category)));
    const filteredQuestions = questions.filter(q => q.category === activeCategory);

    const QuestionItem = ({ question }: { question: Question }) => {
      const [isEditing, setIsEditing] = useState(false);
      const [formData, setFormData] = useState({
        questionText: question.questionText,
        questionType: question.questionType,
        isRequired: question.isRequired,
        placeholder: question.placeholder || '',
        options: (question.options as Array<{label: string, value: string, description?: string}>) || []
      });

      const handleSave = () => {
        updateQuestionMutation.mutate({
          id: question.id,
          data: {
            questionText: formData.questionText,
            questionType: formData.questionType as any,
            isRequired: formData.isRequired,
            placeholder: formData.placeholder || null,
            options: formData.options.length > 0 ? formData.options : null
          }
        });
        setIsEditing(false);
      };

      const addOption = () => {
        setFormData(prev => ({
          ...prev,
          options: [
            ...prev.options,
            { label: '', value: '', description: '' }
          ]
        }));
      };

      const updateOption = (index: number, field: string, value: string) => {
        setFormData(prev => ({
          ...prev,
          options: prev.options.map((opt, i) => 
            i === index ? { ...opt, [field]: value } : opt
          )
        }));
      };

      const removeOption = (index: number) => {
        setFormData(prev => ({
          ...prev,
          options: prev.options.filter((_, i) => i !== index)
        }));
      };

      if (isEditing) {
        return (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Edit Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="questionText">Question Text</Label>
                <Input
                  id="questionText"
                  value={formData.questionText}
                  onChange={(e) => setFormData(prev => ({ ...prev, questionText: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="questionType">Question Type</Label>
                <Select
                  value={formData.questionType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, questionType: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Input</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="number">Number Input</SelectItem>
                    <SelectItem value="date">Date Input</SelectItem>
                    <SelectItem value="radio">Radio Buttons</SelectItem>
                    <SelectItem value="checkbox">Checkboxes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRequired"
                  checked={formData.isRequired}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRequired: !!checked }))}
                />
                <Label htmlFor="isRequired">Required Field</Label>
              </div>

              <div>
                <Label htmlFor="placeholder">Placeholder Text</Label>
                <Input
                  id="placeholder"
                  value={formData.placeholder}
                  onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                  placeholder="Optional helper text"
                />
              </div>

              {(formData.questionType === 'radio' || formData.questionType === 'checkbox') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Answer Options</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addOption}>
                      <i className="fas fa-plus mr-2"></i>
                      Add Option
                    </Button>
                  </div>

                  {formData.options.map((option, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border rounded-lg">
                      <div>
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={option.label}
                          onChange={(e) => updateOption(index, 'label', e.target.value)}
                          placeholder="Display text"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Value</Label>
                        <Input
                          value={option.value}
                          onChange={(e) => updateOption(index, 'value', e.target.value)}
                          placeholder="Internal value"
                        />
                      </div>
                      <div className="flex items-end space-x-2">
                        <div className="flex-1">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={option.description || ''}
                            onChange={(e) => updateOption(index, 'description', e.target.value)}
                            placeholder="Optional"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleSave} disabled={updateQuestionMutation.isPending}>
                  {updateQuestionMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Save Changes
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      }

      return (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium text-gray-900">{question.questionText}</h4>
                  {question.isRequired && (
                    <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Type:</span> {question.questionType}</p>
                  {question.placeholder && (
                    <p><span className="font-medium">Placeholder:</span> {question.placeholder}</p>
                  )}
                  {question.options && Array.isArray(question.options) && question.options.length > 0 && (
                    <div>
                      <span className="font-medium">Options:</span>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        {question.options.map((opt: any, idx: number) => (
                          <li key={idx} className="text-sm">
                            {opt.label} {opt.description && ` (${opt.description})`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="ml-4"
              >
                <i className="fas fa-edit mr-2"></i>
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    };

    return (
      <div className="space-y-6">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid w-full grid-cols-7">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="mt-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 capitalize mb-2">
                  {category} Questions
                </h3>
                <p className="text-gray-600 text-sm">
                  Edit questions and answer options that appear in the obituary form
                </p>
              </div>

              {questionsLoading ? (
                <div className="p-8 text-center text-gray-500">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Loading questions...
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <i className="fas fa-question-circle text-4xl mb-4 text-gray-300"></i>
                  <p className="text-lg font-medium mb-2">No questions in this category</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQuestions.map((question) => (
                    <QuestionItem key={question.id} question={question} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  };

  const renderPromptTemplatesSection = () => {
    const platforms = ['claude', 'chatgpt'];
    const promptTypes = ['base', 'revision'];

    const PromptTemplateEditor = ({ template }: { template: PromptTemplate }) => {
      const [isEditing, setIsEditing] = useState(false);
      const [templateContent, setTemplateContent] = useState(template.template);
      const [uploadingDocument, setUploadingDocument] = useState(false);
      const [documentInfo, setDocumentInfo] = useState<{
        filename?: string;
        preview?: string;
      }>({
        filename: template.contextDocumentName || undefined,
        preview: undefined
      });

      const handleSave = () => {
        updatePromptTemplateMutation.mutate({
          id: template.id,
          data: { template: templateContent }
        });
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Prompt template updated successfully.",
        });
      };

      const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Error",
            description: "Only .docx and .pdf files are allowed.",
            variant: "destructive",
          });
          return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Error",
            description: "File size must be less than 10MB.",
            variant: "destructive",
          });
          return;
        }

        setUploadingDocument(true);

        try {
          const formData = new FormData();
          formData.append('document', file);

          const response = await fetch(`/api/prompt-templates/${template.id}/upload-document`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const result = await response.json();

          setDocumentInfo({
            filename: result.filename,
            preview: result.documentText
          });

          toast({
            title: "Success",
            description: `Document "${result.filename}" uploaded successfully and will be used as context.`,
          });

          // Refresh the templates to show updated data
          queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates"] });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload document. Please try again.",
            variant: "destructive",
          });
        } finally {
          setUploadingDocument(false);
          // Reset the input
          event.target.value = '';
        }
      };

      const handleRemoveDocument = async () => {
        try {
          const response = await fetch(`/api/prompt-templates/${template.id}/document`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to remove document');
          }

          setDocumentInfo({ filename: undefined, preview: undefined });

          toast({
            title: "Success",
            description: "Document removed successfully.",
          });

          // Refresh the templates
          queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates"] });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to remove document. Please try again.",
            variant: "destructive",
          });
        }
      };

      const variableExamples = [
        { name: '{{fullName}}', description: 'Full name of the deceased' },
        { name: '{{age}}', description: 'Age at death' },
        { name: '{{tone}}', description: 'Tone style (traditional, celebratory, etc.)' },
        { name: '{{ageCategory}}', description: 'Age category (child, teenager, adult, senior)' },
        { name: '{{dateOfBirth}}', description: 'Date of birth' },
        { name: '{{dateOfDeath}}', description: 'Date of death' },
        { name: '{{location}}', description: 'Location information' },
        { name: '{{education}}', description: 'Educational background' },
        { name: '{{career}}', description: 'Career information' },
        { name: '{{achievements}}', description: 'Notable achievements' },
        { name: '{{family}}', description: 'Family information' },
        { name: '{{traits}}', description: 'Personality traits' },
        { name: '{{hobbies}}', description: 'Hobbies and interests' },
        { name: '{{religion}}', description: 'Religious information' },
        { name: '{{specialNotes}}', description: 'Special notes or requests' }
      ];

      if (isEditing) {
        return (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Edit {template.name}</span>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={updatePromptTemplateMutation.isPending}>
                    {updatePromptTemplateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <Label htmlFor="template-content">Prompt Template</Label>
                    <Textarea
                      id="template-content"
                      value={templateContent}
                      onChange={(e) => setTemplateContent(e.target.value)}
                      className="min-h-96 font-mono text-sm"
                      placeholder="Enter your prompt template with variables..."
                    />
                  </div>

                  <div className="border-t pt-6">
                    <Label className="text-sm font-medium">Context Document (Optional)</Label>
                    <p className="text-xs text-gray-600 mt-1 mb-3">
                      Upload a .docx or .pdf file with obituary examples to provide context for the AI. 
                      This will only be used for base prompts to help the AI understand the desired style and format.
                    </p>

                    {documentInfo.filename || template.contextDocumentName ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <i className="fas fa-file-alt text-green-600"></i>
                            <span className="text-sm font-medium text-green-800">
                              {documentInfo.filename || template.contextDocumentName}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveDocument}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <i className="fas fa-times mr-1"></i>
                            Remove
                          </Button>
                        </div>
                        {documentInfo.preview && (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <p className="text-xs text-gray-600 mb-2">Document preview:</p>
                            <p className="text-xs text-gray-700 font-mono">{documentInfo.preview}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <i className="fas fa-cloud-upload-alt text-gray-400 text-2xl mb-2"></i>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            Upload obituary examples for AI context
                          </p>
                          <div className="flex justify-center">
                            <div>
                              <input
                                type="file"
                                accept=".docx,.pdf"
                                onChange={handleDocumentUpload}
                                className="hidden"
                                disabled={uploadingDocument}
                                id={`file-upload-${template.id}`}
                              />
                              <label htmlFor={`file-upload-${template.id}`} className="cursor-pointer">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={uploadingDocument}
                                  type="button"
                                  asChild
                                >
                                  <span>
                                    {uploadingDocument ? (
                                      <>
                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <i className="fas fa-upload mr-2"></i>
                                        Choose File
                                      </>
                                    )}
                                  </span>
                                </Button>
                              </label>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            Supports .docx and .pdf files up to 10MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <Label className="text-sm font-medium">Available Variables</Label>
                  <div className="mt-2 space-y-2 max-h-96 overflow-y-auto bg-gray-50 p-3 rounded-lg">
                    {variableExamples.map((variable, idx) => (
                      <div key={idx} className="text-xs">
                        <code className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-mono">
                          {variable.name}
                        </code>
                        <p className="text-gray-600 mt-1">{variable.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }

      return (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <Badge variant="secondary" className="capitalize">
                    {template.platform}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {template.promptType}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {template.template.length > 200 
                      ? template.template.substring(0, 200) + '...' 
                      : template.template
                    }
                  </pre>
                </div>
                {template.contextDocumentName && (
                  <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                    <i className="fas fa-file-alt"></i>
                    <span>Context document: {template.contextDocumentName}</span>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="ml-4"
              >
                <i className="fas fa-edit mr-2"></i>
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    };

    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">AI Prompt Templates</h3>
          <p className="text-gray-600 text-sm">
            Edit the base prompts and revision prompts sent to Claude and ChatGPT for obituary generation.
            Use variables like {`{{fullName}}`}, {`{{age}}`}, {`{{tone}}`} to personalize the prompts.
          </p>
        </div>

        {promptsLoading ? (
          <div className="p-8 text-center text-gray-500">
            <i className="fas fa-spinner fa-spin mr-2"></i>
            Loading prompt templates...
          </div>
        ) : promptTemplates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <i className="fas fa-code text-4xl mb-4 text-gray-300"></i>
            <p className="text-lg font-medium mb-2">No prompt templates found</p>
            <p className="text-sm">Default templates should be automatically created.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {platforms.map(platform => (
              <div key={platform} className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 capitalize flex items-center">
                  <i className={`fas ${platform === 'claude' ? 'fa-robot' : 'fa-brain'} mr-2`}></i>
                  {platform} AI Prompts
                </h4>

                {promptTypes.map(promptType => {
                  const template = promptTemplates.find(
                    t => t.platform === platform && t.promptType === promptType
                  );

                  if (!template) {
                    return (
                      <Card key={promptType} className="mb-4">
                        <CardContent className="pt-4">
                          <div className="text-center text-gray-500 py-4">
                            <p>No {promptType} template found for {platform}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  return (
                    <PromptTemplateEditor key={template.id} template={template} />
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderUserManagementSection = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Funeral Home Management</h3>
            <p className="text-gray-600 mb-4">
              Manage funeral home accounts across the platform. View all registered funeral homes, 
              their team sizes, and account status.
            </p>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">12</div>
                  <div className="text-sm text-gray-600">Active Funeral Homes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">47</div>
                  <div className="text-sm text-gray-600">Total Employees</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">234</div>
                  <div className="text-sm text-gray-600">Total Obituaries</div>
                </div>
              </div>

              <div className="text-center text-gray-500">
                <p>Full funeral home management interface coming soon...</p>
                <p className="text-sm mt-2">Contact system administrator for detailed management needs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={cn(
        "bg-white shadow-sm border-r border-gray-200 transition-all duration-300 flex flex-col min-h-0",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900">DeathMatters</h2>
                <p className="text-sm text-gray-600">
                  {currentUser?.userType === 'admin' ? 'System Admin Panel' : 
                   currentUser?.userType === 'funeral_home' ? 'Funeral Home Panel' : 
                   currentUser?.userType === 'employee' ? 'Employee Panel' : 
                   currentUser?.userType === 'individual' ? 'Individual Panel' : 'Loading...'}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className={cn("fas", sidebarCollapsed ? "fa-chevron-right" : "fa-chevron-left")}></i>
            </Button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => (
              <li key={item.id}>
                {item.href ? (
                  <Link href={item.href}>
                    <button
                      onClick={() => handleSectionChange(item.id)}
                      className={cn(
                        "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        activeSection === item.id
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      <i className={cn(item.icon, "w-5 h-5", sidebarCollapsed ? "mx-auto" : "mr-3")}></i>
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={() => handleSectionChange(item.id)}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      activeSection === item.id
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <i className={cn(item.icon, "w-5 h-5", sidebarCollapsed ? "mx-auto" : "mr-3")}></i>
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </button>
                )}
              </li>
            ))}

            {/* User-type specific menu items */}
            {(currentUser?.userType === 'funeral_home' || currentUser?.userType === 'employee' || currentUser?.userType === 'individual') && (
              <>
                <li className="my-2">
                  <div className="h-px bg-gray-200"></div>
                  {!sidebarCollapsed && (
                    <p className="text-xs font-medium text-gray-500 mt-2 px-3">
                      {currentUser?.userType === 'funeral_home' ? 'Management' : 'Account'}
                    </p>
                  )}
                </li>

                {currentUser?.userType === 'funeral_home' && (
                  <li>
                    <button
                      onClick={() => handleSectionChange('team-management')}
                      className={cn(
                        "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        activeSection === 'team-management'
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      <i className={cn("fas fa-users", "w-5 h-5", sidebarCollapsed ? "mx-auto" : "mr-3")}></i>
                      {!sidebarCollapsed && <span>Team Management</span>}
                    </button>
                  </li>
                )}

                {/* Account Information for all non-admin users */}
                <li>
                  <button
                    onClick={() => handleSectionChange('account-information')}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      activeSection === 'account-information'
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <i className={cn("fas fa-cog", "w-5 h-5", sidebarCollapsed ? "mx-auto" : "mr-3")}></i>
                    {!sidebarCollapsed && <span>
                      {currentUser?.userType === 'funeral_home' ? 'Account Information' : 'My Account'}
                    </span>}
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className={cn(
            "flex items-center",
            sidebarCollapsed ? "justify-center" : "space-x-3"
          )}>
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
              {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentUser?.username || 'Unknown User'}
                </p>
                <p className="text-xs text-gray-500">
                  {currentUser?.userType === 'admin' ? 'System Admin' : 
                   currentUser?.userType === 'funeral_home' ? 'Funeral Home Admin' : 
                   currentUser?.userType === 'employee' ? 'FH Employee' : 
                   currentUser?.userType === 'individual' ? 'Individual User' : 'Loading...'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              {!['team-management', 'account-information'].includes(activeSection) && (
                <>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {activeSection === 'obituaries' && 'Obituary Generator'}
                    {activeSection === 'questions' && currentUser?.userType === 'admin' && 'Question Management'}
                    {activeSection === 'prompts' && currentUser?.userType === 'admin' && 'Prompt Templates'}
                    {activeSection === 'user-management' && currentUser?.userType === 'admin' && 'Funeral Home Management'}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {activeSection === 'obituaries' && (currentUser?.userType === 'admin' 
                      ? 'All obituary creations across all funeral homes'
                      : currentUser?.userType === 'funeral_home' 
                        ? 'Your obituaries and team member obituaries'
                        : currentUser?.userType === 'individual'
                          ? 'Obituaries you are collaborating on'
                          : 'Your obituary creations')}
                    {activeSection === 'questions' && currentUser?.userType === 'admin' && 'Manage form questions and answer options'}
                    {activeSection === 'prompts' && currentUser?.userType === 'admin' && 'Edit AI prompts sent to Claude and ChatGPT'}
                    {activeSection === 'user-management' && currentUser?.userType === 'admin' && 'Manage funeral home accounts and settings'}
                  </p>
                </>
              )}
            </div>

            {activeSection === 'obituaries' && renderObituariesSection()}
            {activeSection === 'questions' && currentUser?.userType === 'admin' && renderQuestionsSection()}
            {activeSection === 'prompts' && currentUser?.userType === 'admin' && renderPromptTemplatesSection()}
            {activeSection === 'user-management' && currentUser?.userType === 'admin' && renderUserManagementSection()}
            {activeSection === 'team-management' && <TeamManagement />}
            {activeSection === 'account-information' && (
              currentUser.userType === 'employee' ? <EmployeeAccount /> : 
              currentUser.userType === 'individual' ? <IndividualAccount /> : 
              <AccountInformation />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Individual Account Component
function IndividualAccount() {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Mock individual user data - in real app this would come from authenticated user
  const [accountData, setAccountData] = useState({
    name: 'Sarah Wilson',
    email: 'sarah.wilson@email.com',
    phone: '(555) 987-6543',
    address: '456 Oak Street, Springfield, IL 62702',
    emergencyContact: 'John Wilson - (555) 123-4567',
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      collaborationInvites: true
    }
  });

  const handleSave = async () => {
    try {
      // In real app, this would make an API call to update account info
      console.log('Saving individual account data:', accountData);
      setIsEditing(false);
      // queryClient.invalidateQueries(['/api/individual/account']);
    } catch (error) {
      console.error('Failed to save account information:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original data
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Account
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={accountData.name}
                    onChange={(e) => setAccountData({...accountData, name: e.target.value})}
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{accountData.name}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={accountData.email}
                    onChange={(e) => setAccountData({...accountData, email: e.target.value})}
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{accountData.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={accountData.phone}
                    onChange={(e) => setAccountData({...accountData, phone: e.target.value})}
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{accountData.phone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                {isEditing ? (
                  <Input
                    id="emergencyContact"
                    value={accountData.emergencyContact}
                    onChange={(e) => setAccountData({...accountData, emergencyContact: e.target.value})}
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{accountData.emergencyContact}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                {isEditing ? (
                  <Input
                    id="address"
                    value={accountData.address}
                    onChange={(e) => setAccountData({...accountData, address: e.target.value})}
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{accountData.address}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive updates about collaboration invites and obituary status</p>
              </div>
              <Checkbox
                id="emailNotifications"
                checked={accountData.preferences.emailNotifications}
                onCheckedChange={(checked) => 
                  setAccountData({
                    ...accountData, 
                    preferences: {...accountData.preferences, emailNotifications: checked}
                  })
                }
                disabled={!isEditing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <p className="text-sm text-gray-500">Receive text messages for urgent updates</p>
              </div>
              <Checkbox
                id="smsNotifications"
                checked={accountData.preferences.smsNotifications}
                onCheckedChange={(checked) => 
                  setAccountData({
                    ...accountData, 
                    preferences: {...accountData.preferences, smsNotifications: checked}
                  })
                }
                disabled={!isEditing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="collaborationInvites">Allow Collaboration Invites</Label>
                <p className="text-sm text-gray-500">Allow funeral homes to invite you to collaborate on obituaries</p>
              </div>
              <Checkbox
                id="collaborationInvites"
                checked={accountData.preferences.collaborationInvites}
                onCheckedChange={(checked) => 
                  setAccountData({
                    ...accountData, 
                    preferences: {...accountData.preferences, collaborationInvites: checked}
                  })
                }
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}