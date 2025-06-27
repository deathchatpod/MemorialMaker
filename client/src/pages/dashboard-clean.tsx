import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Users, MessageSquare, Plus, FileText, Heart, Calendar, Eye, Edit, BarChart3, ClipboardList } from "lucide-react";
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
  const [activeSection, setActiveSection] = useState('obituaries');

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType') || 'admin';
  const userIdParam = parseInt(urlParams.get('userId') || '1');

  const currentUser: User = {
    id: userIdParam,
    username: userTypeParam === 'admin' ? 'John Admin' : 
              userTypeParam === 'funeral_home' ? 'Jane Smith' : 
              userTypeParam === 'employee' ? 'Mike Johnson' : 'Sarah Wilson',
    userType: userTypeParam as User['userType']
  };

  // Data fetching queries
  const { data: obituaries = [], isLoading: isObituariesLoading } = useQuery({
    queryKey: ['/api/obituaries', userTypeParam, userIdParam],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/obituaries?userId=${userIdParam}&userType=${userTypeParam}`);
      return res.json();
    }
  });

  const { data: finalSpaces = [], isLoading: isFinalSpacesLoading } = useQuery({
    queryKey: ['/api/final-spaces', userTypeParam, userIdParam],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/final-spaces?userId=${userIdParam}&userType=${userTypeParam}`);
      return res.json();
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

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'published':
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

  const isAdmin = userTypeParam === 'admin';
  
  const allMenuItems = [
    { id: 'obituaries', label: 'Obituaries', icon: FileText },
    { id: 'finalspaces', label: 'FinalSpaces', icon: Heart },
    { id: 'collaborations', label: 'My Collaborations', icon: Users },
    { id: 'surveys', label: 'Platform Surveys', icon: ClipboardList },
    { id: 'evaluations', label: 'Pre Need Evaluation', icon: BarChart3 },
    { id: 'prompts', label: 'Prompt Templates', icon: FileText },
    { id: 'team', label: 'Team Management', icon: Users },
    { id: 'account', label: 'My Account', icon: Users }
  ];

  const regularMenuItems = [
    { id: 'obituaries', label: 'Obituaries', icon: FileText },
    { id: 'finalspaces', label: 'FinalSpaces', icon: Heart },
    { id: 'collaborations', label: 'My Collaborations', icon: Users },
    { id: 'surveys', label: 'Platform Surveys', icon: ClipboardList },
    { id: 'evaluations', label: 'Pre Need Evaluation', icon: BarChart3 },
    { id: 'account', label: 'My Account', icon: Users }
  ];

  const menuItems = isAdmin ? allMenuItems : regularMenuItems;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <nav className="w-64 bg-white shadow-sm border-r border-gray-200" role="navigation" aria-label="Main navigation">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            {currentUser.userType === 'admin' ? 'System Admin' : 
             currentUser.userType === 'funeral_home' ? 'Funeral Home' : 
             currentUser.userType === 'employee' ? 'Employee' : 
             'Individual'}
          </p>
        </div>

        <div className="px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      activeSection === item.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto" role="main">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {activeSection === 'obituaries' && 'Obituaries'}
              {activeSection === 'collaborations' && 'My Collaborations'}
              {activeSection === 'finalspaces' && 'FinalSpaces'}
              {activeSection === 'surveys' && 'Platform Surveys'}
              {activeSection === 'evaluations' && 'Pre Need Evaluation'}
              {activeSection === 'prompts' && 'Prompt Templates'}
              {activeSection === 'team' && 'Team Management'}
              {activeSection === 'account' && 'My Account'}
            </h1>

            {/* Obituaries Section */}
            {activeSection === 'obituaries' && (
              <DataTable
                title="Obituaries"
                data={Array.isArray(obituaries) ? obituaries : []}
                columns={[
                  {
                    key: "deceasedName",
                    title: "Deceased Name",
                    sortable: true,
                    render: (value) => value || "Untitled"
                  },
                  {
                    key: "createdAt",
                    title: "Date Created",
                    sortable: true,
                    render: (value) => formatDate(value)
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
                  }
                ]}
                actions={createActionButtons([
                  {
                    label: "Edit",
                    onClick: (row) => setLocation(`/obituary/${row.id}/edit`),
                    variant: "outline"
                  },
                  {
                    label: "View",
                    onClick: (row) => setLocation(`/obituary/${row.id}/generated`),
                    variant: "outline"
                  }
                ])}
                createButton={{
                  label: "Create New Obituary",
                  onClick: () => setLocation(`/obituary/new?userType=${userTypeParam}&userId=${userIdParam}`)
                }}
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
                title="FinalSpaces"
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
                    render: (value) => formatDate(value)
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
                  }
                ]}
                actions={createActionButtons([
                  {
                    label: "Edit",
                    icon: Edit,
                    onClick: (row) => setLocation(`/final-spaces/${row.id}/edit`),
                    variant: "outline"
                  },
                  {
                    label: "View",
                    icon: Eye,
                    onClick: (row) => setLocation(`/memorial/${row.slug}`),
                    variant: "outline"
                  }
                ])}
                createButton={{
                  label: "Create New Memorial",
                  icon: Plus,
                  onClick: () => setLocation(`/final-spaces/create?userType=${userTypeParam}&userId=${userIdParam}`)
                }}
                emptyState={{
                  title: 'No memorials found',
                  description: 'Create your first memorial space to get started.',
                  icon: <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
                title="Platform Surveys"
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
                  }
                ]}
                actions={createActionButtons([
                  {
                    label: "Edit",
                    icon: Edit,
                    onClick: (row) => setLocation(`/admin/surveys/${row.id}/edit`),
                    variant: "outline"
                  }
                ])}
                createButton={{
                  label: "Create New Survey",
                  icon: Plus,
                  onClick: () => setLocation(`/admin/surveys/new?userType=${userTypeParam}&userId=${userIdParam}`)
                }}
                emptyState={{
                  title: 'No surveys found',
                  description: 'Create your first survey to collect user feedback.',
                  icon: <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                }}
                isLoading={isSurveysLoading}
              />
            )}

            {/* Pre Need Evaluation Section */}
            {activeSection === 'evaluations' && (
              <PreNeedEvaluationTab userType={userTypeParam} userId={userIdParam} />
            )}

            {/* Prompt Templates Section */}
            {activeSection === 'prompts' && isAdmin && (
              <PromptTemplates />
            )}

            {/* Team Management Section */}
            {activeSection === 'team' && (
              <Card>
                <CardHeader>
                  <CardTitle>Team Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <TeamManagement />
                </CardContent>
              </Card>
            )}

            {/* Account Information Section */}
            {activeSection === 'account' && (
              <Card>
                <CardHeader>
                  <CardTitle>My Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <AccountInformation />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}