import React, { useState, useContext } from "react";
import { Link } from "wouter";
import { UserContext } from "@/App";
import { useFinalSpaces, useCreateFinalSpace, useDeleteFinalSpace, useCompletedObituaries } from "@/hooks/use-final-spaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFinalSpaceSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Heart, Share2, Music, MessageCircle, Trash2, ExternalLink, Calendar, MapPin, Globe, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

const createFinalSpaceSchema = insertFinalSpaceSchema.extend({
  personName: z.string().min(1, "Person name is required"),
  dateOfBirth: z.string().optional(),
  dateOfDeath: z.string().optional(),
  description: z.string().optional(),
  obituaryId: z.number().optional(),
  socialMediaLinks: z.array(z.string()).optional(),
  musicPlaylist: z.string().optional(),
  isPublic: z.boolean().default(true),
  allowComments: z.boolean().default(true)
});

type CreateFinalSpaceForm = z.infer<typeof createFinalSpaceSchema>;

export default function FinalSpaces() {
  const { currentUser } = useContext(UserContext);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: finalSpaces, isLoading } = useFinalSpaces(currentUser?.id || 0, currentUser?.userType || 'regular');
  const { data: completedObituaries } = useCompletedObituaries(currentUser?.id || 0);
  const createFinalSpace = useCreateFinalSpace();
  const deleteFinalSpace = useDeleteFinalSpace();

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
      userId: currentUser?.id
    }
  });

  const onSubmit = async (data: CreateFinalSpaceForm) => {
    try {
      await createFinalSpace.mutateAsync(data);
      toast({
        title: "Success",
        description: "FinalSpace created successfully"
      });
      setIsCreateDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create FinalSpace",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this memorial space?")) {
      try {
        await deleteFinalSpace.mutateAsync(id);
        toast({
          title: "Success",
          description: "FinalSpace deleted successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete FinalSpace",
          variant: "destructive"
        });
      }
    }
  };

  const copyShareLink = (slug: string) => {
    const url = `${window.location.origin}/memorial/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Memorial link copied to clipboard"
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading memorial spaces...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">FinalSpaces</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage FinalSpaces to honor loved ones
            </p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Heart className="mr-2 h-4 w-4" />
              Create FinalSpace
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create FinalSpace</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <SelectItem value="1">mike bologna</SelectItem>
                    {completedObituaries?.map && completedObituaries.map((obituary: any) => (
                      <SelectItem key={obituary.id} value={obituary.id.toString()}>
                        {obituary.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div>
                <Label htmlFor="description">Memorial Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Share memories, stories, or a tribute..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="musicPlaylist">Music Playlist Link</Label>
                <Input
                  id="musicPlaylist"
                  {...form.register("musicPlaylist")}
                  placeholder="Spotify, Pandora, or other music service URL"
                />
              </div>

              <div>
                <Label htmlFor="socialMediaLinks">Social Media Links</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Add social media links to share memories (one per line)
                </p>
                <Textarea
                  id="socialMediaLinks"
                  placeholder="https://facebook.com/memorial-page&#10;https://instagram.com/memories"
                  onChange={(e) => {
                    const links = e.target.value.split('\n').filter(link => link.trim());
                    form.setValue("socialMediaLinks", links);
                  }}
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Privacy Settings</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    {...form.register("isPublic")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isPublic">Make this memorial space public</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowComments"
                    {...form.register("allowComments")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="allowComments">Allow public comments</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createFinalSpace.isPending}>
                  {createFinalSpace.isPending ? "Creating..." : "Create FinalSpace"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {finalSpaces && finalSpaces.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {finalSpaces.map((space: any) => (
            <Card key={space.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{space.personName}</CardTitle>
                    {space.dateOfBirth && space.dateOfDeath && (
                      <p className="text-sm text-muted-foreground flex items-center mt-1">
                        <Calendar className="mr-1 h-3 w-3" />
                        {format(new Date(space.dateOfBirth), 'MMM d, yyyy')} - {format(new Date(space.dateOfDeath), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    {space.isPublic && (
                      <Badge variant="secondary" className="text-xs">
                        <Globe className="mr-1 h-3 w-3" />
                        Public
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {space.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                    {space.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyShareLink(space.slug)}
                    >
                      <Share2 className="h-3 w-3 mr-1" />
                      Share
                    </Button>
                    {space.musicPlaylist && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(space.musicPlaylist, '_blank')}
                      >
                        <Music className="h-3 w-3 mr-1" />
                        Music
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/memorial/${space.slug}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(space.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Created {format(new Date(space.createdAt), 'MMM d, yyyy')}</span>
                    {space.allowComments && (
                      <span className="flex items-center">
                        <MessageCircle className="mr-1 h-3 w-3" />
                        Comments enabled
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No FinalSpaces Yet</h3>
          <p className="text-muted-foreground">
            Create your first FinalSpace to honor a loved one using the button above
          </p>
        </div>
      )}
    </div>
  );
}