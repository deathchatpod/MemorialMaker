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
      <AlertDialogContent className="modal-glass max-w-lg">
        <div className="absolute right-4 top-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full focus-professional hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <AlertDialogHeader className="text-center space-lg pt-2">
          <AlertDialogTitle className="heading-md flex items-center justify-center gap-3 text-foreground">
            <div className="p-2 rounded-full bg-blue-100/80 dark:bg-blue-900/40">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Add a Collaborator
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-muted-foreground space-md">
              <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-amber-50/80 border border-amber-200/60 dark:bg-amber-900/20 dark:border-amber-800/60">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="text-label text-amber-800 dark:text-amber-200">
                  We strongly recommend having a collaborator for every project.
                </span>
              </div>
              <div className="text-body text-center px-2">
                The goal of FinalSpaces by DeathMatters is to always be prepared and make things easier if anything happens.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col space-lg pt-2">
          <div className="flex items-center justify-center space-x-3 w-full">
            <Checkbox
              id="dont-ask-again"
              checked={dontAskAgain}
              onCheckedChange={onDontAskAgain}
              className="focus-professional"
            />
            <label
              htmlFor="dont-ask-again"
              className="text-label text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            >
              Don't ask me again for this memorial
            </label>
          </div>
          
          <div className="flex gap-3 w-full">
            <AlertDialogCancel
              onClick={() => {
                if (onSave) onSave();
                onDoItLater();
              }}
              className="flex-1 h-11 btn-secondary-professional btn-elevation focus-professional"
            >
              Just save, I'll do it later
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onSave) onSave();
                onAddCollaborator();
              }}
              className="flex-1 h-11 btn-primary-professional btn-elevation focus-professional"
            >
              Add Collaborator
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}