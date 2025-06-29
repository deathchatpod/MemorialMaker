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
import { Users, AlertTriangle } from "lucide-react";

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
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-blue-500" />
            Add a Collaborator
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="font-medium text-foreground">
                We strongly recommend having a collaborator for every project.
              </span>
            </div>
            <p className="text-sm">
              The goal of FinalSpaces by DeathMatters is to always be prepared and make things easier if anything happens.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col gap-4">
          <div className="flex items-center space-x-2 w-full">
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
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white border-gray-600"
            >
              Just save, I'll do it later
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onSave) onSave();
                onAddCollaborator();
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Collaborator
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}