import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Calendar, User, Tag, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface CustomerFeedback {
  id: number;
  userId: number;
  userType: string;
  userName: string;
  category: string;
  subject: string;
  description: string;
  screenshotUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerFeedback() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: feedback = [], isLoading } = useQuery<CustomerFeedback[]>({
    queryKey: ["/api/customer-feedback"],
    queryFn: async () => {
      const response = await fetch("/api/customer-feedback");
      if (!response.ok) throw new Error("Failed to fetch feedback");
      return response.json();
    },
  });

  // Filter feedback based on search and filters
  const filteredFeedback = feedback.filter((item) => {
    const matchesSearch = 
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Needs Work":
        return "bg-red-100 text-red-800 border-red-200";
      case "In Process":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Bug/App Crashing":
        return "bg-red-50 text-red-700 border-red-200";
      case "New Feature Request":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "General Feedback":
        return "bg-green-50 text-green-700 border-green-200";
      case "General Question":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusCounts = () => {
    const counts = {
      total: feedback.length,
      needsWork: feedback.filter(f => f.status === "Needs Work").length,
      inProcess: feedback.filter(f => f.status === "In Process").length,
      resolved: feedback.filter(f => f.status === "Resolved").length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-300 mt-4">Loading feedback...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-100 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6" />
                  Customer Feedback
                </CardTitle>
                <p className="text-gray-400 mt-1">
                  Manage and respond to customer feedback submissions
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-100">{statusCounts.total}</p>
                <p className="text-gray-400 text-sm">Total Feedback</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{statusCounts.needsWork}</p>
                <p className="text-gray-400 text-sm">Needs Work</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{statusCounts.inProcess}</p>
                <p className="text-gray-400 text-sm">In Process</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{statusCounts.resolved}</p>
                <p className="text-gray-400 text-sm">Resolved</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by subject, user, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-gray-100">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Needs Work">Needs Work</SelectItem>
                  <SelectItem value="In Process">In Process</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-gray-100">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Bug/App Crashing">Bug/App Crashing</SelectItem>
                  <SelectItem value="New Feature Request">New Feature Request</SelectItem>
                  <SelectItem value="General Feedback">General Feedback</SelectItem>
                  <SelectItem value="General Question">General Question</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">
              Feedback Items ({filteredFeedback.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFeedback.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No feedback found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">User</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Category</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Subject</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeedback.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-700 hover:bg-gray-700/50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-gray-100 font-medium">{item.userName}</p>
                              <p className="text-gray-400 text-sm capitalize">{item.userType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={getCategoryColor(item.category)}>
                            <Tag className="w-3 h-3 mr-1" />
                            {item.category}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-100 font-medium line-clamp-1">{item.subject}</p>
                          <p className="text-gray-400 text-sm line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{formatDate(item.createdAt)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/customer-feedback/${item.id}`)}
                            className="bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}