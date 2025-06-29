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
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [makePrimaryConfirm, setMakePrimaryConfirm] = useState<PromptTemplate | null>(null);
  
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
      if (!selectedTemplate) return [];
      const response = await fetch(`/api/prompt-templates/${selectedTemplate.id}/documents`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
    enabled: !!selectedTemplate
  });

  // Fetch version history for selected template
  const { data: versions = [], isLoading: versionsLoading } = useQuery<PromptTemplate[]>({
    queryKey: ["/api/prompt-templates", selectedTemplate?.platform, selectedTemplate?.promptType, "versions"],
    queryFn: async () => {
      if (!selectedTemplate) return [];
      const response = await fetch(`/api/prompt-templates/${selectedTemplate.platform}/${selectedTemplate.promptType}/versions`);
      if (!response.ok) throw new Error('Failed to fetch versions');
      return response.json();
    },
    enabled: !!selectedTemplate
  });

  // Create new version mutation
  const createVersionMutation = useMutation({
    mutationFn: async (data: PromptFormData & { baseTemplateId: number }) => {
      return await apiRequest('POST', '/api/prompt-templates/versions', {
        ...data,
        createdBy: currentUser.id,
        createdByName: currentUser.name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates"] });
      setEditingTemplate(null);
      setIsCreating(false);
      toast({
        title: "Success",
        description: "New prompt version created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new version",
        variant: "destructive",
      });
    },
  });

  // Make primary mutation
  const makePrimaryMutation = useMutation({
    mutationFn: async (templateId: number) => {
      return await apiRequest('PUT', `/api/prompt-templates/${templateId}/make-primary`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates"] });
      setMakePrimaryConfirm(null);
      toast({
        title: "Success",
        description: "Template version is now primary",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update primary version",
        variant: "destructive",
      });
    },
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, templateId }: { file: File; templateId: number }) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates"] });
      setUploadingDocument(false);
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    },
  });

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
    
    if (template.isPrimary) {
      acc[key].primary = template;
    }
    acc[key].versions.push(template);
    
    return acc;
  }, {} as Record<string, { platform: string; promptType: string; primary: PromptTemplate | null; versions: PromptTemplate[] }>);

  const handleEditTemplate = (template: PromptTemplate) => {
    setEditingTemplate(template);
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

  const handleSaveVersion = () => {
    if (!editingTemplate) return;
    
    createVersionMutation.mutate({
      ...formData,
      baseTemplateId: editingTemplate.id
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTemplate) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, DOCX, or TXT files only",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload files smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    uploadDocumentMutation.mutate({ file, templateId: selectedTemplate.id });
  };

  const getTestingLink = (template: PromptTemplate): string | undefined => {
    if (template.promptType === 'base') {
      return '/obituary/new';
    } else if (template.promptType === 'revision') {
      return '/obituary/new'; // They can test revisions through the obituary flow
    }
    return undefined;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Enhanced Prompt Templates</h1>
          <p className="text-gray-400 mt-1">Manage AI prompt templates with versioning and context documents</p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)} 
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="w-4 h-4" />
          Create New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates List */}
        <div className="space-y-4">
          {Object.entries(groupedTemplates).map(([key, group]) => (
            <Card key={key} className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {group.platform === 'claude' ? (
                        <Bot className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Code className="w-5 h-5 text-green-400" />
                      )}
                      <Badge variant="outline" className="text-gray-300 border-gray-600">
                        {group.platform}
                      </Badge>
                      <Badge variant="outline" className="text-gray-300 border-gray-600">
                        {group.promptType}
                      </Badge>
                    </div>
                    {group.primary && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-xs text-yellow-400">Primary</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {group.primary && getTestingLink(group.primary) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={() => {
                          const link = getTestingLink(group.primary!);
                          if (link) window.open(link, '_blank');
                        }}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Test
                      </Button>
                    )}
                    <span className="text-xs text-gray-500">
                      {group.versions.length} version{group.versions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {group.primary ? (
                  <div className="space-y-3">
                    <h3 className="font-medium text-white">{group.primary.name}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {group.primary.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>v{group.primary.version} by {group.primary.createdByName}</span>
                      <span>{new Date(group.primary.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={() => {
                          setSelectedTemplate(group.primary);
                          setShowVersionHistory(false);
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={() => handleEditTemplate(group.primary!)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={() => {
                          setSelectedTemplate(group.primary);
                          setShowVersionHistory(true);
                        }}
                      >
                        <History className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No primary version set</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 border-gray-600 text-gray-300 hover:bg-gray-700"
                      onClick={() => {
                        setSelectedTemplate(group.versions[0]);
                        setShowVersionHistory(true);
                      }}
                    >
                      Manage Versions
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Template Details/Editor */}
        <div className="space-y-4">
          {(selectedTemplate || editingTemplate || isCreating) && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    {editingTemplate || isCreating ? (
                      <>
                        <Edit className="w-5 h-5" />
                        {isCreating ? 'Create New Template' : 'Edit Template'}
                      </>
                    ) : showVersionHistory ? (
                      <>
                        <History className="w-5 h-5" />
                        Version History
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5" />
                        Template Details
                      </>
                    )}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
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
                {showVersionHistory && selectedTemplate ? (
                  /* Version History View */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-white">
                        {selectedTemplate.platform} - {selectedTemplate.promptType}
                      </h3>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {versions.map((version) => (
                        <div
                          key={version.id}
                          className={`p-3 rounded border ${
                            version.isPrimary
                              ? 'border-yellow-400 bg-yellow-400/10'
                              : 'border-gray-600 bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">v{version.version}</span>
                              {version.isPrimary && (
                                <Badge className="bg-yellow-400 text-yellow-900">Primary</Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {!version.isPrimary && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                                  onClick={() => setMakePrimaryConfirm(version)}
                                >
                                  <Star className="w-3 h-3 mr-1" />
                                  Make Primary
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                                onClick={() => handleEditTemplate(version)}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{version.changelog || 'No changelog provided'}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {version.createdByName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(version.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : editingTemplate || isCreating ? (
                  /* Edit/Create Form */
                  <div className="space-y-6">
                    <Tabs defaultValue="structure" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 bg-gray-700">
                        <TabsTrigger value="structure" className="text-gray-300">Structure</TabsTrigger>
                        <TabsTrigger value="content" className="text-gray-300">Content</TabsTrigger>
                        <TabsTrigger value="metadata" className="text-gray-300">Metadata</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="structure" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name" className="text-gray-300">Template Name</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                              className="bg-gray-700 border-gray-600 text-white"
                              placeholder="e.g., Claude Base Prompt v2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="platform" className="text-gray-300">AI Platform</Label>
                            <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
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
                        
                        <div>
                          <Label htmlFor="promptType" className="text-gray-300">Prompt Type</Label>
                          <Select value={formData.promptType} onValueChange={(value) => setFormData(prev => ({ ...prev, promptType: value }))}>
                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="base">Base Generation</SelectItem>
                              <SelectItem value="revision">Revision</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="content" className="space-y-4">
                        <div>
                          <Label htmlFor="systemMessage" className="text-gray-300">
                            System Message
                            <span className="text-xs text-gray-500 ml-2">Sets the AI's role and context</span>
                          </Label>
                          <Textarea
                            id="systemMessage"
                            value={formData.systemMessage}
                            onChange={(e) => setFormData(prev => ({ ...prev, systemMessage: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white min-h-20"
                            placeholder="You are an expert obituary writer..."
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="userInstructions" className="text-gray-300">
                            User Instructions
                            <span className="text-xs text-gray-500 ml-2">Specific task instructions</span>
                          </Label>
                          <Textarea
                            id="userInstructions"
                            value={formData.userInstructions}
                            onChange={(e) => setFormData(prev => ({ ...prev, userInstructions: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white min-h-20"
                            placeholder="Create a respectful obituary using the provided information..."
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="examples" className="text-gray-300">
                            Examples
                            <span className="text-xs text-gray-500 ml-2">Sample inputs and outputs</span>
                          </Label>
                          <Textarea
                            id="examples"
                            value={formData.examples}
                            onChange={(e) => setFormData(prev => ({ ...prev, examples: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white min-h-20"
                            placeholder="Example input/output pairs..."
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="constraints" className="text-gray-300">
                            Constraints & Guidelines
                            <span className="text-xs text-gray-500 ml-2">Rules and limitations</span>
                          </Label>
                          <Textarea
                            id="constraints"
                            value={formData.constraints}
                            onChange={(e) => setFormData(prev => ({ ...prev, constraints: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white min-h-20"
                            placeholder="Keep the tone respectful, limit to 500 words..."
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="outputFormat" className="text-gray-300">
                            Output Format
                            <span className="text-xs text-gray-500 ml-2">Expected response structure</span>
                          </Label>
                          <Textarea
                            id="outputFormat"
                            value={formData.outputFormat}
                            onChange={(e) => setFormData(prev => ({ ...prev, outputFormat: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white min-h-20"
                            placeholder="Return the obituary in plain text format..."
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="metadata" className="space-y-4">
                        <div>
                          <Label htmlFor="changelog" className="text-gray-300">
                            Version Changelog
                            <span className="text-xs text-gray-500 ml-2">What changed in this version?</span>
                          </Label>
                          <Textarea
                            id="changelog"
                            value={formData.changelog}
                            onChange={(e) => setFormData(prev => ({ ...prev, changelog: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white min-h-20"
                            placeholder="Improved tone handling, added length constraints..."
                          />
                        </div>
                        
                        <div className="bg-gray-700/50 p-4 rounded">
                          <h4 className="text-sm font-medium text-white mb-2">Version Information</h4>
                          <div className="space-y-2 text-xs text-gray-400">
                            <p>Created by: {currentUser.name}</p>
                            <p>Date: {new Date().toLocaleString()}</p>
                            <p>Platform: {formData.platform}</p>
                            <p>Type: {formData.promptType}</p>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingTemplate(null);
                          setIsCreating(false);
                        }}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveVersion}
                          disabled={createVersionMutation.isPending}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {createVersionMutation.isPending ? 'Saving...' : 'Save New Version'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Template Details View */
                  selectedTemplate && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-white">{selectedTemplate.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-gray-300 border-gray-600">
                              {selectedTemplate.platform}
                            </Badge>
                            <Badge variant="outline" className="text-gray-300 border-gray-600">
                              {selectedTemplate.promptType}
                            </Badge>
                            <Badge variant="outline" className="text-gray-300 border-gray-600">
                              v{selectedTemplate.version}
                            </Badge>
                            {selectedTemplate.isPrimary && (
                              <Badge className="bg-yellow-400 text-yellow-900">Primary</Badge>
                            )}
                          </div>
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
                          {getTestingLink(selectedTemplate) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const link = getTestingLink(selectedTemplate);
                                if (link) window.open(link, '_blank');
                              }}
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Test
                            </Button>
                          )}
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
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-gray-400 hover:text-white"
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <FileText className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                              <p className="text-sm text-gray-400">No context documents uploaded</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Upload PDF, DOCX, or TXT files to provide additional context
                              </p>
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="history" className="space-y-4">
                          <div className="bg-gray-700/50 p-4 rounded">
                            <h4 className="text-sm font-medium text-white mb-2">Version Information</h4>
                            <div className="space-y-2 text-sm text-gray-300">
                              <div className="flex justify-between">
                                <span>Version:</span>
                                <span>v{selectedTemplate.version}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Created by:</span>
                                <span>{selectedTemplate.createdByName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Created:</span>
                                <span>{new Date(selectedTemplate.createdAt).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Last updated:</span>
                                <span>{new Date(selectedTemplate.updatedAt).toLocaleString()}</span>
                              </div>
                              {selectedTemplate.changelog && (
                                <div>
                                  <span className="block mb-1">Changelog:</span>
                                  <p className="text-gray-400 text-xs">{selectedTemplate.changelog}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Make Primary Confirmation Dialog */}
      <AlertDialog open={!!makePrimaryConfirm} onOpenChange={() => setMakePrimaryConfirm(null)}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Make Primary Version</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to make version {makePrimaryConfirm?.version} the primary version for{' '}
              {makePrimaryConfirm?.platform} {makePrimaryConfirm?.promptType} prompts? This will be used for all new generations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => makePrimaryConfirm && makePrimaryMutation.mutate(makePrimaryConfirm.id)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Make Primary
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}