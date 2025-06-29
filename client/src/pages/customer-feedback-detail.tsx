import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, User, Tag, Image, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export default function CustomerFeedbackDetail() {
  const [, params] = useRoute("/customer-feedback/:id");
  const [, setLocation] = useLocation();
  const feedbackId = parseInt(params?.id || "0");
  const [status, setStatus] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: feedback, isLoading } = useQuery<CustomerFeedback>({
    queryKey: ["/api/customer-feedback", feedbackId],
    queryFn: async () => {
      const response = await fetch(`/api/customer-feedback/${feedbackId}`);
      if (!response.ok) throw new Error("Failed to fetch feedback");
      return response.json();
    },
    enabled: !!feedbackId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await fetch(`/api/customer-feedback/${feedbackId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Feedback status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-feedback", feedbackId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update feedback status.",
        variant: "destructive",
      });
    },
  });

  // Set initial status when feedback loads
  useState(() => {
    if (feedback && !status) {
      setStatus(feedback.status);
    }
  });

  const handleStatusUpdate = () => {
    if (status && status !== feedback?.status) {
      updateStatusMutation.mutate(status);
    }
  };

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-300 mt-4">Loading feedback details...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8">
              <div className="text-center">
                <p className="text-gray-300">Feedback not found.</p>
                <Button
                  onClick={() => setLocation("/dashboard")}
                  variant="outline"
                  className="mt-4 bg-gray-700 border-gray-600 text-gray-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setLocation("/dashboard")}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <div>
                  <CardTitle className="text-gray-100">
                    Feedback Details #{feedback.id}
                  </CardTitle>
                  <p className="text-gray-400 mt-1">
                    View and manage customer feedback submission
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Feedback Information */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Feedback Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-gray-400 text-sm">Subject</label>
                <p className="text-gray-100 font-medium text-lg mt-1">{feedback.subject}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Category</label>
                <div className="mt-1">
                  <Badge variant="outline" className={getCategoryColor(feedback.category)}>
                    <Tag className="w-3 h-3 mr-1" />
                    {feedback.category}
                  </Badge>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-gray-400 text-sm">Submitted By</label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-100 font-medium">{feedback.userName}</p>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">User Type</label>
                <p className="text-gray-100 capitalize mt-1">{feedback.userType}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Submitted Date</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-100">{formatDate(feedback.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Status Management */}
            <div className="border-t border-gray-700 pt-6">
              <label className="text-gray-400 text-sm">Status Management</label>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Current:</span>
                  <Badge variant="outline" className={getStatusColor(feedback.status)}>
                    {feedback.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-gray-100">
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="Needs Work">Needs Work</SelectItem>
                      <SelectItem value="In Process">In Process</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={!status || status === feedback.status || updateStatusMutation.isPending}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {feedback.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Screenshot */}
        {feedback.screenshotUrl && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <Image className="w-5 h-5" />
                Screenshot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <img
                  src={feedback.screenshotUrl}
                  alt="Feedback screenshot"
                  className="max-w-full h-auto rounded border border-gray-600"
                  style={{ maxHeight: '500px' }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-gray-100 font-medium">Feedback Submitted</p>
                  <p className="text-gray-400 text-sm">{formatDate(feedback.createdAt)}</p>
                  <p className="text-gray-400 text-sm">By {feedback.userName}</p>
                </div>
              </div>
              {feedback.updatedAt !== feedback.createdAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-gray-100 font-medium">Status Updated</p>
                    <p className="text-gray-400 text-sm">{formatDate(feedback.updatedAt)}</p>
                    <p className="text-gray-400 text-sm">Current status: {feedback.status}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}