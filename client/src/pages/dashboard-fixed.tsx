import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Users, MessageSquare, Plus, FileText, Heart, Calendar, Eye, Edit, BarChart3, ClipboardList, Skull, UserCog, Settings, Book } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TeamManagement from "./team-management";
import AccountInformation from "./account-information";
import PromptTemplates from "./prompt-templates";
import MyCollaborations from "./my-collaborations";
import { PreNeedEvaluationTab } from "@/components/pre-need-evaluation-tab";
import DataTable, { createBadgeRenderer, formatDate, createActionButtons } from "@/components/DataTable";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  userType: 'admin' | 'funeral_home' | 'employee' | 'individual';
}

export default function Dashboard() {
  const [location, setLocation] = useLocation();

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType') || 'admin';
  const userIdParam = parseInt(urlParams.get('userId') || '1');

  // Get active section from localStorage for persistence
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem('dashboard-active-tab') || 'obituaries';
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

  // Menu items for all user types with Lucide icons
  const menuItems = [
    { id: 'obituaries', label: 'Obituaries', icon: FileText },
    { id: 'finalspaces', label: 'FinalSpaces', icon: Heart },
    { id: 'collaborations', label: 'My Collaborations', icon: Users },
    { id: 'surveys', label: 'Platform Surveys', icon: ClipboardList },
    { id: 'pre-need', label: 'Pre Need Evaluation', icon: BarChart3 },
    ...(currentUser.userType === 'admin' ? [{ id: 'templates', label: 'Prompt Templates', icon: Settings }] : []),
    ...(currentUser.userType === 'admin' || currentUser.userType === 'funeral_home' 
      ? [{ id: 'team-management', label: 'Team Management', icon: UserCog }] 
      : []),
    { id: 'account', label: 'My Account', icon: Settings }
  ];

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    localStorage.setItem('dashboard-active-tab', section);
  };

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

  return (
    <div className="flex h-screen bg-background memorial-dashboard">
      {/* Sidebar */}
      <nav className="w-64 bg-card shadow-lg border-r border-border" role="navigation" aria-label="Dashboard navigation">
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

          <ul className="space-y-2" role="list">
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
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-background" role="main">
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
                Pre Need Evaluation
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
                        onClick={() => setLocation(`/obituary/${row.id}/edit`)}
                        title="Edit obituary"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLocation(`/obituary/${row.id}/generated`)}
                        title="View obituary"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                }
              ]}
              createButtons={[
                {
                  label: "Create New Obituary",
                  icon: Plus,
                  onClick: () => setLocation(`/obituary/new?userType=${userTypeParam}&userId=${userIdParam}`)
                },
                {
                  label: "Upload Existing Obituary for Review",
                  icon: FileText,
                  variant: "outline" as const,
                  onClick: () => setLocation(`/obituary-review/upload?userType=${userTypeParam}&userId=${userIdParam}`)
                }
              ]}
              emptyState={{
                title: 'No obituaries found',
                description: 'Create your first obituary to get started.'
              }}
              isLoading={isObituariesLoading}
            />
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

          {/* Team Management Section */}
          {activeSection === 'team-management' && (
            <div className="space-y-6">
              <TeamManagement />
            </div>
          )}

          {/* Account Information Section */}
          {activeSection === 'account' && (
            <div className="space-y-6">
              <AccountInformation />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}