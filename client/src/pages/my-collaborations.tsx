import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Edit, Users, Heart } from "lucide-react";
import { Link } from "wouter";
import DataTable, { createBadgeRenderer, formatDate, createActionButtons } from "@/components/DataTable";

interface CollaborationObituary {
  id: number;
  fullName: string;
  dateCreated: string;
  status: string;
  collaborationUrl: string;
  lastActivity: string;
  collaboratorCount: number;
  obituaryId: number;
  feedbackCount: number;
}

interface MyCollaborationsProps {
  userType: string;
  userId: number;
}

export default function MyCollaborations() {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType') || 'admin';
  const userIdParam = parseInt(urlParams.get('userId') || '1');
  
  // Get user email based on type - in real app, this would come from auth context
  const getUserEmail = () => {
    switch (userTypeParam) {
      case 'admin': return 'admin@deathmatters.com';
      case 'funeral_home': return 'funeral@deathmatters.com';
      case 'employee': return 'employee@deathmatters.com';
      case 'individual': return 'individual@deathmatters.com';
      default: return 'admin@deathmatters.com';
    }
  };

  const { data: collaborations = [], isLoading, error } = useQuery({
    queryKey: ['/api/my-collaborations', { 
      userEmail: getUserEmail(),
      userId: userIdParam,
      userType: userTypeParam 
    }]
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'obituary':
        return 'bg-purple-100 text-purple-800';
      case 'finalspace':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

      {filteredCollaborations.length === 0 ? (
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
        <Card>
          <CardHeader>
            <CardTitle>My Collaborations ({collaborations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Obituary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Collaborators</TableHead>
                  <TableHead>My Feedback</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collaborations.map((collaboration) => (
                  <TableRow key={collaboration.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{collaboration.fullName}</div>
                        <div className="text-sm text-gray-500">
                          Created {new Date(collaboration.dateCreated).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          collaboration.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }
                      >
                        {collaboration.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {collaboration.collaboratorCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {collaboration.feedbackCount || 0} items
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(collaboration.lastActivity).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={collaboration.collaborationUrl}>
                        <Button size="sm" className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Continue
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}