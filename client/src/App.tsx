import React, { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import ObituaryForm from "@/pages/obituary-form";
import GeneratedObituaries from "@/pages/generated-obituaries";
import QuestionManagement from "@/pages/question-management";
import FinalSpaces from "@/pages/final-spaces";
import CreateFinalSpace from "@/pages/create-final-space";
import Collaborate from "@/pages/collaborate";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";

// User context for switching between user types
export const UserContext = React.createContext<{
  currentUser: { id: number; username: string; userType: string };
  setCurrentUser: (user: { id: number; username: string; userType: string }) => void;
}>({
  currentUser: { id: 2, username: 'John Admin', userType: 'admin' },
  setCurrentUser: () => {},
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/obituary/new" component={ObituaryForm} />
      <Route path="/obituary/:id/generated" component={GeneratedObituaries} />
      <Route path="/admin/questions" component={QuestionManagement} />
      <Route path="/final-spaces" component={FinalSpaces} />
      <Route path="/final-spaces/create" component={CreateFinalSpace} />
      <Route path="/collaborate/:uuid" component={Collaborate} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState({ 
    id: 1, 
    username: 'Jane Smith', 
    userType: 'funeral_home' 
  });

  // Debug the state updates
  React.useEffect(() => {
    console.log('App level currentUser changed:', currentUser);
  }, [currentUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserContext.Provider value={{ currentUser, setCurrentUser }} key={currentUser.id}>
          <div className="min-h-screen bg-gray-50">
            {/* Navigation Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center space-x-4">
                    <i className="fas fa-heart text-primary text-2xl"></i>
                    <h1 className="text-xl font-semibold text-gray-900">DeathMatters</h1>
                  </div>
                  
                  {/* User Type Switcher */}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <select 
                        value={currentUser.userType}
                        onChange={(e) => {
                          const userType = e.target.value;
                          let newUser;
                          
                          if (userType === 'admin') {
                            newUser = { id: 2, username: 'John Admin', userType: 'admin' };
                          } else if (userType === 'funeral_home') {
                            newUser = { id: 1, username: 'Jane Smith', userType: 'funeral_home' };
                          } else if (userType === 'employee') {
                            newUser = { id: 3, username: 'Mike Johnson', userType: 'employee' };
                          }
                          
                          if (newUser) {
                            setCurrentUser(newUser);
                          }
                        }}
                        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="funeral_home">Funeral Home - Jane Smith</option>
                        <option value="employee">Employee - Mike Johnson</option>
                        <option value="admin">Admin User - John Admin</option>
                      </select>
                      <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <i className="fas fa-user-circle text-lg"></i>
                      <span>{currentUser.username}</span>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <Router />
            <Toaster />
          </div>
        </UserContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
