import React, { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skull } from "lucide-react";
import Home from "./pages/home";
import Dashboard from "./pages/dashboard-fixed";
import Login from "./pages/login";
import Register from "./pages/register";
import ObituaryForm from "./pages/obituary-form";
import GeneratedObituaries from "./pages/generated-obituaries";
import QuestionManagement from "./pages/question-management";
import SurveyManagement from "./pages/survey-management";
import SurveyEditor from "./pages/survey-editor";
import FinalSpaces from "./pages/final-spaces";
import CreateFinalSpace from "./pages/create-final-space";
import CreateSurvey from "./pages/create-survey";
import ObituaryReviewUpload from "./pages/obituary-review-upload";
import ObituaryReviewResults from "./pages/obituary-review-results";
import Collaborate from "./pages/collaborate";
import NotFound from "./pages/not-found";
import TakePreNeedEvaluation from "./pages/take-pre-need-evaluation";
import ViewEvaluation from "./pages/view-evaluation";
import MemorialPage from "./pages/memorial-page";
import EditFinalSpace from "./pages/edit-final-space";

const queryClient = new QueryClient();

interface User {
  id: number;
  username: string;
  userType: string;
}

function GlobalHeader() {
  const [location, setLocation] = useLocation();

  const { data: authenticatedUser, isLoading: authLoading, error: authError } = useQuery({
    queryKey: ['/auth/user'],
    queryFn: async () => {
      const res = await fetch('/auth/user', {
        credentials: 'include',
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error('Auth check failed');
      return res.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Get current user from URL params (existing functionality)
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType');

  const currentUser = (() => {
    // If user is authenticated, use their actual data but allow override for testing
    if (authenticatedUser && !userTypeParam) {
      return {
        id: authenticatedUser.id,
        username: authenticatedUser.name || 'User',
        userType: authenticatedUser.userType || 'admin'
      };
    }
    
    // URL parameter override for testing
    if (userTypeParam === 'admin') {
      return { id: 1, username: 'John Admin', userType: 'admin' };
    } else if (userTypeParam === 'employee') {
      return { id: 3, username: 'Mike Johnson', userType: 'employee' };
    } else if (userTypeParam === 'individual') {
      return { id: 4, username: 'Sarah Wilson', userType: 'individual' };
    } else if (userTypeParam === 'funeral_home') {
      return { id: 2, username: 'Jane Smith', userType: 'funeral_home' };
    } else if (authenticatedUser) {
      // Default to authenticated user if no URL param
      return {
        id: authenticatedUser.id,
        username: authenticatedUser.name || 'User',
        userType: authenticatedUser.userType || 'admin'
      };
    } else {
      // Fallback when not authenticated
      return { id: 1, username: 'John Admin', userType: 'admin' };
    }
  })();

  const handleUserChange = (userType: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('userType', userType);
    window.location.href = url.toString();
  };

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', { method: 'POST' });
      setLocation('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isDashboard = location === '/dashboard' || location.startsWith('/dashboard?');
  const isHomePage = location === '/' || location === '';

  return (
    <header className="memorial-header bg-card shadow-lg border-b border-border" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <Skull className="h-8 w-8 text-primary mr-3" aria-hidden="true" />
              <span className="text-2xl font-bold text-foreground">
                Death<wbr />Matters
              </span>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground">
                  {currentUser.username.charAt(0)}
                </span>
              </div>
              <span className="ml-2 text-sm font-medium text-foreground hidden sm:inline">
                {currentUser.userType === 'admin' ? 'Admin' : 
                 currentUser.userType === 'funeral_home' ? 'Funeral Home' :
                 currentUser.userType === 'employee' ? 'Employee' : 'Individual'} - {currentUser.username}
              </span>
            </div>

            {/* Auth Buttons */}
            <nav role="navigation" aria-label="User account navigation">
              {authenticatedUser ? (
                <>
                  {!isDashboard && (
                    <Button 
                      variant="outline" 
                      className="bg-secondary text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setLocation('/dashboard')}
                    >
                      Dashboard
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="bg-secondary text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    className="bg-secondary text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setLocation('/login')}
                  >
                    Login
                  </Button>
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setLocation('/register')}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </nav>
          </div>
        </div>
        
        {/* User type switching row - only show when authenticated */}
        {authenticatedUser && (
          <div className="flex justify-end pb-2 border-t border-border">
            <div className="relative mt-2">
              <label htmlFor="user-type-select" className="sr-only">Select user type for testing</label>
              <select 
                id="user-type-select"
                value={userTypeParam || authenticatedUser.userType || 'admin'}
                onChange={(e) => handleUserChange(e.target.value)}
                className="bg-input border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                aria-label="Switch user type for testing purposes"
              >
                <option value="admin">Admin - John Admin</option>
                <option value="funeral_home">Funeral Home - Jane Smith</option>
                <option value="employee">Employee - Mike Johnson</option>
                <option value="individual">Individual - Sarah Wilson</option>
              </select>
            </div>
          </div>
        )}
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
      <Route path="/obituary/:id/edit" component={ObituaryForm} />
      <Route path="/obituary-review/upload" component={ObituaryReviewUpload} />
      <Route path="/obituary-review/:id/results" component={ObituaryReviewResults} />
      <Route path="/admin/questions" component={QuestionManagement} />
      <Route path="/admin/surveys" component={SurveyManagement} />
      <Route path="/admin/surveys/:id/edit" component={SurveyEditor} />
      <Route path="/admin/surveys/new" component={CreateSurvey} />
      <Route path="/admin/surveys/:id" component={SurveyEditor} />
      <Route path="/final-spaces" component={FinalSpaces} />
      <Route path="/final-spaces/create" component={CreateFinalSpace} />
      <Route path="/final-spaces/:id/edit" component={EditFinalSpace} />
      <Route path="/memorial/:slug" component={MemorialPage} />
      <Route path="/collaborate/:uuid" component={Collaborate} />
      <Route path="/take-pre-need-evaluation" component={TakePreNeedEvaluation} />
      <Route path="/view-evaluation/:id" component={ViewEvaluation} />
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
        <div className="min-h-screen bg-gray-900">
          <a 
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg transition-all"
          >
            Skip to main content
          </a>

          <GlobalHeader />

          <main id="main-content" role="main">
            <Router />
          </main>

          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;