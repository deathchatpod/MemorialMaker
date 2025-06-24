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
import { Plus, Edit, Save, X, Code, Bot } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PromptTemplate {
  id: number;
  name: string;
  platform: string;
  promptType: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function PromptTemplates() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    platform: "",
    promptType: "",
    content: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch prompt templates
  const { data: templates = [], isLoading } = useQuery<PromptTemplate[]>({
    queryKey: ["/api/prompt-templates"],
    queryFn: async () => {
      const response = await fetch('/api/prompt-templates');
      if (!response.ok) throw new Error('Failed to fetch prompt templates');
      return response.json();
    },
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PromptTemplate> }) => {
      return await apiRequest('PUT', `/api/prompt-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates"] });
      setEditingId(null);
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    },
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<PromptTemplate>) => {
      return await apiRequest('POST', '/api/prompt-templates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates"] });
      setIsCreating(false);
      setFormData({ name: "", platform: "", promptType: "", content: "" });
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/prompt-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates"] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (template: PromptTemplate) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      platform: template.platform,
      promptType: template.promptType,
      content: template.content
    });
  };

  const handleSave = (id: number) => {
    updateMutation.mutate({ id, data: formData });
  };

  const handleCreate = () => {
    if (!formData.name || !formData.platform || !formData.promptType || !formData.content) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ name: "", platform: "", promptType: "", content: "" });
  };

  const getPlatformIcon = (platform: string) => {
    if (platform.toLowerCase().includes('claude')) {
      return <Bot className="w-4 h-4" />;
    }
    if (platform.toLowerCase().includes('chatgpt') || platform.toLowerCase().includes('openai')) {
      return <Code className="w-4 h-4" />;
    }
    return <Code className="w-4 h-4" />;
  };

  const getPlatformColor = (platform: string) => {
    if (platform.toLowerCase().includes('claude')) {
      return 'bg-orange-100 text-orange-800';
    }
    if (platform.toLowerCase().includes('chatgpt') || platform.toLowerCase().includes('openai')) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    if (type === 'base') {
      return 'bg-blue-100 text-blue-800';
    }
    if (type === 'revision') {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const groupedTemplates = templates.reduce((acc, template) => {
    const key = template.platform;
    if (!acc[key]) acc[key] = [];
    acc[key].push(template);
    return acc;
  }, {} as Record<string, PromptTemplate[]>);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prompt Templates</h1>
          <p className="text-gray-600 mt-1">Manage AI prompt templates for obituary generation</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Template
        </Button>
      </div>

      {/* Create New Template Form */}
      {isCreating && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Claude Base Prompt"
                />
              </div>
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude">Claude</SelectItem>
                    <SelectItem value="chatgpt">ChatGPT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="promptType">Prompt Type</Label>
                <Select value={formData.promptType} onValueChange={(value) => setFormData({ ...formData, promptType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base">Base</SelectItem>
                    <SelectItem value="revision">Revision</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="content">Template Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter your prompt template content..."
                className="min-h-32"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCreate} 
                disabled={createMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {createMutation.isPending ? 'Creating...' : 'Create Template'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Groups */}
      <div className="space-y-6">
        {Object.entries(groupedTemplates).map(([platform, platformTemplates]) => (
          <div key={platform}>
            <div className="flex items-center gap-2 mb-4">
              {getPlatformIcon(platform)}
              <h2 className="text-xl font-semibold capitalize">{platform} Templates</h2>
              <Badge className={getPlatformColor(platform)}>
                {platformTemplates.length} template{platformTemplates.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="grid gap-4">
              {platformTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge className={getTypeColor(template.promptType)}>
                          {template.promptType}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {editingId === template.id ? (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleSave(template.id)}
                              disabled={updateMutation.isPending}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => deleteMutation.mutate(template.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingId === template.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor={`name-${template.id}`}>Template Name</Label>
                            <Input
                              id={`name-${template.id}`}
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`platform-${template.id}`}>Platform</Label>
                            <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="claude">Claude</SelectItem>
                                <SelectItem value="chatgpt">ChatGPT</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`type-${template.id}`}>Prompt Type</Label>
                            <Select value={formData.promptType} onValueChange={(value) => setFormData({ ...formData, promptType: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="base">Base</SelectItem>
                                <SelectItem value="revision">Revision</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor={`content-${template.id}`}>Template Content</Label>
                          <Textarea
                            id={`content-${template.id}`}
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="min-h-32"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded border">
                        {template.content}
                      </div>
                    )}
                    <Separator className="my-4" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(template.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first prompt template to get started with AI-powered obituary generation.
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}