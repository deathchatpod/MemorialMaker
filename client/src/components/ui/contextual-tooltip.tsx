import React, { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { HelpCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextualTooltipProps {
  content: string;
  children?: React.ReactNode;
  icon?: 'help' | 'info';
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  maxWidth?: string;
  tooltipId?: string; // Unique ID for dismissal tracking
  dismissible?: boolean;
}

export function ContextualTooltip({ 
  content, 
  children, 
  icon = 'help',
  side = 'top',
  className,
  maxWidth = 'max-w-xs',
  tooltipId,
  dismissible = true
}: ContextualTooltipProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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
    setIsOpen(false);
  };

  // Don't render if dismissed
  if (isDismissed && dismissible) {
    return children || null;
  }

  const IconComponent = icon === 'help' ? HelpCircle : Info;

  const trigger = children || (
    <IconComponent 
      className={cn(
        "w-4 h-4 text-muted-foreground hover:text-foreground cursor-help transition-colors",
        className
      )} 
    />
  );

  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          {trigger}
        </TooltipTrigger>
        <TooltipContent 
          side={side}
          className={cn(
            "text-sm p-3 bg-popover text-popover-foreground border shadow-lg rounded-md relative",
            maxWidth
          )}
        >
          <div className="space-y-1">
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="absolute -top-1 -right-1 w-5 h-5 bg-muted hover:bg-muted-foreground/20 rounded-full flex items-center justify-center transition-colors"
                aria-label="Dismiss tooltip"
              >
                <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}
            {content.split('\n').map((line, index) => (
              <p key={index} className="leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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