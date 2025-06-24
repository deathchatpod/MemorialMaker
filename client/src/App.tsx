import React, { useState } from "react";
import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import Login from "./pages/login";
import Register from "./pages/register";
import ObituaryForm from "./pages/obituary-form";
import GeneratedObituaries from "./pages/generated-obituaries";
import QuestionManagement from "./pages/question-management";
import SurveyManagement from "./pages/survey-management";
import SurveyEditor from "./pages/survey-editor";
import FinalSpaces from "./pages/final-spaces";
import CreateFinalSpace from "./pages/create-final-space";
import Collaborate from "./pages/collaborate";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient();

interface User {
  id: number;
  username: string;
  userType: string;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/obituary/new" component={ObituaryForm} />
      <Route path="/obituary/:id/generated" component={GeneratedObituaries} />
      <Route path="/admin/questions" component={QuestionManagement} />
      <Route path="/admin/surveys" component={SurveyManagement} />
      <Route path="/admin/surveys/:id/edit" component={SurveyEditor} />
      <Route path="/final-spaces" component={FinalSpaces} />
      <Route path="/final-spaces/create" component={CreateFinalSpace} />
      <Route path="/collaborate/:uuid" component={Collaborate} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userTypeParam = urlParams.get('userType');
    
    if (userTypeParam === 'admin') {
      return { id: 2, username: 'John Admin', userType: 'admin' };
    } else if (userTypeParam === 'employee') {
      return { id: 3, username: 'Mike Johnson', userType: 'employee' };
    } else if (userTypeParam === 'individual') {
      return { id: 4, username: 'Sarah Wilson', userType: 'individual' };
    } else {
      return { id: 1, username: 'Jane Smith', userType: 'funeral_home' };
    }
  });

  const handleUserChange = (userType: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('userType', userType);
    window.location.href = url.toString();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <div className="flex-shrink-0 flex items-center">
                    <a href="/" className="flex items-center text-blue-600 hover:text-blue-700">
                      <div className="text-blue-600 mr-2">💙</div>
                      <h1 className="text-xl font-bold text-gray-900">DeathMatters</h1>
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <select 
                      value={currentUser.userType}
                      onChange={(e) => handleUserChange(e.target.value)}
                      className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="admin">Admin - John Admin</option>
                      <option value="funeral_home">Funeral Home - Jane Smith</option>
                      <option value="employee">Employee - Mike Johnson</option>
                      <option value="individual">Individual - Sarah Wilson</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {currentUser.username.charAt(0)}
                      </span>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {currentUser.username}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;