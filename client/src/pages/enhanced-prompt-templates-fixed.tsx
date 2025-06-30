import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Edit, Save, X, Code, Bot, Clock, User, Star, StarOff, 
  History, Upload, FileText, Download, Trash2, ExternalLink, 
  AlertCircle, CheckCircle, Eye
} from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PromptTemplate {
  id: number;
  name: string;
  platform: string;
  promptType: string;
  version: number;
  isPrimary: boolean;
  systemMessage?: string;
  userInstructions?: string;
  examples?: string;
  constraints?: string;
  outputFormat?: string;
  content: string;
  createdBy: number;
  createdByName: string;
  changelog?: string;
  createdAt: string;
  updatedAt: string;
}

interface PromptTemplateDocument {
  id: number;
  promptTemplateId: number;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  content?: string;
  uploadedBy: number;
  uploadedByName: string;
  createdAt: string;
}

interface PromptFormData {
  name: string;
  platform: string;
  promptType: string;
  systemMessage: string;
  userInstructions: string;
  examples: string;
  constraints: string;
  outputFormat: string;
  changelog: string;
}

export default function EnhancedPromptTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<PromptTemplate | null>(null);
  const [editingInCard, setEditingInCard] = useState<PromptTemplate | null>(null);
  const [formData, setFormData] = useState<PromptFormData>({
    name: "",
    platform: "claude",
    promptType: "base",
    systemMessage: "",
    userInstructions: "",
    examples: "",
    constraints: "",
    outputFormat: "",
    changelog: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user info from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType') || 'admin';
  const currentUser = {
    id: 1,
    name: userTypeParam === 'admin' ? 'John Admin' : 'Jane Smith',
    userType: userTypeParam
  };

  // Fetch prompt templates
  const { data: templates = [], isLoading } = useQuery<PromptTemplate[]>({
    queryKey: ["/api/prompt-templates"],
    queryFn: async () => {
      const response = await fetch('/api/prompt-templates');
      if (!response.ok) throw new Error('Failed to fetch prompt templates');
      return response.json();
    },
  });

  // Fetch documents for selected template
  const { data: documents = [], isLoading: documentsLoading } = useQuery<PromptTemplateDocument[]>({
    queryKey: ["/api/prompt-templates", selectedTemplate?.id, "documents"],
    queryFn: async () => {
      if (!selectedTemplate?.id) return [];
      const response = await fetch(`/api/prompt-templates/${selectedTemplate.id}/documents`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
    enabled: !!selectedTemplate?.id,
  });

  // Fetch version history for selected template
  const { data: versionHistory = [], isLoading: versionsLoading } = useQuery<PromptTemplate[]>({
    queryKey: ["/api/prompt-templates", selectedTemplate?.platform, selectedTemplate?.promptType, "versions"],
    queryFn: async () => {
      if (!selectedTemplate?.platform || !selectedTemplate?.promptType) return [];
      const response = await fetch(`/api/prompt-templates/${selectedTemplate.platform}/${selectedTemplate.promptType}/versions`);
      if (!response.ok) throw new Error('Failed to fetch versions');
      return response.json();
    },
    enabled: !!(selectedTemplate?.platform && selectedTemplate?.promptType && showVersionHistory),
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: PromptFormData) => {
      return apiRequest("/api/prompt-templates", "POST", {
        ...data,
        createdBy: currentUser.id,
        createdByName: currentUser.name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates"] });
      setIsCreating(false);
      setFormData({
        name: "",
        platform: "claude",
        promptType: "base",
        systemMessage: "",
        userInstructions: "",
        examples: "",
        constraints: "",
        outputFormat: "",
        changelog: ""
      });
      toast({
        title: "Template Created",
        description: "Prompt template has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PromptFormData }) => {
      return apiRequest(`/api/prompt-templates/${id}`, "PUT", {
        ...data,
        createdBy: currentUser.id,
        createdByName: currentUser.name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates"] });
      setEditingTemplate(null);
      toast({
        title: "Template Updated",
        description: "Prompt template has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/prompt-templates/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates"] });
      setSelectedTemplate(null);
      setEditingTemplate(null);
      toast({
        title: "Template Deleted",
        description: "Prompt template has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  // Make primary mutation
  const makePrimaryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/prompt-templates/${id}/make-primary`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates"] });
      toast({
        title: "Primary Version Updated",
        description: "This version is now the primary template.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update primary version",
        variant: "destructive",
      });
    },
  });

  // Document upload mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ templateId, file }: { templateId: number; file: File }) => {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('uploadedBy', currentUser.id.toString());
      formData.append('uploadedByName', currentUser.name);
      
      const response = await fetch(`/api/prompt-templates/${templateId}/documents`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates", selectedTemplate?.id, "documents"] });
      toast({
        title: "Document Uploaded",
        description: "Context document has been uploaded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      return apiRequest(`/api/prompt-templates/documents/${documentId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates", selectedTemplate?.id, "documents"] });
      toast({
        title: "Document Deleted",
        description: "Context document has been deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const handleEditTemplate = (template: PromptTemplate) => {
    setEditingInCard(template);
    setViewingTemplate(null);
    setFormData({
      name: template.name,
      platform: template.platform,
      promptType: template.promptType,
      systemMessage: template.systemMessage || "",
      userInstructions: template.userInstructions || "",
      examples: template.examples || "",
      constraints: template.constraints || "",
      outputFormat: template.outputFormat || "",
      changelog: ""
    });
  };

  const handleViewTemplate = (template: PromptTemplate) => {
    setViewingTemplate(template);
    setEditingInCard(null);
  };

  const handleSaveInCardEdit = (template: PromptTemplate) => {
    updateTemplateMutation.mutate({ id: template.id, data: formData });
    setEditingInCard(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createTemplateMutation.mutate(formData);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTemplate) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    uploadDocumentMutation.mutate({ templateId: selectedTemplate.id, file });
    e.target.value = '';
  };

  // Group templates by platform and prompt type
  const groupedTemplates = templates.reduce((acc, template) => {
    const key = `${template.platform}-${template.promptType}`;
    if (!acc[key]) {
      acc[key] = {
        platform: template.platform,
        promptType: template.promptType,
        primary: null,
        versions: []
      };
    }
    
    acc[key].versions.push(template);
    if (template.isPrimary) {
      acc[key].primary = template;
    }
    
    return acc;
  }, {} as Record<string, { platform: string; promptType: string; primary: PromptTemplate | null; versions: PromptTemplate[] }>);

  if (isLoading) {
    return (
      <div className="p-6" role="main" aria-label="Loading prompt templates">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-6" aria-label="Loading page title"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-700 rounded" aria-label={`Loading template ${i}`}></div>
            ))}
          </div>
        </div>
        <div className="sr-only" aria-live="polite">Loading prompt templates, please wait...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-900 min-h-screen" role="main">
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" id="page-title">Enhanced Prompt Templates</h1>
          <p className="text-gray-400 mt-1" aria-describedby="page-title">Manage AI prompt templates with versioning and context documents</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template List */}
        <div className="space-y-4">
          {Object.entries(groupedTemplates).map(([key, group]) => {
            const isViewing = viewingTemplate?.id === group.primary?.id;
            const isEditing = editingInCard?.id === group.primary?.id;
            
            return (
              <Card key={key} className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {group.platform === 'claude' ? <Bot className="w-4 h-4 text-blue-400" /> : <Code className="w-4 h-4 text-green-400" />}
                      <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                        {group.platform}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                        {group.promptType}
                      </Badge>
                      {group.primary?.isPrimary && (
                        <Badge className="text-xs bg-yellow-600 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-500 text-white bg-gray-700 hover:bg-gray-600 hover:border-gray-400"
                      onClick={() => {
                        const testUrl = `/test-prompt/${group.platform}/${group.promptType}`;
                        window.open(testUrl, '_blank');
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Test
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {group.primary?.name || `${group.platform} ${group.promptType}`}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {group.primary?.content?.substring(0, 150) || 'No description available'}...
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      v{group.primary?.version || 1} by {group.primary?.createdByName || 'System'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {group.primary?.createdAt ? new Date(group.primary.createdAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  
                  {/* View/Edit Content Area */}
                  {(isViewing || isEditing) && group.primary && (
                    <div className="border-t border-gray-600 pt-4 space-y-4">
                      {isViewing && (
                        <div className="space-y-3">
                          <div className="bg-gray-700/50 p-3 rounded">
                            <h4 className="text-sm font-medium text-white mb-2">Full Content</h4>
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">{group.primary.content}</pre>
                          </div>
                          
                          {group.primary.systemMessage && (
                            <div className="bg-gray-700/50 p-3 rounded">
                              <h4 className="text-sm font-medium text-white mb-2">System Message</h4>
                              <p className="text-xs text-gray-300">{group.primary.systemMessage}</p>
                            </div>
                          )}
                          
                          {group.primary.userInstructions && (
                            <div className="bg-gray-700/50 p-3 rounded">
                              <h4 className="text-sm font-medium text-white mb-2">User Instructions</h4>
                              <p className="text-xs text-gray-300">{group.primary.userInstructions}</p>
                            </div>
                          )}
                          
                          {group.primary.examples && (
                            <div className="bg-gray-700/50 p-3 rounded">
                              <h4 className="text-sm font-medium text-white mb-2">Examples</h4>
                              <p className="text-xs text-gray-300">{group.primary.examples}</p>
                            </div>
                          )}
                          
                          {group.primary.constraints && (
                            <div className="bg-gray-700/50 p-3 rounded">
                              <h4 className="text-sm font-medium text-white mb-2">Constraints</h4>
                              <p className="text-xs text-gray-300">{group.primary.constraints}</p>
                            </div>
                          )}
                          
                          {group.primary.outputFormat && (
                            <div className="bg-gray-700/50 p-3 rounded">
                              <h4 className="text-sm font-medium text-white mb-2">Output Format</h4>
                              <p className="text-xs text-gray-300">{group.primary.outputFormat}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {isEditing && (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`changelog-${group.primary.id}`} className="text-white text-sm">Change Description</Label>
                            <Input
                              id={`changelog-${group.primary.id}`}
                              value={formData.changelog}
                              onChange={(e) => setFormData(prev => ({ ...prev, changelog: e.target.value }))}
                              placeholder="Describe your changes"
                              required
                              className="bg-gray-700 border-gray-600 text-white text-sm"
                              aria-describedby={`changelog-help-${group.primary.id}`}
                            />
                            <p id={`changelog-help-${group.primary.id}`} className="sr-only">
                              Describe what changes you are making to this prompt template
                            </p>
                          </div>
                          
                          <div>
                            <Label htmlFor={`userInstructions-${group.primary.id}`} className="text-white text-sm">User Instructions</Label>
                            <Textarea
                              id={`userInstructions-${group.primary.id}`}
                              value={formData.userInstructions}
                              onChange={(e) => setFormData(prev => ({ ...prev, userInstructions: e.target.value }))}
                              placeholder="Specific instructions for the task..."
                              rows={3}
                              className="bg-gray-700 border-gray-600 text-white text-sm"
                              aria-describedby={`userInstructions-help-${group.primary.id}`}
                            />
                            <p id={`userInstructions-help-${group.primary.id}`} className="sr-only">
                              Provide specific instructions that will guide the AI in completing tasks
                            </p>
                          </div>

                          <div>
                            <Label htmlFor={`examples-${group.primary.id}`} className="text-white text-sm">Examples</Label>
                            <Textarea
                              id={`examples-${group.primary.id}`}
                              value={formData.examples}
                              onChange={(e) => setFormData(prev => ({ ...prev, examples: e.target.value }))}
                              placeholder="Provide examples of desired output..."
                              rows={3}
                              className="bg-gray-700 border-gray-600 text-white text-sm"
                              aria-describedby={`examples-help-${group.primary.id}`}
                            />
                            <p id={`examples-help-${group.primary.id}`} className="sr-only">
                              Show examples of the type of output you want the AI to generate
                            </p>
                          </div>

                          <div>
                            <Label htmlFor={`constraints-${group.primary.id}`} className="text-white text-sm">Constraints</Label>
                            <Textarea
                              id={`constraints-${group.primary.id}`}
                              value={formData.constraints}
                              onChange={(e) => setFormData(prev => ({ ...prev, constraints: e.target.value }))}
                              placeholder="Define limitations and requirements..."
                              rows={3}
                              className="bg-gray-700 border-gray-600 text-white text-sm"
                              aria-describedby={`constraints-help-${group.primary.id}`}
                            />
                            <p id={`constraints-help-${group.primary.id}`} className="sr-only">
                              Define any limitations, restrictions, or specific requirements for the AI output
                            </p>
                          </div>

                          <div>
                            <Label htmlFor={`outputFormat-${group.primary.id}`} className="text-white text-sm">Output Format</Label>
                            <Textarea
                              id={`outputFormat-${group.primary.id}`}
                              value={formData.outputFormat}
                              onChange={(e) => setFormData(prev => ({ ...prev, outputFormat: e.target.value }))}
                              placeholder="Specify the desired output structure..."
                              rows={3}
                              className="bg-gray-700 border-gray-600 text-white text-sm"
                              aria-describedby={`outputFormat-help-${group.primary.id}`}
                            />
                            <p id={`outputFormat-help-${group.primary.id}`} className="sr-only">
                              Specify how you want the AI to structure and format its response
                            </p>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveInCardEdit(group.primary!)}
                              disabled={updateTemplateMutation.isPending}
                              className="flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                            >
                              <Save className="w-4 h-4" />
                              {updateTemplateMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingInCard(null)}
                              className="flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <div className="flex flex-col sm:flex-row gap-2 flex-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className={`flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap w-full sm:flex-1 border-gray-500 text-white bg-gray-700 hover:bg-gray-600 hover:border-gray-400 ${isViewing ? 'bg-gray-600' : ''}`}
                        onClick={() => {
                          if (isViewing) {
                            setViewingTemplate(null);
                          } else {
                            group.primary && handleViewTemplate(group.primary);
                            setEditingInCard(null);
                          }
                        }}
                        disabled={!group.primary}
                        aria-label={isViewing ? `Collapse ${group.primary?.name || 'template'} details` : `View ${group.primary?.name || 'template'} details`}
                      >
                        <Eye className="w-4 h-4" />
                        {isViewing ? 'Collapse' : 'View'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap w-full sm:flex-1 border-gray-500 text-white bg-gray-700 hover:bg-gray-600 hover:border-gray-400 ${isEditing ? 'bg-gray-600' : ''}`}
                        onClick={() => {
                          if (isEditing) {
                            setEditingInCard(null);
                          } else {
                            group.primary && handleEditTemplate(group.primary);
                            setViewingTemplate(null);
                          }
                        }}
                        disabled={!group.primary || updateTemplateMutation.isPending}
                        aria-label={isEditing ? `Cancel editing ${group.primary?.name || 'template'}` : `Edit ${group.primary?.name || 'template'}`}
                      >
                        <Edit className="w-4 h-4" />
                        {isEditing ? 'Cancel' : 'Edit'}
                      </Button>
                    </div>
                    <Badge variant="outline" className="text-xs border-gray-600 text-gray-300 px-2 py-1">
                      {group.versions.length} version{group.versions.length !== 1 ? 's' : ''}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-500 text-white bg-gray-700 hover:bg-gray-600 hover:border-gray-400"
                      onClick={() => {
                        if (group.primary) {
                          setSelectedTemplate(group.primary);
                          setEditingTemplate(null);
                          setShowVersionHistory(true);
                          setIsCreating(false);
                        }
                      }}
                    >
                      <History className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Template Details/Editor */}
        <div className="space-y-4">
          {(selectedTemplate || editingTemplate || isCreating) && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">
                    {isCreating ? "Create New Template" : 
                     editingTemplate ? "Edit Template" : 
                     showVersionHistory ? "Version History" : "Template Details"}
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setEditingTemplate(null);
                      setIsCreating(false);
                      setShowVersionHistory(false);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(editingTemplate || isCreating) && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-white">Template Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter template name"
                          required
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="platform" className="text-white">Platform</Label>
                        <Select
                          value={formData.platform}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="claude">Claude</SelectItem>
                            <SelectItem value="chatgpt">ChatGPT</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="promptType" className="text-white">Prompt Type</Label>
                        <Select
                          value={formData.promptType}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, promptType: value }))}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="base">Base</SelectItem>
                            <SelectItem value="revision">Revision</SelectItem>
                            <SelectItem value="generation">Generation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="changelog" className="text-white">Change Description</Label>
                        <Input
                          id="changelog"
                          value={formData.changelog}
                          onChange={(e) => setFormData(prev => ({ ...prev, changelog: e.target.value }))}
                          placeholder="Describe your changes"
                          required
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>

                    <Separator className="bg-gray-600" />

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="systemMessage" className="text-white">System Message</Label>
                        <Textarea
                          id="systemMessage"
                          value={formData.systemMessage}
                          onChange={(e) => setFormData(prev => ({ ...prev, systemMessage: e.target.value }))}
                          placeholder="Define the AI's role and general behavior..."
                          rows={3}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>

                      <div>
                        <Label htmlFor="userInstructions" className="text-white">User Instructions</Label>
                        <Textarea
                          id="userInstructions"
                          value={formData.userInstructions}
                          onChange={(e) => setFormData(prev => ({ ...prev, userInstructions: e.target.value }))}
                          placeholder="Specific instructions for the task..."
                          rows={4}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>

                      <div>
                        <Label htmlFor="examples" className="text-white">Examples</Label>
                        <Textarea
                          id="examples"
                          value={formData.examples}
                          onChange={(e) => setFormData(prev => ({ ...prev, examples: e.target.value }))}
                          placeholder="Provide examples of desired output..."
                          rows={3}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>

                      <div>
                        <Label htmlFor="constraints" className="text-white">Constraints</Label>
                        <Textarea
                          id="constraints"
                          value={formData.constraints}
                          onChange={(e) => setFormData(prev => ({ ...prev, constraints: e.target.value }))}
                          placeholder="Define limitations and requirements..."
                          rows={3}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>

                      <div>
                        <Label htmlFor="outputFormat" className="text-white">Output Format</Label>
                        <Textarea
                          id="outputFormat"
                          value={formData.outputFormat}
                          onChange={(e) => setFormData(prev => ({ ...prev, outputFormat: e.target.value }))}
                          placeholder="Specify the desired output structure..."
                          rows={3}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="submit"
                        disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {createTemplateMutation.isPending || updateTemplateMutation.isPending
                          ? "Saving..." : isCreating ? "Create Template" : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingTemplate(null);
                          setIsCreating(false);
                        }}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {selectedTemplate && !editingTemplate && !showVersionHistory && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          v{selectedTemplate.version}
                        </Badge>
                        {selectedTemplate.isPrimary && (
                          <Badge className="bg-yellow-600 text-white">
                            <Star className="w-3 h-3 mr-1" />
                            Primary
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTemplate(selectedTemplate)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        {!selectedTemplate.isPrimary && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              >
                                <Star className="w-3 h-3 mr-1" />
                                Make Primary
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gray-800 border-gray-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Make Primary Version</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-300">
                                  This will make version {selectedTemplate.version} the primary template for {selectedTemplate.platform} {selectedTemplate.promptType}. The current primary version will become a secondary version.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => makePrimaryMutation.mutate(selectedTemplate.id)}
                                  className="bg-yellow-600 hover:bg-yellow-700"
                                >
                                  Make Primary
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-300 hover:bg-red-700"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-800 border-gray-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete Template</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-300">
                                Are you sure you want to delete this template version? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteTemplateMutation.mutate(selectedTemplate.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <Tabs defaultValue="content" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 bg-gray-700">
                        <TabsTrigger value="content" className="text-gray-300">Content</TabsTrigger>
                        <TabsTrigger value="documents" className="text-gray-300">Documents</TabsTrigger>
                        <TabsTrigger value="history" className="text-gray-300">History</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="content" className="space-y-4">
                        <div className="bg-gray-700/50 p-4 rounded">
                          <h4 className="text-sm font-medium text-white mb-2">Full Content</h4>
                          <pre className="text-sm text-gray-300 whitespace-pre-wrap">{selectedTemplate.content}</pre>
                        </div>
                        
                        {selectedTemplate.systemMessage && (
                          <div className="bg-gray-700/50 p-4 rounded">
                            <h4 className="text-sm font-medium text-white mb-2">System Message</h4>
                            <p className="text-sm text-gray-300">{selectedTemplate.systemMessage}</p>
                          </div>
                        )}
                        
                        {selectedTemplate.userInstructions && (
                          <div className="bg-gray-700/50 p-4 rounded">
                            <h4 className="text-sm font-medium text-white mb-2">User Instructions</h4>
                            <p className="text-sm text-gray-300">{selectedTemplate.userInstructions}</p>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="documents" className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-white">Context Documents</h4>
                          <div>
                            <input
                              type="file"
                              id="document-upload"
                              className="hidden"
                              accept=".pdf,.docx,.txt"
                              onChange={handleFileUpload}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => document.getElementById('document-upload')?.click()}
                              disabled={uploadDocumentMutation.isPending}
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <Upload className="w-3 h-3 mr-1" />
                              {uploadDocumentMutation.isPending ? 'Uploading...' : 'Upload'}
                            </Button>
                          </div>
                        </div>
                        
                        {documents.length > 0 ? (
                          <div className="space-y-2">
                            {documents.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-3 bg-gray-700/50 rounded"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <p className="text-sm text-white">{doc.originalName}</p>
                                    <p className="text-xs text-gray-400">
                                      {(doc.fileSize / 1024).toFixed(1)} KB • 
                                      Uploaded by {doc.uploadedByName} • 
                                      {new Date(doc.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => window.open(`/api/prompt-templates/documents/${doc.id}/download`, '_blank')}
                                    className="text-gray-400 hover:text-white hover:bg-gray-600"
                                  >
                                    <Download className="w-3 h-3" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-400 hover:text-red-300 hover:bg-red-700"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-gray-800 border-gray-700">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-white">Delete Document</AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-300">
                                          Are you sure you want to delete "{doc.originalName}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteDocumentMutation.mutate(doc.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No context documents uploaded</p>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="history" className="space-y-4">
                        <Button
                          onClick={() => setShowVersionHistory(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <History className="w-4 h-4 mr-2" />
                          View Full Version History
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {showVersionHistory && selectedTemplate && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        Version History: {selectedTemplate.platform} {selectedTemplate.promptType}
                      </h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowVersionHistory(false)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Close
                      </Button>
                    </div>
                    
                    {versionsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-20 bg-gray-700 rounded animate-pulse"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {versionHistory.map((version) => (
                          <div
                            key={version.id}
                            className={`p-4 rounded border ${
                              version.isPrimary 
                                ? 'border-yellow-600 bg-yellow-600/10' 
                                : 'border-gray-600 bg-gray-700/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-gray-600 text-gray-300">
                                  v{version.version}
                                </Badge>
                                {version.isPrimary && (
                                  <Badge className="bg-yellow-600 text-white">
                                    <Star className="w-3 h-3 mr-1" />
                                    Primary
                                  </Badge>
                                )}
                                <span className="text-sm text-gray-400">
                                  by {version.createdByName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {new Date(version.createdAt).toLocaleDateString()}
                                </span>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedTemplate(version);
                                      setShowVersionHistory(false);
                                    }}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditTemplate(version)}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  {!version.isPrimary && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => makePrimaryMutation.mutate(version.id)}
                                      disabled={makePrimaryMutation.isPending}
                                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                    >
                                      <Star className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                            {version.changelog && (
                              <p className="text-sm text-gray-300 mb-2">{version.changelog}</p>
                            )}
                            <p className="text-xs text-gray-400 line-clamp-2">
                              {version.content.substring(0, 200)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}