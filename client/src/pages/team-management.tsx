import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, UserPlus, Mail, Trash2, UserCheck, UserX, Copy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Employee {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  invitedAt: string;
  acceptedAt?: string;
}

interface EmployeeInvitation {
  id: number;
  email: string;
  inviteToken: string;
  isUsed: boolean;
  expiresAt: string;
}

export default function TeamManagement() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Assuming current user is funeral home with ID 1 for testing
  const funeralHomeId = 1;

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/employees', funeralHomeId],
  });

  const { data: invitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ['/api/employee-invitations', funeralHomeId],
  });

  const inviteEmployeeMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest('POST', '/api/employee-invitations', { email, funeralHomeId });
    },
    onSuccess: () => {
      toast({
        title: 'Invitation sent',
        description: 'Employee invitation has been sent successfully.',
      });
      setInviteEmail('');
      setInviteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/employee-invitations', funeralHomeId] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send invitation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      return apiRequest('DELETE', `/api/employees/${employeeId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Employee removed',
        description: 'Employee has been removed from your team.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees', funeralHomeId] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to remove employee',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleEmployeeStatusMutation = useMutation({
    mutationFn: async ({ employeeId, action }: { employeeId: number; action: 'suspend' | 'activate' }) => {
      return apiRequest('PATCH', `/api/employees/${employeeId}/${action}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees', funeralHomeId] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update employee status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      return apiRequest(`/api/employee-invitations/${invitationId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: 'Invitation cancelled',
        description: 'Employee invitation has been cancelled.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employee-invitations', funeralHomeId] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to cancel invitation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleInviteEmployee = () => {
    if (!inviteEmail.trim()) return;
    
    const activeEmployees = (employees as any[]).filter((emp: any) => emp.isActive).length;
    const pendingInvitations = (invitations as any[]).filter((inv: any) => !inv.isUsed).length;
    
    if (activeEmployees + pendingInvitations >= 5) {
      toast({
        title: 'Team limit reached',
        description: 'You can have a maximum of 5 team members. Remove existing members before inviting new ones.',
        variant: 'destructive',
      });
      return;
    }

    inviteEmployeeMutation.mutate(inviteEmail);
  };

  const copyInviteLink = (token: string) => {
    const inviteLink = `${window.location.origin}/accept-invitation/${token}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Invite link copied',
      description: 'The invitation link has been copied to your clipboard.',
    });
  };

  if (employeesLoading || invitationsLoading) {
    return <div className="p-6">Loading team management...</div>;
  }

  const activeEmployees = (employees as any[]).filter((emp: any) => emp.isActive);
  const pendingInvitations = (invitations as any[]).filter((inv: any) => !inv.isUsed);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-gray-600">
            Manage your funeral home team members ({activeEmployees.length + pendingInvitations.length}/5 slots used)
          </p>
        </div>
        
        <div className="flex-shrink-0">
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                disabled={activeEmployees.length + pendingInvitations.length >= 5}
                className="flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap w-full sm:w-auto"
                size="sm"
              >
                <UserPlus className="h-4 w-4" />
                Invite Employee
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to a new team member. They will receive an email with instructions to create their account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="employee@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleInviteEmployee}
                disabled={inviteEmployeeMutation.isPending || !inviteEmail.trim()}
              >
                {inviteEmployeeMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {(activeEmployees.length + pendingInvitations.length >= 5) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have reached the maximum team size of 5 members. Remove existing members before inviting new ones.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Active Employees */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Active Team Members ({activeEmployees.length})
            </CardTitle>
            <CardDescription>
              Current team members with active accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeEmployees.length === 0 ? (
              <p className="text-gray-500">No active team members yet.</p>
            ) : (
              <div className="space-y-4">
                {activeEmployees.map((employee: Employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{employee.name}</h3>
                      <p className="text-sm text-gray-600">{employee.email}</p>
                      <p className="text-xs text-gray-500">
                        Joined: {new Date(employee.acceptedAt || employee.invitedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Active</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleEmployeeStatusMutation.mutate({ employeeId: employee.id, action: 'suspend' })}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {employee.name} from your team? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteEmployeeMutation.mutate(employee.id)}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({pendingInvitations.length})
            </CardTitle>
            <CardDescription>
              Invitations that haven't been accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingInvitations.length === 0 ? (
              <p className="text-gray-500">No pending invitations.</p>
            ) : (
              <div className="space-y-4">
                {pendingInvitations.map((invitation: EmployeeInvitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{invitation.email}</h3>
                      <p className="text-xs text-gray-500">
                        Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Pending</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInviteLink(invitation.inviteToken)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel the invitation for {invitation.email}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteInvitationMutation.mutate(invitation.id)}
                            >
                              Cancel Invitation
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}