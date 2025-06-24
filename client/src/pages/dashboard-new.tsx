import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TeamManagement from "./team-management";
import AccountInformation from "./account-information";
import PromptTemplates from "./prompt-templates";

interface User {
  id: number;
  username: string;
  userType: 'admin' | 'funeral_home' | 'employee' | 'individual';
}

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  
  // Get user type from URL
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType');
  
  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (userTypeParam === 'admin') {
      return { id: 1, username: 'John Admin', userType: 'admin' };
    } else if (userTypeParam === 'employee') {
      return { id: 2, username: 'Mike Johnson', userType: 'employee' };
    } else if (userTypeParam === 'individual') {
      return { id: 3, username: 'Sarah Wilson', userType: 'individual' };
    } else if (userTypeParam === 'funeral_home') {
      return { id: 4, username: 'Jane Smith', userType: 'funeral_home' };
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
    { id: 'obituaries', label: 'Obituary Generator', icon: 'fas fa-file-alt' },
    { id: 'collaborations', label: 'My Collaborations', icon: 'fas fa-handshake' },
    { id: 'finalspaces', label: 'FinalSpaces', icon: 'fas fa-heart' },
    { id: 'surveys', label: 'Platform Surveys', icon: 'fas fa-poll-h' },
    { id: 'prompts', label: 'Prompt Templates', icon: 'fas fa-code' },
    { id: 'management', label: 'Funeral Home Management', icon: 'fas fa-building' }
  ];

  const [activeSection, setActiveSection] = useState('obituaries');

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
                  onClick={() => setActiveSection(item.id)}
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
            onClick={() => setActiveSection('team-management')}
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
            onClick={() => setActiveSection('account')}
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

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              {currentUser.username.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{currentUser.username}</p>
              <p className="text-xs text-gray-500">
                {currentUser.userType === 'admin' ? 'System Admin' : 
                 currentUser.userType === 'funeral_home' ? 'Funeral Home Admin' : 
                 currentUser.userType === 'employee' ? 'Employee' : 
                 currentUser.userType === 'individual' ? 'Individual User' : 'User'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {activeSection === 'obituaries' && 'Obituary Generator'}
              {activeSection === 'collaborations' && 'My Collaborations'}
              {activeSection === 'finalspaces' && 'FinalSpaces'}
              {activeSection === 'surveys' && 'Platform Surveys'}
              {activeSection === 'prompts' && 'Prompt Templates'}
              {activeSection === 'management' && 'Team Management'}
              {activeSection === 'team-management' && 'Team Management'}
              {activeSection === 'account' && 'My Account'}
            </h1>

            {/* Render specific components based on active section */}
            {activeSection === 'management' && <TeamManagement />}
            {activeSection === 'team-management' && <TeamManagement />}
            {activeSection === 'account' && <AccountInformation />}
            {activeSection === 'prompts' && <PromptTemplates />}
            
            {/* Default placeholder for other sections */}
            {!['management', 'team-management', 'account', 'prompts'].includes(activeSection) && (
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
                      {activeSection === 'obituaries' && currentUser.userType === 'admin' && 'All obituary creations across all funeral homes'}
                      {activeSection === 'obituaries' && currentUser.userType === 'funeral_home' && 'Your obituaries and team member obituaries'}
                      {activeSection === 'obituaries' && currentUser.userType === 'employee' && 'Your obituary creations'}
                      {activeSection === 'collaborations' && 'Obituaries you are collaborating on'}
                      {activeSection === 'finalspaces' && 'Memorial spaces and tributes'}
                      {activeSection === 'surveys' && 'Manage platform surveys and questions'}
                      {activeSection === 'prompts' && 'AI prompt templates and configurations'}
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