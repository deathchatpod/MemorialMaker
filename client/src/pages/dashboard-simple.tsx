import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Users, MessageSquare, Plus, FileText, Heart, Calendar, Eye, Edit, BarChart3, ClipboardList, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TeamManagement from "./team-management";
import AccountInformation from "./account-information";
import MyCollaborations from "./my-collaborations";
import { PreNeedEvaluationTab } from "@/components/pre-need-evaluation-tab";
import PromptTemplates from "./prompt-templates";

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
  const { data: obituaries = [], isLoading: isObituariesLoading } = useQuery<any[]>({
    queryKey: ['/api/obituaries']
  });

  const { data: finalSpaces = [], isLoading: isFinalSpacesLoading } = useQuery<any[]>({
    queryKey: ['/api/final-spaces']
  });

  const { data: surveys = [], isLoading: isLoadingSurveys } = useQuery<any[]>({
    queryKey: ['/api/surveys']
  });

  // Admin check - show templates for admin users
  const isAdmin = userTypeParam === 'admin' || currentUser.userType === 'admin';
  
  const menuItems = [
    { id: 'obituaries', label: 'Obituaries', icon: FileText },
    { id: 'finalspaces', label: 'FinalSpaces', icon: Heart },
    { id: 'collaborations', label: 'My Collaborations', icon: Users },
    { id: 'surveys', label: 'Platform Surveys', icon: ClipboardList },
    { id: 'evaluations', label: 'Pre Need Evaluation', icon: BarChart3 },
    ...(isAdmin ? [{ id: 'templates', label: 'Prompt Templates', icon: Settings }] : []),
    { id: 'team', label: 'Team Management', icon: Users },
    { id: 'account', label: 'My Account', icon: Users }
  ];

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <nav className="w-64 bg-gray-800 shadow-sm border-r border-gray-700" role="navigation" aria-label="Main navigation">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white">Dashboard v3</h2>
          <p className="text-sm text-gray-300 mt-1">
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
                        : "text-gray-300 hover:bg-gray-700"
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
            <h1 className="text-2xl font-bold text-white mb-6">
              {activeSection === 'obituaries' && 'Obituaries'}
              {activeSection === 'collaborations' && 'My Collaborations'}
              {activeSection === 'finalspaces' && 'FinalSpaces'}
              {activeSection === 'surveys' && 'Platform Surveys'}
              {activeSection === 'evaluations' && 'Pre Need Evaluation'}
              {activeSection === 'team' && 'Team Management'}
              {activeSection === 'account' && 'My Account'}
            </h1>

            {/* Obituaries Section */}
            {activeSection === 'obituaries' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <span>Obituaries</span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button onClick={() => setLocation(`/obituary/new?userType=${userTypeParam}&userId=${userIdParam}`)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Obituary
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setLocation(`/obituary-review/upload?userType=${userTypeParam}&userId=${userIdParam}`)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Upload Existing Obituary for Review
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isObituariesLoading ? (
                    <p className="text-gray-300">Loading obituaries...</p>
                  ) : obituaries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-700">
                        <thead>
                          <tr className="bg-gray-800">
                            <th className="border border-gray-700 px-4 py-2 text-left text-white">Name</th>
                            <th className="border border-gray-700 px-4 py-2 text-left text-white">Status</th>
                            <th className="border border-gray-700 px-4 py-2 text-left text-white">Created</th>
                            <th className="border border-gray-700 px-4 py-2 text-left text-white">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {obituaries.map((obituary: any) => (
                            <tr key={obituary.id} className="hover:bg-gray-700">
                              <td className="border border-gray-700 px-4 py-2 text-gray-300">{obituary.fullName || obituary.full_name || 'Untitled'}</td>
                              <td className="border border-gray-700 px-4 py-2">
                                <Badge className={obituary.status === 'generated' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                                  {obituary.status}
                                </Badge>
                              </td>
                              <td className="border border-gray-700 px-4 py-2 text-gray-300">
                                {new Date(obituary.createdAt || obituary.created_at).toLocaleDateString()}
                              </td>
                              <td className="border border-gray-700 px-4 py-2">
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setLocation(`/obituary/${obituary.id}/edit`)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setLocation(`/obituary/${obituary.id}/generated`)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-300">No obituaries found. Create your first obituary to get started.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* FinalSpaces Section */}
            {activeSection === 'finalspaces' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>FinalSpaces</span>
                    <Button onClick={() => setLocation(`/final-spaces/create?userType=${userTypeParam}&userId=${userIdParam}`)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Memorial
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isFinalSpacesLoading ? (
                    <p className="text-gray-300">Loading memorials...</p>
                  ) : finalSpaces.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-700">
                        <thead>
                          <tr className="bg-gray-800">
                            <th className="border border-gray-700 px-4 py-2 text-left text-white">Person Name</th>
                            <th className="border border-gray-700 px-4 py-2 text-left text-white">Status</th>
                            <th className="border border-gray-700 px-4 py-2 text-left text-white">Visibility</th>
                            <th className="border border-gray-700 px-4 py-2 text-left text-white">Created</th>
                            <th className="border border-gray-700 px-4 py-2 text-left text-white">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {finalSpaces.map((finalSpace: any) => (
                            <tr key={finalSpace.id} className="hover:bg-gray-700">
                              <td className="border border-gray-700 px-4 py-2 text-gray-300">{finalSpace.personName || finalSpace.person_name || 'Untitled'}</td>
                              <td className="border border-gray-700 px-4 py-2">
                                <Badge className={finalSpace.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                                  {finalSpace.status}
                                </Badge>
                              </td>
                              <td className="border border-gray-700 px-4 py-2">
                                <Badge className={finalSpace.isPublic || finalSpace.is_public ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                                  {finalSpace.isPublic || finalSpace.is_public ? 'Public' : 'Private'}
                                </Badge>
                              </td>
                              <td className="border border-gray-700 px-4 py-2 text-gray-300">
                                {new Date(finalSpace.createdAt || finalSpace.created_at).toLocaleDateString()}
                              </td>
                              <td className="border border-gray-700 px-4 py-2">
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setLocation(`/final-spaces/${finalSpace.id}/edit`)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setLocation(`/memorial/${finalSpace.slug}`)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-300">No memorials found. Create your first memorial space to get started.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* My Collaborations Section */}
            {activeSection === 'collaborations' && (
              <MyCollaborations />
            )}

            {/* Platform Surveys Section */}
            {activeSection === 'surveys' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Platform Surveys
                    </div>
                    <Button onClick={() => setLocation(`/admin/surveys/new?userType=${userTypeParam}&userId=${userIdParam}`)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Survey
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingSurveys ? (
                    <p className="text-gray-300">Loading surveys...</p>
                  ) : surveys && surveys.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-700">
                        <thead>
                          <tr className="bg-gray-800">
                            <th className="border border-gray-700 px-4 py-2 text-left text-white">Survey Name</th>
                            <th className="border border-gray-700 px-4 py-2 text-left text-white">Questions</th>
                            <th className="border border-gray-700 px-4 py-2 text-left text-white">Created</th>
                            <th className="border border-gray-700 px-4 py-2 text-left text-white">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {surveys.map((survey: any) => (
                            <tr key={survey.id} className="hover:bg-gray-700">
                              <td className="border border-gray-700 px-4 py-2 text-gray-300">{survey.name}</td>
                              <td className="border border-gray-700 px-4 py-2 text-gray-300">
                                {survey.questions?.length || 0} questions
                              </td>
                              <td className="border border-gray-700 px-4 py-2 text-gray-300">
                                {new Date(survey.createdAt).toLocaleDateString()}
                              </td>
                              <td className="border border-gray-700 px-4 py-2">
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setLocation(`/admin/surveys/${survey.id}/edit?userType=${userTypeParam}&userId=${userIdParam}`)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setLocation(`/admin/surveys/${survey.id}/questions?userType=${userTypeParam}&userId=${userIdParam}`)}
                                  >
                                    <Settings className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-300">No surveys found. Create your first survey to get started.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pre Need Evaluation Section */}
            {activeSection === 'evaluations' && (
              <PreNeedEvaluationTab />
            )}

            {/* Prompt Templates Section */}
            {activeSection === 'templates' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Prompt Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Button 
                      onClick={() => setLocation(`/admin/templates/new?userType=${userTypeParam}&userId=${userIdParam}`)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Template
                    </Button>
                  </div>
                  <p className="text-gray-300">Prompt template management coming soon.</p>
                </CardContent>
              </Card>
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