import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Edit, Heart } from "lucide-react";
import { Link } from "wouter";

interface FinalSpace {
  id: number;
  fullName: string;
  slug: string;
  status: string;
  createdAt: string;
  createdBy: string;
  commentsCount: number;
  isPublic: boolean;
}

interface FinalSpacesListProps {
  userType: string;
  userId: number;
}

export default function FinalSpacesList({ userType, userId }: FinalSpacesListProps) {
  const { data: finalSpaces = [], isLoading } = useQuery<FinalSpace[]>({
    queryKey: ["/api/final-spaces", userType, userId],
    queryFn: async () => {
      const response = await fetch(`/api/final-spaces?userType=${userType}&userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch final spaces');
      return response.json();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'private': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-600">
            {userType === 'admin' && 'All memorial spaces across funeral homes'}
            {userType === 'funeral_home' && 'Your memorial spaces and team member spaces'}
            {userType === 'employee' && 'Your memorial space creations'}
            {userType === 'individual' && 'Memorial spaces you have access to'}
          </p>
        </div>
        <Link href="/final-spaces/create">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Memorial Space
          </Button>
        </Link>
      </div>

      {finalSpaces.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Heart className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Memorial Spaces Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first memorial space to honor and remember loved ones.
            </p>
            <Link href="/final-spaces/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Memorial Space
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Memorial Spaces ({finalSpaces.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finalSpaces.map((space) => (
                  <TableRow key={space.id}>
                    <TableCell className="font-medium">{space.fullName}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(space.status)}>
                        {space.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{space.createdBy}</TableCell>
                    <TableCell>
                      {new Date(space.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{space.commentsCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/final-spaces/${space.slug}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/final-spaces/${space.id}/edit`}>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
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