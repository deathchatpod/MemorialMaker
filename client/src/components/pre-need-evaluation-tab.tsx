import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Eye, Trash2, Plus, FileText } from 'lucide-react';
import { format, isValid } from 'date-fns';

interface PreNeedEvaluation {
  id: number;
  surveyId: number;
  responses: any;
  completedById: number;
  completedByType: string;
  funeralHomeId?: number;
  createdAt: string;
}

export function PreNeedEvaluationTab() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Safe date formatting function
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Unknown Date';
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid Date';
  };

  // Get current user context from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const currentUserId = parseInt(urlParams.get('userId') || '1');
  const currentUserType = urlParams.get('userType') || 'admin';
  const currentFuneralHomeId = currentUserType === 'funeral_home' ? currentUserId : 
                               currentUserType === 'employee' ? 1 : undefined;

  // Fetch both pre-need evaluations and basics
  const { data: evaluations = [], isLoading: evaluationsLoading } = useQuery<PreNeedEvaluation[]>({
    queryKey: ['/api/survey-responses/type/pre_need_evaluation', currentUserId, currentUserType, currentFuneralHomeId],
    queryFn: async () => {
      const params = new URLSearchParams({
        userId: currentUserId.toString(),
        userType: currentUserType,
      });
      if (currentFuneralHomeId) {
        params.append('funeralHomeId', currentFuneralHomeId.toString());
      }
      
      const response = await fetch(`/api/survey-responses/type/pre_need_evaluation?${params}`);
      if (!response.ok) throw new Error('Failed to fetch evaluations');
      return response.json();
    },
  });

  const { data: basics = [], isLoading: basicsLoading } = useQuery<PreNeedEvaluation[]>({
    queryKey: ['/api/survey-responses/type/pre_need_basics', currentUserId, currentUserType, currentFuneralHomeId],
    queryFn: async () => {
      const params = new URLSearchParams({
        userId: currentUserId.toString(),
        userType: currentUserType,
      });
      if (currentFuneralHomeId) {
        params.append('funeralHomeId', currentFuneralHomeId.toString());
      }
      
      const response = await fetch(`/api/survey-responses/type/pre_need_basics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch basics');
      return response.json();
    },
  });

  // Combine both types of survey responses
  const allSurveyResponses = [
    ...evaluations.map(e => ({ ...e, responseType: 'pre_need_evaluation', surveyName: 'Pre Need Evaluation' })),
    ...basics.map(b => ({ ...b, responseType: 'pre_need_basics', surveyName: 'Pre Need Basics' }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isLoading = evaluationsLoading || basicsLoading;

  // Delete survey response mutation
  const deleteSurveyResponse = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/survey-responses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete survey response');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/survey-responses/type/pre_need_evaluation'] });
      queryClient.invalidateQueries({ queryKey: ['/api/survey-responses/type/pre_need_basics'] });
      toast({
        title: "Survey Response Deleted",
        description: "Survey response has been deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete survey response",
        variant: "destructive"
      });
    }
  });

  const handleTakeEvaluation = () => {
    const params = new URLSearchParams({
      userId: currentUserId.toString(),
      userType: currentUserType,
    });
    if (currentFuneralHomeId) {
      params.append('funeralHomeId', currentFuneralHomeId.toString());
    }
    setLocation(`/take-pre-need-evaluation?${params}`);
  };

  const handleTakeBasics = () => {
    const params = new URLSearchParams({
      userId: currentUserId.toString(),
      userType: currentUserType,
    });
    if (currentFuneralHomeId) {
      params.append('funeralHomeId', currentFuneralHomeId.toString());
    }
    setLocation(`/take-pre-need-basics?${params}`);
  };

  const handleViewResults = (evaluation: PreNeedEvaluation) => {
    const params = new URLSearchParams({
      userId: currentUserId.toString(),
      userType: currentUserType,
    });
    if (currentFuneralHomeId) {
      params.append('funeralHomeId', currentFuneralHomeId.toString());
    }
    setLocation(`/view-evaluation/${evaluation.id}?${params}`);
  };

  const getUserDisplayName = (evaluation: PreNeedEvaluation) => {
    // Map user types to proper display names
    const typeMapping = {
      'admin': 'Admin User',
      'funeral_home': 'Funeral Home',
      'employee': 'Employee',
      'individual': 'Individual'
    };
    
    const displayType = typeMapping[evaluation.completedByType as keyof typeof typeMapping] || evaluation.completedByType;
    return `${displayType} #${evaluation.completedById}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading evaluations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Comprehensive pre-need planning assessments and tools to understand individual readiness and preferences.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Button 
          onClick={handleTakeBasics} 
          className="flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap w-full sm:w-auto"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Take Pre Need Basics
        </Button>
        <Button 
          onClick={handleTakeEvaluation} 
          className="flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap w-full sm:w-auto"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Take Pre Need Evaluation
        </Button>
      </div>

      {/* Pre Need Basics Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pre Need Basics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {basics.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Pre Need Basics Completed</h3>
              <p className="text-muted-foreground mb-4">
                Essential information guide to help your family navigate important matters
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Completed</TableHead>
                  <TableHead>Completed By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {basics.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell>
                      {formatDate(response.createdAt)}
                    </TableCell>
                    <TableCell>
                      {getUserDisplayName(response)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Completed</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewResults(response)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Pre Need Basics</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this Pre Need Basics response? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteSurveyResponse.mutate(response.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pre Need Evaluations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pre Need Evaluations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {evaluations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Pre Need Evaluations Completed</h3>
              <p className="text-muted-foreground mb-4">
                Comprehensive assessments to understand individual readiness and preferences
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Completed</TableHead>
                  <TableHead>Completed By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluations.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell>
                      {formatDate(response.createdAt)}
                    </TableCell>
                    <TableCell>
                      {getUserDisplayName(response)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Completed</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewResults(response)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Pre Need Evaluation</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this Pre Need Evaluation? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteSurveyResponse.mutate(response.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}