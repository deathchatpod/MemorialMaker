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
import { format } from 'date-fns';

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

  // Get current user context from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const currentUserId = parseInt(urlParams.get('userId') || '1');
  const currentUserType = urlParams.get('userType') || 'admin';
  const currentFuneralHomeId = currentUserType === 'funeral_home' ? currentUserId : 
                               currentUserType === 'employee' ? 1 : undefined;

  // Fetch pre-need evaluations
  const { data: evaluations = [], isLoading } = useQuery<PreNeedEvaluation[]>({
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

  // Delete evaluation mutation
  const deleteEvaluation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/survey-responses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete evaluation');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/survey-responses/type/pre_need_evaluation'] });
      toast({
        title: "Evaluation Deleted",
        description: "Pre-need evaluation has been deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete evaluation",
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

      {/* Pre Need Basics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pre Need Basics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Essential Information Guide</h3>
            <p className="text-muted-foreground mb-4">
              Complete the basic information guide to help your family navigate important matters
            </p>
            <Button 
              onClick={handleTakeBasics} 
              className="flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Take Pre Need Basics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Evaluations Table */}
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
              <h3 className="text-lg font-medium mb-2">No Evaluations Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by taking your first pre-need evaluation to assess funeral planning needs
              </p>
              <Button 
                onClick={handleTakeEvaluation} 
                className="flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Take Pre Need Evaluation
              </Button>
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
                {evaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell>
                      {format(new Date(evaluation.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {getUserDisplayName(evaluation)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Completed</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewResults(evaluation)}
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
                              <AlertDialogTitle>Delete Evaluation</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this pre-need evaluation? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteEvaluation.mutate(evaluation.id)}
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