import React, { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skull } from "lucide-react";
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

function GlobalHeader() {
  const [location] = useLocation();
  
  // Check if user is authenticated
  const { data: authenticatedUser } = useQuery({
    queryKey: ['/auth/user'],
    queryFn: async () => {
      const response = await fetch('/auth/user');
      if (!response.ok) throw new Error('Not authenticated');
      return response.json();
    },
    retry: false,
  });

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isDashboard = location.startsWith('/dashboard') || location.startsWith('/admin') || location.startsWith('/obituary') || location.startsWith('/final-spaces');

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <Skull className="h-8 w-8 text-gray-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">DeathMatters</h1>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            {authenticatedUser ? (
              <>
                {!isDashboard && (
                  <Link href="/dashboard">
                    <Button variant="outline">Dashboard</Button>
                  </Link>
                )}
                <Button variant="outline" onClick={handleLogout}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline">Log In</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
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
          <GlobalHeader />
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;