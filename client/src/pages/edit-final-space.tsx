import React, { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Heart, ArrowLeft, Save, Palette, Settings } from "lucide-react";

const editFinalSpaceSchema = z.object({
  personName: z.string().min(1, "Person name is required"),
  dateOfBirth: z.string().optional(),
  dateOfDeath: z.string().optional(),
  description: z.string().optional(),
  musicPlaylist: z.string().optional(),
  isPublic: z.boolean().default(true),
  allowComments: z.boolean().default(true),
});

type EditFinalSpaceForm = z.infer<typeof editFinalSpaceSchema>;

export default function EditFinalSpace() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType') || 'admin';
  const userIdParam = parseInt(urlParams.get('userId') || '1');

  // Fetch the final space data
  const { data: finalSpace, isLoading } = useQuery({
    queryKey: ['/api/final-spaces', id],
    queryFn: async () => {
      const response = await fetch(`/api/final-spaces/${id}`);
      if (!response.ok) throw new Error('Failed to fetch final space');
      return response.json();
    },
    enabled: !!id,
  });

  // Update mutation
  const updateFinalSpace = useMutation({
    mutationFn: async (data: EditFinalSpaceForm) => {
      const response = await fetch(`/api/final-spaces/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update final space');
      }
      
      return response.json();
    },
    onSuccess: (updatedSpace) => {
      toast({
        title: "Success",
        description: "Memorial space updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/final-spaces'] });
      queryClient.invalidateQueries({ queryKey: ['/api/memorial', updatedSpace.slug] });
      setLocation(`/memorial/${updatedSpace.slug}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update memorial space",
        variant: "destructive"
      });
    },
  });

  const form = useForm<EditFinalSpaceForm>({
    resolver: zodResolver(editFinalSpaceSchema),
    defaultValues: {
      personName: "",
      dateOfBirth: "",
      dateOfDeath: "",
      description: "",
      musicPlaylist: "",
      isPublic: true,
      allowComments: true,
    }
  });

  // Update form when data loads
  useEffect(() => {
    if (finalSpace) {
      form.reset({
        personName: finalSpace.personName || "",
        dateOfBirth: finalSpace.dateOfBirth || "",
        dateOfDeath: finalSpace.dateOfDeath || "",
        description: finalSpace.description || "",
        musicPlaylist: finalSpace.musicPlaylist || "",
        isPublic: finalSpace.isPublic !== false,
        allowComments: finalSpace.allowComments !== false,
      });
    }
  }, [finalSpace, form]);

  const onSubmit = async (data: EditFinalSpaceForm) => {
    await updateFinalSpace.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading memorial...</p>
        </div>
      </div>
    );
  }

  if (!finalSpace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Memorial Not Found</h3>
            <p className="text-gray-600">
              The memorial you're trying to edit doesn't exist or you don't have permission to edit it.
            </p>
            <Link href="/dashboard">
              <Button className="mt-4">Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Heart className="mr-3 h-8 w-8 text-blue-600" />
              Edit Memorial Space
            </h1>
            <p className="text-muted-foreground mt-1">
              Update memorial information for {finalSpace.personName}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/memorial/${finalSpace.slug}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Memorial
              </Button>
            </Link>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Memorial Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="personName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter full name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfDeath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Death</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="musicPlaylist"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Music Playlist URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Spotify, YouTube playlist URL" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Memorial Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Share memories, life story, or tribute message..."
                          rows={5}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Privacy Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Privacy Settings</h3>
                  
                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Make this memorial space public</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Allow others to find and visit this memorial
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowComments"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Allow visitors to leave comments</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Let people share memories and condolences
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4 pt-6">
                  <Link href={`/memorial/${finalSpace.slug}`}>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={updateFinalSpace.isPending}
                  >
                    {updateFinalSpace.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Advanced Design Preview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Advanced Design Editor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="mb-4">
                  <Settings className="w-12 h-12 mx-auto text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Professional Design Tools</h3>
                <p className="text-gray-600 mb-6">
                  The advanced memorial editor with drag-and-drop functionality, resizable elements, 
                  and comprehensive customization controls is currently being optimized for stability.
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  This will include: typography controls, color themes, layout customization, 
                  element positioning, and responsive design preview modes.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                  <Settings className="w-4 h-4" />
                  <span>Coming Soon: Full Design Customization</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}