import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Users, MessageSquare, Plus, FileText, Heart, Calendar, Eye, Edit, BarChart3, ClipboardList, Skull, UserCog, Settings, Book, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import TeamManagement from "./team-management";
import AccountInformation from "./account-information";
import PromptTemplates from "./prompt-templates";
import MyCollaborations from "./my-collaborations";
import { PreNeedEvaluationTab } from "@/components/pre-need-evaluation-tab";
import DataTable, { createBadgeRenderer, formatDate, createActionButtons } from "@/components/DataTable";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface User {
  id: number;
  username: string;
  userType: 'admin' | 'funeral_home' | 'employee' | 'individual';
}

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize component safely
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType') || 'admin';
  const userIdParam = parseInt(urlParams.get('userId') || '1');

  // Get active section from URL parameter or localStorage for persistence
  const [activeSection, setActiveSection] = useState(() => {
    try {
      const activeSectionParam = urlParams.get('activeSection');
      if (activeSectionParam) {
        return activeSectionParam;
      }
      return localStorage.getItem('dashboard-active-tab') || 'obituaries';
    } catch (error) {
      console.warn('Error accessing localStorage:', error);
      return 'obituaries';
    }
  });

  // Get current user data
  const currentUser: User = {
    id: userIdParam,
    username: userTypeParam === 'admin' ? 'John Admin' : 
              userTypeParam === 'funeral_home' ? 'Jane Smith' : 
              userTypeParam === 'employee' ? 'Mike Johnson' : 'Sarah Wilson',
    userType: userTypeParam as User['userType']
  };

  // Data fetching queries with explicit user context
  const { data: obituaries = [], isLoading: isObituariesLoading } = useQuery({
    queryKey: ['/api/obituaries', userTypeParam, userIdParam],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/obituaries?userId=${userIdParam}&userType=${userTypeParam}`);
      return res.json();
    }
  });

  const { data: finalSpaces = [], isLoading: isFinalSpacesLoading, error: finalSpacesError } = useQuery({
    queryKey: ['/api/final-spaces', userTypeParam, userIdParam],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/final-spaces?userId=${userIdParam}&userType=${userTypeParam}`);
      const data = await res.json();
      return data;
    }
  });

  const { data: surveys = [], isLoading: isSurveysLoading } = useQuery({
    queryKey: ['/api/surveys', userTypeParam, userIdParam],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/surveys?userId=${userIdParam}&userType=${userTypeParam}`);
      return res.json();
    }
  });

  const { data: evaluations = [], isLoading: isEvaluationsLoading } = useQuery({
    queryKey: ['/api/evaluations', userTypeParam, userIdParam],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/evaluations?userId=${userIdParam}&userType=${userTypeParam}`);
      return res.json();
    }
  });

  const { data: obituaryReviews = [], isLoading: isObituaryReviewsLoading } = useQuery({
    queryKey: ['/api/obituary-reviews', userTypeParam, userIdParam],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/obituary-reviews?userId=${userIdParam}&userType=${userTypeParam}`);
      return res.json();
    }
  });

  const [apiTimeRange, setApiTimeRange] = useState('7d');

  const { data: apiUsage, isLoading: isApiUsageLoading } = useQuery({
    queryKey: ['/api/api-usage', userTypeParam, userIdParam, apiTimeRange],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/api-usage?timeRange=${apiTimeRange}`);
      return res.json();
    },
    enabled: currentUser.userType === 'admin' && activeSection === 'api-usage',
    refetchInterval: currentUser.userType === 'admin' && activeSection === 'api-usage' ? 5000 : false,
    staleTime: 0 // Always consider data stale to ensure fresh fetches
  });

  const { data: customerFeedback = [], isLoading: isCustomerFeedbackLoading } = useQuery({
    queryKey: ['/api/customer-feedback', userTypeParam, userIdParam],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/customer-feedback');
      return res.json();
    },
    enabled: currentUser.userType === 'admin'
  });

  // Menu items for all user types with Lucide icons
  const menuItems = [
    { id: 'obituaries', label: 'Obituaries', icon: FileText },
    { id: 'finalspaces', label: 'FinalSpaces', icon: Heart },
    { id: 'collaborations', label: 'My Collaborations', icon: Users },
    ...(currentUser.userType === 'admin' ? [{ id: 'surveys', label: 'Platform Surveys', icon: ClipboardList }] : []),
    { id: 'pre-need', label: 'Pre Need Services', icon: BarChart3 },
    ...(currentUser.userType === 'admin' ? [{ id: 'templates', label: 'Prompt Templates', icon: Settings }] : []),
    ...(currentUser.userType === 'admin' ? [{ id: 'api-usage', label: 'API Usage', icon: Activity }] : []),
    ...(currentUser.userType === 'admin' ? [{ id: 'customer-feedback', label: 'Customer Feedback', icon: MessageSquare }] : []),
    ...(currentUser.userType === 'admin' || currentUser.userType === 'funeral_home' 
      ? [{ id: 'team-management', label: 'Team Management', icon: UserCog }] 
      : []),
    { id: 'account', label: 'My Account', icon: Settings }
  ];

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    try {
      localStorage.setItem('dashboard-active-tab', section);
    } catch (error) {
      console.warn('Error saving to localStorage:', error);
    }
    
    // Scroll to top of the page when switching tabs
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete mutations for admin users
  const deleteObituaryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/obituaries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/obituaries'] });
      toast({
        title: "Success",
        description: "Obituary deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete obituary",
        variant: "destructive",
      });
    },
  });

  const deleteObituaryReviewMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/obituary-reviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/obituary-reviews'] });
      toast({
        title: "Success",
        description: "Obituary review deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete obituary review",
        variant: "destructive",
      });
    },
  });

  // Helper functions for table rendering
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'published':
      case 'generated':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'private':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Prevent rendering until component is properly initialized
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen bg-background memorial-dashboard items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background memorial-dashboard">
      {/* Sidebar */}
      <nav className="w-64 bg-card shadow-lg border-r border-border flex-shrink-0 flex flex-col" role="navigation" aria-label="Dashboard navigation">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center mb-8">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                <Skull className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{currentUser.username}</h2>
                <p className="text-sm text-muted-foreground capitalize">{currentUser.userType.replace('_', ' ')}</p>
              </div>
            </div>

            <ul className="space-y-2 pb-6" role="list">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleSectionChange(item.id)}
                      className={cn(
                        "w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors",
                        activeSection === item.id
                          ? "bg-accent text-accent-foreground border-r-2 border-primary"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                      )}
                      aria-current={activeSection === item.id ? "page" : undefined}
                    >
                      <IconComponent className="mr-3 w-5 h-5" aria-hidden="true" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background" role="main">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              {activeSection === 'obituaries' && (
              <>
                <FileText className="w-7 h-7 text-primary" />
                Obituaries
              </>
            )}
            {activeSection === 'collaborations' && (
              <>
                <Users className="w-7 h-7 text-primary" />
                My Collaborations
              </>
            )}
            {activeSection === 'finalspaces' && (
              <>
                <Heart className="w-7 h-7 text-primary" />
                FinalSpaces
              </>
            )}
            {activeSection === 'surveys' && (
              <>
                <ClipboardList className="w-7 h-7 text-primary" />
                Platform Surveys
              </>
            )}
            {activeSection === 'pre-need' && (
              <>
                <BarChart3 className="w-7 h-7 text-primary" />
                Pre Need Services
              </>
            )}
            {activeSection === 'team-management' && (
              <>
                <UserCog className="w-7 h-7 text-primary" />
                Team Management
              </>
            )}
            {activeSection === 'templates' && (
              <>
                <Settings className="w-7 h-7 text-primary" />
                Prompt Templates
              </>
            )}
            {activeSection === 'account' && (
              <>
                <Settings className="w-7 h-7 text-primary" />
                My Account
              </>
            )}
          </h1>

          {/* Obituaries Section */}
          {activeSection === 'obituaries' && (
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex flex-wrap justify-end gap-3 mb-4">
                <Button 
                  onClick={() => setLocation(`/obituary/new?userType=${userTypeParam}&userId=${userIdParam}`)}
                  className="flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  Create New Obituary
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation(`/obituary-review/upload?userType=${userTypeParam}&userId=${userIdParam}`)}
                  className="flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap"
                  size="sm"
                >
                  <FileText className="w-4 h-4" />
                  Upload Obit for Review
                </Button>
              </div>

              {/* Obituaries Table */}
              <DataTable
                data={Array.isArray(obituaries) ? obituaries : []}
                columns={[
                  {
                    key: "fullName",
                    title: "Deceased Name",
                    sortable: true,
                    render: (value) => value || "Untitled"
                  },
                  {
                    key: "createdAt",
                    title: "Date Created",
                    sortable: true,
                    render: (value) => (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(value)}
                      </div>
                    )
                  },
                  {
                    key: "status",
                    title: "Status",
                    sortable: true,
                    filterable: true,
                    filterOptions: [
                      { value: "draft", label: "Draft" },
                      { value: "generated", label: "Generated" },
                      { value: "completed", label: "Completed" }
                    ],
                    render: createBadgeRenderer(getStatusColor)
                  },
                  {
                    key: "actions",
                    title: "Actions",
                    sortable: false,
                    render: (value, row) => (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/obituary/${row.id}/generated`)}
                          title="Edit obituary"
                          className="btn-elevation focus-professional"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/obituary/${row.id}/generated`)}
                          title="View obituary"
                          className="btn-elevation focus-professional"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {currentUser.userType === 'admin' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                title="Delete obituary"
                                disabled={deleteObituaryMutation.isPending}
                                className="btn-elevation focus-professional"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="modal-glass">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="heading-lg">Delete Obituary?</AlertDialogTitle>
                                <AlertDialogDescription className="text-body">
                                  Are you sure you want to delete this obituary? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="btn-elevation focus-professional">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteObituaryMutation.mutate(row.id)}
                                  className="btn-elevation focus-professional bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )
                  }
                ]}
                emptyState={{
                  title: 'No obituaries found',
                  description: 'Create your first obituary to get started.'
                }}
                isLoading={isObituariesLoading}
              />

              {/* Obituary Reviews Table */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Obituary Reviews</h3>
                <DataTable
                    data={Array.isArray(obituaryReviews) ? obituaryReviews : []}
                    columns={[
                      {
                        key: "originalFilename",
                        title: "Document Name",
                        sortable: true,
                        render: (value) => value || "Unnamed Document"
                      },
                      {
                        key: "createdAt",
                        title: "Uploaded",
                        sortable: true,
                        render: (value) => (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(value)}
                          </div>
                        )
                      },
                      {
                        key: "status",
                        title: "Status",
                        sortable: true,
                        filterable: true,
                        filterOptions: [
                          { value: "pending", label: "Pending" },
                          { value: "processing", label: "Processing" },
                          { value: "completed", label: "Completed" },
                          { value: "error", label: "Error" }
                        ],
                        render: createBadgeRenderer(getStatusColor)
                      },
                      {
                        key: "actions",
                        title: "Actions",
                        sortable: false,
                        render: (value, row) => (
                          <div className="flex gap-2">
                            {row.status === 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setLocation(`/obituary-review/${row.id}/results`)}
                                title="View AI feedback and results"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Results
                              </Button>
                            )}
                            {row.status === 'pending' && (
                              <Badge variant="secondary">Processing...</Badge>
                            )}
                            {currentUser.userType === 'admin' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    title="Delete obituary review"
                                    disabled={deleteObituaryReviewMutation.isPending}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-gray-800 border-gray-700">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white">Delete Obituary Review?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-300">
                                      Are you sure you want to delete this obituary review? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteObituaryReviewMutation.mutate(row.id)}
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        )
                      }
                    ]}
                    emptyState={{
                      title: 'There are no Obituaries uploaded for review yet.',
                      description: ''
                    }}
                    isLoading={isObituaryReviewsLoading}
                  />
              </div>
            </div>
          )}

          {/* FinalSpaces Section */}
          {activeSection === 'finalspaces' && (
            <DataTable
              data={Array.isArray(finalSpaces) ? finalSpaces : []}
              columns={[
                {
                  key: "personName",
                  title: "Person Name",
                  sortable: true,
                  render: (value) => value || "Untitled"
                },
                {
                  key: "createdAt",
                  title: "Date Created",
                  sortable: true,
                  render: (value) => (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(value)}
                    </div>
                  )
                },
                {
                  key: "status",
                  title: "Status",
                  sortable: true,
                  filterable: true,
                  filterOptions: [
                    { value: "draft", label: "Draft" },
                    { value: "published", label: "Published" },
                    { value: "private", label: "Private" }
                  ],
                  render: createBadgeRenderer(getStatusColor)
                },
                {
                  key: "isPublic",
                  title: "Visibility",
                  sortable: true,
                  filterable: true,
                  filterOptions: [
                    { value: "true", label: "Public" },
                    { value: "false", label: "Private" }
                  ],
                  render: (value) => (
                    <Badge className={value ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                      {value ? 'Public' : 'Private'}
                    </Badge>
                  )
                },
                {
                  key: "actions",
                  title: "Actions",
                  sortable: false,
                  render: (value, row) => (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLocation(`/final-spaces/${row.id}/edit`)}
                        title="Edit memorial"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLocation(`/memorial/${row.slug}`)}
                        title="View memorial"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                }
              ]}
              createButton={{
                label: "Create New Memorial",
                icon: Plus,
                onClick: () => setLocation(`/final-spaces/create?userType=${userTypeParam}&userId=${userIdParam}`)
              }}
              emptyState={{
                title: 'No memorials found',
                description: 'Create your first memorial space to get started.'
              }}
              isLoading={isFinalSpacesLoading}
            />
          )}

          {/* My Collaborations Section */}
          {activeSection === 'collaborations' && (
            <MyCollaborations />
          )}

          {/* Platform Surveys Section */}
          {activeSection === 'surveys' && (
            <DataTable
              data={Array.isArray(surveys) ? surveys : []}
              columns={[
                {
                  key: "name",
                  title: "Survey Name",
                  sortable: true,
                  render: (value) => value || "Untitled Survey"
                },
                {
                  key: "description",
                  title: "Description",
                  sortable: false,
                  render: (value) => value || "No description"
                },
                {
                  key: "status",
                  title: "Status",
                  sortable: true,
                  filterable: true,
                  filterOptions: [
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" }
                  ],
                  render: createBadgeRenderer(getStatusColor)
                },
                {
                  key: "actions",
                  title: "Actions",
                  sortable: false,
                  render: (value, row) => (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLocation(`/admin/surveys/${row.id}/edit`)}
                        title="Edit survey"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                }
              ]}
              createButton={{
                label: "Create New Survey",
                icon: Plus,
                onClick: () => setLocation(`/admin/surveys/new?userType=${userTypeParam}&userId=${userIdParam}`)
              }}
              emptyState={{
                title: 'No surveys found',
                description: 'Create your first survey to collect user feedback.'
              }}
              isLoading={isSurveysLoading}
            />
          )}

          {/* Pre Need Evaluation Section */}
          {activeSection === 'pre-need' && (
            <PreNeedEvaluationTab />
          )}

          {/* Prompt Templates Section */}
          {activeSection === 'templates' && currentUser.userType === 'admin' && (
            <div className="space-y-6">
              <PromptTemplates />
            </div>
          )}

          {/* API Usage Section */}
          {activeSection === 'api-usage' && currentUser.userType === 'admin' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground flex items-center">
                    <Activity className="mr-3 w-6 h-6" />
                    API Usage Dashboard
                  </h2>
                  <p className="text-muted-foreground mt-2">Monitor AI API calls and costs across the platform</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Time Range:</span>
                  <Select value={apiTimeRange} onValueChange={setApiTimeRange}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Summary Cards */}
              {apiUsage?.summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-card border border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                          <p className="text-2xl font-bold text-foreground">{apiUsage.summary.totalCalls}</p>
                        </div>
                        <Activity className="w-8 h-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                          <p className="text-2xl font-bold text-foreground">${apiUsage.summary.totalCost}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-600 font-bold">$</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
                          <p className="text-2xl font-bold text-foreground">{apiUsage.summary.totalTokens.toLocaleString()}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-600 font-bold">T</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                          <p className="text-2xl font-bold text-foreground">{(100 - parseFloat(apiUsage.summary.errorRate)).toFixed(1)}%</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-orange-600 font-bold">%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* API Calls Table */}
              <DataTable
                data={Array.isArray(apiUsage?.calls) ? apiUsage.calls : []}
                columns={[
                  {
                    key: "createdAt",
                    title: "Time",
                    sortable: true,
                    render: (value) => new Date(value).toLocaleString()
                  },
                  {
                    key: "platformFunction",
                    title: "Function",
                    sortable: true,
                    filterable: true,
                    filterOptions: [
                      { value: "obituary_generation", label: "Obituary Generation" },
                      { value: "obituary_revision", label: "Obituary Revision" },
                      { value: "obituary_review", label: "Obituary Review" },
                      { value: "content_feedback", label: "Content Feedback" }
                    ],
                    render: (value) => <span className="text-sm font-medium text-blue-600">{value?.replace('_', ' ') || 'N/A'}</span>
                  },
                  {
                    key: "promptTemplate",
                    title: "Template",
                    sortable: true,
                    render: (value) => <span className="text-xs text-muted-foreground">{value || 'Default'}</span>
                  },
                  {
                    key: "userType",
                    title: "User Type",
                    sortable: true,
                    filterable: true,
                    filterOptions: [
                      { value: "admin", label: "Admin" },
                      { value: "funeral_home", label: "Funeral Home" },
                      { value: "employee", label: "Employee" },
                      { value: "individual", label: "Individual" }
                    ],
                    render: (value) => <span className="capitalize text-xs">{value?.replace('_', ' ') || 'N/A'}</span>
                  },
                  {
                    key: "provider",
                    title: "Provider",
                    sortable: true,
                    filterable: true,
                    filterOptions: [
                      { value: "claude", label: "Claude" },
                      { value: "openai", label: "OpenAI" }
                    ],
                    render: (value) => <span className="font-medium text-xs">{value}</span>
                  },
                  {
                    key: "inputTokens",
                    title: "Input Tokens",
                    sortable: true,
                    render: (value) => value ? value.toLocaleString() : 'N/A'
                  },
                  {
                    key: "outputTokens", 
                    title: "Output Tokens",
                    sortable: true,
                    render: (value) => value ? value.toLocaleString() : 'N/A'
                  },
                  {
                    key: "inputCost",
                    title: "Input Cost",
                    sortable: true,
                    render: (value) => value ? `$${parseFloat(value).toFixed(4)}` : 'N/A'
                  },
                  {
                    key: "outputCost",
                    title: "Output Cost", 
                    sortable: true,
                    render: (value) => value ? `$${parseFloat(value).toFixed(4)}` : 'N/A'
                  },
                  {
                    key: "estimatedCost",
                    title: "Total Cost",
                    sortable: true,
                    render: (value) => value ? `$${parseFloat(value).toFixed(4)}` : 'N/A'
                  },
                  {
                    key: "status",
                    title: "Status",
                    sortable: true,
                    filterable: true,
                    filterOptions: [
                      { value: "success", label: "Success" },
                      { value: "error", label: "Error" },
                      { value: "timeout", label: "Timeout" }
                    ],
                    render: createBadgeRenderer((status) => {
                      switch (status?.toLowerCase()) {
                        case 'success':
                          return 'bg-green-100 text-green-800';
                        case 'error':
                          return 'bg-red-100 text-red-800';
                        case 'timeout':
                          return 'bg-yellow-100 text-yellow-800';
                        default:
                          return 'bg-gray-100 text-gray-800';
                      }
                    })
                  }
                ]}
                emptyState={{
                  title: 'No API calls found',
                  description: 'API usage data will appear here as users interact with AI features.'
                }}
                isLoading={isApiUsageLoading}
              />
            </div>
          )}

          {/* Team Management Section */}
          {activeSection === 'team-management' && (
            <div className="space-y-6">
              <TeamManagement />
            </div>
          )}

          {/* Customer Feedback Section */}
          {activeSection === 'customer-feedback' && currentUser.userType === 'admin' && (
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-100 flex items-center gap-2">
                        <MessageSquare className="w-6 h-6" />
                        Customer Feedback
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        View and manage customer feedback submissions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataTable
                    data={customerFeedback}
                    isLoading={isCustomerFeedbackLoading}
                    emptyMessage="There are no customer feedback submissions yet."
                    onRowClick={(row) => setLocation(`/customer-feedback/${row.id}`)}
                    columns={[
                      {
                        key: "userName",
                        title: "User",
                        sortable: true,
                        filterable: true,
                        render: (value, row) => (
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-gray-100 font-medium">{value}</p>
                              <p className="text-gray-400 text-xs capitalize">{row.userType?.replace('_', ' ')}</p>
                            </div>
                          </div>
                        )
                      },
                      {
                        key: "category",
                        title: "Category",
                        sortable: true,
                        filterable: true,
                        filterOptions: [
                          { value: "Bug/App Crashing", label: "Bug/App Crashing" },
                          { value: "New Feature Request", label: "New Feature Request" },
                          { value: "General Feedback", label: "General Feedback" },
                          { value: "General Question", label: "General Question" }
                        ],
                        render: (value) => (
                          <Badge variant="outline" className="text-xs bg-gray-700 text-gray-200 border-gray-600">
                            {value}
                          </Badge>
                        )
                      },
                      {
                        key: "subject",
                        title: "Subject",
                        sortable: true,
                        filterable: true,
                        render: (value) => (
                          <div className="max-w-xs">
                            <p className="text-gray-100 font-medium truncate">{value}</p>
                          </div>
                        )
                      },
                      {
                        key: "status",
                        title: "Status",
                        sortable: true,
                        filterable: true,
                        filterOptions: [
                          { value: "Needs Work", label: "Needs Work" },
                          { value: "In Process", label: "In Process" },
                          { value: "Resolved", label: "Resolved" }
                        ],
                        render: (value: string) => {
                          const statusColors: Record<string, string> = {
                            "Needs Work": "bg-red-600 text-white",
                            "In Process": "bg-yellow-600 text-white",
                            "Resolved": "bg-green-600 text-white"
                          };
                          return (
                            <Badge className={statusColors[value] || "bg-gray-600 text-white"}>
                              {value}
                            </Badge>
                          );
                        }
                      },
                      {
                        key: "createdAt",
                        title: "Date",
                        sortable: true,
                        render: (value) => formatDate(value)
                      }
                    ]}
                    actions={(row) => [
                      {
                        label: "View Details",
                        icon: Eye,
                        onClick: () => setLocation(`/customer-feedback/${row.id}`),
                        variant: "outline" as const
                      }
                    ]}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Account Information Section */}
          {activeSection === 'account' && (
            <div className="space-y-6">
              <AccountInformation />
            </div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}