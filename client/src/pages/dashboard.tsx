import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { UserContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Obituary {
  id: number;
  fullName: string;
  age?: number;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const { currentUser } = useContext(UserContext);

  const { data: obituaries = [], isLoading } = useQuery<Obituary[]>({
    queryKey: ["/api/obituaries", currentUser.id, currentUser.userType],
    queryFn: async () => {
      const response = await fetch(`/api/obituaries?userId=${currentUser.id}&userType=${currentUser.userType}`);
      if (!response.ok) throw new Error('Failed to fetch obituaries');
      return response.json();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'generated':
        return <Badge className="bg-yellow-100 text-yellow-800">Generated</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">
            {currentUser.userType === 'admin' 
              ? 'All obituary creations across users'
              : 'Your obituary creations and history'
            }
          </p>
        </div>
        <Link href="/obituary/new">
          <Button className="bg-primary text-white hover:bg-blue-700">
            <i className="fas fa-plus mr-2"></i>
            New Obituary
          </Button>
        </Link>
      </div>

      {/* Admin Controls */}
      {currentUser.userType === 'admin' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <i className="fas fa-cog text-primary"></i>
              <span className="font-medium text-gray-900">Admin Controls</span>
            </div>
            <Link href="/admin/questions">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                <i className="fas fa-edit mr-2"></i>
                Manage Questions
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Obituaries Table */}
      <Card>
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Obituaries</h3>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Loading obituaries...
            </div>
          ) : obituaries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <i className="fas fa-file-alt text-4xl mb-4 text-gray-300"></i>
              <p className="text-lg font-medium mb-2">No obituaries yet</p>
              <p className="text-sm">Create your first obituary to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {obituaries.map((obituary) => (
                    <tr key={obituary.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {obituary.fullName}
                        </div>
                        {obituary.age && (
                          <div className="text-sm text-gray-500">Age {obituary.age}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(obituary.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(obituary.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        {obituary.status === 'generated' || obituary.status === 'completed' ? (
                          <Link href={`/obituary/${obituary.id}/generated`}>
                            <button className="text-primary hover:text-blue-700">
                              View
                            </button>
                          </Link>
                        ) : (
                          <Link href={`/obituary/new?id=${obituary.id}`}>
                            <button className="text-primary hover:text-blue-700">
                              Continue
                            </button>
                          </Link>
                        )}
                        <button className="text-gray-400 hover:text-gray-600">
                          {obituary.status === 'completed' ? 'Download' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
