import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType') || 'admin';
  const userIdParam = parseInt(urlParams.get('userId') || '1');

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
    queryKey: ['/api/surveys'],
  });

  const { data: evaluations = [], isLoading: isEvaluationsLoading } = useQuery({
    queryKey: ['/api/survey-responses', { responseType: 'evaluation' }],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/survey-responses?responseType=evaluation&userId=${userIdParam}&userType=${userTypeParam}`);
      return res.json();
    }
  });

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'published':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'private':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (userTypeParam === 'admin') {
      return { id: 1, username: 'John Admin', userType: 'admin' };
    } else if (userTypeParam === 'employee') {
      return { id: 2, username: 'Mike Johnson', userType: 'employee' };
    } else if (userTypeParam === 'individual') {
      return { id: 3, username: 'Sarah Wilson', userType: 'individual' };
    } else if (userTypeParam === 'funeral_home') {
      return { id: 2, username: 'Jane Smith', userType: 'funeral_home' }; // Fixed: funeral home ID is 2
    } else {
      return { id: 1, username: 'John Admin', userType: 'admin' };
    }
  });

  // Update user when URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const newUserType = urlParams.get('userType');

    let newUser: User;
    if (newUserType === 'admin') {
      newUser = { id: 1, username: 'John Admin', userType: 'admin' };
    } else if (newUserType === 'employee') {
      newUser = { id: 2, username: 'Mike Johnson', userType: 'employee' };
    } else if (newUserType === 'individual') {
      newUser = { id: 3, username: 'Sarah Wilson', userType: 'individual' };
    } else if (newUserType === 'funeral_home') {
      newUser = { id: 4, username: 'Jane Smith', userType: 'funeral_home' };
    } else {
      newUser = { id: 1, username: 'John Admin', userType: 'admin' };
    }

    setCurrentUser(newUser);
  }, [location]);

  // All menu items available to all user types
  const menuItems = [
    { id: 'obituaries', label: 'Obituaries', icon: 'fas fa-file-alt' },
    { id: 'finalspaces', label: 'FinalSpaces', icon: 'fas fa-heart' },
    { id: 'collaborations', label: 'My Collaborations', icon: 'fas fa-handshake' },
    { id: 'surveys', label: 'Platform Surveys', icon: 'fas fa-poll-h' },
    { id: 'pre-need', label: 'Pre Need Evaluation', icon: 'fas fa-file-medical' },
    { id: 'prompts', label: 'Prompt Templates', icon: 'fas fa-code' }
  ];

  // Restore tab state from localStorage
  const [activeSection, setActiveSection] = useState(() => {
    const savedTab = localStorage.getItem('dashboard-active-tab');
    return savedTab || 'obituaries';
  });

  // Save tab state when it changes
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    localStorage.setItem('dashboard-active-tab', section);
  };

  console.log(`User: ${currentUser.userType}, Menu items: ${menuItems.map(i => i.label).join(', ')}`);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">DeathMatters</h2>
          <p className="text-sm text-gray-600">
            {currentUser.userType === 'admin' ? 'System Admin Panel' : 
             currentUser.userType === 'funeral_home' ? 'Funeral Home Panel' : 
             currentUser.userType === 'employee' ? 'Employee Panel' : 
             currentUser.userType === 'individual' ? 'Individual Panel' : 'Panel'}
          </p>
        </div>

        {/* Main Menu */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleSectionChange(item.id)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    activeSection === item.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <i className={cn(item.icon, "w-5 h-5 mr-3")}></i>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* Account Section - Available to all users */}
          <div className="my-4 h-px bg-gray-200"></div>
          <p className="text-xs font-medium text-gray-500 mb-2 px-3">Account</p>

          <button
            onClick={() => handleSectionChange('team-management')}
            className={cn(
              "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors mb-2",
              activeSection === 'team-management'
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <i className="fas fa-users w-5 h-5 mr-3"></i>
            <span>Team Management</span>
          </button>

          <button
            onClick={() => handleSectionChange('account')}
            className={cn(
              "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              activeSection === 'account'
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <i className="fas fa-cog w-5 h-5 mr-3"></i>
            <span>My Account</span>
          </button>
        </nav>


      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {activeSection === 'obituaries' && 'Obituaries'}
              {activeSection === 'collaborations' && 'My Collaborations'}
              {activeSection === 'finalspaces' && 'FinalSpaces'}
              {activeSection === 'surveys' && 'Platform Surveys'}
              {activeSection === 'pre-need' && 'Pre Need Evaluation'}
              {activeSection === 'prompts' && 'Prompt Templates'}
              {activeSection === 'team-management' && 'Team Management'}
              {activeSection === 'account' && 'My Account'}
            </h1>

            {/* Render specific components based on active section */}
            {activeSection === 'obituaries' && (
              <DataTable
                title="Obituaries"
                data={obituaries}
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
                      { value: "completed", label: "Completed" },
                      { value: "published", label: "Published" }
                    ],
                    render: createBadgeRenderer(getStatusColor)
                  },
                  {
                    key: "createdByType",
                    title: "Created By",
                    sortable: true,
                    filterable: true,
                    filterOptions: [
                      { value: "admin", label: "Admin" },
                      { value: "funeral_home", label: "Funeral Home" },
                      { value: "employee", label: "Employee" },
                      { value: "individual", label: "Individual" }
                    ],
                    render: (value) => value || "Unknown"
                  },
                  {
                    key: "actions",
                    title: "Actions",
                    render: createActionButtons([
                      {
                        icon: <Eye className="w-4 h-4" />,
                        onClick: (row) => window.location.href = `/obituaries/${row.id}/generate`,
                        title: "View"
                      },
                      {
                        icon: <Edit className="w-4 h-4" />,
                        onClick: (row) => window.location.href = `/obituaries/${row.id}/edit`,
                        title: "Edit"
                      }
                    ])
                  }
                ]}
                searchPlaceholder="Search by deceased name..."
                createButton={{
                  label: "Create Obituary",
                  onClick: () => window.location.href = `/obituaries/create?userType=${userTypeParam}&userId=${userIdParam}`
                }}
                emptyState={{
                  title: "No obituaries found",
                  description: "Start by creating your first obituary",
                  icon: <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                }}
                isLoading={isObituariesLoading}
              />
            )}

            {activeSection === 'collaborations' && (
              <DataTable
                title="Collaborations"
                data={[]} // Replace with actual collaborations data
                columns={[
                  {
                    key: 'obituaryTitle',
                    title: 'Obituary',
                    sortable: true,
                    render: (collab) => collab.obituary?.fullName || 'Unknown',
                  },
                  {
                    key: 'role',
                    title: 'Role',
                    sortable: true,
                    render: (collab) => collab.role || 'Collaborator',
                  },
                  {
                    key: 'status',
                    title: 'Status',
                    sortable: true,
                    render: (collab) => (
                      <Badge variant={collab.status === 'active' ? 'default' : 'secondary'}>
                        {collab.status || 'pending'}
                      </Badge>
                    ),
                  },
                  {
                    key: 'createdAt',
                    title: 'Invited',
                    sortable: true,
                    render: (collab) => formatDate(collab.createdAt || new Date()),
                  },
                  {
                    key: 'actions',
                    title: 'Actions',
                    render: (collab) => (
                      <div className="flex gap-2">
                        {collab.collaborationUuid && (
                          <Link href={`/collaborate/${collab.collaborationUuid}`}>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                        {collab.obituary?.id && (
                          <Link href={`/obituary/${collab.obituary.id}/generated`}>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    ),
                  },
                ]}
                searchPlaceholder="Search by obituary name..."
                emptyState={{
                  title: 'No collaborations found',
                  description: 'You have not been invited to collaborate on any obituaries yet.',
                  icon: <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />,
                }}
                isLoading={false}
              />
            )}

            {activeSection === 'finalspaces' && (
              <DataTable
                  title="FinalSpaces"
                  data={finalSpaces}
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
                      <Badge className={value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {value ? 'Public' : 'Private'}
                      </Badge>
                    )
                  },
                  {
                    key: "actions",
                    title: "Actions",
                    render: createActionButtons([
                      {
                        icon: <Eye className="w-4 h-4" />,
                        onClick: (row) => window.location.href = `/final-spaces/${row.id}`,
                        title: "View"
                      },
                      {
                        icon: <Edit className="w-4 h-4" />,
                        onClick: (row) => window.location.href = `/final-spaces/edit/${row.id}`,
                        title: "Edit"
                      }
                    ])
                  }
                ]}
                searchPlaceholder="Search by person name..."
                createButton={{
                  label: "Create Memorial",
                  onClick: () => window.location.href = `/final-spaces/create?userType=${userTypeParam}&userId=${userIdParam}`
                }}
                emptyState={{
                  title: "No memorials found",
                  description: "Start by creating your first memorial space",
                  icon: <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                }}
                isLoading={isFinalSpacesLoading}
                />
            )}

            {activeSection === 'surveys' && (
              <DataTable
                title="Platform Surveys"
                data={surveys}
                columns={[
                  {
                    key: "name",
                    title: "Survey Name",
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
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                      { value: "draft", label: "Draft" }
                    ],
                    render: (value) => (
                      <Badge className={value === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {value || 'inactive'}
                      </Badge>
                    )
                  },
                  {
                    key: "version",
                    title: "Version",
                    sortable: true,
                    render: (value) => value || "1"
                  },
                  {
                    key: "actions",
                    title: "Actions",
                    render: createActionButtons([
                      {
                        icon: <Edit className="w-4 h-4" />,
                        onClick: (row) => window.location.href = `/surveys/${row.id}/edit`,
                        title: "Edit"
                      }
                    ])
                  }
                ]}
                searchPlaceholder="Search by survey name..."
                createButton={{
                  label: "Create Survey",
                  onClick: () => window.location.href = `/surveys/create?userType=${userTypeParam}&userId=${userIdParam}`
                }}
                emptyState={{
                  title: "No surveys found",
                  description: "Start by creating your first survey",
                  icon: <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                }}
                isLoading={isSurveysLoading}
              />
            )}

            {activeSection === 'pre-need' && (
              <DataTable
                title="Pre Need Evaluations"
                data={evaluations}
                columns={[
                  {
                    key: "respondent",
                    title: "Respondent",
                    sortable: true,
                    render: (value, row) => row.responses?.who_is_this_for || "Unknown"
                  },
                  {
                    key: "submittedAt",
                    title: "Date Completed",
                    sortable: true,
                    render: (value) => (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(value)}
                      </div>
                    )
                  },
                  {
                    key: "responseType",
                    title: "Response Type",
                    sortable: true,
                    filterable: true,
                    filterOptions: [
                      { value: "evaluation", label: "Evaluation" },
                      { value: "survey", label: "Survey" },
                      { value: "assessment", label: "Assessment" }
                    ],
                    render: (value) => (
                      <Badge className="bg-blue-100 text-blue-800">
                        {value || 'evaluation'}
                      </Badge>
                    )
                  },
                  {
                    key: "completedByType",
                    title: "Completed By",
                    sortable: true,
                    filterable: true,
                    filterOptions: [
                      { value: "admin", label: "Admin" },
                      { value: "funeral_home", label: "Funeral Home" },
                      { value: "employee", label: "Employee" },
                      { value: "individual", label: "Individual" }
                    ],
                    render: (value) => value || "Unknown"
                  },
                  {
                    key: "actions",
                    title: "Actions",
                    render: createActionButtons([
                      {
                        icon: <Eye className="w-4 h-4" />,
                        onClick: (row) => window.location.href = `/evaluations/${row.id}/view`,
                        title: "View"
                      }
                    ])
                  }
                ]}
                searchPlaceholder="Search by respondent..."
                createButton={{
                  label: "Take Pre Need Evaluation",
                  onClick: () => window.location.href = `/evaluations/take?userType=${userTypeParam}&userId=${userIdParam}`
                }}
                emptyState={{
                  title: "No evaluations found",
                  description: "Start by taking your first pre need evaluation",
                  icon: <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                }}
                isLoading={isEvaluationsLoading}
              />
            )}

            {activeSection === 'team-management' && <TeamManagement key="team-management" />}
            {activeSection === 'account' && <AccountInformation />}
            {activeSection === 'prompts' && <PromptTemplates />}

            {/* Default placeholder for other sections */}
            {!['obituaries', 'collaborations', 'finalspaces', 'surveys', 'pre-need', 'team-management', 'account', 'prompts'].includes(activeSection) && (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <i className="fas fa-cog text-4xl"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Section
                    </h3>
                    <p className="text-gray-600">
                      {activeSection === 'collaborations' && 'Obituaries you are collaborating on when invited by others'}
                    </p>
                    <Button className="mt-4">
                      Get Started
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function MyCollaborationsTab({ userType, userId }: { userType: string; userId: number }) {
  const { data: collaborations, isLoading } = useQuery({
    queryKey: ["/api/collaborations", userId, userType],
    enabled: !!userId
  });

  if (isLoading) {
    return <div>Loading collaborations...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          My Collaborations
        </CardTitle>
        <CardDescription>
          Obituaries you've been invited to collaborate on
        </CardDescription>
      </CardHeader>
      <CardContent>
        {collaborations && collaborations.length > 0 ? (
          <div className="space-y-4">
            {collaborations.map((collab: any) => (
              <div key={collab.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{collab.obituary?.deceasedName || 'Untitled Obituary'}</h3>
                    <p className="text-sm text-gray-600">
                      Invited by: {collab.obituary?.createdByName || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Added: {new Date(collab.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-x-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/collaborate/${collab.collaborationUuid}`}>
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Collaborate
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No collaborations</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't been invited to collaborate on any obituaries yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PreNeedEvaluationSection({ userType, userId }: { userType: string; userId: number }) {
  // Get funeral home ID based on user type
  const funeralHomeId = userType === 'funeral_home' ? userId : userType === 'employee' ? 1 : undefined;

  return (
    <div className="space-y-6">
      <PreNeedEvaluationTab />
    </div>
  );
}