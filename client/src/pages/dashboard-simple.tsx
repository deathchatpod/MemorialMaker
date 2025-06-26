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
import MyCollaborations from "./my-collaborations";
import { PreNeedEvaluationTab } from "@/components/pre-need-evaluation-tab";

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
    queryKey: ['/api/obituaries', userTypeParam, userIdParam]
  });

  const { data: finalSpaces = [], isLoading: isFinalSpacesLoading } = useQuery({
    queryKey: ['/api/final-spaces', userTypeParam, userIdParam]
  });

  const menuItems = [
    { id: 'obituaries', label: 'Obituaries', icon: FileText },
    { id: 'finalspaces', label: 'FinalSpaces', icon: Heart },
    { id: 'collaborations', label: 'My Collaborations', icon: Users },
    { id: 'surveys', label: 'Platform Surveys', icon: ClipboardList },
    { id: 'evaluations', label: 'Pre Need Evaluation', icon: BarChart3 },
    { id: 'team', label: 'Team Management', icon: Users },
    { id: 'account', label: 'My Account', icon: Users }
  ];

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
              {activeSection === 'team' && 'Team Management'}
              {activeSection === 'account' && 'My Account'}
            </h1>

            {/* Obituaries Section */}
            {activeSection === 'obituaries' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Obituaries</span>
                    <Button onClick={() => setLocation(`/obituary/new?userType=${userTypeParam}&userId=${userIdParam}`)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Obituary
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isObituariesLoading ? (
                    <p className="text-gray-600">Loading obituaries...</p>
                  ) : obituaries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {obituaries.map((obituary: any) => (
                            <tr key={obituary.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2">{obituary.fullName || obituary.full_name || 'Untitled'}</td>
                              <td className="border border-gray-300 px-4 py-2">
                                <Badge className={obituary.status === 'generated' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                  {obituary.status}
                                </Badge>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {new Date(obituary.createdAt || obituary.created_at).toLocaleDateString()}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
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
                    <p className="text-gray-600">No obituaries found. Create your first obituary to get started.</p>
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
                    <p className="text-gray-600">Loading memorials...</p>
                  ) : finalSpaces.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-4 py-2 text-left">Person Name</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Visibility</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {finalSpaces.map((finalSpace: any) => (
                            <tr key={finalSpace.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2">{finalSpace.personName || finalSpace.person_name || 'Untitled'}</td>
                              <td className="border border-gray-300 px-4 py-2">
                                <Badge className={finalSpace.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                  {finalSpace.status}
                                </Badge>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <Badge className={finalSpace.isPublic || finalSpace.is_public ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                                  {finalSpace.isPublic || finalSpace.is_public ? 'Public' : 'Private'}
                                </Badge>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {new Date(finalSpace.createdAt || finalSpace.created_at).toLocaleDateString()}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
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
                    <p className="text-gray-600">No memorials found. Create your first memorial space to get started.</p>
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
                    <span>Platform Surveys</span>
                    <Button onClick={() => setLocation(`/admin/surveys/new?userType=${userTypeParam}&userId=${userIdParam}`)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Survey
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Manage platform surveys here.</p>
                </CardContent>
              </Card>
            )}

            {/* Pre Need Evaluation Section */}
            {activeSection === 'evaluations' && (
              <Card>
                <CardHeader>
                  <CardTitle>Pre Need Evaluation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">View and manage pre-need evaluations.</p>
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