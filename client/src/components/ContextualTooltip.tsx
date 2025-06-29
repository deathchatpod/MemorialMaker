import { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface ContextualTooltipProps {
  content: string;
  children?: ReactNode;
  showIcon?: boolean;
}

export function ContextualTooltip({ content, children, showIcon = true }: ContextualTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children || (
          showIcon && (
            <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help inline ml-1" />
          )
        )}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-popover border-border text-popover-foreground">
        <p className="text-xs">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}