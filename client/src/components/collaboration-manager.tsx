import React, { useState } from "react";
import { useObituaryCollaborators, useAddCollaborator, useRemoveCollaborator } from "@/hooks/use-collaboration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Users, Link, Copy } from "lucide-react";
import { format } from "date-fns";

interface CollaborationManagerProps {
  obituaryId: number;
}

export default function CollaborationManager({ obituaryId }: CollaborationManagerProps) {
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");
  const { toast } = useToast();

  const { data: collaborators, isLoading } = useObituaryCollaborators(obituaryId);
  const addCollaborator = useAddCollaborator();
  const removeCollaborator = useRemoveCollaborator();

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCollaboratorEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await addCollaborator.mutateAsync({
        obituaryId,
        email: newCollaboratorEmail.trim()
      });

      // Copy shareable link to clipboard
      await navigator.clipboard.writeText(result.shareableLink);
      
      toast({
        title: "Collaborator Added",
        description: `${newCollaboratorEmail} has been added. Shareable link copied to clipboard.`
      });
      
      setNewCollaboratorEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add collaborator",
        variant: "destructive"
      });
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: number, email: string) => {
    if (!confirm(`Remove ${email} as a collaborator?`)) {
      return;
    }

    try {
      await removeCollaborator.mutateAsync({ collaboratorId, obituaryId });
      toast({
        title: "Collaborator Removed",
        description: `${email} has been removed`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove collaborator",
        variant: "destructive"
      });
    }
  };

  const generateShareableLink = async (email: string) => {
    try {
      const result = await addCollaborator.mutateAsync({ obituaryId, email });
      await navigator.clipboard.writeText(result.shareableLink);
      toast({
        title: "Link Copied",
        description: "Shareable link copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate link",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Collaborators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading collaborators...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Collaborators
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Add people to help provide feedback on the obituary. They can highlight text they like or want changed.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Collaborator Form */}
        <form onSubmit={handleAddCollaborator} className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="collaboratorEmail" className="sr-only">
              Collaborator Email
            </Label>
            <Input
              id="collaboratorEmail"
              type="email"
              placeholder="Enter email address"
              value={newCollaboratorEmail}
              onChange={(e) => setNewCollaboratorEmail(e.target.value)}
              disabled={addCollaborator.isPending}
            />
          </div>
          <Button 
            type="submit" 
            disabled={addCollaborator.isPending}
            className="whitespace-nowrap"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {addCollaborator.isPending ? "Adding..." : "Add"}
          </Button>
        </form>

        {/* Collaborators List */}
        {collaborators && collaborators.length > 0 ? (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Collaborators</Label>
            {collaborators.map((collaborator: any) => (
              <div
                key={collaborator.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="text-sm font-medium">{collaborator.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {collaborator.createdAt ? format(new Date(collaborator.createdAt), 'MMM d, yyyy') : 'Recently'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateShareableLink(collaborator.email)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveCollaborator(collaborator.id, collaborator.email)}
                    disabled={removeCollaborator.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No collaborators added yet</p>
            <p className="text-sm">Add email addresses above to invite people to provide feedback</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Link className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">How collaboration works:</p>
              <ul className="mt-1 text-blue-700 space-y-1">
                <li>• Collaborators receive a secure link to view and provide feedback</li>
                <li>• They can highlight text they like or want changed</li>
                <li>• All feedback is attributed to the collaborator's name</li>
                <li>• No account creation required for collaborators</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}