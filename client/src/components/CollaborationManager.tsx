import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const inviteCollaboratorSchema = z.object({
  collaboratorEmail: z.string().email("Please enter a valid email address"),
  collaboratorName: z.string().min(1, "Name is required").optional(),
});

type InviteCollaboratorForm = z.infer<typeof inviteCollaboratorSchema>;

interface CollaborationManagerProps {
  entityId: number;
  entityType: "obituary" | "finalspace" | "pre-need-basics";
  endpointBase?: string;
  currentUser?: {
    id: number;
    type: string;
    email: string;
  };
}

export default function CollaborationManager({ entityId, entityType, endpointBase: customEndpointBase, currentUser }: CollaborationManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const endpointBase = customEndpointBase || (entityType === "obituary" ? "/api/obituaries" : "/api/final-spaces");
  
  // Fetch collaborators
  const { data: collaborators = [], isLoading } = useQuery({
    queryKey: [`${endpointBase}/${entityId}/collaborators`],
    enabled: entityId > 0, // Only fetch if we have a valid entity ID
  });

  // Type the collaborators array
  const typedCollaborators = collaborators as Array<{
    id: number;
    collaboratorEmail: string;
    name?: string;
    collaboratorName?: string;
    status: string;
    createdAt: string;
  }>;

  // Invite collaborator mutation
  const inviteCollaborator = useMutation({
    mutationFn: async (data: InviteCollaboratorForm) => {
      const response = await fetch(`${endpointBase}/${entityId}/collaborators`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          invitedBy: currentUser?.id,
          invitedByType: currentUser?.type,
          status: "pending"
        }),
      });
      if (!response.ok) throw new Error("Failed to invite collaborator");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Collaborator invited successfully"
      });
      queryClient.invalidateQueries({ queryKey: [`${endpointBase}/${entityId}/collaborators`] });
      setIsInviteOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to invite collaborator",
        variant: "destructive"
      });
    }
  });

  // Remove collaborator mutation
  const removeCollaborator = useMutation({
    mutationFn: async (collaboratorId: number) => {
      const deleteUrl = entityType === "pre-need-basics" 
        ? `/api/pre-need-basics-collaborators/${collaboratorId}`
        : `${endpointBase.replace('/obituaries', '').replace('/final-spaces', '')}/collaborators/${collaboratorId}`;
      
      const response = await fetch(deleteUrl, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove collaborator");
      return response.ok;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Collaborator removed successfully"
      });
      queryClient.invalidateQueries({ queryKey: [`${endpointBase}/${entityId}/collaborators`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove collaborator",
        variant: "destructive"
      });
    }
  });

  const form = useForm<InviteCollaboratorForm>({
    resolver: zodResolver(inviteCollaboratorSchema),
    defaultValues: {
      collaboratorEmail: "",
      collaboratorName: "",
    }
  });

  const handleInvite = (data: InviteCollaboratorForm) => {
    if (collaborators.length >= 5) {
      toast({
        title: "Limit Reached",
        description: "You can only invite up to 5 collaborators",
        variant: "destructive"
      });
      return;
    }
    inviteCollaborator.mutate(data);
  };

  const handleRemove = (collaboratorId: number) => {
    if (confirm("Are you sure you want to remove this collaborator?")) {
      removeCollaborator.mutate(collaboratorId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-orange-600" />;
      case "declined":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "declined":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading collaborators...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {typedCollaborators.length}/5 collaborators
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              disabled={typedCollaborators.length >= 5}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Invite Collaborator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Collaborator</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleInvite)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="collaboratorEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="collaborator@example.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="collaboratorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Collaborator Name" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={inviteCollaborator.isPending}
                  >
                    {inviteCollaborator.isPending ? "Sending..." : "Send Invitation"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {typedCollaborators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Collaborators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {typedCollaborators.map((collaborator) => (
                <div 
                  key={collaborator.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-medium">
                        {collaborator.collaboratorName || collaborator.name || collaborator.collaboratorEmail}
                      </div>
                      {(collaborator.collaboratorName || collaborator.name) && (
                        <div className="text-sm text-gray-500">
                          {collaborator.collaboratorEmail}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(collaborator.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(collaborator.status)}
                        <span className="capitalize">{collaborator.status}</span>
                      </div>
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemove(collaborator.id)}
                      disabled={removeCollaborator.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {collaborators.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No collaborators yet</p>
          <p className="text-xs">Invite others to help edit this {entityType === "obituary" ? "obituary" : "memorial"}</p>
        </div>
      )}
    </div>
  );
}