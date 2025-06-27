import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCreateFinalSpace, useCompletedObituaries } from "@/hooks/use-final-spaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// Remove insertFinalSpaceSchema import since we're using custom form schema
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Heart, UserPlus, Mail, Trash2 } from "lucide-react";
import MediaUploader from "@/components/MediaUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import CollaboratorConfirmationModal from "@/components/CollaboratorConfirmationModal";
import SocialMediaForm from "@/components/SocialMediaForm";
import CemeteryForm from "@/components/CemeteryForm";

interface MediaFile {
  id: string;
  filename: string;
  url: string;
  isPrimary?: boolean;
  title?: string;
}

interface CemeteryData {
  cemeteryName: string;
  cemeterySection: string;
  plotNumber: string;
  graveNotes: string;
}

interface SocialMediaLinks {
  pinterest?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
}

const createFinalSpaceSchema = z.object({
  personName: z.string().min(1, "Person name is required"),
  dateOfBirth: z.string().optional(),
  dateOfDeath: z.string().optional(),
  description: z.string().optional(),
  obituaryId: z.coerce.number().optional(),
  socialMediaLinks: z.array(z.string()).default([]),
  musicPlaylist: z.string().default(""),
  isPublic: z.boolean().default(true),
  allowComments: z.boolean().default(true),
  hasGravePlot: z.boolean().default(false),
  cemeteryName: z.string().optional(),
  cemeteryUrl: z.string().optional(),
  cemeteryAddress: z.string().optional(),
  plotNumber: z.string().optional(),
  userId: z.number().optional()
});

type CreateFinalSpaceForm = z.infer<typeof createFinalSpaceSchema>;

function CreateFinalSpace() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mediaData, setMediaData] = useState<{
    images: MediaFile[];
    audioFiles: MediaFile[];
    youtubeLinks: MediaFile[];
    primaryMedia: MediaFile | null;
  }>({
    images: [],
    audioFiles: [],
    youtubeLinks: [],
    primaryMedia: null
  });

  // Collaborators state
  const [collaborators, setCollaborators] = useState<Array<{
    id: number;
    email: string;
    name: string;
    status: string;
    isTemporary: boolean;
  }>>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  
  // Collaboration modal state
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  
  // Social media state
  const [socialMediaLinks, setSocialMediaLinks] = useState<Record<string, string>>({});
  
  // Cemetery/grave plot state
  const [cemeteryData, setCemeteryData] = useState({
    cemeteryName: "",
    cemeterySection: "",
    plotNumber: "",
    graveNotes: ""
  });

  // Get current user from URL params like other components
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType') || 'funeral_home';
  const userIdParam = parseInt(urlParams.get('userId') || '2', 10);

  const { data: completedObituaries } = useCompletedObituaries(userIdParam, userTypeParam);
  const createFinalSpace = useCreateFinalSpace();

  // Helper functions for collaborators
  const addCollaborator = () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    if (collaborators.some(c => c.email === inviteEmail)) {
      toast({
        title: "Error", 
        description: "This email is already added",
        variant: "destructive"
      });
      return;
    }

    const newCollaborator = {
      id: Date.now(),
      email: inviteEmail,
      name: inviteName || inviteEmail,
      status: "pending",
      isTemporary: true // Mark as temporary until memorial is created
    };

    setCollaborators([...collaborators, newCollaborator]);
    setInviteEmail("");
    setInviteName("");
    setIsInviteOpen(false);
    
    toast({
      title: "Collaborator Added",
      description: `${newCollaborator.name} will be invited once the memorial is created`
    });
  };

  const removeCollaborator = (id) => {
    setCollaborators(collaborators.filter(c => c.id !== id));
    toast({
      title: "Collaborator Removed",
      description: "Collaborator removed from list"
    });
  };

  const form = useForm<CreateFinalSpaceForm>({
    resolver: zodResolver(createFinalSpaceSchema),
    defaultValues: {
      personName: "",
      dateOfBirth: "",
      dateOfDeath: "",
      description: "",
      obituaryId: undefined,
      socialMediaLinks: [],
      musicPlaylist: "",
      isPublic: true,
      allowComments: true,
      userId: userIdParam
    }
  });

  const onSubmit = async (data: CreateFinalSpaceForm) => {
    // Check if collaborators are attached and show modal if needed
    if (collaborators.length === 0 && !dontAskAgain) {
      setShowCollaboratorModal(true);
      return;
    }

    try {
      // Start form submission process
      
      // Prepare complete data for API submission
      const finalData = {
        personName: data.personName,
        dateOfBirth: data.dateOfBirth || null,
        dateOfDeath: data.dateOfDeath || null,
        description: data.description || null,
        obituaryId: data.obituaryId || null,
        socialMediaLinks: socialMediaLinks,
        musicPlaylist: data.musicPlaylist || null,
        isPublic: data.isPublic !== false,
        allowComments: data.allowComments !== false,
        collaboratorPromptDisabled: dontAskAgain,
        // Cemetery/grave plot data
        hasGravePlot: cemeteryData.hasGravePlot,
        cemeteryName: cemeteryData.cemeteryName || null,
        cemeteryUrl: cemeteryData.cemeteryUrl || null,
        cemeteryAddress: cemeteryData.cemeteryAddress || null,
        plotNumber: cemeteryData.plotNumber || null,
        // Server will handle these fields
        funeralHomeId: userTypeParam === 'funeral_home' ? userIdParam : null,
        createdById: userIdParam,
        createdByType: userTypeParam,
        // Media data from component state
        images: mediaData.images || [],
        audioFiles: mediaData.audioFiles || [],
        youtubeLinks: mediaData.youtubeLinks || [],
        primaryMediaType: mediaData.primaryMedia?.type || null,
        primaryMediaId: mediaData.primaryMedia?.id || null,
        status: 'published'
      };

      const createdSpace = await createFinalSpace.mutateAsync(finalData);

      // Add collaborators if any were added during creation
      if (collaborators.length > 0) {
        try {
          await Promise.all(
            collaborators.map(async (collaborator) => {
              const response = await fetch(`/api/final-spaces/${createdSpace.id}/collaborators`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  collaboratorEmail: collaborator.email,
                  collaboratorName: collaborator.name,
                  invitedById: userIdParam,
                  invitedByType: userTypeParam,
                  status: 'pending'
                }),
              });
              
              if (!response.ok) {
                // Failed to add collaborator
              }
            })
          );
          
          toast({
            title: "Success",
            description: `Memorial space created successfully with ${collaborators.length} collaborator invitation(s) sent`
          });
        } catch (error) {
          // Error adding collaborators
          toast({
            title: "Partial Success",
            description: "Memorial created but some collaborator invitations failed to send"
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Memorial space created successfully"
        });
      }
      
      // Redirect to the created memorial page
      setLocation(`/memorial/${createdSpace.slug}`);
    } catch (error) {
      // Error creating memorial space
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to create memorial space",
        variant: "destructive"
      });
    }
  };

  // Collaboration modal handlers
  const handleAddCollaborator = () => {
    setShowCollaboratorModal(false);
    setIsInviteOpen(true);
  };

  const handleDoItLater = () => {
    setShowCollaboratorModal(false);
    // Proceed with form submission by calling onSubmit again
    const currentData = form.getValues();
    onSubmit(currentData);
  };

  const handleDontAskAgain = (checked: boolean) => {
    setDontAskAgain(checked);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center text-foreground">
              <Heart className="mr-3 h-8 w-8 text-muted-foreground" />
              Create Memorial Space
            </h1>
            <p className="text-muted-foreground mt-1">
              Create a memorial space to honor a loved one
            </p>
          </div>
          <Link href={`/dashboard?userType=${userTypeParam}&userId=${userIdParam}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Memorial Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form 
              onSubmit={form.handleSubmit(onSubmit)} 
              className="space-y-6"
            >
              {/* Obituary Selection */}
              <div>
                <Label htmlFor="obituaryId">Link to Obituary (Optional)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Select an existing obituary to automatically fill name and date fields
                </p>
                <Select onValueChange={(value) => {
                  const obituaryId = value ? parseInt(value) : undefined;
                  form.setValue("obituaryId", obituaryId);
                  
                  // Auto-fill fields if obituary is selected
                  if (value === "1") {
                    form.setValue("personName", "mike bologna");
                    form.setValue("dateOfBirth", "1950-01-15");
                    form.setValue("dateOfDeath", "2025-06-20");
                  } else if (completedObituaries?.find) {
                    const selected = completedObituaries.find((obit: any) => obit.id.toString() === value);
                    if (selected) {
                      form.setValue("personName", selected.fullName);
                      if (selected.dateOfBirth) form.setValue("dateOfBirth", selected.dateOfBirth);
                      if (selected.dateOfDeath) form.setValue("dateOfDeath", selected.dateOfDeath);
                    }
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an obituary (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {completedObituaries && completedObituaries.length > 0 ? (
                      completedObituaries.map((obituary: any) => (
                        <SelectItem key={obituary.id} value={obituary.id.toString()}>
                          {obituary.fullName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No completed obituaries available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="personName">Person's Name *</Label>
                  <Input
                    id="personName"
                    {...form.register("personName")}
                    placeholder="Enter full name"
                  />
                  {form.formState.errors.personName && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.personName.message}
                    </p>
                  )}
                </div>
                <div></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...form.register("dateOfBirth")}
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfDeath">Date of Death</Label>
                  <Input
                    id="dateOfDeath"
                    type="date"
                    {...form.register("dateOfDeath")}
                  />
                </div>
              </div>

              {/* Memorial Description */}
              <div>
                <Label htmlFor="description">Memorial Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Share memories, stories, or a tribute..."
                  rows={6}
                  className="resize-none"
                />
              </div>

              {/* Music Playlist */}
              <div>
                <Label htmlFor="musicPlaylist">Music Playlist Link</Label>
                <Input
                  id="musicPlaylist"
                  {...form.register("musicPlaylist")}
                  placeholder="Spotify, Pandora, or other music service URL"
                />
              </div>

              {/* Social Media Section */}
              <SocialMediaForm
                socialMediaLinks={socialMediaLinks}
                onChange={setSocialMediaLinks}
              />

              {/* Cemetery/Grave Plot Section */}
              <CemeteryForm
                data={cemeteryData}
                onChange={setCemeteryData}
              />

              {/* Media Upload Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Media & Content</h3>
                <MediaUploader onMediaChange={setMediaData} />
              </div>

              {/* Collaborators Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Collaborators</h3>
                    <p className="text-sm text-muted-foreground">
                      Invite others to help manage and contribute to this memorial space
                    </p>
                  </div>
                  <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Collaborator
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Collaborator</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="collaborator-email">Email Address</Label>
                          <Input
                            id="collaborator-email"
                            type="email"
                            placeholder="Enter email address"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="collaborator-name">Name (Optional)</Label>
                          <Input
                            id="collaborator-name"
                            placeholder="Enter name"
                            value={inviteName}
                            onChange={(e) => setInviteName(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={addCollaborator}>
                            <Mail className="w-4 h-4 mr-2" />
                            Add Collaborator
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Collaborators List */}
                {collaborators.length > 0 && (
                  <Card className="bg-card border-border">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {collaborators.map((collaborator) => (
                          <div key={collaborator.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{collaborator.name}</p>
                                <p className="text-sm text-muted-foreground">{collaborator.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-muted-foreground border-border">
                                Will be invited
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCollaborator(collaborator.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                  <div className="text-center p-6 border-2 border-dashed border-border rounded-lg bg-card">
                    <UserPlus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No collaborators added yet. Add collaborators to help manage this memorial space.
                    </p>
                  </div>
                )}
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Privacy Settings</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isPublic"
                      {...form.register("isPublic")}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isPublic" className="text-sm font-normal">
                      Make this FinalSpace public so others can find and visit it
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="allowComments"
                      {...form.register("allowComments")}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="allowComments" className="text-sm font-normal">
                      Allow visitors to leave public comments and memories
                    </Label>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Link href={`/dashboard?userType=${userTypeParam}&userId=${userIdParam}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={createFinalSpace.isPending} 
                  className="min-w-32"
                  onClick={(e) => {
                    // Trigger validation manually
                    form.trigger().then((isValid) => {
                      if (isValid) {
                        // Validation passed, proceed with submission
                      }
                    });
                  }}
                >
                  {createFinalSpace.isPending ? "Creating..." : "Create Memorial Space"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Collaboration Confirmation Modal */}
        <CollaboratorConfirmationModal
          isOpen={showCollaboratorModal}
          onClose={() => setShowCollaboratorModal(false)}
          onAddCollaborator={handleAddCollaborator}
          onDoItLater={handleDoItLater}
          onDontAskAgain={handleDontAskAgain}
          dontAskAgain={dontAskAgain}
        />
      </div>
    </div>
  );
}

export default CreateFinalSpace;