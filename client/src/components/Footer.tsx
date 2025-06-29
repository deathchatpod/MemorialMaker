import { Link } from "wouter";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";

function Footer() {
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const { toast } = useToast();

  // Get current user data
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await fetch("/api/user");
      if (!response.ok) return null;
      return response.json();
    },
  });

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

  const handleCloseModal = () => {
    setFeedbackModalOpen(false);
    setCategory("");
    setSubject("");
    setDescription("");
    setScreenshot(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Screenshot must be less than 5MB.",
          variant: "destructive",
        });
        return;
      }
      setScreenshot(file);
    }
  };

  return (
    <>
      <footer className="bg-card border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Top - Customer feedback */}
            <button
              onClick={() => setFeedbackModalOpen(true)}
              className="flex items-center gap-2 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Customer Feedback
            </button>

            {/* Bottom section - Company info and legal links */}
            <div className="flex flex-col md:flex-row items-center justify-between w-full space-y-4 md:space-y-0">
              {/* Left side - Company info */}
              <div className="text-center md:text-left">
                <p className="text-sm text-muted-foreground">
                  © 2025 DeathMatters. All rights reserved.
                </p>
              </div>

              {/* Right side - Legal links */}
              <div className="flex items-center space-x-6">
                <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Customer Feedback Modal */}
      <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Customer Feedback
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-foreground">Category *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug/App Crashing</SelectItem>
                  <SelectItem value="feature">New Feature Request</SelectItem>
                  <SelectItem value="feedback">General Feedback</SelectItem>
                  <SelectItem value="question">General Question</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-foreground">Subject *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your feedback"
                className="bg-input border-border text-foreground"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide detailed information about your feedback"
                className="bg-input border-border text-foreground min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="screenshot" className="text-foreground">Screenshot (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="bg-input border-border text-foreground"
                />
                {screenshot && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setScreenshot(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {screenshot && (
                <p className="text-sm text-muted-foreground">
                  Selected: {screenshot.name}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseModal}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitFeedbackMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
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
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Footer;