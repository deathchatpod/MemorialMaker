import React from "react";
import { Link } from "wouter";
import { useFinalSpaces, useDeleteFinalSpace } from "@/hooks/use-final-spaces";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Heart, Share2, Music, MessageCircle, Trash2, ExternalLink, Calendar, Globe, ArrowLeft, Edit, Eye } from "lucide-react";
import { format } from "date-fns";

export default function FinalSpaces() {
  // Get current user from URL params like other components
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType') || 'funeral_home';
  const userIdParam = parseInt(urlParams.get('userId') || '2', 10);
  const { toast } = useToast();

  const { data: finalSpaces, isLoading } = useFinalSpaces(userIdParam, userTypeParam);
  const deleteFinalSpace = useDeleteFinalSpace();

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

  // Get current user variables for routing
  const currentUserType = userTypeParam;
  const currentUserId = userIdParam;

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
        <Link href="/final-spaces/create">
          <Button>
            <Heart className="mr-2 h-4 w-4" />
            Create FinalSpace
          </Button>
        </Link>
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
                      onClick={() => {
                        console.log('Navigating to memorial:', space.slug);
                        window.location.href = `/memorial/${space.slug}`;
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        console.log('Navigating to edit:', space.id);
                        window.location.href = `/final-spaces/edit/${space.id}?userType=${currentUserType}&userId=${currentUserId}`;
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
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