import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Edit, Users } from "lucide-react";
import { Link } from "wouter";

interface Obituary {
  id: number;
  fullName: string;
  status: string;
  createdAt: string;
  createdBy: string;
  generatedCount: number;
  hasCollaborators: boolean;
}

interface ObituariesListProps {
  userType: string;
  userId: number;
}

export default function ObituariesList({ userType, userId }: ObituariesListProps) {
  const { data: obituaries = [], isLoading } = useQuery<Obituary[]>({
    queryKey: ["/api/obituaries", userType, userId],
    queryFn: async () => {
      const response = await fetch(`/api/obituaries?userType=${userType}&userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch obituaries');
      return response.json();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
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
            {userType === 'admin' && 'All obituaries across funeral homes'}
            {userType === 'funeral_home' && 'Your obituaries and team member obituaries'}
            {userType === 'employee' && 'Your obituary creations'}
            {userType === 'individual' && 'Obituaries you have access to'}
          </p>
        </div>
        <Link href="/obituary/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Obituary
          </Button>
        </Link>
      </div>

      {obituaries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Edit className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Obituaries Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first obituary to get started with AI-powered content generation.
            </p>
            <Link href="/obituary/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Obituary
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Obituaries ({obituaries.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obituaries.map((obituary) => (
                  <TableRow key={obituary.id}>
                    <TableCell className="font-medium">{obituary.fullName}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(obituary.status)}>
                        {obituary.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{obituary.createdBy}</TableCell>
                    <TableCell>
                      {new Date(obituary.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{obituary.generatedCount} versions</span>
                        {obituary.hasCollaborators && (
                          <Users className="w-4 h-4 text-blue-600" title="Has collaborators" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/obituary/${obituary.id}/generated`}>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/obituary/${obituary.id}/edit`}>
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