import React, { Suspense } from "react";
import { Router, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard-new";
import CreateObituary from "./pages/create-obituary";
import ViewObituary from "./pages/view-obituary";
import EditObituary from "./pages/edit-obituary";
import GeneratedObituary from "./pages/generated-obituary";
import CollaborateObituary from "./pages/collaborate-obituary";
import SurveyForm from "./pages/survey-form";
import CreateFinalSpace from "./pages/create-final-space";
import EditFinalSpace from "./pages/edit-final-space";
import MemorialPage from "./pages/memorial-page";
import UserEvaluation from "./pages/user-evaluation";
import GlobalHeader from "./components/GlobalHeader";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Skip to main content link - appears on focus */}
          <a 
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
          >
            Skip to main content
          </a>
          
          <GlobalHeader />
          
          <main id="main-content" role="main" className="flex-1">
            <Suspense fallback={
              <div role="status" aria-live="polite" className="flex items-center justify-center min-h-64">
                <span className="sr-only">Loading content...</span>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            }>
              <Router>
                <Route path="/" component={Home} />
                <Route path="/login" component={Login} />
                <Route path="/register" component={Register} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/obituary/create" component={CreateObituary} />
                <Route path="/obituary/:id" component={ViewObituary} />
                <Route path="/obituary/:id/edit" component={EditObituary} />
                <Route path="/obituary/:id/generated" component={GeneratedObituary} />
                <Route path="/obituary/:id/collaborate/:uuid" component={CollaborateObituary} />
                <Route path="/surveys/:id" component={SurveyForm} />
                <Route path="/final-spaces/create" component={CreateFinalSpace} />
                <Route path="/edit-final-space/:id" component={EditFinalSpace} />
                <Route path="/memorial/:slug" component={MemorialPage} />
                <Route path="/user-evaluation/:userId" component={UserEvaluation} />
                <Route>
                  <section role="alert" className="text-center py-16">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
                    <p className="text-gray-600">The page you are looking for does not exist.</p>
                  </section>
                </Route>
              </Router>
            </Suspense>
          </main>
          
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;