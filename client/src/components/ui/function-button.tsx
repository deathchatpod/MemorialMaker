import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FunctionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon?: LucideIcon;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  className?: string;
  loading?: boolean;
}

export function FunctionButton({
  onClick,
  disabled = false,
  icon: Icon,
  children,
  variant = 'default',
  className,
  loading = false,
}: FunctionButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      variant={variant}
      size="sm"
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap w-full sm:w-auto",
        className
      )}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
      ) : (
        Icon && <Icon className="h-4 w-4" />
      )}
      {children}
    </Button>
  );
}

// Responsive container for function buttons
interface FunctionButtonContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FunctionButtonContainer({
  title,
  description,
  children,
  className,
}: FunctionButtonContainerProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", className)}>
      <div className="flex-1">
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2">
        {children}
      </div>
    </div>
  );
}