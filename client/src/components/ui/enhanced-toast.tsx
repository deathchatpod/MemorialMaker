import React from 'react';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const toastVariantStyles = {
  default: "bg-background text-foreground border-border",
  destructive: "bg-destructive text-destructive-foreground border-destructive",
  success: "bg-green-600 text-white border-green-600",
  warning: "bg-yellow-600 text-white border-yellow-600",
  info: "bg-blue-600 text-white border-blue-600"
};

const toastIcons = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info
};

interface EnhancedToastProps {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactElement;
  variant?: keyof typeof toastVariantStyles;
  duration?: number;
  persistent?: boolean;
  onClose?: () => void;
}

export function EnhancedToast({
  id,
  title,
  description,
  action,
  variant = 'default',
  persistent = false,
  onClose
}: EnhancedToastProps) {
  const Icon = toastIcons[variant];

  return (
    <Toast className={cn(toastVariantStyles[variant], "flex items-start gap-3")}>
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        {title && <ToastTitle className="font-medium">{title}</ToastTitle>}
        {description && (
          <ToastDescription className={cn(
            "text-sm opacity-90",
            title ? "mt-1" : ""
          )}>
            {description}
          </ToastDescription>
        )}
        {action && (
          <div className="mt-3">
            {action}
          </div>
        )}
      </div>

      {!persistent && (
        <ToastClose 
          className="flex-shrink-0 opacity-70 hover:opacity-100"
          onClick={onClose}
        />
      )}
    </Toast>
  );
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <EnhancedToast
            key={id}
            id={id}
            title={title}
            description={description}
            action={action}
            {...props}
          />
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

// Enhanced toast hook with better defaults
export function useEnhancedToast() {
  const { toast, dismiss, toasts } = useToast();

  const showSuccess = (message: string, title?: string) => {
    toast({
      title: title || "Success",
      description: message,
      duration: 3000,
    });
  };

  const showError = (message: string, title?: string) => {
    toast({
      title: title || "Error",
      description: message,
      variant: "destructive",
      duration: 5000,
    });
  };

  const showWarning = (message: string, title?: string) => {
    toast({
      title: title || "Warning",
      description: message,
      duration: 4000,
    });
  };

  const showInfo = (message: string, title?: string) => {
    toast({
      title: title || "Information",
      description: message,
      duration: 3000,
    });
  };

  const showPersistent = (message: string, title?: string) => {
    return toast({
      title,
      description: message,
      duration: undefined, // Persistent toast
    });
  };

  return {
    toast,
    dismiss,
    toasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showPersistent
  };
}