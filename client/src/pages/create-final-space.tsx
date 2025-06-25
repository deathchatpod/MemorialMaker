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
import { insertFinalSpaceSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Heart } from "lucide-react";
import MediaUploader from "@/components/MediaUploader";

const createFinalSpaceSchema = insertFinalSpaceSchema.extend({
  personName: z.string().min(1, "Person name is required"),
  dateOfBirth: z.string().optional(),
  dateOfDeath: z.string().optional(),
  description: z.string().optional(),
  obituaryId: z.number().optional(),
  socialMediaLinks: z.array(z.string()).optional(),
  musicPlaylist: z.string().optional(),
  isPublic: z.boolean().default(true),
  allowComments: z.boolean().default(true),
  images: z.array(z.any()).optional(),
  audioFiles: z.array(z.any()).optional(),
  youtubeLinks: z.array(z.any()).optional(),
  primaryMediaType: z.string().optional(),
  primaryMediaId: z.string().optional()
});

type CreateFinalSpaceForm = z.infer<typeof createFinalSpaceSchema>;

export default function CreateFinalSpace() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mediaData, setMediaData] = useState({
    images: [],
    audioFiles: [],
    youtubeLinks: [],
    primaryMedia: null
  });

  // Get current user from URL params like other components
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType') || 'funeral_home';
  const userIdParam = parseInt(urlParams.get('userId') || '2', 10);

  const { data: completedObituaries } = useCompletedObituaries(userIdParam, userTypeParam);
  const createFinalSpace = useCreateFinalSpace();

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
      userId: userIdParam,
      images: [],
      audioFiles: [],
      youtubeLinks: [],
      primaryMediaType: "",
      primaryMediaId: ""
    }
  });

  const onSubmit = async (data: CreateFinalSpaceForm) => {
    try {
      console.log('Submitting final space data:', data);
      console.log('Media data:', mediaData);
      
      // Prepare media data for submission
      const finalData = {
        ...data,
        funeralHomeId: userTypeParam === 'funeral_home' ? userIdParam : null,
        createdById: userIdParam,
        createdByType: userTypeParam,
        images: mediaData.images,
        audioFiles: mediaData.audioFiles,
        youtubeLinks: mediaData.youtubeLinks,
        primaryMediaType: mediaData.primaryMedia?.type || null,
        primaryMediaId: mediaData.primaryMedia?.id || null,
        status: 'published'
      };

      console.log('Final data being sent:', finalData);
      
      await createFinalSpace.mutateAsync(finalData);
      toast({
        title: "Success",
        description: "Memorial space created successfully"
      });
      setLocation(`/dashboard?userType=${userTypeParam}&userId=${userIdParam}`);
    } catch (error) {
      console.error('Error creating final space:', error);
      toast({
        title: "Error",
        description: "Failed to create memorial space",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Heart className="mr-3 h-8 w-8 text-blue-600" />
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
        <Card>
          <CardHeader>
            <CardTitle>Memorial Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

              {/* Music and Social */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="resize-none"
                  />
                </div>
              </div>

              {/* Media Upload Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Media & Content</h3>
                <MediaUploader onMediaChange={setMediaData} />
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
                <Button type="submit" disabled={createFinalSpace.isPending} className="min-w-32">
                  {createFinalSpace.isPending ? "Creating..." : "Create Memorial Space"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}