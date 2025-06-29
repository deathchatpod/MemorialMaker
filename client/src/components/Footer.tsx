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

  return (
    <>
      <footer className="bg-card border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Left side - Company info */}
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                © 2025 DeathMatters. All rights reserved.
              </p>
            </div>

            {/* Center - Legal links */}
            <div className="flex items-center space-x-6">
              <Link href="/privacy-policy">
                <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </Link>
              <Link href="/terms-of-service">
                <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </Link>
            </div>

            {/* Right side - Customer feedback */}
            <button
              onClick={() => setFeedbackModalOpen(true)}
              className="flex items-center gap-2 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Customer Feedback
            </button>
          </div>
        </div>
      </footer>

      <CustomerFeedbackModal 
        open={feedbackModalOpen} 
        onOpenChange={setFeedbackModalOpen} 
      />
    </>
  );
}

export default Footer;