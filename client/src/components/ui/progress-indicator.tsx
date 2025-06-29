import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  current: boolean;
}

interface ProgressIndicatorProps {
  steps: Step[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function ProgressIndicator({ 
  steps, 
  orientation = 'horizontal',
  className 
}: ProgressIndicatorProps) {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div 
      className={cn(
        "progress-indicator",
        isHorizontal ? "flex items-center space-x-4" : "flex flex-col space-y-4",
        className
      )}
      role="progressbar"
      aria-label="Progress indicator"
    >
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={cn(
            "flex items-center",
            isHorizontal ? "flex-col text-center" : "flex-row text-left"
          )}
        >
          {/* Step circle */}
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200",
              step.completed 
                ? "bg-primary border-primary text-primary-foreground" 
                : step.current
                ? "border-primary text-primary bg-primary/10"
                : "border-muted-foreground text-muted-foreground"
            )}
          >
            {step.completed ? (
              <Check className="w-4 h-4" />
            ) : (
              <span className="text-sm font-medium">{index + 1}</span>
            )}
          </div>

          {/* Step content */}
          <div className={cn(
            isHorizontal ? "mt-2" : "ml-3 flex-1"
          )}>
            <div
              className={cn(
                "text-sm font-medium",
                step.completed || step.current 
                  ? "text-foreground" 
                  : "text-muted-foreground"
              )}
            >
              {step.title}
            </div>
            {step.description && (
              <div className="text-xs text-muted-foreground mt-1">
                {step.description}
              </div>
            )}
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "transition-colors duration-200",
                isHorizontal 
                  ? "w-12 h-0.5 mx-2" 
                  : "w-0.5 h-6 ml-4 -mr-0.5",
                step.completed 
                  ? "bg-primary" 
                  : "bg-muted-foreground/30"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default ProgressIndicator;