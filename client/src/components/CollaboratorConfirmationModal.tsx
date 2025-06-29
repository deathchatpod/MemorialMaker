import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Users, AlertTriangle, X } from "lucide-react";

interface CollaboratorConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCollaborator: () => void;
  onDoItLater: () => void;
  onDontAskAgain: (checked: boolean) => void;
  dontAskAgain: boolean;
  onSave?: () => void;
}

export default function CollaboratorConfirmationModal({
  isOpen,
  onClose,
  onAddCollaborator,
  onDoItLater,
  onDontAskAgain,
  dontAskAgain,
  onSave
}: CollaboratorConfirmationModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-card border-border">
        <div className="absolute right-4 top-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <AlertDialogHeader className="text-center space-y-4">
          <AlertDialogTitle className="flex items-center justify-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-blue-500" />
            Add a Collaborator
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-muted-foreground space-y-3">
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span className="font-medium text-foreground">
                  We strongly recommend having a collaborator for every project.
                </span>
              </div>
              <div className="text-sm text-center">
                The goal of FinalSpaces by DeathMatters is to always be prepared and make things easier if anything happens.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col gap-4">
          <div className="flex items-center justify-center space-x-2 w-full">
            <Checkbox
              id="dont-ask-again"
              checked={dontAskAgain}
              onCheckedChange={onDontAskAgain}
            />
            <label
              htmlFor="dont-ask-again"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Don't ask me again for this memorial
            </label>
          </div>
          
          <div className="flex gap-2 w-full">
            <AlertDialogCancel
              onClick={() => {
                if (onSave) onSave();
                onDoItLater();
              }}
              className="flex-1 h-10 bg-gray-600 hover:bg-gray-700 text-white border-gray-600 flex items-center justify-center"
            >
              Just save, I'll do it later
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onSave) onSave();
                onAddCollaborator();
              }}
              className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
            >
              Add Collaborator
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}