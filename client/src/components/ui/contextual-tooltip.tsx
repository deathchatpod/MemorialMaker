import React, { useState, useEffect } from 'react';
import { HelpCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextualTooltipProps {
  content: string;
  children?: React.ReactNode;
  icon?: 'help' | 'info';
  className?: string;
  tooltipId?: string; // Unique ID for dismissal tracking
  dismissible?: boolean;
}

export function ContextualTooltip({ 
  content, 
  children, 
  icon = 'help',
  className,
  tooltipId,
  dismissible = true
}: ContextualTooltipProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if tooltip was previously dismissed
  useEffect(() => {
    if (tooltipId && dismissible) {
      try {
        const dismissed = localStorage.getItem(`tooltip-dismissed-${tooltipId}`);
        setIsDismissed(dismissed === 'true');
      } catch (error) {
        // Ignore localStorage errors
      }
    }
  }, [tooltipId, dismissible]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (tooltipId) {
      try {
        localStorage.setItem(`tooltip-dismissed-${tooltipId}`, 'true');
      } catch (error) {
        // Ignore localStorage errors
      }
    }
    
    setIsDismissed(true);
  };

  // Don't render tooltip if dismissed
  if (isDismissed && dismissible) {
    return <>{children}</>;
  }

  return (
    <div className="relative inline-block">
      {children}
      {!isDismissed && (
        <div className="absolute -top-2 -right-2 z-50">
          <div className="bg-blue-600 text-white rounded-lg p-3 shadow-lg border border-blue-500 max-w-xs min-w-[200px]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="text-xs leading-relaxed">
                  {content.split('\n').map((line, index) => (
                    <p key={index} className="mb-1 last:mb-0">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
              {dismissible && (
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 text-blue-200 hover:text-white transition-colors ml-2 p-1 rounded-full hover:bg-blue-700"
                  aria-label="Dismiss tooltip"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Pre-defined tooltip content for common form fields
export const tooltipContent = {
  tone: "Choose the overall tone for the obituary:\n• Formal: Traditional, respectful, and professional\n• Warm: Personal, heartfelt, and emotional\n• Celebratory: Uplifting, focusing on life achievements\n• Simple: Straightforward, concise, and dignified",
  
  ageCategory: "Select the most appropriate age category:\n• Child: Under 18 years\n• Young Adult: 18-35 years\n• Adult: 36-65 years\n• Senior: Over 65 years\n\nThis helps tailor the content appropriately.",
  
  relationship: "Specify your relationship to the deceased:\n• Immediate Family: Spouse, child, parent, sibling\n• Extended Family: Grandchild, cousin, aunt, uncle\n• Friend: Close personal relationship\n• Professional: Colleague, business associate\n• Other: Any other relationship type",
  
  serviceInfo: "Include details about memorial services:\n• Date and time of service\n• Location (funeral home, church, etc.)\n• Type of service (viewing, funeral, celebration of life)\n• Special instructions for attendees",
  
  obituaryLength: "Choose the desired length:\n• Brief: 100-200 words, essential information only\n• Standard: 300-500 words, balanced detail\n• Detailed: 500+ words, comprehensive life story\n\nLonger obituaries allow for more personal stories and details.",
  
  personalStories: "Share meaningful memories or stories:\n• Childhood memories or family traditions\n• Career highlights or achievements\n• Hobbies, interests, or passions\n• Impact on family and community\n• Funny or heartwarming anecdotes",
  
  survivalInfo: "List surviving family members:\n• Start with immediate family (spouse, children)\n• Include grandchildren and great-grandchildren\n• Mention siblings and their families\n• Consider including close friends if appropriate\n• Use full names when possible",
  
  donations: "Memorial donation information:\n• Preferred charity or organization\n• Complete contact information\n• Specific fund or program if applicable\n• Alternative: 'In lieu of flowers' statements\n• Family preference for donations vs. flowers"
};

export default ContextualTooltip;