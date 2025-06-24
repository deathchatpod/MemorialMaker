import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ExternalLink, Clock, Users } from "lucide-react";
import { Link } from "wouter";

interface CollaborationObituary {
  id: number;
  fullName: string;
  dateCreated: string;
  status: string;
  collaborationUrl: string;
  lastActivity: string;
  collaboratorCount: number;
}

export default function MyCollaborations() {
  // Mock data for now - replace with actual API call
  const { data: collaborations = [], isLoading } = useQuery<CollaborationObituary[]>({
    queryKey: ["/api/my-collaborations"],
    queryFn: async () => {
      // This would be replaced with actual API call
      return [
        {
          id: 1,
          fullName: "John Smith",
          dateCreated: "2024-06-20",
          status: "active",
          collaborationUrl: "/collaborate/abc123",
          lastActivity: "2024-06-22",
          collaboratorCount: 3
        },
        {
          id: 2,
          fullName: "Mary Johnson",
          dateCreated: "2024-06-18",
          status: "completed",
          collaborationUrl: "/collaborate/def456",
          lastActivity: "2024-06-21",
          collaboratorCount: 5
        }
      ];
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Collaborations</h1>
        <p className="text-gray-600 mt-1">
          Obituaries you have been invited to collaborate on
        </p>
      </div>

      {collaborations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Collaborations Yet
            </h3>
            <p className="text-gray-600 mb-4">
              You haven't been invited to collaborate on any obituaries yet. 
              When someone invites you to help with an obituary, it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {collaborations.map((collaboration) => (
            <Card key={collaboration.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Obituary for {collaboration.fullName}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Created on {new Date(collaboration.dateCreated).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge 
                    className={
                      collaboration.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }
                  >
                    {collaboration.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {collaboration.collaboratorCount} collaborators
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Last activity: {new Date(collaboration.lastActivity).toLocaleDateString()}
                    </div>
                  </div>
                  <Link href={collaboration.collaborationUrl}>
                    <Button className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Continue Collaboration
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}