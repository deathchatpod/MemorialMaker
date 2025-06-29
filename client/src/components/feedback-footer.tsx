import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, MessageSquare, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface User {
  id: number;
  userType: string;
  fullName?: string;
  businessName?: string;
  name?: string;
}

interface FeedbackFooterProps {
  currentUser: User | null;
}

export default function FeedbackFooter({ currentUser }: FeedbackFooterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitFeedbackMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/customer-feedback', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to submit feedback');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll review it soon.",
      });
      handleCloseModal();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !subject || !description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('category', category);
    formData.append('subject', subject);
    formData.append('description', description);
    
    if (screenshot) {
      formData.append('screenshot', screenshot);
    }

    submitFeedbackMutation.mutate(formData);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCategory("");
    setSubject("");
    setDescription("");
    setScreenshot(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a JPEG, PNG, or GIF image.",
          variant: "destructive",
        });
        return;
      }
      
      setScreenshot(file);
    }
  };

  const getUserDisplayName = () => {
    if (!currentUser) return "Guest";
    return currentUser.fullName || currentUser.businessName || currentUser.name || "User";
  };

  const getUserTypeDisplay = () => {
    if (!currentUser) return "Guest";
    switch (currentUser.userType) {
      case 'admin': return 'Admin';
      case 'funeral_home': return 'Funeral Home';
      case 'employee': return 'Employee';
      case 'individual': return 'Individual';
      default: return currentUser.userType;
    }
  };

  if (!currentUser) {
    return null; // Don't show footer for unauthenticated users
  }

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 px-4 py-3 z-40">
        <div className="max-w-6xl mx-auto flex justify-center">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            size="sm"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Send us feedback!
          </Button>
        </div>
      </footer>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] bg-gray-900 border-gray-700 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-100 text-xl">Send Feedback</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col h-full">
            <form id="feedback-form" onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pr-2">
              {/* User Information Display */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 text-sm">Your Name</Label>
                      <p className="text-gray-100 font-medium">{getUserDisplayName()}</p>
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">User Type</Label>
                      <p className="text-gray-100 font-medium">{getUserTypeDisplay()}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-gray-300 text-sm">Date & Time</Label>
                      <p className="text-gray-100 font-medium">
                        {new Date().toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback Form */}
              <div className="space-y-4">
              <div>
                <Label htmlFor="category" className="text-gray-300">
                  Category <span className="text-red-400">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-100">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="Bug/App Crashing">Bug/App Crashing</SelectItem>
                    <SelectItem value="New Feature Request">New Feature Request</SelectItem>
                    <SelectItem value="General Feedback">General Feedback</SelectItem>
                    <SelectItem value="General Question">General Question</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject" className="text-gray-300">
                  Subject <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your feedback"
                  className="bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400"
                  maxLength={255}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-300">
                  Description/Message <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide detailed information about your feedback..."
                  className="bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 min-h-[120px]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="screenshot" className="text-gray-300">
                  Screenshot (Optional)
                </Label>
                <p className="text-gray-400 text-sm mb-2">
                  If you can take a screenshot to show us more detail, that would be great!
                </p>
                <div className="flex items-center gap-4">
                  <Input
                    id="screenshot"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleFileChange}
                    className="bg-gray-800 border-gray-600 text-gray-100 file:bg-gray-700 file:text-gray-100 file:border-0 file:rounded file:px-3 file:py-1"
                  />
                  {screenshot && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setScreenshot(null)}
                      className="text-gray-400 hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {screenshot && (
                  <p className="text-green-400 text-sm mt-1">
                    Selected: {screenshot.name}
                  </p>
                )}
              </div>
              </div>
            </form>

            {/* Submit Buttons - Fixed at bottom */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 mt-4 bg-gray-900">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseModal}
                className="text-gray-300 hover:text-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="feedback-form"
                disabled={submitFeedbackMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {submitFeedbackMutation.isPending ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}