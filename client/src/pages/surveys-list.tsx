import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Edit, BarChart3 } from "lucide-react";
import { Link } from "wouter";

interface Survey {
  id: number;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  version: number;
  questionsCount: number;
  responsesCount: number;
}

export default function SurveysList() {
  const { data: surveys = [], isLoading } = useQuery<Survey[]>({
    queryKey: ["/api/surveys"],
    queryFn: async () => {
      const response = await fetch('/api/surveys');
      if (!response.ok) throw new Error('Failed to fetch surveys');
      return response.json();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
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
            All platform surveys are visible to all users. Create surveys to gather feedback and insights.
          </p>
        </div>
        <Link href="/admin/surveys/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Survey
          </Button>
        </Link>
      </div>

      {surveys.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <BarChart3 className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Surveys Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first survey to start gathering user feedback and insights.
            </p>
            <Link href="/admin/surveys/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Survey
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Platform Surveys ({surveys.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Survey Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surveys.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{survey.name}</div>
                        {survey.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {survey.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(survey.status)}>
                        {survey.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{survey.questionsCount || 0}</TableCell>
                    <TableCell>{survey.responsesCount || 0}</TableCell>
                    <TableCell>
                      {new Date(survey.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/surveys/${survey.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/surveys/${survey.id}/edit`}>
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